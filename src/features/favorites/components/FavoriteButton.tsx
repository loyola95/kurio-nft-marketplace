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
  size = 'md',
}: {
  nftId: string
  nftName: string
  variant?: 'button' | 'icon'
  /** sm: 28px (cards mobile); lg: 35px (detalhe mobile); square: ações do card no hover (desktop). */
  size?: 'sm' | 'md' | 'lg' | 'square'
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
        className={cn(
          'grid place-items-center border border-border bg-surface-2 hover:border-primary',
          size === 'square' ? 'size-[35px] rounded-[4px] text-foreground' : 'rounded-full',
          size === 'sm' && 'size-7 text-primary',
          size === 'md' && 'size-[30px] text-foreground',
          size === 'lg' && 'size-[35px] text-highlight',
        )}
      >
        <Icon
          name={isFavorite ? 'heart' : 'heart-outline'}
          size={size === 'sm' ? 15 : size === 'square' ? 20 : 16}
          className={isFavorite ? 'text-danger' : undefined}
        />
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
      <Icon
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={20}
        className={isFavorite ? 'text-danger' : undefined}
      />
      {isFavorite ? 'Favoritado' : 'Favoritar'}
    </button>
  )
}
