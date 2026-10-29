import { HttpResponse } from 'msw'
import { CatalogQuery } from '@/contracts/nft'
import { db } from '../db/store'
import { featured, findNft, queryCatalog, related, toDetail } from '../domain/catalog'
import { MockHttpError, route } from '../lib/http'
import { scenario } from '../scenarios'

function parseCatalogQuery(url: URL) {
  const p = url.searchParams
  const list = (key: string) => p.get(key)?.split(',').filter(Boolean)
  const parsed = CatalogQuery.safeParse({
    q: p.get('q') || undefined,
    categories: list('categories'),
    networks: list('networks'),
    priceMin: p.get('priceMin') || undefined,
    priceMax: p.get('priceMax') || undefined,
    tab: p.get('tab') || undefined,
    sort: p.get('sort') || undefined,
    page: p.get('page') ? Number(p.get('page')) : undefined,
    pageSize: p.get('pageSize') ? Number(p.get('pageSize')) : undefined,
  })
  if (!parsed.success) {
    throw new MockHttpError(422, 'VALIDATION_ERROR', 'Parâmetros de busca inválidos.')
  }
  return parsed.data
}

export const nftHandlers = [
  route('get', '/nfts', ({ request }) => {
    const q = parseCatalogQuery(new URL(request.url))
    return HttpResponse.json(queryCatalog(db.get(), q, { empty: scenario.behavior.emptyCatalog }))
  }),

  route('get', '/nfts/featured', () => HttpResponse.json(featured(db.get()))),

  route<{ id: string }>('get', '/nfts/:id', ({ params }) => {
    const nft = findNft(db.get(), params.id)
    if (!nft) throw new MockHttpError(404, 'NOT_FOUND', 'NFT não encontrado.')
    return HttpResponse.json(toDetail(nft))
  }),

  route<{ id: string }>('get', '/nfts/:id/related', ({ params }) => {
    const nft = findNft(db.get(), params.id)
    if (!nft) throw new MockHttpError(404, 'NOT_FOUND', 'NFT não encontrado.')
    return HttpResponse.json(related(db.get(), nft))
  }),
]
