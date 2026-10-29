import { describe, expect, it } from 'vitest'
import type { Edition } from '@/contracts/nft'
import type { MockCart, MockCoupon, MockNft } from '../db/schema'
import { CartError, addItem, computeSummary, mergeCarts, resolveCoupon, toCartView } from './cart'

const coupons: MockCoupon[] = [
  {
    code: 'KURIO10',
    label: '10% de desconto',
    kind: 'percent',
    value: '10',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
  {
    code: 'GENESIS',
    label: '0.05 ETH de desconto',
    kind: 'fixed',
    value: '0.05',
    expiresAt: '2099-01-01T00:00:00.000Z',
  },
  {
    code: 'VERAO2025',
    label: '15% de desconto',
    kind: 'percent',
    value: '15',
    expiresAt: '2025-03-20T23:59:59.000Z',
  },
]
const NOW = Date.parse('2026-10-29T12:00:00.000Z')

const edition = (over: Partial<Edition> = {}): Edition => ({
  id: 'e-50',
  label: '1/50',
  supply: 50,
  available: 10,
  maxPerOrder: 10,
  priceEth: '1.19',
  status: 'available',
  ...over,
})

const nft = (editions: Edition[], over: Partial<MockNft> = {}): MockNft =>
  ({
    id: 'emerald-ape-042',
    name: 'Emerald Ape #042',
    tokenId: '#0042',
    network: 'ethereum',
    image: { src: '/x-640.webp', alt: '', width: 640, height: 640 },
    editions,
    ...over,
  }) as unknown as MockNft

const emptyCart = (over: Partial<MockCart> = {}): MockCart => ({
  id: 'c-1',
  ownerType: 'user',
  items: [],
  couponCode: null,
  notices: [],
  version: 1,
  ...over,
})

let seq = 0
const newId = () => `i-${++seq}`

describe('resumo do carrinho', () => {
  const lines = [
    { unitPriceEth: '1.19', quantity: 2, network: 'ethereum' as const },
    { unitPriceEth: '1.39', quantity: 6, network: 'ethereum' as const },
    { unitPriceEth: '1.79', quantity: 9, network: 'ethereum' as const },
  ]

  it('soma subtotal, taxa da rede e total como no Figma', () => {
    expect(computeSummary(lines, null)).toEqual({
      subtotalEth: '26.83',
      discountEth: '0',
      networkFeeEth: '0.016',
      totalEth: '26.846',
    })
  })

  it('KURIO10 desconta 10% do subtotal', () => {
    const s = computeSummary(lines, coupons[0])
    expect(s.discountEth).toBe('2.683')
    expect(s.totalEth).toBe('24.163')
  })

  it('GENESIS nunca desconta mais que o subtotal', () => {
    const s = computeSummary(
      [{ unitPriceEth: '0.02', quantity: 1, network: 'polygon' }],
      coupons[1],
    )
    expect(s.discountEth).toBe('0.02')
    expect(s.totalEth).toBe('0.002')
  })

  it('carrinho vazio com cupom fica todo zerado', () => {
    expect(computeSummary([], coupons[0])).toEqual({
      subtotalEth: '0',
      discountEth: '0',
      networkFeeEth: '0',
      totalEth: '0',
    })
  })

  it('cobra uma taxa por rede presente (um pedido por rede)', () => {
    const s = computeSummary(
      [
        { unitPriceEth: '1', quantity: 1, network: 'ethereum' },
        { unitPriceEth: '1', quantity: 1, network: 'polygon' },
        { unitPriceEth: '1', quantity: 1, network: 'polygon' },
      ],
      null,
    )
    expect(s.networkFeeEth).toBe('0.018')
  })

  it('com rede escolhida considera só a taxa dela', () => {
    expect(computeSummary(lines, null, 'ethereum').networkFeeEth).toBe('0.016')
  })
})

describe('cupons', () => {
  it('aceita código válido sem diferenciar maiúsculas', () => {
    expect(resolveCoupon(coupons, ' kurio10 ', NOW).code).toBe('KURIO10')
  })

  it('VERAO2025 está expirado', () => {
    expect(() => resolveCoupon(coupons, 'VERAO2025', NOW)).toThrow(
      expect.objectContaining({ code: 'COUPON_EXPIRED' }),
    )
  })

  it('código desconhecido é inválido', () => {
    expect(() => resolveCoupon(coupons, 'NADA', NOW)).toThrow(
      expect.objectContaining({ code: 'COUPON_INVALID' }),
    )
  })
})

describe('adicionar item', () => {
  it('soma com o item da mesma edição', () => {
    const e = edition()
    const cart = addItem(
      emptyCart(),
      { nftId: 'emerald-ape-042', editionId: 'e-50', quantity: 2 },
      e,
      newId,
    )
    const next = addItem(
      cart,
      { nftId: 'emerald-ape-042', editionId: 'e-50', quantity: 3 },
      e,
      newId,
    )
    expect(next.items).toHaveLength(1)
    expect(next.items[0].quantity).toBe(5)
    expect(next.items[0].seenUnitPriceEth).toBe('1.19')
  })

  it('não passa do disponível', () => {
    const e = edition({ available: 3 })
    expect(() =>
      addItem(emptyCart(), { nftId: 'emerald-ape-042', editionId: 'e-50', quantity: 4 }, e, newId),
    ).toThrow(CartError)
  })

  it('edição esgotada não entra no carrinho', () => {
    const e = edition({ available: 0, status: 'sold_out' })
    expect(() =>
      addItem(emptyCart(), { nftId: 'emerald-ape-042', editionId: 'e-50', quantity: 1 }, e, newId),
    ).toThrow(expect.objectContaining({ code: 'AVAILABILITY_CONFLICT' }))
  })
})

describe('juntar carrinho de visitante', () => {
  it('soma quantidades limitando ao disponível e avisa o corte', () => {
    const e = edition({ available: 4, maxPerOrder: 10 })
    const find = () => ({ nft: nft([e]), edition: e })
    const guest = emptyCart({
      ownerType: 'guest',
      items: [
        {
          id: 'g1',
          nftId: 'emerald-ape-042',
          editionId: 'e-50',
          quantity: 3,
          seenUnitPriceEth: '1.19',
          addedAt: '',
        },
      ],
    })
    const user = emptyCart({
      items: [
        {
          id: 'u1',
          nftId: 'emerald-ape-042',
          editionId: 'e-50',
          quantity: 2,
          seenUnitPriceEth: '1.19',
          addedAt: '',
        },
      ],
    })
    const merged = mergeCarts(guest, user, find, newId)
    expect(merged.items).toHaveLength(1)
    expect(merged.items[0].quantity).toBe(4)
    expect(merged.notices).toEqual([
      expect.objectContaining({ kind: 'merge_trimmed', itemId: 'u1' }),
    ])
  })

  it('mantém o cupom do visitante se a conta não tiver', () => {
    const merged = mergeCarts(
      emptyCart({ ownerType: 'guest', couponCode: 'GENESIS' }),
      emptyCart(),
      () => null,
      newId,
    )
    expect(merged.couponCode).toBe('GENESIS')
  })
})

describe('visão do carrinho', () => {
  it('marca preço alterado com o preço anterior', () => {
    const e = edition({ priceEth: '1.55' })
    const cart = emptyCart({
      items: [
        {
          id: 'i1',
          nftId: 'emerald-ape-042',
          editionId: 'e-50',
          quantity: 2,
          seenUnitPriceEth: '1.19',
          addedAt: '',
        },
      ],
    })
    const { view } = toCartView(cart, () => ({ nft: nft([e]), edition: e }), null)
    expect(view.items[0]).toMatchObject({
      status: 'price_changed',
      unitPriceEth: '1.55',
      previousUnitPriceEth: '1.19',
      lineTotalEth: '3.1',
    })
    expect(view.notices).toEqual([expect.objectContaining({ kind: 'price_changed', itemId: 'i1' })])
    expect(view.summary.subtotalEth).toBe('3.1')
  })

  it('reduz a quantidade quando o estoque caiu', () => {
    const e = edition({ available: 1 })
    const cart = emptyCart({
      items: [
        {
          id: 'i1',
          nftId: 'emerald-ape-042',
          editionId: 'e-50',
          quantity: 3,
          seenUnitPriceEth: '1.19',
          addedAt: '',
        },
      ],
    })
    const { view, changed } = toCartView(cart, () => ({ nft: nft([e]), edition: e }), null)
    expect(changed).toBe(true)
    expect(view.items[0]).toMatchObject({ status: 'quantity_reduced', quantity: 1, maxQuantity: 1 })
  })

  it('item esgotado fica fora do resumo', () => {
    const e = edition({ available: 0, status: 'sold_out' })
    const cart = emptyCart({
      items: [
        {
          id: 'i1',
          nftId: 'emerald-ape-042',
          editionId: 'e-50',
          quantity: 1,
          seenUnitPriceEth: '1.19',
          addedAt: '',
        },
      ],
    })
    const { view } = toCartView(cart, () => ({ nft: nft([e]), edition: e }), null)
    expect(view.items[0].status).toBe('sold_out')
    expect(view.summary.totalEth).toBe('0')
  })
})
