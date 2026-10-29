import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback } from 'react'
import { logout } from '@/api/endpoints/auth'
import { cartIdentity, sessionStore } from '@/api/identity'
import { removeByPrefix } from '@/lib/storage'
import { sessionKeys } from './session'

/**
 * Limpa tudo que é privado da sessão: queries do usuário, carrinho, token e,
 * no logout, os rascunhos. Na expiração os rascunhos ficam (são por userId)
 * para o formulário voltar preenchido depois do novo login.
 * O provider de tempo real reage à troca de usuário e encerra o socket.
 */
export async function clearSessionData(
  queryClient: QueryClient,
  { keepDrafts = false }: { keepDrafts?: boolean } = {},
) {
  await queryClient.cancelQueries()
  queryClient.removeQueries({ queryKey: ['user'] })
  queryClient.removeQueries({ queryKey: ['cart'] })
  if (!keepDrafts) {
    removeByPrefix('session', 'kurio.checkout.')
    removeByPrefix('session', 'kurio.draft.')
  }
  sessionStore.clear()
  cartIdentity.reset()
  queryClient.setQueryData(sessionKeys.current, null)
}

/** Token vencido pelo relógio do cliente (o servidor confirma na próxima chamada). */
export function sessionExpiredLocally(now = Date.now()): boolean {
  const expiresAt = sessionStore.getExpiresAt()
  return Boolean(sessionStore.getToken() && expiresAt && Date.parse(expiresAt) <= now)
}

export function useClearSession() {
  const queryClient = useQueryClient()
  return useCallback(
    (options?: { keepDrafts?: boolean }) => clearSessionData(queryClient, options),
    [queryClient],
  )
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
