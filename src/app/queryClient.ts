import { QueryClient } from '@tanstack/react-query'
import { isRetryable } from '@/api/errors'

/**
 * Política de cache e retry (documentada no ARCHITECTURE.md):
 * - leituras tentam de novo até 2 vezes, só em falha transitória (rede, timeout, 5xx);
 * - mutations nunca repetem sozinhas, para não duplicar operações;
 * - staleTime padrão de 30 s; cada recurso ajusta o seu nas queryOptions.
 */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        retry: (failureCount, error) => failureCount < 2 && isRetryable(error),
        retryDelay: (attempt) => 500 * 2 ** attempt,
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  })
}
