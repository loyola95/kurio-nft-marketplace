import type { Network } from '@/contracts/common'
import type { Quote, QuoteLine } from '@/contracts/quote'
import { mul } from '@/lib/money'
import type { MockCart, MockCoupon, MockQuote } from '../db/schema'
import { DomainError, computeSummary, maxQuantityOf, type FindEdition } from './cart'

export const QUOTE_TTL_MS = 5 * 60 * 1000

export interface BuildQuoteInput {
  cart: MockCart
  find: FindEdition
  coupon: MockCoupon | null
  network: Network
  userId: string
  cartKey: string
  id: string
  version: number
  now: number
}

/** O que a cotação considerou: se mudar até o envio, a cotação está desatualizada. */
export function quoteFingerprint(quote: Pick<Quote, 'lines' | 'coupon' | 'summary'>): string {
  return JSON.stringify({
    lines: quote.lines.map((l) => [l.editionId, l.unitPriceEth, l.quantity]),
    coupon: quote.coupon?.code ?? null,
    fee: quote.summary.networkFeeEth,
    total: quote.summary.totalEth,
  })
}

/**
 * Cotação de um pedido: só os itens do carrinho daquela rede (um pedido é sempre
 * de uma rede), com preço e estoque atuais. Item sem estoque bloqueia a cotação.
 */
export function buildQuote(input: BuildQuoteInput): MockQuote {
  const { cart, find, coupon, network } = input
  const lines: QuoteLine[] = []
  const conflicts: { nftId: string; editionId: string; name: string; available: number }[] = []

  for (const item of cart.items) {
    const found = find(item.nftId, item.editionId)
    if (!found || found.nft.network !== network) continue
    const { nft, edition } = found
    const max = maxQuantityOf(edition)
    if (item.quantity > max) {
      conflicts.push({ nftId: nft.id, editionId: edition.id, name: nft.name, available: max })
      continue
    }
    lines.push({
      itemId: item.id,
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      editionLabel: edition.label,
      tokenId: nft.tokenId,
      image: nft.image,
      unitPriceEth: edition.priceEth,
      quantity: item.quantity,
      lineTotalEth: mul(edition.priceEth, item.quantity),
    })
  }

  if (conflicts.length > 0) {
    const names = conflicts.map((c) => c.name).join(', ')
    throw new DomainError(
      'AVAILABILITY_CONFLICT',
      `Não há unidades suficientes de ${names}. Revise o carrinho.`,
      undefined,
      { conflicts },
    )
  }
  if (lines.length === 0) {
    throw new DomainError('VALIDATION_ERROR', 'Não há itens dessa rede no carrinho.', {
      network: 'Não há itens dessa rede no carrinho.',
    })
  }

  const summary = computeSummary(
    lines.map((l) => ({ unitPriceEth: l.unitPriceEth, quantity: l.quantity, network })),
    coupon,
    network,
  )
  const quote: Quote = {
    id: input.id,
    version: input.version,
    cartVersion: cart.version,
    expiresAt: new Date(input.now + QUOTE_TTL_MS).toISOString(),
    network,
    lines,
    coupon: coupon ? { code: coupon.code, label: coupon.label, status: 'applied' } : null,
    summary,
  }
  return {
    ...quote,
    userId: input.userId,
    cartKey: input.cartKey,
    fingerprint: quoteFingerprint(quote),
  }
}

/** Remove os campos internos do banco simulado. */
export function toQuote(quote: MockQuote): Quote {
  const { userId: _u, cartKey: _c, fingerprint: _f, ...rest } = quote
  return rest
}
