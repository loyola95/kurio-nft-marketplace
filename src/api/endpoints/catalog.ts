import { CatalogPage, Featured, NftDetail, RelatedNfts, type CatalogQuery } from '@/contracts/nft'
import { http } from '../http'

export function catalogQueryToParams(q: CatalogQuery): Record<string, string> {
  const params: Record<string, string> = {
    tab: q.tab,
    sort: q.sort,
    page: String(q.page),
    pageSize: String(q.pageSize),
  }
  if (q.q) params.q = q.q
  if (q.categories?.length) params.categories = q.categories.join(',')
  if (q.networks?.length) params.networks = q.networks.join(',')
  if (q.priceMin) params.priceMin = q.priceMin
  if (q.priceMax) params.priceMax = q.priceMax
  return params
}

export async function getNfts(q: CatalogQuery, signal?: AbortSignal) {
  const { data } = await http.get('/nfts', { params: catalogQueryToParams(q), signal })
  return CatalogPage.parse(data)
}

export async function getFeatured(signal?: AbortSignal) {
  const { data } = await http.get('/nfts/featured', { signal })
  return Featured.parse(data)
}

export async function getNft(id: string, signal?: AbortSignal) {
  const { data } = await http.get(`/nfts/${encodeURIComponent(id)}`, { signal })
  return NftDetail.parse(data)
}

export async function getRelated(id: string, signal?: AbortSignal) {
  const { data } = await http.get(`/nfts/${encodeURIComponent(id)}/related`, { signal })
  return RelatedNfts.parse(data)
}
