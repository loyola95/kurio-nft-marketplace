import { readJson, removeKey, writeJson } from '@/lib/storage'

const SESSION_KEY = 'kurio.session'
const CART_ID_KEY = 'kurio.cartId'

interface StoredSession {
  token: string
  expiresAt: string
}

/** Token da sessão. Sobrevive a refresh; nunca guarda senha. */
export const sessionStore = {
  getToken(): string | null {
    return readJson<StoredSession>('local', SESSION_KEY)?.token ?? null
  },
  getExpiresAt(): string | null {
    return readJson<StoredSession>('local', SESSION_KEY)?.expiresAt ?? null
  },
  set(token: string, expiresAt: string) {
    writeJson('local', SESSION_KEY, { token, expiresAt })
  },
  clear() {
    removeKey('local', SESSION_KEY)
  },
}

/** Identidade do carrinho do visitante (header X-Cart-Id). */
export const cartIdentity = {
  get(): string {
    const existing = readJson<string>('local', CART_ID_KEY)
    if (existing) return existing
    const id = crypto.randomUUID()
    writeJson('local', CART_ID_KEY, id)
    return id
  },
  reset(): string {
    const id = crypto.randomUUID()
    writeJson('local', CART_ID_KEY, id)
    return id
  },
}
