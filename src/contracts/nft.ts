import { z } from 'zod'
import { EthAmount, Image, IsoDate, Network } from './common'

export const Category = z.enum([
  'arte-digital',
  'fotografia',
  'musica',
  'arte-3d',
  'colecionaveis',
  'generativa',
  'jogos',
  'assinaturas',
  'utilidade',
])
export type Category = z.infer<typeof Category>

export const CATEGORY_LABEL: Record<Category, string> = {
  'arte-digital': 'Arte digital',
  fotografia: 'Fotografia',
  musica: 'Música',
  'arte-3d': 'Arte 3D',
  colecionaveis: 'Colecionáveis',
  generativa: 'Generativa',
  jogos: 'Jogos',
  assinaturas: 'Assinaturas',
  utilidade: 'Utilidade',
}

export const EditionLabel = z.enum(['1/1', '1/10', '1/50', 'ABERTA'])
export type EditionLabel = z.infer<typeof EditionLabel>

export const EditionStatus = z.enum(['available', 'sold_out', 'unavailable'])
export type EditionStatus = z.infer<typeof EditionStatus>

export const Edition = z.object({
  id: z.string(),
  label: EditionLabel,
  supply: z.number().int().nullable(),
  available: z.number().int().min(0),
  maxPerOrder: z.number().int().min(1),
  priceEth: EthAmount,
  status: EditionStatus,
})
export type Edition = z.infer<typeof Edition>

export const NftSummary = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  collection: z.string(),
  category: Category,
  network: Network,
  image: Image,
  priceEth: EthAmount,
  compareAtPriceEth: EthAmount.nullable(),
  badge: z.literal('RARO').nullable(),
  available: z.number().int().min(0),
  listedAt: IsoDate,
  version: z.number().int(),
})
export type NftSummary = z.infer<typeof NftSummary>

export const Review = z.object({
  id: z.string(),
  author: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string(),
  createdAt: IsoDate,
})
export type Review = z.infer<typeof Review>

export const NftDetail = NftSummary.extend({
  description: z.string(),
  longDescription: z.string(),
  tokenId: z.string(),
  contract: z.string(),
  royaltiesPct: z.number(),
  attributes: z.array(z.string()),
  rating: z.object({ average: z.number(), count: z.number().int() }),
  reviews: z.array(Review),
  gallery: z.array(Image),
  editions: z.array(Edition),
})
export type NftDetail = z.infer<typeof NftDetail>

export const CatalogTab = z.enum(['todos', 'lancamentos', 'em-alta'])
export type CatalogTab = z.infer<typeof CatalogTab>
export const CatalogSort = z.enum(['recentes', 'menor-preco', 'maior-preco', 'nome'])
export type CatalogSort = z.infer<typeof CatalogSort>

export const CatalogQuery = z.object({
  q: z.string().optional(),
  categories: z.array(Category).optional(),
  networks: z.array(Network).optional(),
  priceMin: EthAmount.optional(),
  priceMax: EthAmount.optional(),
  tab: CatalogTab.default('todos'),
  sort: CatalogSort.default('recentes'),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(48).default(9),
})
export type CatalogQuery = z.infer<typeof CatalogQuery>
export type CatalogQueryInput = z.input<typeof CatalogQuery>

export const CategoryFacet = z.object({ id: Category, label: z.string(), count: z.number().int() })
export const NetworkFacet = z.object({ id: Network, label: z.string(), count: z.number().int() })

export const CatalogPage = z.object({
  items: z.array(NftSummary),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
  facets: z.object({
    categories: z.array(CategoryFacet),
    networks: z.array(NetworkFacet),
    priceRange: z.object({ min: EthAmount, max: EthAmount }),
  }),
})
export type CatalogPage = z.infer<typeof CatalogPage>

export const Featured = z.object({ hero: z.array(NftSummary), spotlight: NftSummary })
export type Featured = z.infer<typeof Featured>

export const RelatedNfts = z.array(NftSummary)
