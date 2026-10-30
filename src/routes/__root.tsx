import { Outlet, createRootRouteWithContext, useLocation } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { Announcer } from '@/features/layout/Announcer'
import { Footer } from '@/features/layout/Footer'
import { Header } from '@/features/layout/Header'
import { MobileTabBar } from '@/features/layout/MobileTabBar'
import { NotFound } from '@/features/layout/NotFound'
import { ConnectionStatus } from '@/features/layout/ConnectionStatus'
import { ScenarioLauncher } from '@/features/devtools/ScenarioLauncher'
import { RealtimeProvider } from '@/realtime/RealtimeProvider'
import { useAuthErrorHandler } from '@/features/auth/useAuthErrorHandler'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFound />,
})

const TAB_BAR_ROUTES = ['/', '/perfil', '/perfil/carteiras', '/perfil/favoritos', '/indisponivel']

function RootLayout() {
  const desktop = useMediaQuery('(min-width: 1024px)')
  const { pathname } = useLocation()
  const withTabBar = TAB_BAR_ROUTES.includes(pathname)
  // No mobile login e cadastro são telas cheias, sem rodapé (frames Mobile / Login e Cadastro).
  const authPage = pathname === '/entrar' || pathname === '/cadastro'
  // Os frames de perfil e carteiras não têm rodapé.
  const profilePage = pathname.startsWith('/perfil')
  // O frame mobile do carrinho termina no resumo, sem rodapé.
  const cartPage = pathname === '/carrinho'
  // O frame mobile do pagamento também não tem rodapé; a confirmação é um cartão sobre o fundo.
  const checkoutPage = pathname === '/pagamento'
  const orderPage = pathname.startsWith('/pedidos/')
  useAuthErrorHandler()
  return (
    <RealtimeProvider>
      <a
        href="#conteudo"
        className="sr-only z-50 rounded-md bg-primary px-4 py-2 font-bold text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Pular para o conteúdo
      </a>
      <div className="page-container flex min-h-dvh flex-col gap-8 pt-6 md:pt-6">
        <Header withDivider={pathname === '/'} />
        {/* No Figma o rodapé fica a 96px do conteúdo (gap-8 + mb-16). */}
        <main
          id="conteudo"
          tabIndex={-1}
          className={cn('flex-1 outline-none md:mb-16', profilePage && 'pb-[110px] md:pb-0')}
        >
          <Outlet />
        </main>
        <div
          className={cn(
            withTabBar ? 'pb-[110px] md:pb-6' : 'pb-6',
            (authPage || cartPage || checkoutPage) && 'hidden md:block',
            (profilePage || orderPage) && 'hidden',
          )}
        >
          <Footer />
        </div>
      </div>
      {withTabBar && <MobileTabBar />}
      {/* Desktop: canto inferior direito, longe do cabeçalho e dos modais. Mobile: logo abaixo
          da fileira de botões do topo (voltar, favoritar), sem cobri-los: embaixo ficam a barra
          de navegação e a de compra. */}
      <Toaster position={desktop ? 'bottom-right' : 'top-center'} mobileOffset={{ top: 72 }} />
      <Announcer />
      <ConnectionStatus />
      <ScenarioLauncher />
    </RealtimeProvider>
  )
}
