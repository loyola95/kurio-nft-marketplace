import { createFileRoute } from '@tanstack/react-router'
import { catalogSearchSchema } from '@/features/catalog/searchSchema'
import { PageShell } from '@/features/layout/PageShell'

export const Route = createFileRoute('/')({
  validateSearch: catalogSearchSchema,
  component: () => <PageShell title="Início" />,
})
