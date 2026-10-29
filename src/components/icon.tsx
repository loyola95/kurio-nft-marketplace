import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

export type IconName =
  | 'activity'
  | 'arrow-left'
  | 'arrow-right'
  | 'arrow-right-2'
  | 'cart'
  | 'chevron-down'
  | 'close'
  | 'danger'
  | 'delete'
  | 'download'
  | 'eye'
  | 'eye-off'
  | 'facebook'
  | 'filter'
  | 'google'
  | 'grid'
  | 'heart'
  | 'heart-outline'
  | 'home'
  | 'image'
  | 'location'
  | 'logout'
  | 'message'
  | 'search'
  | 'search-header'
  | 'select-arrow'
  | 'shop'
  | 'social-facebook'
  | 'social-instagram'
  | 'social-linkedin'
  | 'social-other'
  | 'social-twitter'
  | 'star'
  | 'user'
  | 'user-tab'
  | 'wallet'

/**
 * Ícones exportados do Figma (public/icons). A máscara CSS faz o ícone herdar
 * a cor do texto (currentColor), então estados ativo/inativo usam classes de cor.
 */
export function Icon({
  name,
  size = 20,
  className,
  label,
}: {
  name: IconName
  size?: number
  className?: string
  /** Texto para leitores de tela; sem label o ícone é decorativo. */
  label?: string
}) {
  const style = {
    width: size,
    height: size,
    maskImage: `url(/icons/${name}.svg)`,
    WebkitMaskImage: `url(/icons/${name}.svg)`,
    maskSize: 'contain',
    WebkitMaskSize: 'contain',
    maskRepeat: 'no-repeat',
    WebkitMaskRepeat: 'no-repeat',
    maskPosition: 'center',
    WebkitMaskPosition: 'center',
  } satisfies CSSProperties
  return (
    <span
      className={cn('inline-block shrink-0 bg-current', className)}
      style={style}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    />
  )
}

/** Ícones coloridos (marcas de login social) mantêm as cores originais. */
export function BrandIcon({ name, size = 20 }: { name: 'google' | 'facebook'; size?: number }) {
  return <img src={`/icons/${name}.svg`} width={size} height={size} alt="" aria-hidden="true" />
}
