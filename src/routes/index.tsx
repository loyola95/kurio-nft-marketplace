import { createFileRoute } from '@tanstack/react-router'
import { CatalogSearchBar } from '@/features/catalog/components/CatalogSearchBar'
import { CatalogSection, MobileCatalogBar } from '@/features/catalog/components/CatalogSection'
import { Blog, Promos } from '@/features/catalog/components/Editorial'
import { Hero, MobileHero } from '@/features/catalog/components/Hero'
import { catalogListOptions, featuredOptions } from '@/features/catalog/queries'
import { catalogSearchSchema, toCatalogQuery } from '@/features/catalog/searchSchema'
import { usePageTitle } from '@/lib/usePageTitle'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  loaderDeps: ({ search }) => toCatalogQuery(search),
  // Inicia as requisições junto com a navegação; a tela mostra skeletons enquanto isso.
  loader: ({ context, deps }) => {
    void context.queryClient.prefetchQuery(catalogListOptions(deps))
    void context.queryClient.prefetchQuery(featuredOptions)
  },
  component: HomePage,
})

function HomePage() {
  usePageTitle(
    'Marketplace de NFTs',
    'Descubra NFTs selecionados de criadores emergentes e consagrados. Busque, filtre e compre arte digital na Kurio.',
  )
  return (
    <div className="flex flex-col gap-4 md:gap-24">
      <div className="flex flex-col gap-4 md:hidden">
        <div className="flex gap-2">
          <CatalogSearchBar className="flex-1" />
          <MobileCatalogBar />
        </div>
        <MobileHero />
      </div>
      <Hero />
      <div className="hidden md:block lg:hidden">
        <CatalogSearchBar />
      </div>
      <CatalogSection />
      <div className="hidden md:block">
        <Promos />
      </div>
      <div className="hidden md:block">
        <Blog />
      </div>
    </div>
  )
}
