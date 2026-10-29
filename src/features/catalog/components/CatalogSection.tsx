import { useQuery } from '@tanstack/react-query'
import { CATEGORY_LABEL } from '@/contracts/nft'
import { cn } from '@/lib/utils'
import { catalogListOptions } from '../queries'
import { CATALOG_PAGE_SIZE, toCatalogQuery } from '../searchSchema'
import { useCatalogSearch } from '../useCatalogSearch'
import { CatalogTabs, SortSelect } from './CatalogToolbar'
import { FilterDrawer } from './FilterDrawer'
import { FilterPanel } from './FilterPanel'
import { NftCard, NftCardSkeleton } from './NftCard'
import { Pagination } from './Pagination'
import { Spotlight } from './Spotlight'
import { EmptyState, ErrorState } from './States'

export function CatalogSection() {
  const { search, clear, hasFilters } = useCatalogSearch()
  const query = toCatalogQuery(search)
  const list = useQuery(catalogListOptions(query))
  const data = list.data
  const facets = data?.facets
  const activeCount =
    (search.categorias?.length ?? 0) +
    (search.redes?.length ?? 0) +
    (search.precoMin || search.precoMax ? 1 : 0)
  const refreshing = list.isFetching && !list.isPending

  const resultLabel = data
    ? data.total === 0
      ? 'Nenhum NFT encontrado'
      : `${data.total} ${data.total === 1 ? 'NFT encontrado' : 'NFTs encontrados'}`
    : 'Carregando NFTs'

  return (
    <section id="catalogo" aria-labelledby="catalogo-titulo" className="flex scroll-mt-6 gap-12">
      <aside
        aria-label="Filtros do catálogo"
        className="hidden w-[310px] shrink-0 flex-col gap-6 lg:flex"
      >
        <FilterPanel facets={facets} />
        <Spotlight />
      </aside>

      <div className="flex min-w-0 flex-1 flex-col gap-8">
        <h2 id="catalogo-titulo" className="sr-only">
          Catálogo de NFTs
        </h2>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CatalogTabs />
          <div className="hidden items-center gap-4 md:flex">
            <div className="lg:hidden">
              <FilterDrawer facets={facets} activeCount={activeCount} variant="button" />
            </div>
            <SortSelect />
          </div>
        </div>

        {(search.q || search.categorias?.length) && (
          <p className="text-sm text-text-2">
            {search.q && <>Resultados para “{search.q}”. </>}
            {search.categorias?.length
              ? `Coleções: ${search.categorias.map((c) => CATEGORY_LABEL[c]).join(', ')}.`
              : null}
          </p>
        )}

        <p className="sr-only" role="status" aria-live="polite">
          {refreshing ? 'Atualizando resultados' : resultLabel}
        </p>

        <div aria-busy={list.isFetching} className="relative">
          {list.isPending ? (
            <ul className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-8 md:gap-y-[72px]">
              {Array.from({ length: CATALOG_PAGE_SIZE }, (_, i) => (
                <li key={i}>
                  <NftCardSkeleton />
                </li>
              ))}
            </ul>
          ) : list.isError && !data ? (
            <ErrorState error={list.error} onRetry={() => void list.refetch()} />
          ) : data && data.items.length === 0 ? (
            <EmptyState
              title="Nenhum NFT encontrado"
              message={
                hasFilters
                  ? 'Nenhum item corresponde aos filtros escolhidos. Ajuste ou limpe os filtros.'
                  : 'O catálogo está vazio no momento. Volte mais tarde.'
              }
              action={hasFilters ? { label: 'Limpar filtros', onClick: clear } : undefined}
            />
          ) : data ? (
            <>
              {list.isError && (
                <div role="alert" className="mb-4">
                  <ErrorState
                    title="Não foi possível atualizar os resultados"
                    error={list.error}
                    onRetry={() => void list.refetch()}
                  />
                </div>
              )}
              <ul
                className={cn(
                  'grid grid-cols-2 gap-x-4 gap-y-6 transition-opacity md:grid-cols-3 md:gap-x-8 md:gap-y-[72px]',
                  refreshing && 'opacity-60',
                )}
              >
                {data.items.map((nft, i) => (
                  <li key={nft.id}>
                    <NftCard nft={nft} priority={i < 3} />
                  </li>
                ))}
              </ul>
              {refreshing && (
                <p className="absolute -top-6 right-0 text-xs text-text-2" aria-hidden>
                  Atualizando…
                </p>
              )}
            </>
          ) : null}
        </div>

        {data && data.items.length > 0 && (
          <div className="mt-6 md:mt-[56px]">
            <Pagination page={data.page} totalPages={data.totalPages} />
          </div>
        )}
      </div>
    </section>
  )
}

export function MobileCatalogBar() {
  const { search } = useCatalogSearch()
  const query = toCatalogQuery(search)
  const { data } = useQuery(catalogListOptions(query))
  const activeCount =
    (search.categorias?.length ?? 0) +
    (search.redes?.length ?? 0) +
    (search.precoMin || search.precoMax ? 1 : 0)
  return <FilterDrawer facets={data?.facets} activeCount={activeCount} />
}
