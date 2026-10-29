import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import { sessionStore } from '@/api/identity'
import type { Cart } from '@/contracts/cart'
import type { RealtimeEvent } from '@/contracts/events'
import type { Order } from '@/contracts/order'
import { REALTIME_EVENTS } from '@/contracts/events'
import { useSession } from '@/features/auth/session'
import { announce } from '@/features/layout/announce'
import { formatEth } from '@/lib/money'
import { RealtimeContext, type RealtimeStatus } from './context'
import { applyEvent, type ApplyContext } from './handlers'
import { reconcileActive } from './reconcile'
import { SeenSet } from './seen'
import { createSocket } from './socket'

/**
 * Ciclo de vida do socket amarrado à sessão: troca de usuário ou logout encerra
 * o socket anterior (listeners incluídos) e abre outro com o novo token. Assim
 * eventos de uma sessão anterior nunca chegam aos dados do usuário seguinte.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient()
  const { user, status: sessionStatus } = useSession()
  const userId = user?.id ?? null
  const [status, setStatus] = useState<RealtimeStatus>('connecting')

  useEffect(() => {
    if (sessionStatus === 'loading') return
    const socket = createSocket(userId ? sessionStore.getToken() : null)
    const ctx: ApplyContext = { userId, seen: new SeenSet(), versions: new Map() }
    let wasDisconnected = false

    const onEvent = (raw: unknown) => {
      const outcome = applyEvent(qc, raw, ctx)
      if (outcome === 'applied') notify(qc, raw as RealtimeEvent)
    }
    const onConnect = () => {
      setStatus('connected')
      if (wasDisconnected) reconcileActive(qc, userId)
      wasDisconnected = false
    }
    const onDisconnect = () => {
      wasDisconnected = true
      setStatus('reconnecting')
    }

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)
    for (const name of REALTIME_EVENTS) socket.on(name, onEvent)

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      for (const name of REALTIME_EVENTS) socket.off(name, onEvent)
      socket.disconnect()
      setStatus('connecting')
    }
  }, [qc, userId, sessionStatus])

  return <RealtimeContext.Provider value={{ status }}>{children}</RealtimeContext.Provider>
}

/** Feedback visível e acessível quando um item do carrinho muda. */
function notify(qc: ReturnType<typeof useQueryClient>, event: RealtimeEvent) {
  if (event.type !== 'nft.updated') return
  // Estoque que mudou pela própria compra da pessoa não é aviso para ela.
  const ownOrders = qc.getQueriesData<Order>({ queryKey: ['user'] })
  const bought = ownOrders.some(
    ([key, order]) =>
      key[2] === 'orders' &&
      order?.receipt?.lines?.some((l) => l.nftId === event.data.nftId) &&
      Date.now() - Date.parse(order.updatedAt) < 60_000,
  )
  if (bought) return
  const carts = qc.getQueriesData<Cart>({ queryKey: ['cart'] })
  const item = carts.flatMap(([, c]) => c?.items ?? []).find((i) => i.nftId === event.data.nftId)
  if (!item) return
  const edition = event.data.editions.find((e) => e.editionId === item.editionId)
  if (!edition) return
  if (edition.available === 0) {
    toast.warning(`${item.name} (${item.editionLabel}) esgotou. Revise seu carrinho.`)
  } else if (edition.priceEth !== item.unitPriceEth) {
    toast.info(`O preço de ${item.name} mudou para ${formatEth(edition.priceEth)}.`)
  } else if (edition.available < item.quantity) {
    toast.warning(`A disponibilidade de ${item.name} diminuiu. Revise seu carrinho.`)
  } else {
    return
  }
  announce('Um item do seu carrinho foi atualizado.')
}
