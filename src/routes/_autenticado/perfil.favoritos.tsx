import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/features/layout/PageShell'

export const Route = createFileRoute('/_autenticado/perfil/favoritos')({
  component: () => <PageShell title="Lista de interesse" />,
})
