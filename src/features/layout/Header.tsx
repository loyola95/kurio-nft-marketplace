import { Link, useLocation } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { useSession } from '@/features/auth/session'
import { CartLink } from './CartLink'
import { SearchDialog } from './SearchDialog'
import { UserMenu } from './UserMenu'
import { cn } from '@/lib/utils'

const NAV = [
  { label: 'Início', to: '/' as const, match: (p: string) => p === '/' },
  {
    label: 'Mercado',
    to: '/' as const,
    hash: 'catalogo',
    match: (p: string) =>
      p.startsWith('/nft') || p.startsWith('/carrinho') || p.startsWith('/pagamento'),
  },
  {
    label: 'Criadores',
    to: '/indisponivel' as const,
    search: { de: 'criadores' },
    match: () => false,
  },
  { label: 'Aprenda', to: '/indisponivel' as const, search: { de: 'aprenda' }, match: () => false },
]

/** Cabeçalho do Figma (desktop e tablet). No mobile cada tela tem o seu topo. */
export function Header({ withDivider = false }: { withDivider?: boolean }) {
  const { pathname, href } = useLocation()
  const { user, status } = useSession()

  return (
    <header className="hidden md:block">
      <div className="flex h-[45px] items-center justify-between gap-6">
        <Link to="/" className="w-[100px] shrink-0 text-sm font-bold tracking-wide lg:w-[160px]">
          KURIO
        </Link>
        <nav aria-label="Principal" className="h-full">
          <ul className="flex h-full items-stretch gap-6 lg:gap-10">
            {NAV.map((item) => {
              const active = item.match(pathname)
              return (
                <li key={item.label} className="relative flex">
                  <Link
                    to={item.to}
                    hash={item.hash}
                    search={item.search}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex h-[45px] items-start text-base leading-[21px] whitespace-nowrap transition-colors hover:text-highlight',
                      active ? 'font-bold text-highlight' : 'text-foreground',
                    )}
                  >
                    {item.label}
                  </Link>
                  {active && (
                    <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-primary" />
                  )}
                </li>
              )
            })}
          </ul>
        </nav>
        <div className="flex shrink-0 items-center gap-5 lg:gap-7">
          <SearchDialog />
          <CartLink />
          {status === 'authenticated' && user ? (
            <UserMenu user={user} />
          ) : (
            <Button asChild size="sm" className="h-[35px] w-[100px] gap-1 px-2 font-medium">
              <Link to="/entrar" search={{ redirect: href }}>
                <Icon name="logout" size={20} />
                Entrar
              </Link>
            </Button>
          )}
        </div>
      </div>
      {withDivider && <div aria-hidden className="h-px bg-primary/30" />}
    </header>
  )
}
