import { z } from 'zod'
import { Network } from '@/contracts/common'
import { CatalogSort, CatalogTab, Category, type CatalogQuery } from '@/contracts/nft'

// Estado do catálogo na URL (fonte única): busca, filtros, ordenação e página.
// Listas viram texto separado por vírgula: ?categorias=musica,fotografia
const splitList = (value: unknown) =>
  typeof value === 'string' ? value.split(',').filter(Boolean) : value

const csv = <T extends z.ZodType>(item: T) =>
  z.preprocess(splitList, z.array(item)).optional().catch(undefined)

const decimal = z.coerce
  .string()
  .regex(/^\d+(\.\d{1,18})?$/)
  .optional()
  .catch(undefined)

export const catalogSearchSchema = z.object({
  q: z.coerce.string().optional().catch(undefined),
  categorias: csv(Category),
  redes: csv(Network),
  precoMin: decimal,
  precoMax: decimal,
  aba: CatalogTab.optional().catch(undefined),
  ordem: CatalogSort.optional().catch(undefined),
  pagina: z.coerce.number().int().min(1).optional().catch(undefined),
})
export type CatalogSearch = z.infer<typeof catalogSearchSchema>

export const CATALOG_PAGE_SIZE = 9

export function toCatalogQuery(search: CatalogSearch): CatalogQuery {
  return {
    q: search.q?.trim() || undefined,
    categories: search.categorias?.length ? search.categorias : undefined,
    networks: search.redes?.length ? search.redes : undefined,
    priceMin: search.precoMin,
    priceMax: search.precoMax,
    tab: search.aba ?? 'todos',
    sort: search.ordem ?? 'recentes',
    page: search.pagina ?? 1,
    pageSize: CATALOG_PAGE_SIZE,
  }
}

/** Serializa listas como texto separado por vírgula (URL legível). */
export function joinList<T extends string>(values: T[] | undefined): string | undefined {
  return values?.length ? values.join(',') : undefined
}
