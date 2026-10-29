import { createFileRoute } from '@tanstack/react-router'
import { PageShell } from '@/features/layout/PageShell'

export const Route = createFileRoute('/_autenticado/pedidos/$orderId')({
  component: () => <PageShell title="Pedido" />,
})
