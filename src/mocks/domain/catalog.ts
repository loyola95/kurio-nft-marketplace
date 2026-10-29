import { NETWORK_LABEL } from '@/contracts/common'
import {
  CATEGORY_LABEL,
  type CatalogPage,
  type CatalogQuery,
  type Category,
  type Edition,
  type Featured,
  type NftDetail,
  type NftSummary,
} from '@/contracts/nft'
import { cmp } from '@/lib/money'
import type { MockNft, MockState } from '../db/schema'

const LATEST_COUNT = 24
const TRENDING_COUNT = 30

/** Edição exibida no card: 1/50 se estiver à venda, senão a primeira disponível. */
export function defaultEdition(nft: MockNft): Edition {
  return (
    nft.editions.find((e) => e.label === '1/50' && e.status === 'available') ??
    nft.editions.find((e) => e.status === 'available') ??
    nft.editions.find((e) => e.label === '1/50') ??
    nft.editions[0]
  )
}

export function totalAvailable(nft: MockNft): number {
  return nft.editions.filter((e) => e.status !== 'unavailable').reduce((n, e) => n + e.available, 0)
}

export function toSummary(nft: MockNft): NftSummary {
  return {
    id: nft.id,
    slug: nft.slug,
    name: nft.name,
    collection: nft.collection,
    category: nft.category,
    network: nft.network,
    image: nft.image,
    priceEth: defaultEdition(nft).priceEth,
    compareAtPriceEth: nft.compareAtPriceEth,
    badge: nft.badge,
    available: totalAvailable(nft),
    listedAt: nft.listedAt,
    version: nft.version,
  }
}

export function toDetail(nft: MockNft): NftDetail {
  const ratingSum = nft.reviews.reduce((n, r) => n + r.rating, 0)
  return {
    ...toSummary(nft),
    description: nft.description,
    longDescription: nft.longDescription,
    tokenId: nft.tokenId,
    contract: nft.contract,
    royaltiesPct: nft.royaltiesPct,
    attributes: nft.attributes,
    rating: {
      average: nft.reviews.length ? Math.round((ratingSum / nft.reviews.length) * 10) / 10 : 0,
      count: nft.reviews.length,
    },
    reviews: nft.reviews,
    gallery: nft.gallery,
    editions: nft.editions,
  }
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

function byTab(nfts: MockNft[], tab: CatalogQuery['tab']): MockNft[] {
  if (tab === 'lancamentos') {
    return [...nfts].sort((a, b) => b.listedAt.localeCompare(a.listedAt)).slice(0, LATEST_COUNT)
  }
  if (tab === 'em-alta') {
    return [...nfts].sort((a, b) => b.popularity - a.popularity).slice(0, TRENDING_COUNT)
  }
  return nfts
}

export function queryCatalog(
  state: MockState,
  q: CatalogQuery,
  options: { empty?: boolean } = {},
): CatalogPage {
  const all = options.empty ? [] : state.nfts
  const term = q.q ? normalize(q.q) : ''
  const summaries = byTab(all, q.tab)
    .map((nft) => ({ nft, summary: toSummary(nft) }))
    .filter(({ nft, summary }) => {
      if (term && !normalize(`${nft.name} ${nft.collection}`).includes(term)) return false
      if (q.categories?.length && !q.categories.includes(nft.category)) return false
      if (q.networks?.length && !q.networks.includes(nft.network)) return false
      if (q.priceMin && cmp(summary.priceEth, q.priceMin) < 0) return false
      if (q.priceMax && cmp(summary.priceEth, q.priceMax) > 0) return false
      return true
    })
    .map(({ summary }) => summary)

  const sorted = [...summaries]
  if (q.sort === 'menor-preco') sorted.sort((a, b) => cmp(a.priceEth, b.priceEth))
  else if (q.sort === 'maior-preco') sorted.sort((a, b) => cmp(b.priceEth, a.priceEth))
  else if (q.sort === 'nome') sorted.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
  else sorted.sort((a, b) => b.listedAt.localeCompare(a.listedAt))

  const total = sorted.length
  const start = (q.page - 1) * q.pageSize

  const categoryCounts = new Map<Category, number>()
  const networkCounts = new Map<MockNft['network'], number>()
  for (const nft of all) {
    categoryCounts.set(nft.category, (categoryCounts.get(nft.category) ?? 0) + 1)
    networkCounts.set(nft.network, (networkCounts.get(nft.network) ?? 0) + 1)
  }
  const prices = all.map((n) => defaultEdition(n).priceEth)

  return {
    items: sorted.slice(start, start + q.pageSize),
    page: q.page,
    pageSize: q.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / q.pageSize)),
    facets: {
      categories: (Object.keys(CATEGORY_LABEL) as Category[]).map((id) => ({
        id,
        label: CATEGORY_LABEL[id],
        count: categoryCounts.get(id) ?? 0,
      })),
      networks: (Object.keys(NETWORK_LABEL) as MockNft['network'][]).map((id) => ({
        id,
        label: NETWORK_LABEL[id],
        count: networkCounts.get(id) ?? 0,
      })),
      priceRange: {
        min: prices.length ? prices.reduce((a, b) => (cmp(a, b) <= 0 ? a : b)) : '0',
        max: prices.length ? prices.reduce((a, b) => (cmp(a, b) >= 0 ? a : b)) : '0',
      },
    },
  }
}

export function featured(state: MockState): Featured {
  const [first, second, third, , , sixth] = state.nfts
  return {
    hero: [first, second, sixth].map(toSummary),
    spotlight: toSummary(third),
  }
}

export function related(state: MockState, nft: MockNft): NftSummary[] {
  return state.nfts
    .filter((n) => n.id !== nft.id && n.collection === nft.collection)
    .slice(0, 5)
    .map(toSummary)
}

export function findNft(state: MockState, id: string): MockNft | undefined {
  return state.nfts.find((n) => n.id === id)
}
