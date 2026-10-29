import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { ErrorState } from '@/features/catalog/components/States'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/NftCard'
import { usePageTitle } from '@/lib/usePageTitle'
import { useFavorites } from '../queries'

/** "Lista de interesse" (sem frame no Figma): mesmo título do perfil e a grade de cards do catálogo. */
export function FavoritesPage() {
  usePageTitle('Lista de interesse')
  const { data, isPending, isError, error, refetch } = useFavorites()
  const count = data?.items.length ?? 0

  return (
    <section aria-labelledby="favoritos-titulo" className="flex flex-col gap-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h1 id="favoritos-titulo" className="text-base leading-4 font-bold">
          Lista de interesse
        </h1>
        {data && count > 0 && (
          <p className="text-sm text-text-2">
            {count} {count === 1 ? 'NFT salvo' : 'NFTs salvos'}
          </p>
        )}
      </div>

      {isPending ? (
        <ul
          aria-hidden
          className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-8 md:gap-y-12"
        >
          {Array.from({ length: 3 }, (_, i) => (
            <li key={i}>
              <NftCardSkeleton />
            </li>
          ))}
        </ul>
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar sua lista de interesse"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : count === 0 ? (
        <div className="flex flex-col items-start gap-4 rounded-md bg-surface p-6">
          <p className="font-bold">Sua lista de interesse está vazia</p>
          <p className="text-sm text-text-2">
            Toque no coração de um NFT para guardá-lo aqui e acompanhar preço e disponibilidade.
          </p>
          <Button asChild>
            <Link to="/" hash="catalogo">
              Explorar o catálogo
            </Link>
          </Button>
        </div>
      ) : (
        <ul
          aria-label="NFTs na lista de interesse"
          className="grid grid-cols-2 gap-x-4 gap-y-6 md:grid-cols-3 md:gap-x-8 md:gap-y-12"
        >
          {data.items.map((nft) => (
            <li key={nft.id}>
              <NftCard nft={nft} showFavorite />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
