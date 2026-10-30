import { useState } from 'react'
import type { Image } from '@/contracts/common'
import { cn } from '@/lib/utils'

const WIDTHS = [320, 640, 960]

/**
 * Imagem de NFT com srcset (WebP 320/640/960) e dimensões fixas para não deslocar o layout.
 * Até carregar, o espaço pulsa no tom de superfície (sem movimento se a pessoa preferir).
 */
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
  const [loaded, setLoaded] = useState(false)
  const base = image.src.replace(/-\d+\.webp$/, '')
  return (
    <img
      ref={(img) => {
        // Imagem já em cache pode terminar antes de o onLoad ser ligado.
        if (img?.complete && img.naturalWidth > 0) setLoaded(true)
      }}
      src={image.src}
      srcSet={WIDTHS.map((w) => `${base}-${w}.webp ${w}w`).join(', ')}
      sizes={sizes}
      width={image.width}
      height={image.height}
      alt={alt ?? image.alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={() => setLoaded(true)}
      className={cn('object-cover', !loaded && 'bg-surface-3 motion-safe:animate-pulse', className)}
    />
  )
}
