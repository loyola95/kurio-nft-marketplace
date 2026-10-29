import { z } from 'zod'
import { EthAmount, IsoDate } from './common'
import { EditionStatus } from './nft'
import { OrderStatus } from './order'

// Todo evento carrega identidade estável (id), recurso afetado e versão.
const EventBase = z.object({
  id: z.string(),
  version: z.number().int(),
  occurredAt: IsoDate,
  userId: z.string().nullable().optional(),
})

export const NftUpdatedData = z.object({
  nftId: z.string(),
  priceEth: EthAmount,
  available: z.number().int().min(0),
  editions: z.array(
    z.object({
      editionId: z.string(),
      priceEth: EthAmount,
      available: z.number().int().min(0),
      status: EditionStatus,
    }),
  ),
})
export type NftUpdatedData = z.infer<typeof NftUpdatedData>

export const OrderUpdatedData = z.object({
  orderId: z.string(),
  status: OrderStatus,
  declineReason: z.string().nullable(),
})
export type OrderUpdatedData = z.infer<typeof OrderUpdatedData>

export const NftUpdatedEvent = EventBase.extend({
  type: z.literal('nft.updated'),
  resource: z.object({ type: z.literal('nft'), id: z.string() }),
  data: NftUpdatedData,
})
export type NftUpdatedEvent = z.infer<typeof NftUpdatedEvent>

export const OrderUpdatedEvent = EventBase.extend({
  type: z.literal('order.updated'),
  resource: z.object({ type: z.literal('order'), id: z.string() }),
  data: OrderUpdatedData,
})
export type OrderUpdatedEvent = z.infer<typeof OrderUpdatedEvent>

export const RealtimeEvent = z.discriminatedUnion('type', [NftUpdatedEvent, OrderUpdatedEvent])
export type RealtimeEvent = z.infer<typeof RealtimeEvent>

export const REALTIME_EVENTS = ['nft.updated', 'order.updated'] as const
