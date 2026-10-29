import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/contracts/cart'
import { ErrorState } from '@/features/catalog/components/States'
import { RelatedNfts } from '@/features/nft/components/RelatedNfts'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useCart, useDismissCartNotices } from '../queries'
import { CART_COLUMNS, CartItemRow } from './CartItemRow'
import { CartSummary, CartSummarySkeleton } from './CartSummary'

function Notices({ cart }: { cart: Cart }) {
  const dismiss = useDismissCartNotices()
  if (cart.notices.length === 0) return null
  return (
    <div
      role="status"
      className="flex flex-col gap-3 rounded-md border border-primary/40 bg-primary/10 p-4 text-sm leading-5 sm:flex-row sm:items-start sm:justify-between"
    >
      <ul className="flex flex-col gap-1">
        {cart.notices.map((n) => (
          <li key={n.id}>{n.message}</li>
        ))}
      </ul>
      <button
        type="button"
        onClick={() => dismiss.mutate()}
        disabled={dismiss.isPending}
        className="shrink-0 self-start text-highlight hover:underline disabled:opacity-50"
      >
        Entendi
      </button>
    </div>
  )
}

function EmptyCart() {
  return (
    <div className="flex flex-col items-start gap-4 rounded-md bg-surface p-6">
      <p className="font-bold">Seu carrinho está vazio</p>
      <p className="text-sm text-text-2">
        Explore o catálogo e adicione NFTs para ver o resumo da compra aqui.
      </p>
      <Button asChild>
        <Link to="/" hash="catalogo">
          Explorar o catálogo
        </Link>
      </Button>
    </div>
  )
}

function CartSkeleton() {
  return (
    <div aria-hidden className="flex flex-col gap-5 lg:gap-3">
      {Array.from({ length: 3 }, (_, i) => (
        <Skeleton key={i} className="h-[100px] rounded-[14px] lg:h-[70px] lg:rounded-none" />
      ))}
    </div>
  )
}

/** Carrinho de NFTs (frames Desktop e Mobile / Carrinho de NFTs). */
export function CartPage() {
  usePageTitle('Carrinho')
  const { data: cart, isPending, isError, error, refetch } = useCart()
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const empty = cart && cart.items.length === 0

  return (
    <div className="flex min-h-[calc(100dvh-24px)] flex-col gap-24 lg:min-h-0">
      <div className="flex flex-1 flex-col gap-3">
        <nav aria-label="Trilha de navegação" className="hidden lg:block">
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
              <span aria-hidden> / </span>
            </li>
            <li aria-current="page">Carrinho</li>
          </ol>
        </nav>

        {/* Cabeçalho do frame mobile: voltar + título centralizado. */}
        <div className="relative mt-2 flex h-11 items-start justify-center lg:hidden">
          <button
            type="button"
            onClick={() => (canGoBack ? router.history.back() : void router.navigate({ to: '/' }))}
            className="absolute top-0 left-1 grid size-[35px] place-items-center rounded-full border border-border bg-surface-2 text-text-2"
          >
            <Icon name="arrow-left" size={20} />
            <span className="sr-only">Voltar</span>
          </button>
          <h1 className="pt-[9px] text-xl leading-4 font-bold lg:sr-only">Carrinho de NFTs</h1>
        </div>
        <h1 className="sr-only max-lg:hidden">Carrinho de NFTs</h1>

        <div className="flex flex-1 flex-col gap-1 lg:gap-6 xl:grid xl:grid-cols-[782px_332px] xl:items-start xl:justify-between">
          <div className="flex flex-col gap-3 px-1 lg:px-0">
            {cart && <Notices cart={cart} />}
            <div aria-hidden className={cn('hidden text-base leading-4 lg:grid', CART_COLUMNS)}>
              <span className="font-bold">NFTs</span>
              <span className="font-medium">Preço</span>
              <span className="font-bold">Edições</span>
              <span className="font-medium">Total</span>
            </div>
            <hr className="hidden border-primary/30 lg:block" />
            {isPending ? (
              <CartSkeleton />
            ) : isError ? (
              <ErrorState
                title="Não foi possível carregar o carrinho"
                error={error}
                onRetry={() => void refetch()}
              />
            ) : empty ? (
              <EmptyCart />
            ) : (
              <ul aria-label="Itens do carrinho" className="flex flex-col gap-5 lg:gap-3">
                {cart.items.map((item) => (
                  <CartItemRow
                    key={item.id}
                    item={item}
                    // Duas edições do mesmo NFT: a linha do token mostra a edição para diferenciar.
                    showEdition={cart.items.some((o) => o.id !== item.id && o.nftId === item.nftId)}
                  />
                ))}
              </ul>
            )}
          </div>
          {(isPending || (cart && !empty)) && (
            <div className="mt-auto lg:mt-0 lg:ml-auto lg:w-[332px] xl:ml-0">
              {cart ? <CartSummary cart={cart} /> : <CartSummarySkeleton />}
            </div>
          )}
        </div>
      </div>

      {cart?.items[0] && (
        <div className="hidden lg:block">
          <RelatedNfts nftId={cart.items[0].nftId} title="Colecionadores também viram" />
        </div>
      )}
    </div>
  )
}
