import type { QueryClient } from '@tanstack/react-query'

/**
 * Depois de uma reconexão, eventos podem ter sido perdidos. A API REST é a
 * fonte da verdade: revalida o que está na tela (catálogo, detalhe, carrinho
 * e pedidos do usuário atual). Queries inativas só revalidam quando voltarem.
 */
export function reconcileActive(qc: QueryClient, userId: string | null) {
  void qc.invalidateQueries({ queryKey: ['nfts'] })
  void qc.invalidateQueries({ queryKey: ['cart'] })
  if (userId) void qc.invalidateQueries({ queryKey: ['user', userId, 'orders'] })
}
