import { createFileRoute } from '@tanstack/react-router'
import { OrderPage } from '@/features/orders/components/OrderPage'

export const Route = createFileRoute('/_autenticado/pedidos/$orderId')({
  component: function OrderRoute() {
    const { orderId } = Route.useParams()
    return <OrderPage orderId={orderId} />
  },
})
