import { COUPONS, FAVORITES, USERS, WALLETS } from '../fixtures/accounts'
import { buildNfts } from '../fixtures/nfts'
import type { MockState } from './schema'

/** Versão do formato do banco. Mudou a forma dos dados, aumenta aqui. */
export const SEED_VERSION = 3

export function buildSeed(): MockState {
  return {
    seedVersion: SEED_VERSION,
    users: structuredClone(USERS),
    sessions: [],
    nfts: buildNfts(),
    favorites: structuredClone(FAVORITES),
    carts: {},
    coupons: structuredClone(COUPONS),
    quotes: {},
    orders: {},
    wallets: structuredClone(WALLETS),
    connections: {},
    sequence: 1000,
    lastEvent: null,
    scenario: 'padrao',
  }
}
