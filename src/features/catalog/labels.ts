import type { CatalogSort } from '@/contracts/nft'

export const SORT_LABEL: Record<CatalogSort, string> = {
  recentes: 'Listados recentemente',
  'menor-preco': 'Menor preço',
  'maior-preco': 'Maior preço',
  nome: 'Nome (A a Z)',
}

const PAGE_WINDOW = 4

/** Páginas visíveis: janela de 4 números como no Figma, deslizando com a página atual. */
export function pageWindow(page: number, totalPages: number): number[] {
  const start = Math.max(1, Math.min(page - 1, totalPages - PAGE_WINDOW + 1))
  const end = Math.min(totalPages, start + PAGE_WINDOW - 1)
  return Array.from({ length: end - start + 1 }, (_, i) => start + i)
}
