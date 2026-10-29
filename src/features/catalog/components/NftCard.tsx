import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/contracts/nft'
import { Skeleton } from '@/components/ui/skeleton'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { NftImage } from './NftImage'

/**
 * Card da grade. Desktop: moldura #241612 258x300, arte 250x250 com raio 15.
 * Mobile: moldura 175x200 em gradiente com raio 20, arte 168x168 com raio 16 e coração;
 * a coluna da direita desce 32px (ver CatalogSection) e inverte o respiro da arte.
 */
export function NftCard({
  nft,
  priority = false,
  compact = false,
  showFavorite = false,
}: {
  nft: NftSummary
  priority?: boolean
  /** Textos 15/20 e 16/16 em todas as larguras ("Mais desta coleção"). */
  compact?: boolean
  /** Coração também no desktop (lista de interesse); na grade ele é só do mobile. */
  showFavorite?: boolean
}) {
  const soldOut = nft.available === 0
  return (
    <article className="group relative flex flex-col gap-2 md:gap-3">
      <div
        className={cn(
          'relative grid aspect-[175/200] place-items-center items-start rounded-[20px] bg-linear-135 from-surface to-surface-2 pt-3 md:aspect-[258/300] md:items-center md:rounded-none md:bg-surface md:bg-none md:pt-0 [[data-stagger]>li:nth-child(even)_&]:pt-5 md:[[data-stagger]>li:nth-child(even)_&]:pt-0',
          // Na grade a moldura tem 300px exatos; a proporção arredondava para 302.
          !compact && 'lg:aspect-auto lg:h-[300px]',
        )}
      >
        <NftImage
          image={nft.image}
          priority={priority}
          sizes="(min-width: 1024px) 250px, (min-width: 768px) 30vw, 45vw"
          className="aspect-square w-[96%] rounded-2xl transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none md:w-[96.9%] md:rounded-[15px]"
        />
        {nft.badge && (
          <span className="absolute top-4 left-0 w-[68px] px-2 py-2 text-[13px] leading-4 font-medium text-primary-foreground bg-primary md:top-3 md:left-3 md:w-auto md:rounded-sm md:py-0.5 md:text-[10px] md:leading-[13px] md:font-bold md:tracking-wide">
            {nft.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 bottom-3 rounded-sm bg-background/90 px-2 py-0.5 text-xs font-bold text-danger">
            Esgotado
          </span>
        )}
        <div className={cn('absolute top-3 right-2.5 z-10', !showFavorite && 'md:hidden')}>
          <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" size="sm" />
        </div>
      </div>
      <div className={cn('flex flex-col pl-2 md:pl-0', !compact && 'md:gap-3')}>
        <h3
          className={cn('truncate text-[15px] leading-5', !compact && 'md:text-base md:leading-4')}
        >
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0 hover:text-highlight"
          >
            {nft.name}
          </Link>
        </h3>
        <p
          className={cn('flex items-baseline gap-3 text-base leading-4', !compact && 'md:text-lg')}
        >
          <span className="font-bold text-highlight">{formatEth(nft.priceEth)}</span>
          {nft.compareAtPriceEth && (
            <span className="font-normal text-text-3">
              <span className="sr-only">Preço anterior: </span>
              {formatEth(nft.compareAtPriceEth)}
            </span>
          )}
        </p>
      </div>
    </article>
  )
}

/** Mesmas dimensões do card final, para o carregamento não deslocar a página. */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-2 md:gap-3" aria-hidden>
      <Skeleton className="aspect-[175/200] w-full rounded-[20px] md:aspect-[258/300] md:rounded-none" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}
