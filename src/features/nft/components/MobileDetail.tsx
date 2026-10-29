import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import type { Edition, NftDetail } from '@/contracts/nft'
import { NftImage } from '@/features/catalog/components/NftImage'
import { FavoriteButton } from '@/features/favorites/components/FavoriteButton'
import { formatEth } from '@/lib/money'
import { EditionSelector } from './EditionSelector'
import { QuantityStepper } from './QuantityStepper'

/** Topo e folha de detalhes do frame "Mobile / Detalhes do NFT" (414px). */
export function MobileDetailTop({
  nft,
  edition,
  onSelectEdition,
}: {
  nft: NftDetail
  edition: Edition
  onSelectEdition: (id: string) => void
}) {
  return (
    <section aria-labelledby="nft-titulo-mobile" className="-mx-6 -mt-6 md:hidden">
      {/* Hero: gradiente #241612 → #2f1d15 com a arte de 361x356 e os botões redondos. */}
      <div className="relative h-[506px] bg-linear-135 from-surface to-surface-2 pt-[23px] pr-[25px] pl-7">
        <div className="flex items-center justify-between">
          <Link
            to="/"
            hash="catalogo"
            className="grid size-[35px] place-items-center rounded-full border border-border bg-surface-2 text-text-2"
          >
            <Icon name="arrow-left" size={20} />
            <span className="sr-only">Voltar ao catálogo</span>
          </Link>
          <FavoriteButton nftId={nft.id} nftName={nft.name} variant="icon" size="lg" />
        </div>
        {/* O frame mobile mostra só a arte principal: as bolinhas ficam sob a arte no Figma. */}
        <div className="mt-2 h-[356px] overflow-hidden rounded-3xl">
          <NftImage
            image={nft.image}
            priority
            sizes="361px"
            alt={`${nft.name}, arte principal`}
            className="size-full"
          />
        </div>
      </div>

      {/* Folha de detalhes: sobe 114px sobre o hero, raio 31 no topo. */}
      <div className="relative -mt-[114px] flex flex-col gap-3 rounded-t-[31px] bg-surface px-6 pt-8 pb-6">
        <div className="flex items-center justify-between gap-3">
          <h1 id="nft-titulo-mobile" className="text-xl leading-4 font-bold">
            {nft.name}
          </h1>
          <a
            href="#avaliacoes"
            className="flex h-[27px] shrink-0 items-center rounded-[32px] border border-primary pr-1.5 pl-1.5 text-sm leading-4"
          >
            <Icon name="star" size={14} className="text-gold" />
            <span aria-hidden className="ml-1 font-medium">
              {nft.rating.average.toFixed(1)}
            </span>
            <span aria-hidden className="text-text-2">
              ({nft.rating.count})
            </span>
            <span className="sr-only">
              Nota {nft.rating.average.toFixed(1)}, {nft.rating.count} avaliações de colecionadores
            </span>
          </a>
        </div>
        <p className="text-sm leading-6 text-text-2">{nft.description}</p>
        <EditionSelector
          editions={nft.editions}
          selectedId={edition.id}
          onSelect={onSelectEdition}
          compact
        />
        <dl className="flex flex-col gap-3 text-[15px] leading-5 text-text-3">
          <div className="flex gap-[1ch]">
            <dt>ID do token:</dt>
            <dd>{nft.tokenId}</dd>
          </div>
          <div className="flex gap-[1ch]">
            <dt>Coleção:</dt>
            <dd>{nft.collection}</dd>
          </div>
          <div className="flex gap-[1ch]">
            <dt>Atributos:</dt>
            <dd>{nft.attributes.join(', ')}</dd>
          </div>
        </dl>
      </div>
    </section>
  )
}

/** Barra de compra fixa (Buy Bar do Figma): quantidade, preço, "Comprar NFT" e carrinho. */
export function MobileBuyBar({
  priceEth,
  quantity,
  max,
  onQuantityChange,
  purchasable,
  pending,
  limitMessage,
  showLimit,
  onBuy,
  onAddToCart,
}: {
  priceEth: string
  quantity: number
  max: number
  onQuantityChange: (value: number) => void
  purchasable: boolean
  pending: boolean
  limitMessage?: string
  showLimit: boolean
  onBuy: () => void
  onAddToCart: () => void
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col gap-5 rounded-t-[40px] bg-surface px-6 pt-5 pb-9 shadow-[0_0_20px_rgb(10_6_4/0.45)] md:hidden">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span aria-hidden className="text-[15px] leading-4 font-medium text-text-2">
            Qtd.
          </span>
          <QuantityStepper
            value={quantity}
            max={max}
            onChange={onQuantityChange}
            disabled={!purchasable}
            size="sm"
          />
        </div>
        <p className="text-xl leading-4 font-bold text-highlight">{formatEth(priceEth)}</p>
      </div>
      {showLimit && limitMessage && <p className="-mt-3 text-xs text-text-2">{limitMessage}</p>}
      <div className="flex gap-3">
        <button
          type="button"
          onClick={onBuy}
          disabled={!purchasable || pending}
          className="h-[60px] w-[196px] rounded-[40px] bg-[linear-gradient(108deg,var(--kurio-primary),rgb(210_138_76/0.8))] text-base leading-5 font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {pending ? 'Adicionando…' : 'Comprar NFT'}
        </button>
        <button
          type="button"
          onClick={onAddToCart}
          disabled={!purchasable || pending}
          className="grid size-[60px] place-items-center rounded-[40px] border border-border bg-surface-2 text-text-3 hover:border-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Icon name="shop" size={20} />
          <span className="sr-only">Adicionar ao carrinho sem sair desta página</span>
        </button>
      </div>
    </div>
  )
}
