import { queryOptions, useQuery } from '@tanstack/react-query'
import { getOrder, getPendingOrders } from '@/api/endpoints/checkout'
import { useSession } from '@/features/auth/session'
import { useRealtimeStatus } from '@/realtime/context'
import { orderKeys } from './keys'

/**
 * Pedido do usuário. Enquanto pendente, o evento order.updated atualiza; se o
 * socket estiver fora, cai para polling de 5 s (fallback).
 */
export const orderOptions = (userId: string, id: string, socketConnected: boolean) =>
  queryOptions({
    queryKey: orderKeys.detail(userId, id),
    queryFn: ({ signal }) => getOrder(id, signal),
    staleTime: 0,
    refetchInterval: (query) =>
      query.state.data?.status === 'pending' && !socketConnected ? 5000 : false,
  })

export function useOrder(id: string) {
  const { user } = useSession()
  const connected = useRealtimeStatus() === 'connected'
  return useQuery({ ...orderOptions(user?.id ?? '', id, connected), enabled: Boolean(user) })
}

/** Pedidos pendentes (retomada depois de refresh ou reconexão). */
export function usePendingOrders() {
  const { user } = useSession()
  return useQuery({
    queryKey: orderKeys.pending(user?.id ?? ''),
    queryFn: ({ signal }) => getPendingOrders(signal),
    enabled: Boolean(user),
    staleTime: 0,
  })
}
