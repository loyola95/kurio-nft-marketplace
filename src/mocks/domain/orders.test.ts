import { beforeEach, describe, expect, it } from 'vitest'
import type { CreateOrderInput } from '@/contracts/order'
import type { MockState } from '../db/schema'
import { buildSeed } from '../db/seed'
import { DomainError, type FindEdition } from './cart'
import { findNft } from './catalog'
import { createQuoteFor, placeOrder, resolveDueOrders, type PlaceOrderInput } from './orders'
import { QUOTE_TTL_MS } from './quote'

const NOW = Date.parse('2026-10-29T12:00:00.000Z')
const USER = 'u-ana'

let state: MockState
let seq: number
const newId = (prefix: string) => `${prefix}-${++seq}`
const find: FindEdition = (nftId, editionId) => {
  const nft = findNft(state, nftId)
  const edition = nft?.editions.find((e) => e.id === editionId)
  return nft && edition ? { nft, edition } : null
}
const edition = (nftId: string, label = '1/50') =>
  findNft(state, nftId)!.editions.find((e) => e.label === label)!

function addToCart(nftId: string, quantity: number, label = '1/50') {
  const cart = (state.carts[`user:${USER}`] ??= {
    id: 'c-ana',
    ownerType: 'user',
    items: [],
    couponCode: null,
    notices: [],
    version: 1,
  })
  const ed = edition(nftId, label)
  cart.items.push({
    id: newId('item'),
    nftId,
    editionId: ed.id,
    quantity,
    seenUnitPriceEth: ed.priceEth,
    addedAt: new Date(NOW).toISOString(),
  })
  cart.version += 1
}

function connect(walletId = 'w-ana-1', network: 'ethereum' | 'polygon' = 'ethereum') {
  const id = newId('conn')
  state.connections[id] = {
    id,
    status: 'connected',
    walletId,
    connector: 'metamask',
    network,
    userId: USER,
  }
  return id
}

function quote(network: 'ethereum' | 'polygon' = 'ethereum', now = NOW) {
  return createQuoteFor(state, { userId: USER, network, now, find, id: newId('q') })
}

function order(body: CreateOrderInput, over: Partial<PlaceOrderInput> = {}) {
  return placeOrder(state, {
    userId: USER,
    key: 'k-1',
    bodyHash: 'h-1',
    body,
    now: NOW,
    behavior: { orderDelayMs: 3000, orderOutcome: 'confirmed' },
    find,
    newId,
    ...over,
  })
}

function bodyFor(q: { id: string; version: number }, connectionId: string): CreateOrderInput {
  return {
    quoteId: q.id,
    quoteVersion: q.version,
    walletId: 'w-ana-1',
    network: 'ethereum',
    connectionId,
    collector: {
      displayName: 'Ana Souza',
      network: 'ethereum',
      walletAddress: '0xA91F3c5B7d2e4F6a8B0c1D2e3F4a5B6c7D8eE82C',
      walletType: 'metamask',
      email: 'ana@kurio.dev',
      username: 'ana.souza',
      profileName: 'ana.souza',
      ensOrSecondary: '',
      referralCode: 'KURIO-ANA',
      ensName: 'nova.eth',
      useOtherWallet: false,
      note: '',
    },
  }
}

function expectDomainError(fn: () => unknown, code: string) {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(DomainError)
    expect((error as DomainError).code).toBe(code)
    return error as DomainError
  }
  throw new Error(`esperava ${code}`)
}

beforeEach(() => {
  state = buildSeed()
  seq = 0
})

describe('cotação', () => {
  it('inclui só os itens da rede escolhida, com taxa daquela rede', () => {
    const polygon = state.nfts.find(
      (n) =>
        n.network === 'polygon' && n.editions.some((e) => e.label === '1/50' && e.available > 0),
    )!
    addToCart('emerald-ape-042', 2)
    addToCart(polygon.id, 1)
    const q = quote('ethereum')
    expect(q.lines.map((l) => l.nftId)).toEqual(['emerald-ape-042'])
    expect(q.summary).toEqual({
      subtotalEth: '2.38',
      discountEth: '0',
      networkFeeEth: '0.016',
      totalEth: '2.396',
    })
    expect(Date.parse(q.expiresAt) - NOW).toBe(QUOTE_TTL_MS)
  })

  it('rede sem itens no carrinho é erro de validação', () => {
    addToCart('emerald-ape-042', 1)
    expectDomainError(() => quote('polygon'), 'VALIDATION_ERROR')
  })

  it('item acima do disponível bloqueia com AVAILABILITY_CONFLICT', () => {
    addToCart('emerald-ape-042', 2)
    edition('emerald-ape-042').available = 1
    const error = expectDomainError(() => quote(), 'AVAILABILITY_CONFLICT')
    expect(error.details).toMatchObject({ conflicts: [{ nftId: 'emerald-ape-042', available: 1 }] })
  })
})

