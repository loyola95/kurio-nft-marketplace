import { useState } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/contracts/cart'
import type { Quote } from '@/contracts/quote'
import { CouponForm } from '@/features/cart/components/CartSummary'
import { NftImage } from '@/features/catalog/components/NftImage'
import { formatEth } from '@/lib/money'

function Row({ label, value, small }: { label: string; value: string; small?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[15px] leading-5">
      <dt>{label}</dt>
      <dd data-label={label} className={small ? 'text-[15px] leading-5' : 'text-lg leading-4'}>
        {value}
      </dd>
    </div>
  )
}

/** Coluna "Seus NFTs" do frame desktop: linhas e totais da cotação da rede escolhida. */
export function CheckoutItems({
  quote,
  cart,
  failed,
}: {
  quote: Quote | undefined
  cart: Cart
  /** A cotação falhou (a mensagem aparece abaixo dos conectores): sem esqueleto infinito. */
  failed: boolean
}) {
  const [couponOpen, setCouponOpen] = useState(false)
  return (
    <section aria-labelledby="seus-nfts" className="flex flex-col gap-3">
      <h2 id="seus-nfts" className="text-[17px] leading-4 font-bold">
        Seus NFTs
      </h2>
      <div aria-hidden className="flex justify-between text-base leading-4">
        <span className="font-bold">NFTs</span>
        <span className="font-medium">Subtotal</span>
      </div>
      <hr className="border-primary/30" />

      {failed && !quote ? null : !quote ? (
        <div aria-hidden className="flex flex-col gap-3">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-[70px]" />
          ))}
          <Skeleton className="h-[150px]" />
        </div>
      ) : (
        <>
          <ul aria-label="Itens deste pedido" className="flex flex-col gap-3">
            {quote.lines.map((line) => (
              // Comentário #32: miniatura, nome, "(x N)" e subtotal na mesma grade em todas as linhas.
              <li
                key={line.itemId}
                className="grid min-h-[70px] grid-cols-[70px_minmax(0,1fr)_44px_auto] items-center gap-x-2 bg-surface pr-3 pl-1"
              >
                <NftImage
                  image={line.image}
                  sizes="70px"
                  alt=""
                  className="size-[62px] rounded-lg"
                />
                <span className="flex min-w-0 flex-col gap-1.5">
                  <span className="truncate text-base leading-4 font-bold">{line.name}</span>
                  <span className="truncate text-sm leading-4 text-text-3">
                    ID do token: {line.tokenId}
                  </span>
                </span>
                <span className="text-right text-sm leading-4 text-text-2">
                  <span className="sr-only">Quantidade: </span>(x {line.quantity})
                </span>
                <span className="text-right text-lg leading-4 font-bold whitespace-nowrap text-highlight">
                  {formatEth(line.lineTotalEth)}
                </span>
              </li>
            ))}
          </ul>

          {cart.coupon || couponOpen ? (
            <CouponForm cart={cart} />
          ) : (
            <p className="text-center text-sm leading-4">
              Tem um código promocional?{' '}
              <button
                type="button"
                onClick={() => setCouponOpen(true)}
                className="text-highlight hover:underline"
              >
                Aplique aqui
              </button>
            </p>
          )}

          <dl className="flex flex-col gap-3">
            <Row label="Subtotal" value={formatEth(quote.summary.subtotalEth)} />
            <Row
              label="Desconto do lançamento"
              value={`(-) ${formatEth(quote.summary.discountEth)}`}
              small
            />
            <Row label="Taxa de rede" value={formatEth(quote.summary.networkFeeEth)} />
            <p className="text-center text-xs leading-4 text-highlight">Taxa estimada</p>
            <hr className="border-primary/30" />
            {/* O total fica recuado 42px dos dois lados, como no frame. */}
            <div className="flex items-baseline justify-between gap-3 px-[42px] text-base leading-4 font-bold">
              <dt>Total</dt>
              <dd data-label="Total" className="text-lg leading-4 text-highlight">
                {formatEth(quote.summary.totalEth)}
              </dd>
            </div>
          </dl>
        </>
      )}
    </section>
  )
}
