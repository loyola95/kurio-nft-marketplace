import { Outlet, createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth/session'
import { clearSessionData, sessionExpiredLocally } from '@/features/auth/useLogout'

// Layout das rotas privadas: checkout, perfil, carteiras, favoritos e pedidos.
export const Route = createFileRoute('/_autenticado')({
  beforeLoad: async ({ context, location }) => {
    if (sessionExpiredLocally()) {
      await clearSessionData(context.queryClient, { keepDrafts: true })
      throw redirect({ to: '/entrar', search: { redirect: location.href, motivo: 'expirada' } })
    }
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (!user) {
      throw redirect({ to: '/entrar', search: { redirect: location.href } })
    }
    return { user }
  },
  component: Outlet,
})
