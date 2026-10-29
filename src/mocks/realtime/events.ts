import type { NftUpdatedEvent, OrderUpdatedEvent } from '@/contracts/events'
import type { MockOrder } from '../db/schema'
import { db } from '../db/store'
import { defaultEdition, findNft, totalAvailable } from '../domain/catalog'
import { publish } from './server'

/**
 * Toda mudança de preço ou estoque passa por aqui: incrementa a versão do NFT
 * no banco (que a API REST também devolve) e publica o evento correspondente.
 */
export function publishNftUpdated(nftId: string): NftUpdatedEvent | null {
  const event = db.update((s) => {
    const nft = findNft(s, nftId)
    if (!nft) return null
    nft.version += 1
    const e: NftUpdatedEvent = {
      id: crypto.randomUUID(),
      type: 'nft.updated',
      resource: { type: 'nft', id: nft.id },
      version: nft.version,
      occurredAt: new Date().toISOString(),
      userId: null,
      data: {
        nftId: nft.id,
        priceEth: defaultEdition(nft).priceEth,
        available: totalAvailable(nft),
        editions: nft.editions.map((ed) => ({
          editionId: ed.id,
          priceEth: ed.priceEth,
          available: ed.available,
          status: ed.status,
        })),
      },
    }
    return e
  })
  if (event) publish(event)
  return event
}

export function publishOrderUpdated(order: MockOrder): OrderUpdatedEvent {
  const event: OrderUpdatedEvent = {
    id: crypto.randomUUID(),
    type: 'order.updated',
    resource: { type: 'order', id: order.id },
    version: order.version,
    occurredAt: new Date().toISOString(),
    userId: order.userId,
    data: { orderId: order.id, status: order.status, declineReason: order.declineReason },
  }
  publish(event)
  return event
}
