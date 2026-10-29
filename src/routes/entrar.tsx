import { createFileRoute, redirect } from '@tanstack/react-router'
import { sessionQueryOptions } from '@/features/auth/session'
import { authSearchSchema } from '@/features/auth/authSearch'
import { AuthScreen } from '@/features/auth/components/AuthScreen'
import { safeRedirect } from '@/lib/redirect'

export const Route = createFileRoute('/entrar')({
  validateSearch: authSearchSchema,
  beforeLoad: async ({ context, search }) => {
    const user = await context.queryClient.ensureQueryData(sessionQueryOptions)
    if (user) throw redirect({ href: safeRedirect(search.redirect) })
  },
  component: () => <AuthScreen mode="login" />,
})
