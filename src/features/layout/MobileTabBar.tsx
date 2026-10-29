import { Link, useLocation } from '@tanstack/react-router'
import { Icon, type IconName } from '@/components/icon'
import { useCartCount } from '@/features/cart/useCartCount'
import { cn } from '@/lib/utils'

type Tab = {
  label: string
  icon: IconName
  to: '/' | '/perfil/favoritos' | '/carrinho' | '/perfil'
  hash?: string
  match: (p: string) => boolean
}

const TABS: Tab[] = [
  { label: 'Início', icon: 'home', to: '/', match: (p) => p === '/' },
  {
    label: 'Favoritos',
    icon: 'heart',
    to: '/perfil/favoritos',
    match: (p) => p === '/perfil/favoritos',
  },
  { label: 'Carrinho', icon: 'shop', to: '/carrinho', match: (p) => p.startsWith('/carrinho') },
  {
    label: 'Perfil',
    icon: 'user-tab',
    to: '/perfil',
    match: (p) => p === '/perfil' || p === '/perfil/carteiras',
  },
]

/** Barra inferior do frame "Mobile / Início". O botão central abre o catálogo filtrável. */
export function MobileTabBar() {
  const { pathname } = useLocation()
  const count = useCartCount()
  const [first, second, third, fourth] = TABS

  const item = (tab: Tab) => {
    const active = tab.match(pathname)
    return (
      <Link
        to={tab.to}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'relative grid size-11 place-items-center',
          active ? 'text-highlight' : 'text-text-2',
        )}
      >
        <Icon name={tab.icon} size={20} />
        <span className="sr-only">
          {tab.label}
          {tab.icon === 'shop' && count > 0 ? `, ${count} itens` : ''}
        </span>
      </Link>
    )
  }

  return (
    <nav
      aria-label="Navegação do aplicativo"
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="relative mx-auto h-[95px] max-w-[414px]">
        <img
          src="/icons/tabbar-bg.svg"
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-fill"
        />
        <ul className="relative flex h-full items-center justify-between px-6 pt-4">
          <li>{item(first)}</li>
          <li>{item(second)}</li>
          <li className="-mt-[60px]">
            <Link
              to="/"
              hash="catalogo"
              className="grid size-[65px] place-items-center rounded-full bg-primary text-foreground shadow-lg"
            >
              <Icon name="grid" size={26} />
              <span className="sr-only">Explorar coleções</span>
            </Link>
          </li>
          <li>{item(third)}</li>
          <li>{item(fourth)}</li>
        </ul>
      </div>
    </nav>
  )
}
