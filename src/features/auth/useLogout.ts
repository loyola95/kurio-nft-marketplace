import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { logout } from '@/api/endpoints/auth'
import { cartIdentity, sessionStore } from '@/api/identity'
import { removeByPrefix } from '@/lib/storage'
import { sessionKeys } from './session'

/**
 * Limpa tudo que é privado da sessão: queries do usuário, carrinho, rascunhos
 * e token. O provider de tempo real reage à troca de usuário e encerra o socket.
 */
export function useClearSession() {
  const queryClient = useQueryClient()
  return useCallback(async () => {
    await queryClient.cancelQueries()
    queryClient.removeQueries({ queryKey: ['user'] })
    queryClient.removeQueries({ queryKey: ['cart'] })
    removeByPrefix('session', 'kurio.checkout.')
    removeByPrefix('session', 'kurio.draft.')
    sessionStore.clear()
    cartIdentity.reset()
    queryClient.setQueryData(sessionKeys.current, null)
  }, [queryClient])
}

export function useLogout() {
  const clear = useClearSession()
  const navigate = useNavigate()
  return useCallback(async () => {
    try {
      await logout()
    } catch {
      // Mesmo se a API falhar, a sessão local é encerrada.
    }
    await clear()
    await navigate({ to: '/' })
  }, [clear, navigate])
}
