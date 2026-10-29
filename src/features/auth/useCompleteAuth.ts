import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { mergeCart } from '@/api/endpoints/cart'
import { cartIdentity, sessionStore } from '@/api/identity'
import type { AuthResponse } from '@/contracts/auth'
import type { Cart } from '@/contracts/cart'
import { cartKeys } from '@/features/cart/queries'
import { announce } from '@/features/layout/announce'
import { safeRedirect } from '@/lib/redirect'
import { sessionKeys } from './session'

/**
 * Depois de login ou cadastro: guarda o token, junta o carrinho de visitante
 * (se tiver itens) ao da conta e volta para onde a pessoa estava.
 */
export function useCompleteAuth() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()
  return useCallback(
    async (response: AuthResponse, redirectTo?: string) => {
      const guestId = cartIdentity.get()
      const guestCart = queryClient.getQueryData<Cart>(cartKeys.current(`guest:${guestId}`))
      sessionStore.set(response.session.token, response.session.expiresAt)
      queryClient.setQueryData(sessionKeys.current, response.user)
      if (guestCart?.items.length) {
        try {
          await mergeCart(guestId)
        } catch {
          toast.error('Não foi possível trazer os itens do carrinho de visitante.')
        }
      }
      queryClient.removeQueries({ queryKey: cartKeys.current(`guest:${guestId}`) })
      cartIdentity.reset()
      void queryClient.invalidateQueries({ queryKey: cartKeys.all })
      announce(`Você entrou como ${response.user.displayName}.`)
      await navigate({ href: safeRedirect(redirectTo) })
    },
    [queryClient, navigate],
  )
}
