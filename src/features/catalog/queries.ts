import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { getFeatured, getNfts } from '@/api/endpoints/catalog'
import type { CatalogQuery } from '@/contracts/nft'

export const catalogKeys = {
  all: ['nfts'] as const,
  lists: () => [...catalogKeys.all, 'list'] as const,
  list: (q: CatalogQuery) => [...catalogKeys.lists(), q] as const,
  featured: () => [...catalogKeys.all, 'featured'] as const,
}

/**
 * Cada combinação de parâmetros tem a sua chave: respostas de buscas antigas
 * nunca sobrescrevem a atual, e o signal cancela a requisição obsoleta.
 */
export const catalogListOptions = (q: CatalogQuery) =>
  queryOptions({
    queryKey: catalogKeys.list(q),
    queryFn: ({ signal }) => getNfts(q, signal),
    placeholderData: keepPreviousData,
    staleTime: 30_000,
  })

export const featuredOptions = queryOptions({
  queryKey: catalogKeys.featured(),
  queryFn: ({ signal }) => getFeatured(signal),
  staleTime: 60_000,
})
