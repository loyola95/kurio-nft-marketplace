import { Link } from '@tanstack/react-router'
import type { NftSummary } from '@/contracts/nft'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/money'
import { NftImage } from './NftImage'

/** Card da grade do Figma: moldura #241612 258x300, arte 250x250 com raio 15. */
export function NftCard({ nft, priority = false }: { nft: NftSummary; priority?: boolean }) {
  const soldOut = nft.available === 0
  return (
    <article className="group relative flex flex-col gap-3">
      <div className="relative grid aspect-[258/300] place-items-center bg-surface">
        <NftImage
          image={nft.image}
          priority={priority}
          sizes="(min-width: 1024px) 250px, (min-width: 768px) 30vw, 45vw"
          className="aspect-square w-[96.9%] rounded-[15px] transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none"
        />
        {nft.badge && (
          <span className="absolute top-3 left-3 rounded-sm bg-primary px-2 py-0.5 text-[10px] leading-[13px] font-bold tracking-wide text-primary-foreground">
            {nft.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 bottom-3 rounded-sm bg-background/90 px-2 py-0.5 text-xs font-bold text-danger">
            Esgotado
          </span>
        )}
      </div>
      <h3 className="truncate text-base leading-4">
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="after:absolute after:inset-0 hover:text-highlight"
        >
          {nft.name}
        </Link>
      </h3>
      <p className="flex items-baseline gap-3 text-lg leading-4">
        <span className="font-bold text-highlight">{formatEth(nft.priceEth)}</span>
        {nft.compareAtPriceEth && (
          <span className="text-text-3 line-through">
            <span className="sr-only">Preço anterior: </span>
            {formatEth(nft.compareAtPriceEth)}
          </span>
        )}
      </p>
    </article>
  )
}

/** Mesmas dimensões do card final, para o carregamento não deslocar a página. */
export function NftCardSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-hidden>
      <Skeleton className="aspect-[258/300] w-full rounded-none" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}
