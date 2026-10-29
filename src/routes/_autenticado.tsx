import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth/session'

// Layout das rotas privadas: checkout, perfil, carteiras, favoritos e pedidos.
export const Route = createFileRoute('/_autenticado')({
  beforeLoad: async ({ context, location }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (!user) {
      throw redirect({ to: '/entrar', search: { redirect: location.href } })
    }
    return { user }
  },
  component: Outlet,
})
