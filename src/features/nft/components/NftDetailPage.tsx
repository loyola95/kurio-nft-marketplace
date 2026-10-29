import { useQuery } from '@tanstack/react-query'
import { Link, getRouteApi, useNavigate } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { NETWORK_LABEL } from '@/contracts/common'
import type { Edition, NftDetail } from '@/contracts/nft'
import { useAddToCart, useQuantityInCart } from '@/features/cart/queries'
import { ErrorState } from '@/features/catalog/components/States'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { NotFound } from '@/features/layout/NotFound'
import { formatEth } from '@/lib/money'
import { usePageTitle } from '@/lib/usePageTitle'
import { nftDetailOptions, pickEdition } from '../queries'
import { DetailSkeleton } from './DetailSkeleton'
import { EditionSelector } from './EditionSelector'
import { Gallery } from './Gallery'
import { QuantityStepper } from './QuantityStepper'
import { RelatedNfts } from './RelatedNfts'
import { ShareLinks } from './ShareLinks'
import { Stars } from './Stars'

const route = getRouteApi('/nft/$nftId')

export function NftDetailPage() {
  const { nftId } = route.useParams()
  const detail = useQuery(nftDetailOptions(nftId))

  if (detail.isPending) return <DetailSkeleton />
  if (detail.isError) {
    if (isApiError(detail.error, 'NOT_FOUND')) {
      return (
        <NotFound
          title="NFT não encontrado"
          message="Este NFT não existe ou foi removido do catálogo. Explore outras obras disponíveis."
        />
      )
    }
    return (
      <ErrorState
        title="Não foi possível carregar este NFT"
        error={detail.error}
        onRetry={() => void detail.refetch()}
      />
    )
  }
  return <Detail nft={detail.data} />
}

