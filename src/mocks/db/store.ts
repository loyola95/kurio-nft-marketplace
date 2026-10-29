import type { MockState } from './schema'
import { buildSeed, SEED_VERSION } from './seed'

export const STORAGE_KEY = 'kurio.mockdb.v1'

export interface KeyValueStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

function memoryStorage(): KeyValueStorage {
  const map = new Map<string, string>()
  return {
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => void map.set(k, v),
    removeItem: (k) => void map.delete(k),
  }
}

function defaultStorage(): KeyValueStorage {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.getItem(STORAGE_KEY)
      return localStorage
    }
  } catch {
    // Armazenamento bloqueado: segue só em memória.
  }
  return memoryStorage()
}

export interface Store {
  get(): MockState
  update<T>(fn: (state: MockState) => T): T
  reset(): void
  subscribe(fn: (state: MockState) => void): () => void
}

/** Banco simulado: estado em memória, persistido após cada mutação. */
export function createStore(storage: KeyValueStorage = defaultStorage()): Store {
  const listeners = new Set<(state: MockState) => void>()

  const load = (): MockState => {
    try {
      const raw = storage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as MockState
        if (parsed.seedVersion === SEED_VERSION) return parsed
      }
    } catch {
      // Dado corrompido: volta ao seed.
    }
    return buildSeed()
  }

  let state = load()

  const persist = () => {
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Cota excedida ou bloqueio: o estado em memória continua valendo.
    }
    listeners.forEach((fn) => fn(state))
  }

  return {
    get: () => state,
    update(fn) {
      const result = fn(state)
      persist()
      return result
    },
    reset() {
      state = buildSeed()
      persist()
    },
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
  }
}

export const db = createStore()

export function nextId(state: MockState, prefix: string): string {
  state.sequence += 1
  return `${prefix}-${state.sequence}`
}
