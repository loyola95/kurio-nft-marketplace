import { queryOptions, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addFavorite, getFavorites, removeFavorite } from '@/api/endpoints/account'
import type { Favorites } from '@/contracts/favorites'
import { useSession } from '@/features/auth/session'
import { toast } from 'sonner'
import { announce } from '@/features/layout/announce'

export const favoriteKeys = {
  list: (userId: string) => ['user', userId, 'favorites'] as const,
}

export const favoritesOptions = (userId: string) =>
  queryOptions({
    queryKey: favoriteKeys.list(userId),
    queryFn: ({ signal }) => getFavorites(signal),
    staleTime: 60_000,
  })

export function useFavorites() {
  const { user } = useSession()
  return useQuery({ ...favoritesOptions(user?.id ?? ''), enabled: Boolean(user) })
}

export function useIsFavorite(nftId: string): boolean {
  const { data } = useFavorites()
  return data?.nftIds.includes(nftId) ?? false
}

/**
 * Favoritar com atualização otimista: a interface muda na hora, e se a API
 * falhar o estado anterior volta (rollback) com aviso acessível.
 */
export function useToggleFavorite() {
  const queryClient = useQueryClient()
  const { user } = useSession()
  const key = favoriteKeys.list(user?.id ?? '')

  return useMutation({
    mutationFn: ({ nftId, favorite }: { nftId: string; favorite: boolean }) =>
      favorite ? addFavorite(nftId) : removeFavorite(nftId),
    onMutate: async ({ nftId, favorite }) => {
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Favorites>(key)
      queryClient.setQueryData<Favorites>(key, (old) => {
        const base = old ?? { nftIds: [], items: [] }
        return favorite
          ? { ...base, nftIds: [...new Set([...base.nftIds, nftId])] }
          : {
              nftIds: base.nftIds.filter((id) => id !== nftId),
              items: base.items.filter((n) => n.id !== nftId),
            }
      })
      return { previous }
    },
    onError: (_error, _vars, context) => {
      queryClient.setQueryData(key, context?.previous)
      // O toast já é anunciado por leitores de tela (região aria-live do sonner).
      toast.error('Não foi possível atualizar seus favoritos. A alteração foi desfeita.')
    },
    onSuccess: (_data, { favorite }) => {
      announce(favorite ? 'Adicionado à lista de interesse.' : 'Removido da lista de interesse.')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: key }),
  })
}
