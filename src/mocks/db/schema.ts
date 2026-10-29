import type { Network } from '@/contracts/common'
import type { CartNotice } from '@/contracts/cart'
import type { Image } from '@/contracts/common'
import type { Category, Edition, Review } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import type { Quote } from '@/contracts/quote'
import type { Wallet, WalletConnection } from '@/contracts/wallet'
import type { ScenarioName } from '@/contracts/mock'

export interface MockUser {
  id: string
  username: string
  email: string
  displayName: string
  salt: string
  passwordHash: string
  avatarUrl: string | null
  ensName: string
  walletNickname: string
  profileVersion: number
}

export interface MockSession {
  token: string
  userId: string
  expiresAt: string
}

export interface MockNft {
  id: string
  slug: string
  name: string
  collection: string
  category: Category
  network: Network
  image: Image
  gallery: Image[]
  compareAtPriceEth: string | null
  badge: 'RARO' | null
  listedAt: string
  popularity: number
  description: string
  longDescription: string
  tokenId: string
  contract: string
  royaltiesPct: number
  attributes: string[]
  reviews: Review[]
  editions: Edition[]
  version: number
}

export interface MockCartItem {
  id: string
  nftId: string
  editionId: string
  quantity: number
  /** Preço unitário que o usuário viu por último; base para detectar mudança. */
  seenUnitPriceEth: string
  addedAt: string
}

export interface MockCart {
  id: string
  ownerType: 'guest' | 'user'
  items: MockCartItem[]
  couponCode: string | null
  notices: CartNotice[]
  version: number
}

export interface MockCoupon {
  code: string
  label: string
  kind: 'percent' | 'fixed'
  value: string
  expiresAt: string
}

export interface MockQuote extends Quote {
  userId: string
  cartKey: string
  /** Assinatura do que a cotação considerou (preços, estoque, cupom, taxa). */
  fingerprint: string
}

export interface MockOrder extends Order {
  userId: string
  idempotencyKey: string
  bodyHash: string
  resolveAt: string
  outcome: 'confirmed' | 'declined'
  /** Edições e quantidades compradas (saem do carrinho na confirmação). */
  purchased: { nftId: string; editionId: string; quantity: number }[]
}

export interface MockWalletConnection extends WalletConnection {
  userId: string
}

export interface MockState {
  seedVersion: number
  users: MockUser[]
  sessions: MockSession[]
  nfts: MockNft[]
  favorites: Record<string, string[]>
  carts: Record<string, MockCart>
  coupons: MockCoupon[]
  quotes: Record<string, MockQuote>
  orders: Record<string, MockOrder>
  wallets: Record<string, { primary: Wallet | null; secondary: Wallet | null }>
  connections: Record<string, MockWalletConnection>
  /** Contador global usado para ids e versões de eventos. */
  sequence: number
  lastEvent: unknown | null
  /** Último evento de cada tipo (controle "evento antigo" escolhe o tipo). */
  lastEvents: Record<string, unknown>
  scenario: ScenarioName
  /** Efeitos únicos do cenário já aplicados (ex.: preço que muda uma vez no checkout). */
  scenarioEffects: string[]
}
