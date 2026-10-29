import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/features/layout/PageShell'

export const Route = createFileRoute('/carrinho')({
  component: () => <PageShell title="Carrinho de NFTs" />,
})
