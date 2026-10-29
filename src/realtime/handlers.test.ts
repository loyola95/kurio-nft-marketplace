import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { CatalogPage, NftDetail } from '@/contracts/nft'
import type { RealtimeEvent } from '@/contracts/events'
import type { Order } from '@/contracts/order'
import { applyEvent, type ApplyContext } from './handlers'
import { SeenSet } from './seen'

const detail = {
  id: 'nft-1',
  slug: 'nft-1',
  name: 'Emerald Ape #042',
  collection: 'Kurio Apes',
  category: 'arte-digital',
  network: 'ethereum',
  image: { src: '/x-640.webp', alt: '', width: 640, height: 640 },
  priceEth: '1.19',
  compareAtPriceEth: null,
  badge: null,
  available: 10,
  listedAt: '2026-10-28T12:00:00.000Z',
  version: 3,
  editions: [
    {
      id: 'e-50',
      label: '1/50',
      supply: 50,
      available: 10,
      maxPerOrder: 10,
      priceEth: '1.19',
      status: 'available',
    },
  ],
} as unknown as NftDetail

const nftEvent = (
  over: Partial<{ id: string; version: number; price: string }> = {},
): RealtimeEvent => ({
  id: over.id ?? 'ev-1',
  type: 'nft.updated',
  resource: { type: 'nft', id: 'nft-1' },
  version: over.version ?? 4,
  occurredAt: '2026-10-29T10:00:00.000Z',
  data: {
    nftId: 'nft-1',
    priceEth: over.price ?? '1.50',
    available: 9,
    editions: [
      { editionId: 'e-50', priceEth: over.price ?? '1.50', available: 9, status: 'available' },
    ],
  },
})

const order = { id: 'o-1', status: 'pending', version: 1 } as unknown as Order
const orderEvent = (
  status: 'confirmed' | 'declined' | 'pending',
  version: number,
  userId = 'u-ana',
  id = `oe-${version}`,
): RealtimeEvent => ({
  id,
  type: 'order.updated',
  resource: { type: 'order', id: 'o-1' },
  version,
  occurredAt: '2026-10-29T10:00:00.000Z',
  userId,
  data: { orderId: 'o-1', status, declineReason: null },
})

function setup(userId: string | null = 'u-ana') {
  const qc = new QueryClient()
  qc.setQueryData(['nfts', 'detail', 'nft-1'], detail)
  qc.setQueryData(['nfts', 'list', { page: 1 }], {
    items: [{ ...detail }],
  } as unknown as CatalogPage)
  qc.setQueryData(['user', 'u-ana', 'orders', 'o-1'], order)
  const ctx: ApplyContext = { userId, seen: new SeenSet(50), versions: new Map() }
  return { qc, ctx }
}

describe('aplicação de eventos de tempo real', () => {
  it('nft.updated atualiza detalhe e listas', () => {
    const { qc, ctx } = setup()
    expect(applyEvent(qc, nftEvent(), ctx)).toBe('applied')
    const d = qc.getQueryData<NftDetail>(['nfts', 'detail', 'nft-1'])!
    expect(d.priceEth).toBe('1.50')
    expect(d.editions[0].available).toBe(9)
    expect(d.version).toBe(4)
    const list = qc.getQueryData<CatalogPage>(['nfts', 'list', { page: 1 }])!
    expect(list.items[0].priceEth).toBe('1.50')
  })

  it('evento duplicado não é reaplicado', () => {
    const { qc, ctx } = setup()
    applyEvent(qc, nftEvent(), ctx)
    qc.setQueryData<NftDetail>(['nfts', 'detail', 'nft-1'], (d) => ({ ...d!, priceEth: '9.99' }))
    expect(applyEvent(qc, nftEvent(), ctx)).toBe('duplicate')
    expect(qc.getQueryData<NftDetail>(['nfts', 'detail', 'nft-1'])!.priceEth).toBe('9.99')
  })

  it('evento com versão antiga não regride o estado', () => {
    const { qc, ctx } = setup()
    applyEvent(qc, nftEvent({ id: 'a', version: 5, price: '2.00' }), ctx)
    expect(applyEvent(qc, nftEvent({ id: 'b', version: 4, price: '0.10' }), ctx)).toBe('stale')
    expect(applyEvent(qc, nftEvent({ id: 'c', version: 5, price: '0.10' }), ctx)).toBe('stale')
    expect(qc.getQueryData<NftDetail>(['nfts', 'detail', 'nft-1'])!.priceEth).toBe('2.00')
  })

  it('versão do cache vinda da API também vale como referência', () => {
    const { qc, ctx } = setup()
    expect(applyEvent(qc, nftEvent({ id: 'x', version: 3 }), ctx)).toBe('stale')
  })

  it('order.updated de outro usuário é descartado', () => {
    const { qc, ctx } = setup('u-bruno')
    expect(applyEvent(qc, orderEvent('confirmed', 2, 'u-ana'), ctx)).toBe('foreign')
    expect(qc.getQueryData<Order>(['user', 'u-ana', 'orders', 'o-1'])!.status).toBe('pending')
  })

  it('pedido terminal não volta a pendente', () => {
    const { qc, ctx } = setup()
    expect(applyEvent(qc, orderEvent('confirmed', 2), ctx)).toBe('applied')
    expect(qc.getQueryData<Order>(['user', 'u-ana', 'orders', 'o-1'])!.status).toBe('confirmed')
    expect(applyEvent(qc, orderEvent('pending', 3), ctx)).toBe('stale')
    expect(qc.getQueryData<Order>(['user', 'u-ana', 'orders', 'o-1'])!.status).toBe('confirmed')
  })

  it('evento malformado é ignorado', () => {
    const { qc, ctx } = setup()
    expect(applyEvent(qc, { id: 'z', type: 'nft.updated' } as unknown as RealtimeEvent, ctx)).toBe(
      'invalid',
    )
  })
})
