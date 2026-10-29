import { Link } from '@tanstack/react-router'
import type { User } from '@/contracts/auth'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLogout } from '@/features/auth/useLogout'
import { Avatar } from './Avatar'

/** Estado logado do botão "Entrar" (não desenhado no Figma; segue o mesmo padrão visual). */
export function UserMenu({ user }: { user: User }) {
  const logout = useLogout()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex h-[35px] max-w-[160px] items-center gap-2 rounded-md border border-border px-2 text-sm hover:border-primary"
        aria-label={`Menu da conta de ${user.displayName}`}
      >
        <Avatar user={user} size={24} />
        <span className="truncate">{user.displayName}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 border-border bg-surface">
        <DropdownMenuLabel className="truncate text-xs text-text-2">{user.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/perfil">Meu perfil</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil/carteiras">Carteiras</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to="/perfil/favoritos">Lista de interesse</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void logout()}>Sair</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
