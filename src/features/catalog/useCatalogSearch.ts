import { getRouteApi } from '@tanstack/react-router'
import { useCallback } from 'react'
import type { CatalogSearch } from './searchSchema'

const route = getRouteApi('/')

/**
 * Leitura e escrita do estado do catálogo na URL. Toda mudança de filtro,
 * busca, aba ou ordenação volta para a página 1. Cada mudança é uma entrada
 * no histórico, então voltar/avançar restaura o estado anterior.
 */
export function useCatalogSearch() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const update = useCallback(
    (patch: Partial<CatalogSearch>, options: { keepPage?: boolean } = {}) => {
      void navigate({
        search: (prev) => {
          const next = { ...prev, ...patch }
          if (!options.keepPage) next.pagina = undefined
          return next
        },
        resetScroll: false,
      })
    },
    [navigate],
  )

  const toggle = useCallback(
    <K extends 'categorias' | 'redes'>(key: K, value: NonNullable<CatalogSearch[K]>[number]) => {
      const current = (search[key] ?? []) as string[]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      update({ [key]: next.length ? next : undefined } as Partial<CatalogSearch>)
    },
    [search, update],
  )

  const clear = useCallback(() => {
    void navigate({ search: {}, resetScroll: false })
  }, [navigate])

  const hasFilters = Boolean(
    search.q ||
    search.categorias?.length ||
    search.redes?.length ||
    search.precoMin ||
    search.precoMax,
  )

  return { search, update, toggle, clear, hasFilters }
}
