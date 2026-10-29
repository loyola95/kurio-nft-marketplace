import { ScenarioName } from '@/contracts/mock'
import { db } from '../db/store'
import { createNetworkController, type NetworkController } from './network'

/** Comportamentos de domínio que cada cenário altera (além da rede). */
export interface ScenarioBehavior {
  sessionTtlMs: number
  orderDelayMs: number
  orderOutcome: 'confirmed' | 'declined'
  /** Atraso da resposta de POST /orders (o pedido é criado antes). */
  orderResponseDelayMs: number
  walletRejects: boolean
  emptyCatalog: boolean
  priceChangeOnQuote: boolean
  soldOutOnQuote: boolean
  realtimeDropEveryMs: number | null
}

const DEFAULT_BEHAVIOR: ScenarioBehavior = {
  sessionTtlMs: 2 * 60 * 60 * 1000,
  orderDelayMs: 3000,
  orderOutcome: 'confirmed',
  orderResponseDelayMs: 0,
  walletRejects: false,
  emptyCatalog: false,
  priceChangeOnQuote: false,
  soldOutOnQuote: false,
  realtimeDropEveryMs: null,
}

const HTTP_TIMEOUT_MS = Number(import.meta.env.VITE_HTTP_TIMEOUT_MS ?? 8000)

const BEHAVIOR: Partial<Record<ScenarioName, Partial<ScenarioBehavior>>> = {
  'catalogo-vazio': { emptyCatalog: true },
  'sessao-expirada': { sessionTtlMs: 60_000 },
  'preco-alterado-no-checkout': { priceChangeOnQuote: true },
  'esgotado-no-checkout': { soldOutOnQuote: true },
  'timeout-pedido': { orderResponseDelayMs: HTTP_TIMEOUT_MS + 2000 },
  'pagamento-recusado': { orderOutcome: 'declined' },
  'carteira-recusada': { walletRejects: true },
  'tempo-real-instavel': { realtimeDropEveryMs: 20_000 },
}

let network: NetworkController = createNetworkController(db.get().scenario)
const listeners = new Set<(name: ScenarioName) => void>()

export const scenario = {
  get name(): ScenarioName {
    return db.get().scenario
  },
  get behavior(): ScenarioBehavior {
    return { ...DEFAULT_BEHAVIOR, ...BEHAVIOR[db.get().scenario] }
  },
  get network(): NetworkController {
    return network
  },
  set(name: ScenarioName) {
    db.update((s) => {
      s.scenario = name
      s.scenarioEffects = []
    })
    // Recria o controlador para reiniciar contadores e a seed: cenário reproduzível.
    network = createNetworkController(name)
    listeners.forEach((fn) => fn(name))
  },
  onChange(fn: (name: ScenarioName) => void) {
    listeners.add(fn)
    return () => listeners.delete(fn)
  },
}

/** Lê ?cenario= da URL inicial. Retorna true se um cenário foi aplicado. */
export function applyScenarioFromUrl(search: string): boolean {
  const value = new URLSearchParams(search).get('cenario')
  const parsed = ScenarioName.safeParse(value)
  if (!parsed.success) return false
  if (parsed.data !== scenario.name) scenario.set(parsed.data)
  return true
}
