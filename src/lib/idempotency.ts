import { readJson, removeKey, writeJson } from './storage'

/** JSON com chaves ordenadas: o mesmo conteúdo sempre gera o mesmo texto. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`
  }
  return JSON.stringify(value)
}

/** sha256 do corpo canônico (o servidor compara para detectar chave reutilizada com outro corpo). */
export async function hashBody(body: unknown): Promise<string> {
  const bytes = new TextEncoder().encode(canonicalJson(body))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export interface Attempt {
  quoteId: string
  quoteVersion: number
  walletId: string
  network: string
}

interface StoredAttempt extends Attempt {
  key: string
}

const attemptKey = (userId: string) => `kurio.checkout.${userId}.attempt`
const sameAttempt = (a: Attempt, b: Attempt) =>
  a.quoteId === b.quoteId &&
  a.quoteVersion === b.quoteVersion &&
  a.walletId === b.walletId &&
  a.network === b.network

/**
 * Chave de idempotência da tentativa de compra. Nasce no primeiro "Confirmar
 * compra" de uma cotação/carteira/rede e é reaproveitada em reenvios (clique
 * repetido, timeout, refresh). Nova cotação gera nova chave.
 */
export const idempotency = {
  forAttempt(userId: string, attempt: Attempt): string {
    const stored = readJson<StoredAttempt>('session', attemptKey(userId))
    if (stored && sameAttempt(stored, attempt)) return stored.key
    const key = crypto.randomUUID()
    writeJson('session', attemptKey(userId), { ...attempt, key })
    return key
  },
  clear(userId: string) {
    removeKey('session', attemptKey(userId))
  },
}
