import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  addCartItem,
  applyCoupon,
  getCart,
  removeCartItem,
  dismissCartNotices,
  removeCoupon,
  updateCartItem,
} from '@/api/endpoints/cart'
import { cartIdentity } from '@/api/identity'
import type { AddCartItemInput, Cart } from '@/contracts/cart'
import { useSession } from '@/features/auth/session'

/** Dono do carrinho: usuário logado ou o visitante (X-Cart-Id). Isola o cache por dono. */
export function cartOwnerKey(userId: string | null): string {
  return userId ? `user:${userId}` : `guest:${cartIdentity.get()}`
}

export const cartKeys = {
  all: ['cart'] as const,
  current: (ownerKey: string) => ['cart', ownerKey] as const,
}

export const cartQueryOptions = (ownerKey: string) =>
  queryOptions({
    queryKey: cartKeys.current(ownerKey),
    queryFn: ({ signal }) => getCart(signal),
    staleTime: 0,
    refetchOnWindowFocus: true,
  })

export function useCartKey() {
  const { user, status } = useSession()
  return { key: cartOwnerKey(user?.id ?? null), ready: status !== 'loading' }
}

export function useCart() {
  const { key, ready } = useCartKey()
  return useQuery({ ...cartQueryOptions(key), enabled: ready })
}

/** Toda mutation do carrinho devolve o carrinho inteiro: o cache recebe a resposta da API. */
function useCartMutation<TVars>(fn: (vars: TVars) => Promise<Cart>) {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  return useMutation({
    mutationFn: fn,
    onSuccess: (cart) => queryClient.setQueryData(cartKeys.current(key), cart),
    // Conflito de estoque: o carrinho no servidor mudou, então recarrega a versão real.
    onError: () => queryClient.invalidateQueries({ queryKey: cartKeys.current(key) }),
  })
}

export const useAddToCart = () => useCartMutation((input: AddCartItemInput) => addCartItem(input))
export const useUpdateCartItem = () =>
  useCartMutation(({ itemId, quantity }: { itemId: string; quantity: number }) =>
    updateCartItem(itemId, quantity),
  )
export const useRemoveCartItem = () => useCartMutation((itemId: string) => removeCartItem(itemId))
export const useApplyCoupon = () => useCartMutation((code: string) => applyCoupon(code))
export const useRemoveCoupon = () => useCartMutation(() => removeCoupon())
export const useDismissCartNotices = () => useCartMutation(() => dismissCartNotices())

/** Quantidade já no carrinho para uma edição (limite de quantidade no detalhe). */
export function useQuantityInCart(editionId: string | undefined): number {
  const { data } = useCart()
  if (!editionId || !data) return 0
  return data.items.filter((i) => i.editionId === editionId).reduce((n, i) => n + i.quantity, 0)
}

/**
 * Devolve ao carrinho um item removido ("Desfazer" do aviso). Chama a API direto, sem
 * depender da linha que já saiu da tela, e grava o carrinho devolvido no cache.
 */
export function useRestoreCartItem() {
  const queryClient = useQueryClient()
  const { key } = useCartKey()
  return async (input: AddCartItemInput) => {
    const cart = await addCartItem(input)
    queryClient.setQueryData(cartKeys.current(key), cart)
  }
}
