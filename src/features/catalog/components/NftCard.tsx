import { Link } from '@tanstack/react-router'
import { toast } from 'sonner'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import type { NftSummary } from '@/contracts/nft'
import { Skeleton } from '@/components/ui/skeleton'
import { useAddToCart } from '@/features/cart/queries'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { NftImage } from './NftImage'

/**
 * Ações do card no hover (frame Desktop / Login): carrinho, favoritar e ver detalhes,
 * 35px com raio 4, centralizadas sobre a base da arte. Aparecem também com o foco do teclado.
 */
function CardActions({ nft }: { nft: NftSummary }) {
  const add = useAddToCart()
  const square =
    'grid size-[35px] place-items-center rounded-[4px] border border-border bg-surface-2 text-foreground transition-colors hover:border-primary disabled:cursor-not-allowed disabled:opacity-50'
  return (
    <div className="absolute bottom-[7px] left-1/2 z-10 hidden -translate-x-1/2 gap-2.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 motion-reduce:transition-none lg:flex">
      <button
        type="button"
        disabled={nft.available === 0 || add.isPending}
        onClick={() =>
          add.mutate(
            { nftId: nft.id, editionId: nft.defaultEditionId, quantity: 1 },
            {
              onSuccess: () => toast.success(`${nft.name} adicionado ao carrinho.`),
              onError: (error) =>
                toast.error(
                  isApiError(error) ? error.message : 'Não foi possível adicionar ao carrinho.',
                ),
            },
          )
        }
        className={square}
      >
        <Icon name="cart" size={20} />
        <span className="sr-only">Adicionar {nft.name} ao carrinho</span>
      </button>
      <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" size="square" />
      <Link to="/nft/$nftId" params={{ nftId: nft.id }} className={square}>
        <Icon name="search-header" size={22} />
        <span className="sr-only">Ver detalhes de {nft.name}</span>
      </Link>
    </div>
  )
}

/**
 * Card da grade. Desktop: moldura #241612 com a arte de raio 15; mobile: moldura em
 * gradiente com raio 20, arte de raio 16 e coração; a coluna da direita desce 32px (ver
 * CatalogSection). O Figma deixa 4px nas laterais e 25px em cima e embaixo (258x300 para
 * uma arte de 250), o que parece arte fora do lugar: aqui a moldura é quadrada, com a
 * mesma folga nos quatro lados.
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
      <div className="relative grid aspect-square place-items-center rounded-[20px] bg-linear-135 from-surface to-surface-2 p-1.5 md:rounded-none md:bg-surface md:bg-none md:p-2">
        <NftImage
          image={nft.image}
          priority={priority}
          sizes="(min-width: 1024px) 250px, (min-width: 768px) 30vw, 45vw"
          className="aspect-square w-full rounded-2xl transition-transform duration-300 group-hover:scale-[1.02] motion-reduce:transition-none md:rounded-[15px]"
        />
        {nft.badge && (
          <span className="absolute top-4 left-4 rounded-sm bg-primary px-2 py-0.5 text-[10px] leading-[13px] font-bold tracking-wide text-primary-foreground md:top-5 md:left-5">
            {nft.badge}
          </span>
        )}
        {soldOut && (
          <span className="absolute right-3 bottom-3 rounded-sm bg-background/90 px-2 py-0.5 text-xs font-bold text-danger">
            Esgotado
          </span>
        )}
        {!compact && !showFavorite && <CardActions nft={nft} />}
        <div className={cn('absolute top-3 right-2.5 z-10', !showFavorite && 'md:hidden')}>
          <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" size="sm" />
        </div>
      </div>
      <div className={cn('flex flex-col pl-2 md:pl-0', !compact && 'md:gap-3')}>
        {/* No celular o nome quebra em até duas linhas: o número do NFT fica visível. */}
        <h3
          className={cn(
            'line-clamp-2 text-[15px] leading-5 md:line-clamp-none md:truncate',
            !compact && 'md:text-base md:leading-4',
          )}
        >
          <Link
            to="/nft/$nftId"
            params={{ nftId: nft.id }}
            className="after:absolute after:inset-0"
          >
            {nft.name}
          </Link>
        </h3>
        <p
          className={cn('flex items-baseline gap-3 text-base leading-4', !compact && 'md:text-lg')}
        >
          <span className="font-bold text-highlight">{formatEth(nft.priceEth)}</span>
          {nft.compareAtPriceEth && (
            <span className="font-normal text-text-3 line-through">
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
      <Skeleton className="aspect-square w-full rounded-[20px] md:rounded-none" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/3" />
    </div>
  )
}
