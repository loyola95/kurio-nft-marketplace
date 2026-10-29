import { useLocation, useNavigate } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { useSession } from '@/features/auth/session'
import { cn } from '@/lib/utils'
import { useIsFavorite, useToggleFavorite } from '../queries'

/** Favoritar exige login: o visitante vai para o login e volta para esta tela. */
export function FavoriteButton({
  nftId,
  nftName,
  variant = 'button',
}: {
  nftId: string
  nftName: string
  variant?: 'button' | 'icon'
}) {
  const { status } = useSession()
  const isFavorite = useIsFavorite(nftId)
  const toggle = useToggleFavorite()
  const navigate = useNavigate()
  const { href } = useLocation()

  const onClick = () => {
    if (status !== 'authenticated') {
      void navigate({ to: '/entrar', search: { redirect: href } })
      return
    }
    toggle.mutate({ nftId, favorite: !isFavorite })
  }

  const label = isFavorite
    ? `Remover ${nftName} da lista de interesse`
    : `Adicionar ${nftName} à lista de interesse`

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={isFavorite}
        aria-label={label}
        className="grid size-[30px] place-items-center rounded-full border border-border bg-surface-2 text-foreground hover:border-primary"
      >
        <Icon name="heart" size={16} className={isFavorite ? 'text-danger' : undefined} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isFavorite}
      className={cn(
        'flex h-10 w-[130px] items-center justify-center gap-2 rounded-md border border-primary text-sm leading-5 font-medium text-highlight transition-colors hover:bg-primary/10',
        isFavorite && 'bg-primary/15',
      )}
    >
      <Icon name="heart" size={20} className={isFavorite ? 'text-danger' : undefined} />
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </button>
  )
}
