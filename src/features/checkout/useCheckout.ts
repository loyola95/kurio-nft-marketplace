import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useRef, useState } from 'react'
import { connectWallet, createOrder, createQuote, disconnectWallet } from '@/api/endpoints/checkout'
import { isApiError, isRetryable } from '@/api/errors'
import type { Network } from '@/contracts/common'
import type { CollectorForm, CreateOrderInput, Order } from '@/contracts/order'
import { Quote } from '@/contracts/quote'
import type { WalletConnection, WalletType } from '@/contracts/wallet'
import { cartKeys } from '@/features/cart/queries'
import { announce } from '@/features/layout/announce'
import { orderKeys } from '@/features/orders/keys'
import { drafts } from '@/lib/drafts'
import { idempotency } from '@/lib/idempotency'
import { sameTerms } from './model'

export const CHECKOUT_DRAFT = 'checkout'

export const quoteKey = (userId: string, network: Network | null, signature: string) =>
  ['user', userId, 'quote', network, signature] as const

/** Hora atual que avança a cada segundo (expiração da cotação na revisão). */
export function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

export type SendProblem =
  { kind: 'stale' } | { kind: 'unconfirmed' } | { kind: 'error'; message: string } | null

interface Params {
  userId: string
  walletId: string | null
  network: Network | null
  signature: string
  connection: WalletConnection | null
  setConnection: (c: WalletConnection | null) => void
  review: Quote | null
  setReview: (q: Quote | null) => void
  /** O pedido não pode seguir: volta ao passo de conexão ou ao carrinho. */
  onBlocked: (reason: 'disconnected' | 'availability', message: string) => void
}

/**
 * Regras do pagamento: conexão simulada na API, cotação da rede escolhida,
 * revisão e envio com chave de idempotência (clique repetido, timeout e
 * refresh reaproveitam a mesma chave e recuperam o mesmo pedido).
 */
export function useCheckout(p: Params) {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const [connectError, setConnectError] = useState<string | null>(null)
  const [connecting, setConnecting] = useState<WalletType | null>(null)
  const [problem, setProblem] = useState<SendProblem>(null)
  const inFlight = useRef(false)

  const quote = useQuery({
    queryKey: quoteKey(p.userId, p.network, p.signature),
    queryFn: () => createQuote(p.network!),
    enabled: Boolean(p.userId && p.network && p.signature),
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  const connect = useMutation({
    mutationFn: (connector: WalletType) =>
      connectWallet({ walletId: p.walletId!, connector, network: p.network! }),
    onMutate: (connector) => {
      setConnecting(connector)
      setConnectError(null)
    },
    onSuccess: (connection) => {
      p.setConnection(connection)
      announce('Carteira conectada.')
    },
    onError: (error) => {
      p.setConnection(null)
      setConnectError(
        isApiError(error, 'WALLET_REJECTED')
          ? 'A conexão foi recusada na carteira.'
          : isApiError(error)
            ? error.message
            : 'Não foi possível conectar a carteira.',
      )
    },
    onSettled: () => setConnecting(null),
  })

  const disconnect = useCallback(() => {
    const current = p.connection
    p.setConnection(null)
    setConnectError(null)
    // A desconexão local vale mesmo se a API falhar; o servidor recusa pedido sem conexão ativa.
    if (current) void disconnectWallet(current.id).catch(() => undefined)
  }, [p])

  /** Abrir a revisão gera a cotação na API: é ela que vale para o pedido. */
  const newQuote = useCallback(async (): Promise<Quote> => {
    const { data, error } = await quote.refetch({ throwOnError: false })
    if (!data || error) throw error
    return data
  }, [quote])

  const order = useMutation({
    mutationFn: ({ body, key }: { body: CreateOrderInput; key: string }) => createOrder(body, key),
  })

  const finish = useCallback(
    async (created: Order) => {
      qc.setQueryData(orderKeys.detail(p.userId, created.id), created)
      void qc.invalidateQueries({ queryKey: orderKeys.pending(p.userId) })
      void qc.invalidateQueries({ queryKey: cartKeys.all })
      await navigate({ to: '/pedidos/$orderId', params: { orderId: created.id } })
      // Depois de sair da tela: nenhum salvamento atrasado recria o rascunho.
      idempotency.clear(p.userId)
      drafts.remove(p.userId, CHECKOUT_DRAFT)
    },
    [navigate, p.userId, qc],
  )

  const submit = useCallback(
    async (collector: CollectorForm) => {
      const accepted = p.review
      // Guarda contra clique repetido: só um envio por vez.
      if (inFlight.current || !accepted || !p.walletId || !p.network) return
      if (!p.connection) {
        p.onBlocked('disconnected', 'Conecte a carteira para continuar.')
        return
      }
      inFlight.current = true
      setProblem(null)
      const key = idempotency.forAttempt(p.userId, {
        quoteId: accepted.id,
        quoteVersion: accepted.version,
        walletId: p.walletId,
        network: p.network,
      })
      const body: CreateOrderInput = {
        quoteId: accepted.id,
        quoteVersion: accepted.version,
        walletId: p.walletId,
        network: p.network,
        connectionId: p.connection.id,
        collector,
      }
      try {
        await finish(await order.mutateAsync({ body, key }))
      } catch (error) {
        if (isApiError(error, 'QUOTE_STALE')) {
          // A API devolve a cotação nova: a pessoa revisa e confirma de novo (nova chave).
          const parsed = Quote.safeParse((error.details as { quote?: unknown })?.quote)
          if (parsed.success) p.setReview(parsed.data)
          setProblem({ kind: 'stale' })
          announce('Os valores mudaram. Revise e confirme de novo.')
        } else if (isApiError(error, 'WALLET_DISCONNECTED')) {
          p.setConnection(null)
          p.setReview(null)
          p.onBlocked('disconnected', 'A carteira foi desconectada. Conecte novamente.')
        } else if (isApiError(error, 'AVAILABILITY_CONFLICT')) {
          p.setReview(null)
          void qc.invalidateQueries({ queryKey: cartKeys.all })
          p.onBlocked('availability', error.message)
        } else if (isApiError(error, 'SESSION_EXPIRED') || isApiError(error, 'UNAUTHENTICATED')) {
          // O interceptor leva ao login; o rascunho e a chave continuam guardados.
        } else if (isRetryable(error)) {
          // Pode ter sido criado: reenviar com a mesma chave recupera o mesmo pedido.
          setProblem({ kind: 'unconfirmed' })
        } else {
          setProblem({
            kind: 'error',
            message: isApiError(error) ? error.message : 'Não foi possível enviar o pedido.',
          })
        }
      } finally {
        inFlight.current = false
      }
    },
    [finish, order, p, qc],
  )

  /** Nova cotação na revisão (venceu ou mudou). */
  const refreshReview = useCallback(async () => {
    setProblem(null)
    const { data } = await quote.refetch()
    if (data) p.setReview(data)
  }, [p, quote])

  const latest = quote.data
  const reviewChanged = Boolean(p.review && latest && !sameTerms(p.review, latest))
  // Com a revisão aberta, a nova cotação falhar por estoque também bloqueia o envio.
  const reviewUnavailable =
    p.review && isApiError(quote.error, 'AVAILABILITY_CONFLICT') ? quote.error.message : null

  return {
    quote,
    newQuote,
    connect: (connector: WalletType) => connect.mutate(connector),
    connecting,
    connectError,
    setConnectError,
    disconnect,
    submit,
    submitting: order.isPending,
    problem,
    clearProblem: () => setProblem(null),
    reviewChanged,
    reviewUnavailable,
    refreshReview,
  }
}
