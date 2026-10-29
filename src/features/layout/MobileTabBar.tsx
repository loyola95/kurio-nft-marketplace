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

  const item = (tab: Tab, position: string) => {
    const active = tab.match(pathname)
    return (
      <Link
        to={tab.to}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'absolute top-7 grid size-11 place-items-center',
          position,
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
      <div className="relative h-[95px]">
        {/* Forma do Figma (Vector 15:5504) recortada sem a margem da sombra; a sombra vem do CSS. */}
        <svg
          aria-hidden
          viewBox="30 40 414 95"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full drop-shadow-[0_-10px_15px_rgb(10_6_4/0.45)]"
        >
          <path
            d="M312.85 40C299.09 40 286.87 48.2 281.02 60.65C273.26 77.17 256.46 88.62 237 88.62C217.54 88.62 200.74 77.18 192.98 60.65C187.13 48.2 174.9 40 161.15 40H58.93C42.95 40 30 52.95 30 68.93V134.95H444V68.93C444 52.95 431.05 40 415.07 40H312.85Z"
            fill="var(--kurio-surface)"
          />
        </svg>
        {/* Posições do frame de 414px: ícones em x 36, 108, 292 e 354; alvo de toque de 44px. */}
        <ul>
          <li>{item(TABS[0], 'left-6')}</li>
          <li>{item(TABS[1], 'left-[96px]')}</li>
          <li className="absolute -top-[31px] left-1/2 -translate-x-1/2">
            <Link
              to="/"
              hash="catalogo"
              className="relative grid size-[65px] place-items-center rounded-full bg-background text-foreground"
            >
              <span
                aria-hidden
                className="absolute inset-0 rounded-full bg-[linear-gradient(180deg,rgb(210_138_76/0.4),rgb(210_138_76))]"
              />
              <Icon name="grid" size={26} className="relative" />
              <span className="sr-only">Explorar coleções</span>
            </Link>
          </li>
          <li>{item(TABS[2], 'right-[90px]')}</li>
          <li>{item(TABS[3], 'right-7')}</li>
        </ul>
      </div>
    </nav>
  )
}
