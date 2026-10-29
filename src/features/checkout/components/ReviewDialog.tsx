import { Link } from '@tanstack/react-router'
import type { ReactNode } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import { Icon } from '@/components/icon'
import { NETWORK_LABEL } from '@/contracts/common'
import type { Quote } from '@/contracts/quote'
import { WALLET_TYPE_LABEL, type WalletConnection, type Wallet } from '@/contracts/wallet'
import { OrderCard } from '@/features/orders/components/OrderCard'
import { primaryAction } from '@/features/orders/format'
import { formatEth } from '@/lib/money'
import { isExpired, shortAddress } from '../model'
import type { SendProblem } from '../useCheckout'

interface Props {
  quote: Quote
  wallet: Wallet
  connection: WalletConnection | null
  now: number
  /** A cotação atual da API cobra diferente da revisada (evento de preço/estoque, cupom). */
  changed: boolean
  /** Algum item deixou de ter estoque: a compra não pode seguir com estes itens. */
  unavailable: string | null
  problem: SendProblem
  submitting: boolean
  onConfirm: () => void
  onRefresh: () => void
  onClose: () => void
}

function Alert({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div
      role="alert"
      className="flex flex-col gap-2 rounded-md border border-primary/40 bg-primary/10 p-3 text-sm leading-5"
    >
      <div>{children}</div>
      {action}
    </div>
  )
}

/**
 * Revisão antes do envio (README: "permitir revisão antes do envio"). Cotação
 * vencida ou desatualizada bloqueia o envio até a pessoa gerar outra e confirmar de novo.
 */
export function ReviewDialog(props: Props) {
  const { quote, wallet, connection, now, changed, unavailable, problem, submitting } = props
  const expired = isExpired(quote, now)
  const blocked = expired || changed || Boolean(unavailable)
  const refresh = (
    <button
      type="button"
      onClick={props.onRefresh}
      className="self-start font-bold text-highlight hover:underline"
    >
      Atualizar cotação
    </button>
  )

  const alert = unavailable ? (
    <Alert
      action={
        <Link to="/carrinho" className="self-start font-bold text-highlight hover:underline">
          Revisar carrinho
        </Link>
      }
    >
      {unavailable}
    </Alert>
  ) : expired ? (
    <Alert action={refresh}>Esta cotação expirou. Gere uma nova para conferir os valores.</Alert>
  ) : changed ? (
    <Alert action={refresh}>
      Preço, disponibilidade ou cupom mudaram desde esta cotação. Atualize e confira antes de
      confirmar.
    </Alert>
  ) : problem?.kind === 'stale' ? (
    <Alert>Os valores mudaram. Esta é a cotação atualizada: revise e confirme de novo.</Alert>
  ) : problem?.kind === 'unconfirmed' ? (
    <Alert>
      <strong>Não conseguimos confirmar o envio.</strong> Seu pedido pode ter sido registrado. Tente
      novamente: usamos o mesmo identificador e nada é cobrado em dobro.
    </Alert>
  ) : problem?.kind === 'error' ? (
    <Alert>{problem.message}</Alert>
  ) : null

  const expiresAt = new Date(quote.expiresAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <Dialog open onOpenChange={(open) => !open && !submitting && props.onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-background/85"
        className="max-h-dvh w-full max-w-[578px] gap-0 overflow-y-auto bg-transparent p-0 ring-0 max-sm:h-dvh max-sm:max-w-none sm:max-w-[578px]"
      >
        <DialogTitle className="sr-only">Revise sua compra</DialogTitle>
        <DialogDescription className="sr-only">
          Confira itens, taxas, total, carteira e rede antes de confirmar.
        </DialogDescription>
        <OrderCard
          label="Revisão da compra"
          titleAs="h2"
          icon={
            <span className="grid size-20 place-items-center rounded-full border border-border bg-surface-2 text-highlight">
              <Icon name="wallet" size={40} />
            </span>
          }
          title="Revise sua compra"
          meta={[
            { label: 'Rede', strong: true, value: NETWORK_LABEL[quote.network] },
            { label: 'Endereço', value: shortAddress(wallet.address) },
            { label: 'Total', value: formatEth(quote.summary.totalEth) },
            {
              label: 'Carteira',
              strong: true,
              value: connection ? WALLET_TYPE_LABEL[connection.connector] : wallet.nickname,
            },
          ]}
          lines={quote.lines}
          summary={quote.summary}
          alert={alert}
          note={
            <p>
              O pedido vai para a rede {NETWORK_LABEL[quote.network]} com a carteira{' '}
              {wallet.nickname}. Valores garantidos até {expiresAt}.
            </p>
          }
          actions={
            <>
              <button
                type="button"
                onClick={props.onConfirm}
                disabled={blocked || submitting}
                aria-busy={submitting || undefined}
                className={primaryAction}
              >
                {problem?.kind === 'unconfirmed' && !submitting
                  ? 'Tentar novamente'
                  : submitting
                    ? 'Enviando…'
                    : 'Confirmar compra'}
              </button>
              <button
                type="button"
                onClick={props.onClose}
                disabled={submitting}
                className="text-sm leading-4 text-highlight hover:underline disabled:opacity-50"
              >
                Voltar e editar
              </button>
            </>
          }
          closeButton={
            <button
              type="button"
              onClick={props.onClose}
              disabled={submitting}
              className="grid size-6 place-items-center text-primary hover:text-highlight"
            >
              <Icon name="close" size={18} />
              <span className="sr-only">Fechar revisão</span>
            </button>
          }
        />
      </DialogContent>
    </Dialog>
  )
}
