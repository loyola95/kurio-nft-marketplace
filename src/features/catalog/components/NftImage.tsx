import type { Image } from '@/contracts/common'
import { cn } from '@/lib/utils'

const WIDTHS = [320, 640, 960]

/** Imagem de NFT com srcset (WebP 320/640/960) e dimensões fixas para não deslocar o layout. */
export function NftImage({
  image,
  sizes,
  className,
  priority = false,
  alt,
}: {
  image: Image
  sizes: string
  className?: string
  priority?: boolean
  alt?: string
}) {
  const base = image.src.replace(/-\d+\.webp$/, '')
  return (
    <img
      src={image.src}
      srcSet={WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ')}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      className={cn('object-cover', className)}
    />
  )
}
