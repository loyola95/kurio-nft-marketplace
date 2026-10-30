import type { ReactNode } from 'react'
import type { Summary } from '@/contracts/cart'
import type { QuoteLine } from '@/contracts/quote'
import { NftImage } from '@/features/catalog/components/NftImage'
import { formatEth } from '@/lib/money'
import { cn } from '@/lib/utils'

// Cartão do frame "Desktop / Confirmação de Pedido" (578px). O mesmo visual serve
// para revisão, pedido pendente, confirmado e recusado (comentário #46 do Figma).

/** Colunas NFTs | Edições | Subtotal: cabeçalho e linhas na mesma grade (comentário #15). */
const COLUMNS =
  'grid grid-cols-[minmax(0,1fr)_52px_80px] items-center gap-x-2 sm:grid-cols-[minmax(0,1fr)_76px_104px] sm:gap-x-3'

export function OrderLines({ lines }: { lines: QuoteLine[] }) {
  return (
    <div className="flex flex-col gap-3">
      <div aria-hidden className={cn(COLUMNS, 'text-xs leading-4 sm:text-base')}>
        <span className="font-bold">NFTs</span>
        <span className="text-center font-medium">Quantidade</span>
        <span className="text-right font-medium">Subtotal</span>
      </div>
      <hr className="border-primary/30" />
      <ul aria-label="Itens do pedido" className="flex flex-col gap-3">
        {lines.map((line) => (
          <li key={line.itemId} className={cn(COLUMNS, 'min-h-[70px] bg-surface')}>
            <div className="flex min-w-0 items-center gap-3">
              <NftImage
                image={line.image}
                sizes="70px"
                alt=""
                className="size-[50px] shrink-0 rounded-lg sm:size-[70px]"
              />
              <div className="flex min-w-0 flex-col gap-1.5">
                <span className="text-sm leading-4 font-bold break-words sm:truncate sm:text-base">
                  {line.name}
                </span>
                <span className="text-xs leading-4 text-text-3 sm:truncate sm:text-sm">
                  ID do token: {line.tokenId}
                  <span className="sr-only">, edição {line.editionLabel}</span>
                </span>
              </div>
            </div>
            <span className="text-center text-xs leading-4 text-text-2 sm:text-sm">
              <span className="sr-only">Quantidade: </span>(x {line.quantity})
            </span>
            <span className="text-right text-sm leading-4 font-bold whitespace-nowrap text-highlight sm:text-lg">
              {formatEth(line.lineTotalEth)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Taxa, desconto (se houver) e total, alinhados à direita como no Figma. */
export function OrderTotals({ summary }: { summary: Summary }) {
  const hasDiscount = Number(summary.discountEth) > 0
  return (
    <dl className="ml-auto flex w-full max-w-[321px] flex-col gap-3">
      {hasDiscount && (
        <div className="flex items-baseline justify-between gap-3 text-[15px] leading-5">
          <dt>Desconto</dt>
          <dd data-label="Desconto" className="text-right text-lg leading-4">
            (-) {formatEth(summary.discountEth)}
          </dd>
        </div>
      )}
      <div className="flex items-baseline justify-between gap-3 text-[15px] leading-5">
        <dt>Taxa de rede</dt>
        <dd data-label="Taxa de rede" className="text-right text-lg leading-4">
          {formatEth(summary.networkFeeEth)}
        </dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 text-base leading-4 font-bold">
        <dt>Total</dt>
        <dd data-label="Total" className="text-right text-lg leading-4 text-highlight">
          {formatEth(summary.totalEth)}
        </dd>
      </div>
    </dl>
  )
}

export interface MetaItem {
  label: string
  value: ReactNode
  /** No Figma "ID da transação" e "Carteira" têm rótulo em negrito. */
  strong?: boolean
}

/** Faixa "ID da transação | Data | Total | Carteira" entre as duas linhas laranja. */
function MetaRow({ items }: { items: MetaItem[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-y border-primary px-6 py-[15px] sm:flex sm:justify-between sm:gap-0 sm:px-9">
      {items.map((item, i) => (
        <div
          key={item.label}
          className={cn(
            'flex min-w-0 flex-col text-text-2',
            i > 0 && 'sm:border-l sm:border-primary sm:pl-3',
            i < items.length - 1 && 'sm:shrink-0 sm:pr-3',
          )}
        >
          <dt className={cn('text-sm leading-4 whitespace-nowrap', item.strong && 'font-bold')}>
            {item.label}
          </dt>
          {/* Só o último valor (nome da carteira) pode quebrar linha; os outros cabem inteiros. */}
          <dd
            className={cn('text-[15px] leading-5', i < items.length - 1 && 'sm:whitespace-nowrap')}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  )
}

interface OrderCardProps {
  label: string
  icon: ReactNode
  title: ReactNode
  /** Nível do título: h1 na página do pedido, h2 dentro do modal (o título do modal vem do Dialog). */
  titleAs?: 'h1' | 'h2'
  meta: MetaItem[]
  lines: QuoteLine[]
  summary: Summary
  /** Avisos acima da tabela (cotação desatualizada, falha de envio). */
  alert?: ReactNode
  note: ReactNode
  actions: ReactNode
  closeButton?: ReactNode
  className?: string
}

export function OrderCard({
  label,
  icon,
  title,
  titleAs: Title = 'h1',
  meta,
  lines,
  summary,
  alert,
  note,
  actions,
  closeButton,
  className,
}: OrderCardProps) {
  return (
    <section
      aria-label={label}
      className={cn('relative flex w-full max-w-[578px] flex-col bg-surface', className)}
    >
      {/* Ícone de 18px em botão de 24px: fica a 17px do topo e 14px da direita, como no frame. */}
      {closeButton && <div className="absolute top-[14px] right-[11px]">{closeButton}</div>}
      <header className="flex flex-col items-center gap-4 px-6 pt-[22px] pb-[22px]">
        <span className="grid size-20 place-items-center">{icon}</span>
        <Title className="text-center text-base leading-4 font-bold text-text-2">{title}</Title>
      </header>
      <MetaRow items={meta} />
      <div className="flex flex-col gap-3 px-5 pt-5 pb-12 sm:px-11">
        <h2 className="text-[15px] leading-4 font-bold">Detalhes da transação</h2>
        {alert}
        <OrderLines lines={lines} />
        <OrderTotals summary={summary} />
        <hr className="border-primary/30" />
        {/* Frame: texto da rede e botão a 20px. */}
        <div className="flex flex-col items-center gap-5">
          <div className="text-center text-sm leading-[22px] text-balance text-text-2">{note}</div>
          {actions && <div className="flex flex-col items-center gap-3">{actions}</div>}
        </div>
      </div>
      <div aria-hidden className="h-2.5 bg-primary" />
    </section>
  )
}
