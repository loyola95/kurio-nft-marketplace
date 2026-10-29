import { usePageTitle } from '@/lib/usePageTitle'
import { CatalogSearchBar } from './CatalogSearchBar'
import { CatalogSection, MobileCatalogBar } from './CatalogSection'
import { Blog, Promos } from './Editorial'
import { Hero, MobileHero } from './Hero'

/** Tela inicial: destaques, catálogo filtrável e conteúdo editorial. */
export function HomePage() {
  usePageTitle(
    'Marketplace de NFTs',
    'Descubra NFTs selecionados de criadores emergentes e consagrados. Busque, filtre e compre arte digital na Kurio.',
  )
  return (
    <div className="flex flex-col gap-4 md:gap-24">
      <div className="flex flex-col gap-4 pt-4 md:hidden">
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
