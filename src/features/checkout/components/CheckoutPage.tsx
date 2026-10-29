import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useCanGoBack, useRouter } from '@tanstack/react-router'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import { Skeleton } from '@/components/ui/skeleton'
import type { Cart } from '@/contracts/cart'
import { NETWORK_LABEL } from '@/contracts/common'
import { CollectorForm } from '@/contracts/order'
import type { Profile } from '@/contracts/profile'
import type { Quote } from '@/contracts/quote'
import type { Wallet, WalletConnection, Wallets } from '@/contracts/wallet'
import { useSession } from '@/features/auth/session'
import { useCart } from '@/features/cart/queries'
import { ErrorState } from '@/features/catalog/components/States'
import { usePendingOrders } from '@/features/orders/queries'
import { useProfile, useWallets } from '@/features/profile/queries'
import { drafts } from '@/lib/drafts'
import { formatEth } from '@/lib/money'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { usePageTitle } from '@/lib/usePageTitle'
import {
  cartSignature,
  collectorDefaults,
  initialWallet,
  networkOptions,
  networksWithoutWallet,
  walletFields,
  walletsList,
} from '../model'
import { CHECKOUT_DRAFT, useCheckout, useNow } from '../useCheckout'
import { CheckoutItems } from './CheckoutItems'
import { CollectorFields } from './CollectorFields'
import { ConnectorList } from './ConnectorList'
import { ReviewDialog } from './ReviewDialog'
import { WalletCards } from './WalletCards'

type MobileStep = 'form' | 'wallet'

/** Leva o foco ao grupo de conectores (depois da troca de etapa no mobile). */
const focusConnectors = () =>
  window.setTimeout(() => document.querySelector<HTMLElement>('[data-connectors]')?.focus())

/** Rascunho do pagamento (sessionStorage, por usuário): volta igual depois de refresh ou novo login. */
interface CheckoutDraft {
  values: CollectorForm
  walletId: string | null
  connection: WalletConnection | null
  review: Quote | null
  step: MobileStep
}

const confirmClass =
  'h-[45px] w-full rounded-lg bg-primary text-[15px] leading-4 font-bold text-primary-foreground transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-60 max-md:h-[60px] max-md:rounded-[40px] max-md:bg-[linear-gradient(108deg,var(--kurio-primary),rgb(210_138_76/0.8))]'

function Notice({ children }: { children: ReactNode }) {
  return (
    <div
      role="status"
      className="rounded-md border border-primary/40 bg-primary/10 p-3 text-sm leading-5"
    >
      {children}
    </div>
  )
}

export function CheckoutPage() {
  usePageTitle('Pagamento')
  const { user } = useSession()
  const profile = useProfile()
  const wallets = useWallets()
  const cart = useCart()

  // "Carrinho vazio" só vale na entrada: se a compra esvaziar o carrinho enquanto a
  // revisão está aberta (ex.: timeout com o pedido já confirmado), a tela continua.
  const buyable = Boolean(cart.data?.items.some((i) => i.status !== 'sold_out'))
  const [started, setStarted] = useState(false)
  if (buyable && !started) setStarted(true)

  if (!user || profile.isPending || wallets.isPending || cart.isPending) {
    return <CheckoutSkeleton />
  }
  const failed = [profile, wallets, cart].find((q) => q.isError)
  if (failed || !profile.data || !wallets.data || !cart.data) {
    return (
      <ErrorState
        title="Não foi possível carregar o pagamento"
        error={failed?.error}
        onRetry={() => {
          void profile.refetch()
          void wallets.refetch()
          void cart.refetch()
        }}
      />
    )
  }
  if (!buyable && !started) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-xl leading-6 font-bold">Pagamento</h1>
        <div className="flex flex-col items-start gap-4 rounded-lg bg-surface p-8">
          <h2 className="text-lg font-bold">Seu carrinho está vazio</h2>
          <p className="text-sm text-text-2">
            Adicione NFTs ao carrinho para finalizar uma compra.
          </p>
          <Link to="/" hash="catalogo" className="font-bold text-highlight hover:underline">
            Explorar o catálogo
          </Link>
        </div>
      </div>
    )
  }
  return (
    <CheckoutForm
      key={user.id}
      userId={user.id}
      profile={profile.data}
      wallets={wallets.data}
      cart={cart.data}
    />
  )
}