function Detail({ nft }: { nft: NftDetail }) {
  usePageTitle(nft.name, `${nft.name}: ${nft.description}`)
  const search = route.useSearch()
  const navigate = useNavigate()
  const edition = pickEdition(nft, search.edicao)
  const inCart = useQuantityInCart(edition.id)
  const limit = Math.max(0, Math.min(edition.available, edition.maxPerOrder) - inCart)
  const [quantity, setQuantity] = useState(1)
  const qty = Math.min(Math.max(1, quantity), Math.max(1, limit))
  const addToCart = useAddToCart()
  const purchasable = edition.status === 'available' && limit > 0

  const selectEdition = (id: string) => {
    setQuantity(1)
    void navigate({
      to: '/nft/$nftId',
      params: { nftId: nft.id },
      search: { edicao: id },
      replace: true,
      resetScroll: false,
    })
  }

  const buy = () => {
    addToCart.mutate(
      { nftId: nft.id, editionId: edition.id, quantity: qty },
      {
        onSuccess: () => {
          toast.success(`${nft.name} (${edition.label}) adicionado ao carrinho.`)
          void navigate({ to: '/carrinho' })
        },
        onError: (error) => {
          toast.error(
            isApiError(error, 'AVAILABILITY_CONFLICT')
              ? 'A quantidade pedida não está mais disponível para esta edição.'
              : isApiError(error)
                ? error.message
                : 'Não foi possível adicionar ao carrinho.',
          )
        },
      },
    )
  }

  const limitMessage = limitText(edition, inCart)

  return (
    <div className="flex flex-col gap-12 pb-40 md:gap-24 md:pb-0">
      <div className="flex flex-col gap-3">
        <nav aria-label="Trilha de navegação" className="hidden md:block">
          <ol className="flex gap-1 text-[15px] leading-4 font-bold">
            <li>
              <Link to="/" className="hover:text-highlight">
                Início
              </Link>
              <span aria-hidden> / </span>
            </li>
            <li>
              <Link to="/" hash="catalogo" className="hover:text-highlight">
                Mercado
              </Link>
            </li>
          </ol>
        </nav>
        <Link
          to="/"
          hash="catalogo"
          className="flex w-fit items-center gap-2 text-sm text-text-2 md:hidden"
        >
          <Icon name="arrow-left" size={20} />
          Voltar ao catálogo
        </Link>

        <section aria-labelledby="nft-titulo" className="flex flex-col gap-8 md:flex-row">
          <div className="relative md:w-[573px] md:shrink-0">
            <Gallery images={nft.gallery} name={nft.name} />
            <div className="absolute top-4 right-4 md:top-[15px] md:right-[13px]">
              <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" />
            </div>
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex flex-col gap-3">
              <h1 id="nft-titulo" className="text-[28px] leading-[37px] font-bold">
                {nft.name}
              </h1>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-[22px] leading-4 font-bold text-highlight">
                  {formatEth(edition.priceEth)}
                </p>
                <a href="#avaliacoes" className="flex items-center gap-1 text-sm text-text-2">
                  <Stars rating={nft.rating.average} />
                  <span>
                    {nft.rating.count} avaliações de colecionadores
                    <span className="sr-only">, nota média {nft.rating.average}</span>
                  </span>
                </a>
              </div>
            </div>
            <hr className="border-primary/30" />
            <div className="flex flex-col gap-3">
              <h2 className="text-[15px] leading-4 font-bold">Sobre este NFT:</h2>
              <p className="text-[15px] leading-5 text-text-2">{nft.description}</p>
            </div>
            <EditionSelector
              editions={nft.editions}
              selectedId={edition.id}
              onSelect={selectEdition}
            />

            <div className="hidden flex-wrap items-start justify-between gap-4 md:flex">
              <QuantityStepper
                value={qty}
                max={Math.max(1, limit)}
                onChange={setQuantity}
                disabled={!purchasable}
                limitMessage={limitMessage}
              />
              <div className="flex gap-2">
                <Button
                  type="button"
                  className="w-[130px] text-sm"
                  onClick={buy}
                  disabled={!purchasable || addToCart.isPending}
                >
                  {addToCart.isPending ? 'Adicionando…' : 'COMPRAR'}
                </Button>
                <FavoriteButton nftId={nft.id} nftName={nft.name} />
              </div>
            </div>
            {!purchasable && (
              <p role="status" className="text-sm text-danger">
                {edition.status !== 'available'
                  ? 'Esta edição não está à venda. Escolha outra edição.'
                  : 'Você já tem no carrinho a quantidade máxima disponível desta edição.'}
              </p>
            )}

            <dl className="flex flex-col gap-3 text-[15px] leading-5 text-text-3">
              <div className="flex gap-1">
                <dt>ID do token:</dt>
                <dd>{nft.tokenId}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Coleção:</dt>
                <dd>{nft.collection}</dd>
              </div>
              <div className="flex gap-1">
                <dt>Atributos:</dt>
                <dd>{nft.attributes.join(', ')}</dd>
              </div>
            </dl>
            <ShareLinks name={nft.name} />
          </div>
        </section>
      </div>

      <Tabs defaultValue="detalhes" className="flex flex-col gap-3" id="avaliacoes">
        <TabsList className="relative h-auto w-full justify-start gap-8 rounded-none border-b border-primary/30 bg-transparent p-0">
          <TabsTrigger
            value="detalhes"
            className="h-auto flex-none rounded-none border-0 border-b-[3px] border-transparent px-0 pb-3 text-[17px] leading-4 font-normal text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-highlight"
          >
            Detalhes do NFT
          </TabsTrigger>
          <TabsTrigger
            value="avaliacoes"
            className="h-auto flex-none rounded-none border-0 border-b-[3px] border-transparent px-0 pb-3 text-[17px] leading-4 font-normal text-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-bold data-[state=active]:text-highlight"
          >
            Avaliações de colecionadores ({nft.rating.count})
          </TabsTrigger>
        </TabsList>
        <TabsContent value="detalhes" className="flex flex-col gap-3 text-sm leading-6">
          <p className="text-text-2">{nft.longDescription}</p>
          <div>
            <h3 className="font-bold">Rede:</h3>
            <p className="text-text-2">
              Cunhado na {NETWORK_LABEL[nft.network]} com procedência imutável e metadados
              armazenados no IPFS.
            </p>
          </div>
          <div>
            <h3 className="font-bold">Contrato:</h3>
            <p className="text-text-2">{nft.contract} • Contrato inteligente ERC-721 verificado.</p>
          </div>
          <div>
            <h3 className="font-bold">Direitos autorais:</h3>
            <p className="text-text-2">
              Direitos autorais do criador: {nft.royaltiesPct}% nas vendas secundárias, pagos
              automaticamente pelos mercados compatíveis.
            </p>
          </div>
        </TabsContent>
        <TabsContent value="avaliacoes">
          {nft.reviews.length === 0 ? (
            <p className="text-sm text-text-2">Este NFT ainda não recebeu avaliações.</p>
          ) : (
            <ul className="flex flex-col gap-4">
              {nft.reviews.map((r) => (
                <li key={r.id} className="flex flex-col gap-1 rounded-md bg-surface p-4">
                  <div className="flex items-center gap-2 text-sm font-bold">
                    {r.author}
                    <Stars rating={r.rating} />
                  </div>
                  <p className="text-sm text-text-2">{r.comment}</p>
                </li>
              ))}
            </ul>
          )}
        </TabsContent>
      </Tabs>

      <RelatedNfts nftId={nft.id} />

      {/* Barra de compra fixa do frame "Mobile / Detalhes do NFT". */}
      <div className="fixed inset-x-0 bottom-0 z-30 rounded-t-[24px] bg-surface px-6 pt-5 pb-8 md:hidden">
        <div className="flex items-end justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-text-2">Qtd.</span>
            <QuantityStepper
              value={qty}
              max={Math.max(1, limit)}
              onChange={setQuantity}
              disabled={!purchasable}
              size="sm"
            />
          </div>
          <p className="text-[22px] leading-4 font-bold text-highlight">
            {formatEth(edition.priceEth)}
          </p>
        </div>
        {qty >= limit && limitMessage && <p className="mt-2 text-xs text-text-2">{limitMessage}</p>}
        <Button
          type="button"
          className="mt-4 h-[60px] w-full rounded-[10px]"
          onClick={buy}
          disabled={!purchasable || addToCart.isPending}
        >
          {addToCart.isPending ? 'Adicionando…' : 'Comprar NFT'}
        </Button>
      </div>
    </div>
  )
}

function limitText(edition: Edition, inCart: number): string | undefined {
  if (edition.status !== 'available') return undefined
  const cap = Math.min(edition.available, edition.maxPerOrder)
  const base =
    edition.available <= edition.maxPerOrder
      ? `Restam ${edition.available} ${edition.available === 1 ? 'unidade' : 'unidades'} desta edição.`
      : `Limite de ${edition.maxPerOrder} por pedido nesta edição.`
  return inCart > 0 ? `${base} Você já tem ${Math.min(inCart, cap)} no carrinho.` : base
}
