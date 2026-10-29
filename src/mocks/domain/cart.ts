import type { AddCartItemInput, Cart, CartItem, CartNotice, Summary } from '@/contracts/cart'
import { NETWORK_FEE_ETH, type Network } from '@/contracts/common'
import type { ErrorCode } from '@/contracts/errors'
import type { Edition } from '@/contracts/nft'
import { cmp, mul, percent, sub, sum, min } from '@/lib/money'
import type { MockCart, MockCartItem, MockCoupon, MockNft } from '../db/schema'

// Regras do carrinho em funções puras: o handler só lê/grava o banco e responde.

export class CartError extends Error {
  readonly code: ErrorCode
  readonly fieldErrors?: Record<string, string>
  constructor(code: ErrorCode, message: string, fieldErrors?: Record<string, string>) {
    super(message)
    this.code = code
    this.fieldErrors = fieldErrors
  }
}

export type FindEdition = (
  nftId: string,
  editionId: string,
) => { nft: MockNft; edition: Edition } | null

export interface SummaryLine {
  unitPriceEth: string
  quantity: number
  network: Network
}

/** Máximo que pode estar no carrinho para a edição. */
export const maxQuantityOf = (edition: Edition) =>
  edition.status === 'available' ? Math.min(edition.available, edition.maxPerOrder) : 0

/**
 * Resumo sempre calculado aqui (a interface só formata). Sem rede escolhida,
 * cobra uma taxa por rede presente, porque cada rede vira um pedido.
 */
export function computeSummary(
  lines: SummaryLine[],
  coupon: MockCoupon | null,
  network?: Network,
): Summary {
  if (lines.length === 0) {
    return { subtotalEth: '0', discountEth: '0', networkFeeEth: '0', totalEth: '0' }
  }
  const subtotalEth = sum(lines.map((l) => mul(l.unitPriceEth, l.quantity)))
  const rawDiscount = !coupon
    ? '0'
    : coupon.kind === 'percent'
      ? percent(subtotalEth, Number(coupon.value))
      : coupon.value
  const discountEth = min(rawDiscount, subtotalEth)
  const networks = network ? [network] : [...new Set(lines.map((l) => l.network))]
  const networkFeeEth = sum(networks.map((n) => NETWORK_FEE_ETH[n]))
  return {
    subtotalEth,
    discountEth,
    networkFeeEth,
    totalEth: sum([sub(subtotalEth, discountEth), networkFeeEth]),
  }
}

export function resolveCoupon(coupons: MockCoupon[], rawCode: string, now: number): MockCoupon {
  const code = rawCode.trim().toUpperCase()
  const coupon = coupons.find((c) => c.code === code)
  if (!coupon) {
    throw new CartError('COUPON_INVALID', 'Código promocional inválido.', {
      code: 'Código promocional inválido.',
    })
  }
  if (Date.parse(coupon.expiresAt) <= now) {
    throw new CartError('COUPON_EXPIRED', 'Este código promocional expirou.', {
      code: 'Este código promocional expirou.',
    })
  }
  return coupon
}

function limitMessage(max: number) {
  return max === 0
    ? 'Esta edição não está mais disponível.'
    : `Só é possível ter ${max} ${max === 1 ? 'unidade' : 'unidades'} desta edição no carrinho.`
}

export function addItem(
  cart: MockCart,
  input: AddCartItemInput,
  edition: Edition,
  newId: () => string,
): MockCart {
  const existing = cart.items.find(
    (i) => i.nftId === input.nftId && i.editionId === input.editionId,
  )
  const max = maxQuantityOf(edition)
  const quantity = (existing?.quantity ?? 0) + input.quantity
  if (quantity > max) throw new CartError('AVAILABILITY_CONFLICT', limitMessage(max))
  const items = existing
    ? cart.items.map((i) =>
        i === existing ? { ...i, quantity, seenUnitPriceEth: edition.priceEth } : i,
      )
    : [
        ...cart.items,
        {
          id: newId(),
          nftId: input.nftId,
          editionId: input.editionId,
          quantity,
          seenUnitPriceEth: edition.priceEth,
          addedAt: new Date().toISOString(),
        },
      ]
  return { ...cart, items, version: cart.version + 1 }
}

export function setQuantity(cart: MockCart, itemId: string, quantity: number, edition: Edition) {
  const max = maxQuantityOf(edition)
  if (quantity > max) throw new CartError('AVAILABILITY_CONFLICT', limitMessage(max))
  return {
    ...cart,
    // Mexer no item confirma o preço atual (some o aviso de preço alterado).
    items: cart.items.map((i) =>
      i.id === itemId ? { ...i, quantity, seenUnitPriceEth: edition.priceEth } : i,
    ),
    notices: cart.notices.filter((n) => n.itemId !== itemId),
    version: cart.version + 1,
  }
}