function CheckoutForm({
  userId,
  profile,
  wallets,
  cart,
}: {
  userId: string
  profile: Profile
  wallets: Wallets
  cart: Cart
}) {
  const desktop = useMediaQuery('(min-width: 768px)')
  const router = useRouter()
  const canGoBack = useCanGoBack()
  const [draft] = useState(() => drafts.load<CheckoutDraft>(userId, CHECKOUT_DRAFT))
  const options = networkOptions(cart, wallets)
  const list = walletsList(wallets)

  const [walletId, setWalletId] = useState(
    () => initialWallet(cart, wallets, draft?.walletId ?? null)?.id ?? null,
  )
  const wallet = list.find((w) => w.id === walletId) ?? null
  const network = wallet?.network ?? null
  const [connection, setConnection] = useState<WalletConnection | null>(() =>
    draft?.connection && draft.connection.walletId === walletId ? draft.connection : null,
  )
  const [review, setReview] = useState<Quote | null>(() =>
    draft?.review && draft.review.network === network ? draft.review : null,
  )
  // Ao voltar (refresh ou novo login) o mobile reabre no formulário, para a pessoa conferir os dados.
  const [step, setStep] = useState<MobileStep>('form')
  const [blocked, setBlocked] = useState<string | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)

  const form = useForm<CollectorForm>({
    resolver: zodResolver(CollectorForm),
    mode: 'onTouched',
    defaultValues: draft?.values
      ? { ...draft.values, ...walletFields(wallet) }
      : collectorDefaults(profile, wallet),
  })

  const checkout = useCheckout({
    userId,
    walletId,
    network,
    signature: cartSignature(cart, network),
    connection,
    setConnection,
    review,
    setReview,
    onBlocked: (reason, message) => {
      if (reason === 'disconnected') {
        checkout.setConnectError(message)
        setStep('wallet')
        focusConnectors()
      } else {
        setBlocked(message)
      }
    },
  })
  const now = useNow()
  const pending = usePendingOrders()

  // Rascunho: salva a cada mudança (300 ms) para restaurar depois de refresh ou novo login.
  const saveDraft = useCallback(() => {
    drafts.save<CheckoutDraft>(userId, CHECKOUT_DRAFT, {
      values: form.getValues(),
      walletId,
      connection,
      review,
      step,
    })
  }, [connection, form, review, step, userId, walletId])
  useEffect(() => {
    let timer: number | undefined
    const schedule = () => {
      window.clearTimeout(timer)
      timer = window.setTimeout(saveDraft, 300)
    }
    schedule()
    const unsubscribe = form.subscribe({ formState: { values: true }, callback: schedule })
    return () => {
      unsubscribe()
      window.clearTimeout(timer)
    }
  }, [form, saveDraft])

  const selectWallet = (next: Wallet | null) => {
    if (!next || next.id === walletId) return
    checkout.disconnect()
    setWalletId(next.id)
    setReview(null)
    for (const [key, value] of Object.entries(walletFields(next))) {
      form.setValue(key as keyof CollectorForm, value as never, { shouldDirty: true })
    }
  }

  /** "Confirmar compra" na página: valida, exige carteira conectada e gera a cotação da revisão. */
  const openReview = form.handleSubmit(
    async () => {
      saveDraft()
      setBlocked(null)
      setQuoteError(null)
      if (!connection) {
        checkout.setConnectError('Conecte a carteira para continuar.')
        focusConnectors()
        return
      }
      try {
        checkout.clearProblem()
        setReview(await checkout.newQuote())
      } catch (error) {
        if (isApiError(error, 'SESSION_EXPIRED') || isApiError(error, 'UNAUTHENTICATED')) return
        setQuoteError(isApiError(error) ? error.message : 'Não foi possível gerar a cotação.')
      }
    },
    () => setStep('form'),
  )

  const goBack = () => {
    if (!desktop && step === 'wallet') setStep('form')
    else if (canGoBack) router.history.back()
    else void router.navigate({ to: '/carrinho' })
  }

  const missing = networksWithoutWallet(cart, wallets)
  const pendingOrder = pending.data?.[0]
  const quote = checkout.quote.data

  const notices = (
    <>
      {draft && <Notice>Restauramos os dados do pagamento.</Notice>}
      {pendingOrder && (
        <Notice>
          Você tem um pedido em andamento.{' '}
          <Link
            to="/pedidos/$orderId"
            params={{ orderId: pendingOrder.id }}
            className="font-bold text-highlight hover:underline"
          >
            Acompanhar pedido
          </Link>
        </Notice>
      )}
      {missing.length > 0 && (
        <Notice>
          Os itens da rede {missing.map((n) => NETWORK_LABEL[n]).join(' e ')} precisam de uma
          carteira dessa rede.{' '}
          <Link to="/perfil/carteiras" className="font-bold text-highlight hover:underline">
            Cadastrar carteira
          </Link>
        </Notice>
      )}
      {blocked && (
        <div
          role="alert"
          className="rounded-md border border-danger/60 bg-danger/10 p-3 text-sm leading-5"
        >
          {blocked}{' '}
          <Link to="/carrinho" className="font-bold text-highlight hover:underline">
            Revisar carrinho
          </Link>
        </div>
      )}
    </>
  )

  const fields = (
    <CollectorFields
      form={form}
      wallet={wallet}
      wallets={wallets}
      cart={cart}
      options={options}
      onSelectWallet={selectWallet}
      withWalletFields={desktop}
    />
  )

  const connectors = (
    <div>
      <ConnectorList
        variant={desktop ? 'desktop' : 'mobile'}
        network={network}
        connection={connection}
        connecting={checkout.connecting}
        error={checkout.connectError}
        onConnect={checkout.connect}
        onDisconnect={checkout.disconnect}
      />
    </div>
  )

  const confirmButton = (
    <button
      type="button"
      onClick={() => void openReview()}
      disabled={!wallet || checkout.quote.isFetching}
      className={confirmClass}
    >
      Confirmar compra
    </button>
  )

  const quoteProblem = (quoteError || checkout.quote.error) && (
    <p role="alert" className="text-sm leading-5 text-danger">
      {quoteError ??
        (isApiError(checkout.quote.error)
          ? checkout.quote.error.message
          : 'Não foi possível gerar a cotação.')}{' '}
      <Link to="/carrinho" className="font-bold text-highlight hover:underline">
        Revisar carrinho
      </Link>
    </p>
  )

  const reviewDialog = review && wallet && (
    <ReviewDialog
      quote={review}
      wallet={wallet}
      connection={connection}
      now={now}
      changed={checkout.reviewChanged}
      problem={checkout.problem}
      submitting={checkout.submitting}
      onConfirm={() => void checkout.submit(CollectorForm.parse(form.getValues()))}
      onRefresh={() => void checkout.refreshReview()}
      onClose={() => {
        setReview(null)
        checkout.clearProblem()
      }}
    />
  )

  if (!desktop) {
    return (
      <div className="flex min-h-[calc(100dvh-24px)] flex-col gap-4 px-1 pt-2 pb-8">
        <div className="relative flex h-11 items-center gap-6">
          <button
            type="button"
            onClick={goBack}
            className="grid size-[35px] shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-text-2"
          >
            <Icon name="arrow-left" size={20} />
            <span className="sr-only">Voltar</span>
          </button>
          <h1 className="text-xl leading-4 font-bold">Pagamento com carteira</h1>
        </div>
        {notices}
        {step === 'form' ? (
          <form
            noValidate
            aria-labelledby="perfil-colecionador"
            onSubmit={form.handleSubmit(() => setStep('wallet'))}
            className="flex flex-1 flex-col gap-4"
          >
            <h2 id="perfil-colecionador" className="text-base leading-4 font-bold">
              Perfil do colecionador
            </h2>
            {fields}
            <button type="submit" className={`${confirmClass} mt-auto`}>
              Continuar
            </button>
          </form>
        ) : (
          <div className="flex flex-1 flex-col gap-4">
            <WalletCards
              wallets={list}
              options={options}
              selectedId={walletId}
              onSelect={selectWallet}
            />
            {connectors}
            {quoteProblem}
            <p className="flex items-baseline justify-end gap-7 text-base leading-4 font-bold">
              Total:
              <span className="text-lg leading-4 text-highlight">
                {quote ? formatEth(quote.summary.totalEth) : '…'}
              </span>
            </p>
            <div className="mt-auto">{confirmButton}</div>
          </div>
        )}
        {reviewDialog}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <nav aria-label="Trilha de navegação">
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
          <li aria-current="page">Pagamento</li>
        </ol>
      </nav>
      <h1 className="sr-only">Pagamento</h1>
      {notices}
      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[763px_405px] xl:justify-between">
        <form
          noValidate
          aria-labelledby="perfil-colecionador"
          onSubmit={(e) => {
            e.preventDefault()
            void openReview()
          }}
          className="flex flex-col gap-3"
        >
          <h2 id="perfil-colecionador" className="text-[17px] leading-4 font-bold">
            Perfil do colecionador
          </h2>
          {fields}
        </form>
        <div className="flex flex-col gap-3">
          <CheckoutItems quote={quote} cart={cart} />
          {connectors}
          {quoteProblem}
          <div className="mt-3">{confirmButton}</div>
        </div>
      </div>
      {reviewDialog}
    </div>
  )
}

function CheckoutSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando pagamento" className="flex flex-col gap-8">
      <Skeleton className="h-4 w-64" />
      <div className="flex flex-col gap-8 xl:grid xl:grid-cols-[763px_405px] xl:justify-between">
        <div className="grid gap-x-6 gap-y-3 md:grid-cols-2">
          {Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} className="h-[69px]" />
          ))}
        </div>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-[70px]" />
          <Skeleton className="h-[70px]" />
          <Skeleton className="h-[180px]" />
        </div>
      </div>
    </div>
  )
}
