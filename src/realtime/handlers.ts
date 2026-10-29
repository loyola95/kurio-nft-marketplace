import type { QueryClient } from '@tanstack/react-query'
import { RealtimeEvent, type NftUpdatedEvent, type OrderUpdatedEvent } from '@/contracts/events'
import type { CatalogPage, Featured, NftDetail, NftSummary } from '@/contracts/nft'
import type { Order } from '@/contracts/order'
import { orderKeys } from '@/features/orders/keys'
import type { SeenSet } from './seen'

export type ApplyOutcome = 'applied' | 'duplicate' | 'stale' | 'foreign' | 'invalid'

export interface ApplyContext {
  /** Usuário da sessão atual; eventos privados de outro usuário são descartados. */
  userId: string | null
  seen: SeenSet
  /** Última versão aplicada por recurso ("nft:<id>", "order:<id>"). */
  versions: Map<string, number>
}

const TERMINAL = new Set(['confirmed', 'declined'])

/**
 * Aplica um evento ao cache do TanStack Query de forma idempotente:
 * duplicatas (mesmo id) e versões antigas nunca regridem nem reaplicam efeitos.
 */
export function applyEvent(qc: QueryClient, raw: unknown, ctx: ApplyContext): ApplyOutcome {
  const parsed = RealtimeEvent.safeParse(raw)
  if (!parsed.success) return 'invalid'
  const event = parsed.data
  if (ctx.seen.has(event.id)) return 'duplicate'

  if (event.type === 'order.updated' && event.userId && event.userId !== ctx.userId) {
    return 'foreign'
  }

  const resourceKey = `${event.resource.type}:${event.resource.id}`
  const known = Math.max(ctx.versions.get(resourceKey) ?? -1, cachedVersion(qc, event, ctx))
  if (event.version <= known) {
    ctx.seen.add(event.id)
    return 'stale'
  }

  const outcome = event.type === 'nft.updated' ? applyNft(qc, event) : applyOrder(qc, event, ctx)
  ctx.seen.add(event.id)
  if (outcome === 'applied') ctx.versions.set(resourceKey, event.version)
  return outcome
}

function cachedVersion(qc: QueryClient, event: RealtimeEvent, ctx: ApplyContext): number {
  if (event.type === 'nft.updated') {
    return qc.getQueryData<NftDetail>(['nfts', 'detail', event.data.nftId])?.version ?? -1
  }
  if (!ctx.userId) return -1
  return qc.getQueryData<Order>(orderKeys.detail(ctx.userId, event.data.orderId))?.version ?? -1
}

function patchSummary<T extends NftSummary>(item: T, event: NftUpdatedEvent): T {
  if (item.id !== event.data.nftId || item.version >= event.version) return item
  return {
    ...item,
    priceEth: event.data.priceEth,
    available: event.data.available,
    version: event.version,
  }
}

function applyNft(qc: QueryClient, event: NftUpdatedEvent): ApplyOutcome {
  const { nftId, editions } = event.data
  qc.setQueryData<NftDetail>(['nfts', 'detail', nftId], (old) => {
    if (!old) return old
    const byId = new Map(editions.map((e) => [e.editionId, e]))
    return {
      ...patchSummary(old, event),
      editions: old.editions.map((e) => {
        const next = byId.get(e.id)
        return next
          ? { ...e, priceEth: next.priceEth, available: next.available, status: next.status }
          : e
      }),
    }
  })
  qc.setQueriesData<CatalogPage>({ queryKey: ['nfts', 'list'] }, (old) =>
    old ? { ...old, items: old.items.map((i) => patchSummary(i, event)) } : old,
  )
  qc.setQueriesData<NftSummary[]>({ queryKey: ['nfts', 'related'] }, (old) =>
    old ? old.map((i) => patchSummary(i, event)) : old,
  )
  qc.setQueryData<Featured>(['nfts', 'featured'], (old) =>
    old
      ? {
          hero: old.hero.map((i) => patchSummary(i, event)),
          spotlight: patchSummary(old.spotlight, event),
        }
      : old,
  )
  // O carrinho é recalculado pela API (preço, disponibilidade, avisos).
  void qc.invalidateQueries({ queryKey: ['cart'] })
  return 'applied'
}

function applyOrder(qc: QueryClient, event: OrderUpdatedEvent, ctx: ApplyContext): ApplyOutcome {
  if (!ctx.userId) return 'foreign'
  const key = orderKeys.detail(ctx.userId, event.data.orderId)
  const current = qc.getQueryData<Order>(key)
  if (current && TERMINAL.has(current.status)) return 'stale'
  if (current) {
    qc.setQueryData<Order>(key, {
      ...current,
      status: event.data.status,
      declineReason: event.data.declineReason,
      version: event.version,
    })
  }
  // O recibo completo (hash da transação) vem da API.
  void qc.invalidateQueries({ queryKey: key })
  void qc.invalidateQueries({ queryKey: orderKeys.pending(ctx.userId) })
  if (event.data.status === 'confirmed') void qc.invalidateQueries({ queryKey: ['cart'] })
  return 'applied'
}
