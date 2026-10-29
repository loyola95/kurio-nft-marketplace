import { NETWORK_LABEL, type Network } from '@/contracts/common'
import type { CreateOrderInput, Order } from '@/contracts/order'
import type { Quote } from '@/contracts/quote'
import { WALLET_NETWORKS, WALLET_TYPE_LABEL } from '@/contracts/wallet'
import type { MockOrder, MockQuote, MockState } from '../db/schema'
import { hex, prng } from '../lib/prng'
import { DomainError, type FindEdition } from './cart'
import { buildQuote, toQuote } from './quote'

export interface OrderBehavior {
  orderDelayMs: number
  orderOutcome: 'confirmed' | 'declined'
}

export interface PlaceOrderInput {
  userId: string
  key: string
  bodyHash: string
  body: CreateOrderInput
  now: number
  behavior: OrderBehavior
  find: FindEdition
  newId: (prefix: string) => string
}

export type PlaceOrderResult =
  | { kind: 'created'; order: MockOrder }
  | { kind: 'replayed'; order: MockOrder }
  /** Algo mudou desde a cotação: a nova cotação já está gravada e volta ao cliente. */
  | { kind: 'stale'; quote: Quote }

const EXPLORER: Record<Network, string> = {
  ethereum: 'https://etherscan.io/tx/',
  polygon: 'https://polygonscan.com/tx/',
  solana: 'https://solscan.io/tx/',
}

export const cartKeyOf = (userId: string) => `user:${userId}`

/** Cupom do carrinho ainda válido agora (expirado deixa de valer na cotação). */
export function activeCoupon(state: MockState, code: string | null, now: number) {
  const coupon = state.coupons.find((c) => c.code === code)
  return coupon && Date.parse(coupon.expiresAt) > now ? coupon : null
}

export function createQuoteFor(
  state: MockState,
  params: { userId: string; network: Network; now: number; find: FindEdition; id: string },
): MockQuote {
  const cartKey = cartKeyOf(params.userId)
  const cart = state.carts[cartKey]
  if (!cart || cart.items.length === 0) {
    throw new DomainError('VALIDATION_ERROR', 'Seu carrinho está vazio.')
  }
  const previous = Object.values(state.quotes).filter((q) => q.userId === params.userId)
  const quote = buildQuote({
    cart,
    find: params.find,
    coupon: activeCoupon(state, cart.couponCode, params.now),
    network: params.network,
    userId: params.userId,
    cartKey,
    id: params.id,
    version: previous.reduce((v, q) => Math.max(v, q.version), 0) + 1,
    now: params.now,
  })
  // Cada cotação vale até expirar (a revisão aberta continua válida depois de um
  // refresh); as vencidas saem do banco.
  for (const q of previous) {
    if (Date.parse(q.expiresAt) <= params.now) delete state.quotes[q.id]
  }
  state.quotes[quote.id] = quote
  return quote
}

/** Hash de transação simulado e reproduzível a partir do id do pedido. */
export function fakeTxHash(orderId: string): string {
  let seed = 0
  for (const ch of orderId) seed = (Math.imul(seed, 31) + ch.charCodeAt(0)) >>> 0
  return `0x${hex(prng(seed), 64)}`
}

/**
 * Cria o pedido (pendente) de forma idempotente. A mesma chave com o mesmo corpo
 * devolve o pedido já criado; com outro corpo é conflito. Antes de criar,
 * revalida a cotação contra preço, estoque, cupom e taxa atuais.
 */
