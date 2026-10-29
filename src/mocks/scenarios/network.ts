import type { ErrorCode } from '@/contracts/errors'
import type { ScenarioName } from '@/contracts/mock'
import { prng, randomInt } from '../lib/prng'

export type NetworkEffect = null | 'network' | 'timeout' | { status: number; code: ErrorCode }

export interface NetworkDecision {
  delayMs: number
  effect: NetworkEffect
}

export interface RequestInfo {
  method: string
  /** Caminho relativo à base da API, por exemplo "/nfts". */
  path: string
}

interface FailureRule {
  match: (req: RequestInfo) => boolean
  effect: Exclude<NetworkEffect, null>
  /** Quantas vezes a regra dispara; sem valor, dispara sempre. */
  times?: number
}

interface ScenarioNetwork {
  latency: (req: RequestInfo, rand: () => number, count: number) => number
  rules: FailureRule[]
}

const fixed = (ms: number) => () => ms
const isCatalogRead = (r: RequestInfo) => r.method === 'GET' && r.path.startsWith('/nfts')
const isPrivate = (r: RequestInfo) =>
  r.path.startsWith('/me') ||
  r.path.startsWith('/orders') ||
  r.path.startsWith('/quotes') ||
  r.path.startsWith('/wallet-connections')

export const SCENARIO_NETWORK: Partial<Record<ScenarioName, ScenarioNetwork>> = {
  lento: { latency: fixed(2500), rules: [] },
  'latencia-variavel': { latency: (_r, rand) => randomInt(rand, 100, 1500), rules: [] },
  'fora-de-ordem': {
    // Requisições ímpares do catálogo demoram mais que as pares: a anterior chega depois.
    latency: (r, _rand, count) => (r.path === '/nfts' ? (count % 2 === 1 ? 1800 : 200) : 150),
    rules: [],
  },
  offline: { latency: fixed(150), rules: [{ match: () => true, effect: 'network' }] },
  'erro-servidor': {
    latency: fixed(150),
    rules: [{ match: isCatalogRead, effect: { status: 500, code: 'INTERNAL_ERROR' } }],
  },
  'falha-transitoria': {
    latency: fixed(150),
    rules: [
      { match: isCatalogRead, effect: { status: 503, code: 'SERVICE_UNAVAILABLE' }, times: 2 },
    ],
  },
  'sem-permissao': {
    latency: fixed(150),
    rules: [{ match: isPrivate, effect: { status: 403, code: 'FORBIDDEN' } }],
  },
  'favorito-falha': {
    latency: fixed(150),
    rules: [
      {
        match: (r) =>
          r.path.startsWith('/me/favorites/') && (r.method === 'PUT' || r.method === 'DELETE'),
        effect: { status: 500, code: 'INTERNAL_ERROR' },
      },
    ],
  },
}

const DEFAULT_NETWORK: ScenarioNetwork = { latency: fixed(150), rules: [] }

export interface NetworkController {
  decide(req: RequestInfo): NetworkDecision
}

/** Decide latência e falha de cada requisição de forma reproduzível. */
export function createNetworkController(name: ScenarioName, seed = 7): NetworkController {
  const config = SCENARIO_NETWORK[name] ?? DEFAULT_NETWORK
  const rand = prng(seed)
  const fired = new Map<FailureRule, number>()
  const counts = new Map<string, number>()

  return {
    decide(req) {
      const key = `${req.method} ${req.path}`
      const count = (counts.get(key) ?? 0) + 1
      counts.set(key, count)
      const delayMs = config.latency(req, rand, count)
      for (const rule of config.rules) {
        if (!rule.match(req)) continue
        const n = fired.get(rule) ?? 0
        if (rule.times !== undefined && n >= rule.times) continue
        fired.set(rule, n + 1)
        return { delayMs, effect: rule.effect }
      }
      return { delayMs, effect: null }
    },
  }
}
