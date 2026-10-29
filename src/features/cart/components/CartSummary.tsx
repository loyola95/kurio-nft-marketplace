import { Link, useNavigate } from '@tanstack/react-router'
import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { isApiError } from '@/api/errors'
import type { Cart } from '@/contracts/cart'
import { formatEth } from '@/lib/money'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { useApplyCoupon, useRemoveCoupon } from '../queries'

export function CouponForm({ cart }: { cart: Cart }) {
  const apply = useApplyCoupon()
  const remove = useRemoveCoupon()
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const inputId = useId()
  const errorId = `${inputId}-erro`

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!code.trim()) {
      setError('Informe o código promocional.')
      return
    }
    setError(null)
    apply.mutate(code, {
      onSuccess: () => setCode(''),
      onError: (e) =>
        setError(
          isApiError(e)
            ? (e.fieldErrors?.code ?? e.message)
            : 'Não foi possível aplicar o código agora.',
        ),
    })
  }

  if (cart.coupon) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-sm leading-4 font-bold max-lg:sr-only">Código promocional</p>
        <div className="flex items-center justify-between gap-3 rounded-[40px] border border-primary/60 px-4 py-2 text-sm lg:rounded-[3px]">
          <p>
            <span className="font-bold text-highlight">{cart.coupon.code}</span>
            <span className="text-text-2"> · {cart.coupon.label}</span>
          </p>
          <button
            type="button"
            onClick={() => remove.mutate()}
            disabled={remove.isPending}
            aria-label={`Remover cupom ${cart.coupon.code}`}
            className="text-sm text-highlight hover:underline disabled:opacity-50"
          >
            Remover
          </button>
        </div>
      </div>
    )
  }

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-2">
      <label htmlFor={inputId} className="text-sm leading-4 font-bold max-lg:sr-only">
        Código promocional
      </label>
      <div
        className={cn(
          'flex h-[50px] overflow-hidden rounded-[40px] border lg:h-10 lg:rounded-[3px]',
          error ? 'border-danger' : 'border-border lg:border-primary',
        )}
      >
        <input
          id={inputId}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Digite o código promocional..."
          autoComplete="off"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="min-w-0 flex-1 bg-transparent px-4 text-[13px] leading-[22px] outline-none placeholder:text-text-3 focus-visible:bg-surface-2 lg:px-2 lg:text-xs lg:leading-4"
        />
        <button
          type="submit"
          disabled={apply.isPending}
          className="w-[97px] shrink-0 rounded-[40px] bg-[linear-gradient(108deg,rgb(210_138_76/0.54),var(--kurio-primary))] text-[15px] leading-4 font-bold text-foreground disabled:opacity-60 lg:w-[102px] lg:rounded-none lg:bg-primary lg:bg-none lg:text-primary-foreground"
        >
          {apply.isPending ? '…' : 'Aplicar'}
        </button>
      </div>
      {error && (
        <p id={errorId} className="text-xs leading-4 text-danger">
          {error}
        </p>
      )}
    </form>
  )
}

/** Linha do resumo; o dd leva data-label para os testes acharem o valor da linha. */
function Row({
  label,
  value,
  className,
  valueClassName,
  children,
}: {
  label: string
  value: string
  className?: string
  valueClassName?: string
  children?: ReactNode
}) {
  return (
    <div className={cn('flex flex-wrap items-baseline justify-between gap-x-3', className)}>
      <dt>{label}</dt>
      <dd data-label={label} className={cn('text-right', valueClassName)}>
        {value}
        {children}
      </dd>
    </div>
  )
}