/** Junta o carrinho do visitante no da conta; o excedente ao disponível vira aviso. */
export function mergeCarts(
  guest: MockCart,
  user: MockCart,
  find: FindEdition,
  newId: () => string,
): MockCart {
  const items: MockCartItem[] = user.items.map((i) => ({ ...i }))
  const notices: CartNotice[] = [...user.notices]
  for (const g of guest.items) {
    const found = find(g.nftId, g.editionId)
    if (!found) continue
    const max = maxQuantityOf(found.edition)
    const target = items.find((i) => i.nftId === g.nftId && i.editionId === g.editionId)
    const wanted = (target?.quantity ?? 0) + g.quantity
    const quantity = Math.min(wanted, max)
    if (target) target.quantity = quantity
    else if (quantity > 0) items.push({ ...g, id: newId(), quantity })
    if (quantity < wanted) {
      const itemId = target?.id ?? items[items.length - 1]?.id ?? g.id
      notices.push({
        id: newId(),
        kind: 'merge_trimmed',
        itemId,
        message: `${found.nft.name} (${found.edition.label}): ${quantity === 0 ? 'não há mais unidades disponíveis' : `ficaram ${quantity} no carrinho, o máximo disponível`}.`,
      })
    }
  }
  return {
    ...user,
    items,
    notices,
    couponCode: user.couponCode ?? guest.couponCode,
    version: user.version + 1,
  }
}

/**
 * Monta o Cart do contrato a partir do banco: preço e estoque atuais, status por item
 * e avisos. Estoque menor que a quantidade reduz o item (changed = precisa gravar).
 */
export function toCartView(
  cart: MockCart,
  find: FindEdition,
  coupon: MockCoupon | null,
): { view: Cart; cart: MockCart; changed: boolean } {
  let changed = false
  const stored = { ...cart, items: [...cart.items], notices: [...cart.notices] }
  const items: CartItem[] = []
  const derived: CartNotice[] = []

  stored.items = stored.items.flatMap((item) => {
    const found = find(item.nftId, item.editionId)
    if (!found) {
      changed = true
      return []
    }
    const { nft, edition } = found
    const max = maxQuantityOf(edition)
    let status: CartItem['status'] = 'ok'
    let quantity = item.quantity
    if (max === 0) {
      status = 'sold_out'
      derived.push({
        id: `sold_out:${item.id}`,
        kind: 'sold_out',
        itemId: item.id,
        message: `${nft.name} (${edition.label}) esgotou e não entra no total.`,
      })
    } else if (quantity > max) {
      quantity = max
      changed = true
      stored.notices.push({
        id: `quantity_reduced:${item.id}:${stored.version}`,
        kind: 'quantity_reduced',
        itemId: item.id,
        message: `${nft.name} (${edition.label}): restam ${max} ${max === 1 ? 'unidade' : 'unidades'}, a quantidade foi ajustada.`,
      })
      status = 'quantity_reduced'
    } else if (cmp(item.seenUnitPriceEth, edition.priceEth) !== 0) {
      status = 'price_changed'
      derived.push({
        id: `price_changed:${item.id}:${edition.priceEth}`,
        kind: 'price_changed',
        itemId: item.id,
        message: `O preço de ${nft.name} (${edition.label}) mudou de ${item.seenUnitPriceEth} para ${edition.priceEth} ETH.`,
      })
    }
    if (stored.notices.some((n) => n.kind === 'quantity_reduced' && n.itemId === item.id)) {
      status = status === 'sold_out' ? status : 'quantity_reduced'
    }
    items.push({
      id: item.id,
      nftId: nft.id,
      editionId: edition.id,
      name: nft.name,
      editionLabel: edition.label,
      tokenId: nft.tokenId,
      network: nft.network,
      image: nft.image,
      unitPriceEth: edition.priceEth,
      quantity,
      lineTotalEth: mul(edition.priceEth, quantity),
      available: edition.available,
      maxQuantity: max,
      status,
      previousUnitPriceEth: status === 'price_changed' ? item.seenUnitPriceEth : null,
    })
    return [{ ...item, quantity }]
  })
  if (changed) stored.version += 1

  const counted = items.filter((i) => i.status !== 'sold_out')
  const view: Cart = {
    id: stored.id,
    ownerType: stored.ownerType,
    items,
    coupon: coupon ? { code: coupon.code, label: coupon.label, status: 'applied' } : null,
    summary: computeSummary(counted, coupon),
    notices: [...stored.notices, ...derived],
    version: stored.version,
  }
  return { view, cart: stored, changed }
}
