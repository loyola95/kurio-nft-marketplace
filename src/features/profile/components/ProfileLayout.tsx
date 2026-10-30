import { Link, Outlet, useLocation } from '@tanstack/react-router'
import { useEffect, useRef } from 'react'
import { Icon, type IconName } from '@/components/icon'
import { useLogout } from '@/features/auth/useLogout'
import { cn } from '@/lib/utils'

type Item = { label: string; icon: IconName } & (
  | { to: '/perfil' | '/perfil/carteiras' | '/perfil/favoritos' }
  | { to: '/indisponivel'; de: string }
)

// Ordem e ícones do "Account Sidebar" do Figma. Itens fora do escopo da entrega ficam no
// menu, apagados e sem navegar, com a etiqueta "fora da demo": a pessoa continua no perfil.
const ITEMS: Item[] = [
  { label: 'Dados do perfil', icon: 'user', to: '/perfil' },
  { label: 'Carteiras', icon: 'location', to: '/perfil/carteiras' },
  { label: 'Atividade', icon: 'shop', to: '/indisponivel', de: 'atividade' },
  { label: 'Lista de interesse', icon: 'heart-outline', to: '/perfil/favoritos' },
  { label: 'Ofertas', icon: 'activity', to: '/indisponivel', de: 'ofertas' },
  { label: 'Arquivos baixados', icon: 'download', to: '/indisponivel', de: 'downloads' },
  { label: 'Suporte', icon: 'danger', to: '/indisponivel', de: 'suporte' },
]

/** Área "Meu perfil": barra lateral de 310px no desktop, menu horizontal rolável no mobile. */
export function ProfileLayout() {
  const { pathname } = useLocation()
  const logout = useLogout()
  const mobileNav = useRef<HTMLUListElement>(null)

  // No menu horizontal do mobile, traz o item da página atual para a área visível.
  useEffect(() => {
    mobileNav.current
      ?.querySelector('[aria-current="page"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center' })
  }, [pathname])
  const active = (item: Item) => item.to !== '/indisponivel' && pathname === item.to

  const link = (item: Item, mobile: boolean) =>
    'de' in item ? (
      <span
        className={cn(
          // relative: o texto só para leitor de tela é absoluto e não pode escapar da faixa rolável.
          'relative flex cursor-not-allowed items-center text-[15px] text-text-3 opacity-60',
          mobile
            ? 'h-10 shrink-0 gap-2 rounded-full border border-border px-4 whitespace-nowrap'
            : 'h-[45px] gap-3 px-4 leading-[45px]',
        )}
      >
        <Icon name={item.icon} size={18} />
        <span>{item.label}</span>
        <span className="rounded-sm border border-border px-1.5 text-[10px] leading-4 tracking-wide uppercase">
          fora da demo
        </span>
        <span className="sr-only">: não faz parte desta demonstração</span>
      </span>
    ) : (
      <Link
        to={item.to}
        search={'de' in item ? { de: item.de } : undefined}
        // Exato: senão o Link marca "Dados do perfil" (/perfil) como atual em todas as subpáginas.
        activeOptions={{ exact: true }}
        aria-current={active(item) ? 'page' : undefined}
        className={cn(
          'flex items-center text-[15px] text-highlight transition-colors hover:text-foreground',
          mobile
            ? cn(
                'h-10 shrink-0 gap-2 rounded-full border px-4 whitespace-nowrap',
                active(item) ? 'border-primary bg-primary/10' : 'border-border',
              )
            : cn(
                'relative h-[45px] gap-3 px-4 leading-[45px]',
                active(item) &&
                  'before:absolute before:inset-y-0 before:left-0 before:w-1.5 before:bg-primary',
              ),
        )}
      >
        <Icon name={item.icon} size={18} />
        {item.label}
      </Link>
    )

  const logoutButton = (mobile: boolean) => (
    <button
      type="button"
      onClick={() => void logout()}
      className={cn(
        'flex items-center text-[15px] leading-[15px] font-bold text-highlight hover:text-foreground',
        mobile ? 'h-10 shrink-0 gap-2 rounded-full border border-border px-4' : 'h-10 gap-2 px-4',
      )}
    >
      <Icon name="logout" size={20} />
      Sair
    </button>
  )

  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-7">
      <nav aria-label="Meu perfil" className="hidden w-[310px] shrink-0 bg-surface py-2 lg:block">
        <p className="p-2.5 text-lg leading-4 font-bold">Meu perfil</p>
        <ul>
          {ITEMS.map((item) => (
            <li key={item.label}>{link(item, false)}</li>
          ))}
        </ul>
        <div className="border-t border-primary/30">{logoutButton(false)}</div>
      </nav>

      <nav aria-label="Meu perfil" className="-mx-6 lg:hidden">
        <ul ref={mobileNav} className="flex gap-2 overflow-x-auto px-6 pb-1 [scrollbar-width:none]">
          {ITEMS.map((item) => (
            <li key={item.label}>{link(item, true)}</li>
          ))}
          <li>{logoutButton(true)}</li>
        </ul>
      </nav>

      {/* No celular a barra de navegação fica por cima do fim da página: espaço para ela. */}
      <div className="min-w-0 flex-1 pb-28 lg:pb-0">
        <Outlet />
      </div>
    </div>
  )
}