describe('pedido', () => {
  it('mesma chave e mesmo corpo devolvem o mesmo pedido (replayed)', () => {
    addToCart('emerald-ape-042', 2)
    const body = bodyFor(quote(), connect())
    const first = order(body)
    const second = order(body)
    expect(first.kind).toBe('created')
    expect(second.kind).toBe('replayed')
    if (first.kind === 'stale' || second.kind === 'stale') throw new Error('inesperado')
    expect(second.order.id).toBe(first.order.id)
    expect(Object.keys(state.orders)).toHaveLength(1)
  })

  it('mesma chave com corpo diferente é IDEMPOTENCY_CONFLICT', () => {
    addToCart('emerald-ape-042', 2)
    const body = bodyFor(quote(), connect())
    order(body)
    expectDomainError(() => order(body, { bodyHash: 'outro' }), 'IDEMPOTENCY_CONFLICT')
    expect(Object.keys(state.orders)).toHaveLength(1)
  })

  it('preço mudou depois da cotação: QUOTE_STALE com a cotação nova, sem pedido', () => {
    addToCart('emerald-ape-042', 2)
    const body = bodyFor(quote(), connect())
    edition('emerald-ape-042').priceEth = '1.5'
    const result = order(body)
    expect(result.kind).toBe('stale')
    if (result.kind !== 'stale') return
    expect(result.quote.lines[0].unitPriceEth).toBe('1.5')
    expect(result.quote.id).not.toBe(body.quoteId)
    expect(state.orders).toEqual({})
  })

  it('gerar outra cotação (ex.: refresh) não invalida a que está em revisão', () => {
    addToCart('emerald-ape-042', 1)
    const reviewed = quote()
    quote()
    expect(order(bodyFor(reviewed, connect())).kind).toBe('created')
  })

  it('cotação vencida (mais de 5 min) também exige nova confirmação', () => {
    addToCart('emerald-ape-042', 1)
    const body = bodyFor(quote(), connect())
    expect(order(body, { now: NOW + QUOTE_TTL_MS + 1 }).kind).toBe('stale')
  })

  it('cupom removido depois da cotação deixa a cotação desatualizada', () => {
    addToCart('emerald-ape-042', 1)
    state.carts[`user:${USER}`].couponCode = 'KURIO10'
    const body = bodyFor(quote(), connect())
    expect(state.quotes[body.quoteId].summary.discountEth).toBe('0.119')
    state.carts[`user:${USER}`].couponCode = null
    expect(order(body).kind).toBe('stale')
  })

  it('conexão desfeita antes de confirmar é WALLET_DISCONNECTED', () => {
    addToCart('emerald-ape-042', 1)
    const connectionId = connect()
    const body = bodyFor(quote(), connectionId)
    delete state.connections[connectionId]
    expectDomainError(() => order(body), 'WALLET_DISCONNECTED')
  })

  it('carteira de outra rede é NETWORK_MISMATCH', () => {
    addToCart('emerald-ape-042', 1)
    const body = { ...bodyFor(quote(), connect('w-ana-2', 'polygon')), walletId: 'w-ana-2' }
    expectDomainError(() => order(body), 'NETWORK_MISMATCH')
  })

  it('confirmado remove só as quantidades compradas e grava hash', () => {
    addToCart('emerald-ape-042', 2)
    const body = bodyFor(quote(), connect())
    const before = edition('emerald-ape-042').available
    const created = order(body)
    if (created.kind !== 'created') throw new Error('esperava pedido')
    expect(edition('emerald-ape-042').available).toBe(before - 2)
    // Depois de enviar, a pessoa adiciona mais unidades e outro NFT.
    state.carts[`user:${USER}`].items[0].quantity = 3
    addToCart('golden-beat-207', 1)

    resolveDueOrders(state, NOW + 3000, find)
    const resolved = state.orders[created.order.id]
    expect(resolved.status).toBe('confirmed')
    expect(resolved.version).toBe(2)
    expect(resolved.receipt.transaction?.hash).toMatch(/^0x[0-9a-f]{64}$/)
    expect(resolved.receipt.transaction?.explorerUrl).toContain('https://etherscan.io/tx/0x')
    const items = state.carts[`user:${USER}`].items
    expect(items.map((i) => [i.nftId, i.quantity])).toEqual([
      ['emerald-ape-042', 1],
      ['golden-beat-207', 1],
    ])
    expect(edition('emerald-ape-042').available).toBe(before - 2)
  })

  it('recusado não mexe no carrinho e devolve o estoque reservado', () => {
    addToCart('emerald-ape-042', 2)
    const body = bodyFor(quote(), connect())
    const before = edition('emerald-ape-042').available
    const created = order(body, { behavior: { orderDelayMs: 3000, orderOutcome: 'declined' } })
    if (created.kind !== 'created') throw new Error('esperava pedido')
    resolveDueOrders(state, NOW + 3000, find)
    expect(state.orders[created.order.id].status).toBe('declined')
    expect(state.orders[created.order.id].declineReason).toBeTruthy()
    expect(state.orders[created.order.id].receipt.transaction).toBeNull()
    expect(state.carts[`user:${USER}`].items).toHaveLength(1)
    expect(state.carts[`user:${USER}`].items[0].quantity).toBe(2)
    expect(edition('emerald-ape-042').available).toBe(before)
  })

  it('resolve pedido vencido depois de um reload (estado recriado do storage)', () => {
    addToCart('emerald-ape-042', 1)
    const created = order(bodyFor(quote(), connect()))
    if (created.kind !== 'created') throw new Error('esperava pedido')
    // O timer morreu no reload; o banco volta do localStorage.
    state = JSON.parse(JSON.stringify(state)) as MockState
    expect(resolveDueOrders(state, NOW + 2999, find).orders).toHaveLength(0)
    expect(state.orders[created.order.id].status).toBe('pending')
    const { orders, nftIds } = resolveDueOrders(state, NOW + 3000, find)
    expect(orders.map((o) => o.id)).toEqual([created.order.id])
    expect(nftIds).toEqual(['emerald-ape-042'])
    expect(state.orders[created.order.id].status).toBe('confirmed')
    // Terminal: rodar de novo não muda nada.
    expect(resolveDueOrders(state, NOW + 9000, find).orders).toHaveLength(0)
  })
})
