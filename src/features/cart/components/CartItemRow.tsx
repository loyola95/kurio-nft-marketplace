import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { toast } from 'sonner'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import type { CartItem } from '@/contracts/cart'
import { NftImage } from '@/features/catalog/components/NftImage'
import { QuantityStepper } from '@/features/nft/components/QuantityStepper'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'
import { useRemoveCartItem, useRestoreCartItem, useUpdateCartItem } from '../queries'

/** Colunas da tabela do Figma (NFTs, Preço, Edições, Total, excluir) com 61px entre elas. */
export const CART_COLUMNS = 'lg:grid-cols-[250px_77px_75px_87px_24px] lg:gap-x-[61px]'

/**
 * Item do carrinho. Desktop (lg+): linha da tabela de 70px. Mobile: card de 100px
 * com imagem, edição, total da linha e stepper redondo; o botão de excluir não tem
 * espaço no frame mobile, então fica no canto do card (desvio documentado).
 */
export function CartItemRow({
  item,
  showEdition = false,
}: {
  item: CartItem
  showEdition?: boolean
}) {
  const update = useUpdateCartItem()
  const remove = useRemoveCartItem()
  const restore = useRestoreCartItem()
  const [error, setError] = useState<string | null>(null)
  const label = `${item.name} (${item.editionLabel})`
  const soldOut = item.status === 'sold_out'
  const busy = update.isPending || remove.isPending

  const fail = (fallback: string) => (e: unknown) =>
    setError(isApiError(e) && e.code === 'AVAILABILITY_CONFLICT' ? e.message : fallback)

  const change = (quantity: number) => {
    setError(null)
    update.mutate(
      { itemId: item.id, quantity },
      { onError: fail('Não foi possível atualizar a quantidade. Tente novamente.') },
    )
  }

  const stepper = (size: 'sm' | 'round') => (
    <QuantityStepper
      size={size}
      value={item.quantity}
      max={Math.max(1, item.maxQuantity)}
      onChange={change}
      disabled={soldOut || busy}
      label={`Quantidade de ${label}`}
    />
  )

  const removeButton = (className: string) => (
    <button
      type="button"
      onClick={() => {
        setError(null)
        // Remove na hora e oferece "Desfazer" (mesma edição e quantidade), em vez de um
        // diálogo de confirmação a cada remoção.
        const removed = { nftId: item.nftId, editionId: item.editionId, quantity: item.quantity }
        remove.mutate(item.id, {
          onSuccess: () =>
            toast(`${label} removido do carrinho.`, {
              action: {
                label: 'Desfazer',
                onClick: () =>
                  void restore(removed).catch((e: unknown) =>
                    toast.error(
                      isApiError(e) ? e.message : 'Não foi possível devolver o item ao carrinho.',
                    ),
                  ),
              },
            }),
          onError: fail('Não foi possível remover o item. Tente novamente.'),
        })
      }}
      disabled={busy}
      className={cn(
        'grid place-items-center text-text-3 transition-colors after:absolute after:-inset-2 hover:text-danger disabled:opacity-50',
        className,
      )}
    >
      <Icon name="delete" size={24} />
      <span className="sr-only">Remover {label} do carrinho</span>
    </button>
  )

  return (
    <li
      className={cn(
        'flex flex-col rounded-[14px] bg-surface shadow-[0_6px_20px_rgb(10_6_4/0.35)] lg:rounded-none lg:shadow-none',
        soldOut && 'opacity-80',
      )}
    >
      <div
        className={cn(
          'relative flex min-h-[100px] lg:grid lg:min-h-[70px] lg:items-center lg:pr-6',
          CART_COLUMNS,
        )}
      >
        <div className="flex min-w-0 gap-[9px] lg:items-center lg:gap-4">
          <NftImage
            image={item.image}
            sizes="100px"
            className="size-[100px] shrink-0 rounded-[14px] lg:size-[70px] lg:rounded-md"
          />
          <div className="flex min-w-0 flex-col pt-[13px] pr-[86px] lg:gap-1.5 lg:pt-0 lg:pr-0">
            <h3 className="line-clamp-2 text-[15px] leading-5 font-bold break-words lg:line-clamp-none lg:truncate lg:text-base lg:leading-4">
              <Link
                to="/nft/$nftId"
                params={{ nftId: item.nftId }}
                className="hover:text-highlight"
              >
                {item.name}
              </Link>
            </h3>
            <p className="mt-1.5 text-sm leading-4 text-text-2 lg:hidden">
              Edição: {item.editionLabel}
            </p>
            <p className="hidden truncate text-sm leading-4 text-text-3 lg:block">
              ID do token: {item.tokenId}
              {showEdition && ` · ${item.editionLabel}`}
            </p>
            {soldOut && <p className="mt-1 text-xs font-bold text-danger">Esgotada</p>}
            <p className="mt-auto pb-[15px] text-lg leading-4 font-bold text-highlight lg:hidden">
              {formatEth(item.lineTotalEth)}
            </p>
          </div>
        </div>

        <p className="hidden flex-col text-base leading-4 font-bold text-text-2 lg:flex">
          <span className="sr-only">Preço: </span>
          {formatEth(item.unitPriceEth)}
          {item.previousUnitPriceEth && (
            <span className="mt-1 text-xs font-normal text-text-3 line-through">
              <span className="sr-only">Antes: </span>
              {formatEth(item.previousUnitPriceEth)}
            </span>
          )}
        </p>

        <div className="absolute top-[38px] right-4 lg:static">
          <div className="lg:hidden">{stepper('round')}</div>
          <div className="hidden lg:block">{stepper('sm')}</div>
        </div>

        <p className="hidden text-base leading-4 font-bold text-highlight lg:block">
          <span className="sr-only">Total: </span>
          {formatEth(item.lineTotalEth)}
        </p>

        {removeButton('absolute top-2 right-3.5 size-6 lg:relative lg:top-auto lg:right-auto')}
      </div>
      {error && (
        <p role="alert" className="px-4 pb-3 text-xs text-danger lg:px-0 lg:pt-1 lg:pb-2">
          {error}
        </p>
      )}
    </li>
  )
}