/** "Resumo da carteira": totais vêm prontos da API; aqui só se formata. */
export function CartSummary({ cart }: { cart: Cart }) {
  const navigate = useNavigate()
  const { summary } = cart
  const hasItems = cart.items.some((i) => i.status !== 'sold_out')

  return (
    <section
      aria-labelledby="resumo-titulo"
      className="-mx-6 mt-1 flex flex-col gap-3 rounded-t-[40px] bg-surface px-6 pt-6 pb-9 lg:mx-0 lg:mt-0 lg:gap-6 lg:rounded-none lg:bg-transparent lg:p-0"
    >
      <div className="flex flex-col gap-3 max-lg:sr-only">
        <h2 id="resumo-titulo" className="text-lg leading-4 font-bold">
          Resumo da carteira
        </h2>
        <hr className="border-primary/30" />
      </div>

      <CouponForm cart={cart} />

      <dl className="flex flex-col gap-3 text-[15px] leading-5">
        <Row
          label="Subtotal"
          value={formatEth(summary.subtotalEth)}
          valueClassName="text-base leading-4 lg:text-lg"
        />
        <Row label="Desconto do lançamento" value={`(-) ${formatEth(summary.discountEth)}`} />
        <Row
          label="Taxa de rede"
          value={formatEth(summary.networkFeeEth)}
          valueClassName="text-base leading-4 lg:text-lg"
        >
          <span className="block text-xs leading-4 text-highlight lg:mt-3">Taxa estimada</span>
        </Row>
        <Row
          label="Total"
          value={formatEth(summary.totalEth)}
          className="mt-0 text-base leading-4 font-bold lg:mt-3"
          valueClassName="text-lg leading-4 text-highlight"
        />
      </dl>

      <div className="mt-5 flex flex-col gap-3 lg:mt-0">
        <button
          type="button"
          disabled={!hasItems}
          onClick={() => void navigate({ to: '/pagamento' })}
          className="h-[60px] rounded-[40px] bg-[linear-gradient(108deg,var(--kurio-primary),rgb(210_138_76/0.8))] text-base leading-4 font-bold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 lg:h-10 lg:rounded-[3px] lg:bg-primary lg:bg-none lg:text-[15px]"
        >
          Conectar e finalizar
        </button>
        <Link
          to="/"
          hash="catalogo"
          className="hidden text-center text-[15px] leading-5 text-highlight hover:underline lg:block"
        >
          Continuar explorando
        </Link>
      </div>
    </section>
  )
}

/**
 * Esqueleto do resumo com as mesmas caixas do resumo final (medidas no DOM):
 * desktop 332x387 (cabeçalho, cupom 64, linhas 150, botões 72) e mobile com a
 * folha arredondada (cupom 50, linhas 127, botão 60).
 */
export function CartSummarySkeleton() {
  return (
    <section
      aria-label="Carregando resumo"
      aria-busy="true"
      className="-mx-6 mt-1 flex flex-col gap-3 rounded-t-[40px] bg-surface px-6 pt-6 pb-9 lg:mx-0 lg:mt-0 lg:gap-6 lg:rounded-none lg:bg-transparent lg:p-0"
    >
      <div className="flex h-[29px] flex-col gap-3 max-lg:hidden">
        <Skeleton className="h-4 w-[180px]" />
        <hr className="border-primary/30" />
      </div>
      <div className="flex h-[50px] flex-col justify-end gap-2 lg:h-16">
        <Skeleton className="h-4 w-[150px] max-lg:hidden" />
        <Skeleton className="h-full rounded-[40px] lg:h-10 lg:rounded-[3px]" />
      </div>
      <div className="flex h-[127px] flex-col justify-between lg:h-[150px]">
        {Array.from({ length: 4 }, (_, i) => (
          <Skeleton key={i} className="h-5 w-full" />
        ))}
      </div>
      <div className="mt-5 flex h-[60px] flex-col gap-3 lg:mt-0 lg:h-[72px]">
        <Skeleton className="h-[60px] rounded-[40px] lg:h-10 lg:rounded-[3px]" />
        <Skeleton className="mx-auto h-5 w-[170px] max-lg:hidden" />
      </div>
    </section>
  )
}
