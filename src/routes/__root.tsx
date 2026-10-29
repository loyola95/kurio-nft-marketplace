import { Outlet, createRootRouteWithContext, useLocation } from '@tanstack/react-router'
import type { RouterContext } from '@/app/router'
import { Toaster } from '@/components/ui/sonner'
import { Announcer } from '@/features/layout/Announcer'
import { Footer } from '@/features/layout/Footer'
import { Header } from '@/features/layout/Header'
import { MobileTabBar } from '@/features/layout/MobileTabBar'
import { NotFound } from '@/features/layout/NotFound'
import { ConnectionStatus } from '@/features/layout/ConnectionStatus'
import { RealtimeProvider } from '@/realtime/RealtimeProvider'

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => <NotFound />,
})

const TAB_BAR_ROUTES = ['/', '/perfil', '/perfil/carteiras', '/perfil/favoritos', '/indisponivel']

function RootLayout() {
  const { pathname } = useLocation()
  const withTabBar = TAB_BAR_ROUTES.includes(pathname)
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
        <main id="conteudo" tabIndex={-1} className="flex-1 outline-none">
          <Outlet />
        </main>
        <div className={withTabBar ? 'pb-[110px] md:pb-6' : 'pb-6'}>
          <Footer />
        </div>
      </div>
      {withTabBar && <MobileTabBar />}
      <Toaster position="top-center" />
      <Announcer />
      <ConnectionStatus />
    </RealtimeProvider>
  )
}
