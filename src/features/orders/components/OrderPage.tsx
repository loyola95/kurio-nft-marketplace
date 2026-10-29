import { Link, useNavigate } from '@tanstack/react-router'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABEL } from '@/contracts/common'
import type { Order } from '@/contracts/order'
import { ErrorState } from '@/features/catalog/components/States'
import { shortAddress } from '@/features/checkout/model'
import { formatEth } from '@/lib/money'
import { usePageTitle } from '@/lib/usePageTitle'
import { useOrder } from '../queries'
import { formatOrderDate, primaryAction } from '../format'
import { OrderCard } from './OrderCard'

const EXPLORER_NAME = { ethereum: 'Etherscan', polygon: 'Polygonscan', solana: 'Solscan' } as const

function StatusIcon({ status }: { status: Order['status'] }) {
  if (status === 'confirmed') {
    return <img src="/icons/thank-you.svg" width={80} height={80} alt="" aria-hidden />
  }
  if (status === 'declined') return <Icon name="danger" size={64} className="text-danger" />
  return (
    <span
      aria-hidden
      className="size-16 animate-spin rounded-full border-4 border-primary/25 border-t-primary motion-reduce:animate-none"
    />
  )
}

const TITLE: Record<Order['status'], string> = {
  pending: 'Estamos confirmando seu pedido',
  confirmed: 'Seus NFTs agora estão na sua carteira',
  declined: 'Pagamento recusado',
}

/** Cartão do pedido nos três estados; só "confirmed" vindo da API mostra a confirmação. */
export function OrderStatusCard({ order }: { order: Order }) {
  const navigate = useNavigate()
  const { receipt, status } = order
  const network = NETWORK_LABEL[receipt.network]
  const tx = receipt.transaction

  const note =
    status === 'confirmed' ? (
      <p>
        Transação confirmada na {network}. A propriedade foi transferida para sua carteira conectada
        e registrada na rede.
      </p>
    ) : status === 'declined' ? (
      <>
        <p>{order.declineReason}</p>
        <p>Seus itens continuam no carrinho.</p>
      </>
    ) : (
      <p role="status">
        Aguardando a confirmação na {network}. Esta página atualiza sozinha e pode ser recarregada
        sem criar outra compra.
      </p>
    )

  const actions =
    status === 'confirmed' && tx ? (
      <>
        <a
          href={tx.explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={primaryAction}
        >
          Ver no {EXPLORER_NAME[receipt.network]}
          <span className="sr-only"> (abre em nova aba; transação simulada)</span>
        </a>
        <p className="text-xs leading-4 text-text-3">Transação simulada na demonstração.</p>
      </>
    ) : status === 'declined' ? (
      <Link to="/pagamento" className={primaryAction}>
        Voltar ao pagamento
      </Link>
    ) : null

  return (
    <OrderCard
      label={`Pedido ${order.id}`}
      icon={<StatusIcon status={status} />}
      title={TITLE[status]}
      meta={[
        {
          label: 'ID da transação',
          strong: true,
          value: tx ? (
            <span title={tx.hash}>
              {shortAddress(tx.hash)}
              <span className="sr-only"> ({tx.hash})</span>
            </span>
          ) : status === 'declined' ? (
            'Não gerado'
          ) : (
            'Aguardando'
          ),
        },
        { label: 'Data', value: formatOrderDate(receipt.confirmedAt ?? order.createdAt) },
        { label: 'Total', value: formatEth(receipt.summary.totalEth) },
        { label: 'Carteira', strong: true, value: receipt.wallet.label },
      ]}
      lines={receipt.lines}
      summary={receipt.summary}
      note={note}
      actions={actions}
      closeButton={
        <button
          type="button"
          onClick={() => void navigate({ to: status === 'declined' ? '/carrinho' : '/' })}
          className="grid size-6 place-items-center text-primary hover:text-highlight"
        >
          <Icon name="close" size={18} />
          <span className="sr-only">Fechar</span>
        </button>
      }
    />
  )
}

function Message({ title, text }: { title: string; text: string }) {
  return (
    <section className="flex w-full max-w-[578px] flex-col items-center gap-4 bg-surface px-6 py-12 text-center">
      <h1 className="text-lg leading-6 font-bold">{title}</h1>
      <p className="text-sm leading-[22px] text-text-2">{text}</p>
      <Link to="/" className={primaryAction}>
        Voltar ao catálogo
      </Link>
    </section>
  )
}

export function OrderPage({ orderId }: { orderId: string }) {
  usePageTitle('Pedido')
  const { data, isPending, isError, error, refetch } = useOrder(orderId)

  let content
  if (isPending) {
    content = <Skeleton aria-label="Carregando pedido" className="h-[640px] w-full max-w-[578px]" />
  } else if (isError && isApiError(error, 'FORBIDDEN')) {
    content = (
      <Message
        title="Você não tem acesso a este pedido"
        text="Este pedido pertence a outra conta. Entre com a conta que fez a compra para ver os detalhes."
      />
    )
  } else if (isError && isApiError(error, 'NOT_FOUND')) {
    content = <Message title="Pedido não encontrado" text="Confira o link ou volte ao catálogo." />
  } else if (isError) {
    content = (
      <ErrorState
        title="Não foi possível carregar o pedido"
        error={error}
        onRetry={() => void refetch()}
      />
    )
  } else {
    content = <OrderStatusCard order={data} />
  }

  // Frame: o cartão centralizado sobre o fundo escuro, 166px abaixo do topo.
  return <div className="flex justify-center md:pt-[65px]">{content}</div>
}
