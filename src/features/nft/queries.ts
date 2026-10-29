import { queryOptions } from '@tanstack/react-query'
import { getNft, getRelated } from '@/api/endpoints/catalog'
import { isApiError } from '@/api/errors'
import type { Edition, NftDetail } from '@/contracts/nft'

export const nftKeys = {
  detail: (id: string) => ['nfts', 'detail', id] as const,
  related: (id: string) => ['nfts', 'related', id] as const,
}

export const nftDetailOptions = (id: string) =>
  queryOptions({
    queryKey: nftKeys.detail(id),
    queryFn: ({ signal }) => getNft(id, signal),
    staleTime: 30_000,
    // NFT inexistente não melhora tentando de novo.
    retry: (count, error) => !isApiError(error, 'NOT_FOUND') && count < 2,
  })

export const relatedOptions = (id: string) =>
  queryOptions({
    queryKey: nftKeys.related(id),
    queryFn: ({ signal }) => getRelated(id, signal),
    staleTime: 60_000,
  })

/** Edição inicial: a pedida na URL se estiver à venda; senão 1/50; senão a primeira disponível. */
export function pickEdition(nft: NftDetail, requested?: string): Edition {
  const available = nft.editions.filter((e) => e.status === 'available')
  return (
    available.find((e) => e.id === requested) ??
    available.find((e) => e.label === '1/50') ??
    available[0] ??
    nft.editions.find((e) => e.id === requested) ??
    nft.editions[0]
  )
}
