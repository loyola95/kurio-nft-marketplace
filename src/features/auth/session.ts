import { queryOptions, useQuery } from '@tanstack/react-query'
import { getSession } from '@/api/endpoints/auth'
import { isApiError } from '@/api/errors'
import { sessionStore } from '@/api/identity'
import type { User } from '@/contracts/auth'

export const sessionKeys = { current: ['session'] as const }

/**
 * Sessão atual. Sem token, ninguém está logado (sem chamar a API).
 * Com token, a API confirma; 401 limpa o token e devolve null.
 */
export const sessionQueryOptions = queryOptions({
  queryKey: sessionKeys.current,
  queryFn: async ({ signal }): Promise<User | null> => {
    if (!sessionStore.getToken()) return null
    try {
      return (await getSession(signal)).user
    } catch (error) {
      if (isApiError(error, 'SESSION_EXPIRED') || isApiError(error, 'UNAUTHENTICATED')) {
        sessionStore.clear()
        return null
      }
      throw error
    }
  },
  staleTime: Infinity,
})

export function useSession(): {
  user: User | null
  status: 'loading' | 'authenticated' | 'guest'
} {
  const { data, isPending } = useQuery(sessionQueryOptions)
  if (isPending) return { user: null, status: 'loading' }
  return data ? { user: data, status: 'authenticated' } : { user: null, status: 'guest' }
}
