import { createFileRoute } from '@tanstack/react-router'
import { HomePage } from '@/features/catalog/components/HomePage'
import { catalogListOptions, featuredOptions } from '@/features/catalog/queries'
import { catalogSearchSchema, toCatalogQuery } from '@/features/catalog/searchSchema'

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