export function placeOrder(state: MockState, input: PlaceOrderInput): PlaceOrderResult {
  const { userId, key, body, now } = input

  const existing = Object.values(state.orders).find(
    (o) => o.userId === userId && o.idempotencyKey === key,
  )
  if (existing) {
    if (existing.bodyHash !== input.bodyHash) {
      throw new DomainError(
        'IDEMPOTENCY_CONFLICT',
        'Esta tentativa de compra já foi enviada com outros dados.',
      )
    }
    return { kind: 'replayed', order: existing }
  }

  const wallets = state.wallets[userId]
  const wallet = [wallets?.primary, wallets?.secondary].find((w) => w?.id === body.walletId)
  if (!wallet) {
    throw new DomainError('VALIDATION_ERROR', 'Escolha uma carteira cadastrada.', {
      walletId: 'Escolha uma carteira cadastrada.',
    })
  }
  if (wallet.network !== body.network) {
    throw new DomainError(
      'NETWORK_MISMATCH',
      `A carteira ${wallet.nickname} é da rede ${NETWORK_LABEL[wallet.network]}.`,
    )
  }

  const connection = state.connections[body.connectionId]
  if (
    !connection ||
    connection.userId !== userId ||
    connection.walletId !== wallet.id ||
    connection.network !== body.network
  ) {
    throw new DomainError('WALLET_DISCONNECTED', 'A carteira foi desconectada. Conecte novamente.')
  }

  const quote = state.quotes[body.quoteId]
  if (quote && quote.userId === userId && quote.network !== body.network) {
    throw new DomainError('NETWORK_MISMATCH', 'A cotação é de outra rede.')
  }

  // Cotação nova com os dados de agora; se diferir da aceita (ou ela venceu), o usuário confirma de novo.
  const fresh = createQuoteFor(state, {
    userId,
    network: body.network,
    now,
    find: input.find,
    id: input.newId('q'),
  })
  const accepted =
    quote &&
    quote.userId === userId &&
    quote.version === body.quoteVersion &&
    Date.parse(quote.expiresAt) > now &&
    quote.fingerprint === fresh.fingerprint
  if (!accepted) return { kind: 'stale', quote: toQuote(fresh) }

  // A cotação aceita é consumida pelo pedido; a recalculada só serviu de conferência.
  delete state.quotes[fresh.id]
  delete state.quotes[quote.id]

  // Reserva o estoque até a resolução.
  for (const line of quote.lines) {
    const found = input.find(line.nftId, line.editionId)!
    found.edition.available -= line.quantity
    if (found.edition.available === 0 && found.edition.status === 'available') {
      found.edition.status = 'sold_out'
    }
  }

  const id = input.newId('ord')
  const createdAt = new Date(now).toISOString()
  const order: MockOrder = {
    id,
    status: 'pending',
    version: 1,
    createdAt,
    updatedAt: createdAt,
    declineReason: null,
    receipt: {
      lines: quote.lines,
      coupon: quote.coupon,
      summary: quote.summary,
      network: quote.network,
      wallet: { label: WALLET_TYPE_LABEL[connection.connector], address: wallet.address },
      transaction: null,
      confirmedAt: null,
    },
    userId,
    idempotencyKey: key,
    bodyHash: input.bodyHash,
    resolveAt: new Date(now + input.behavior.orderDelayMs).toISOString(),
    outcome: input.behavior.orderOutcome,
    purchased: quote.lines.map((l) => ({
      nftId: l.nftId,
      editionId: l.editionId,
      quantity: l.quantity,
    })),
  }
  state.orders[id] = order
  return { kind: 'created', order }
}

/**
 * Resolve um pedido pendente com o resultado previsto. Confirmado: o estoque
 * reservado vira venda e só as quantidades compradas saem do carrinho.
 * Recusado: a reserva volta ao estoque e o carrinho fica intacto.
 * Devolve os NFTs cujo estoque mudou de forma visível.
 */
export function resolveOrder(
  state: MockState,
  order: MockOrder,
  now: number,
  find: FindEdition,
): string[] {
  if (order.status !== 'pending') return []
  const at = new Date(now).toISOString()
  order.status = order.outcome
  order.version += 1
  order.updatedAt = at

  if (order.outcome === 'declined') {
    order.declineReason = 'O pagamento foi recusado pela carteira. Nenhum valor foi cobrado.'
    for (const p of order.purchased) {
      const found = find(p.nftId, p.editionId)
      if (!found) continue
      found.edition.available += p.quantity
      if (found.edition.status === 'sold_out' && found.edition.available > 0) {
        found.edition.status = 'available'
      }
    }
    return []
  }

  const hash = fakeTxHash(order.id)
  order.receipt = {
    ...order.receipt,
    transaction: { hash, explorerUrl: `${EXPLORER[order.receipt.network]}${hash}` },
    confirmedAt: at,
  }

  const cartKey = cartKeyOf(order.userId)
  const cart = state.carts[cartKey]
  if (cart) {
    const items = cart.items.flatMap((item) => {
      const bought = order.purchased.find(
        (p) => p.nftId === item.nftId && p.editionId === item.editionId,
      )
      if (!bought) return [item]
      const quantity = item.quantity - bought.quantity
      return quantity > 0 ? [{ ...item, quantity }] : []
    })
    const kept = new Set(items.map((i) => i.id))
    state.carts[cartKey] = {
      ...cart,
      items,
      notices: cart.notices.filter((n) => kept.has(n.itemId)),
      // O cupom foi usado neste pedido.
      couponCode: order.receipt.coupon?.code === cart.couponCode ? null : cart.couponCode,
      version: cart.version + 1,
    }
  }
  return [...new Set(order.purchased.map((p) => p.nftId))]
}

/** Resolve os pedidos vencidos (também depois de um refresh, pelo resolveAt gravado). */
export function resolveDueOrders(
  state: MockState,
  now: number,
  find: FindEdition,
): { orders: MockOrder[]; nftIds: string[] } {
  const due = Object.values(state.orders).filter(
    (o) => o.status === 'pending' && Date.parse(o.resolveAt) <= now,
  )
  const nftIds = due.flatMap((o) => resolveOrder(state, o, now, find))
  return { orders: due, nftIds: [...new Set(nftIds)] }
}

export function toOrder(order: MockOrder): Order {
  return {
    id: order.id,
    status: order.status,
    version: order.version,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    declineReason: order.declineReason,
    receipt: order.receipt,
  }
}

/** Conector precisa suportar a rede (MetaMask e Coinbase só EVM). */
export function assertConnectorSupports(connector: keyof typeof WALLET_NETWORKS, network: Network) {
  if (!WALLET_NETWORKS[connector].includes(network)) {
    throw new DomainError(
      'VALIDATION_ERROR',
      `${WALLET_TYPE_LABEL[connector]} não conecta na rede ${NETWORK_LABEL[network]}.`,
      { connector: `${WALLET_TYPE_LABEL[connector]} não conecta nessa rede.` },
    )
  }
}
