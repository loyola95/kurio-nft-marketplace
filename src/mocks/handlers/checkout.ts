import { HttpResponse, delay, http } from 'msw'
import type { ErrorCode } from '@/contracts/errors'
import { CreateOrderInput } from '@/contracts/order'
import { CreateQuoteInput } from '@/contracts/quote'
import { ConnectWalletInput } from '@/contracts/wallet'
import { hashBody } from '@/lib/idempotency'
import { add } from '@/lib/money'
import type { MockOrder, MockQuote } from '../db/schema'
import { db, nextId } from '../db/store'
import { DomainError } from '../domain/cart'
import {
  assertConnectorSupports,
  createQuoteFor,
  placeOrder,
  resolveDueOrders,
  toOrder,
} from '../domain/orders'
import { toQuote } from '../domain/quote'
import { requireUser } from '../lib/auth'
import { API_BASE, MockHttpError, readBody, route } from '../lib/http'
import { publishNftUpdated, publishOrderUpdated } from '../realtime/events'
import { scenario } from '../scenarios'
import { finder } from './cart'
import { registerMockStats } from './control'

// Cotação, conexão de carteira e pedidos. Toda regra mora em domain/; aqui só
// banco, cenário, agendamento e tradução para HTTP.

const STATUS: Partial<Record<ErrorCode, number>> = {
  VALIDATION_ERROR: 422,
  NETWORK_MISMATCH: 422,
  AVAILABILITY_CONFLICT: 409,
  IDEMPOTENCY_CONFLICT: 409,
  WALLET_DISCONNECTED: 409,
}

function guard<T>(fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    if (error instanceof DomainError) {
      throw new MockHttpError(STATUS[error.code] ?? 400, error.code, error.message, {
        fieldErrors: error.fieldErrors,
        details: error.details,
      })
    }
    throw error
  }
}

// --- Agendador: pedidos guardam resolveAt, então sobrevivem a refresh. ---

const timers = new Map<string, number>()

const HOLD = 'orders-hold'

function settleDueOrders() {
  // Controle "segurar pedidos": testes e painel resolvem quando quiserem.
  if (db.get().scenarioEffects.includes(HOLD)) return
  const { orders, nftIds } = db.update((s) => resolveDueOrders(s, Date.now(), finder(s)))
  for (const order of orders) {
    window.clearTimeout(timers.get(order.id))
    timers.delete(order.id)
    publishOrderUpdated(order)
  }
  // Venda confirmada: o estoque definitivo sai pelo tempo real.
  for (const nftId of nftIds) publishNftUpdated(nftId)
}

function schedule(order: MockOrder) {
  window.clearTimeout(timers.get(order.id))
  const wait = Math.max(0, Date.parse(order.resolveAt) - Date.now())
  timers.set(order.id, window.setTimeout(settleDueOrders, wait))
}

// No boot do mock: resolve o que venceu enquanto a página estava fechada e reagenda o resto.
settleDueOrders()
for (const order of Object.values(db.get().orders)) {
  if (order.status === 'pending') schedule(order)
}

registerMockStats(() => ({
  quotes: Object.keys(db.get().quotes).length,
  walletConnections: Object.keys(db.get().connections).length,
}))

// --- Cenários "preço alterado" e "esgotado" no checkout: acontecem uma vez,
// logo depois da cotação, como se outra pessoa comprasse ou o preço subisse. ---

const TWIST_DELAY_MS = 1200

function scheduleCheckoutTwist(quote: MockQuote) {
  const { priceChangeOnQuote, soldOutOnQuote } = scenario.behavior
  const effect = priceChangeOnQuote ? 'checkout-price' : soldOutOnQuote ? 'checkout-soldout' : null
  const line = quote.lines[0]
  if (!effect || !line || db.get().scenarioEffects.includes(effect)) return
  window.setTimeout(() => {
    const applied = db.update((s) => {
      if (s.scenarioEffects.includes(effect)) return false
      const found = finder(s)(line.nftId, line.editionId)
      if (!found) return false
      s.scenarioEffects.push(effect)
      if (effect === 'checkout-price') {
        found.edition.priceEth = add(found.edition.priceEth, '0.25')
      } else {
        found.edition.available = 0
        found.edition.status = 'sold_out'
      }
      return true
    })
    if (applied) publishNftUpdated(line.nftId)
  }, TWIST_DELAY_MS)
}

export const checkoutHandlers = [
  route('post', '/quotes', async ({ request }) => {
    const user = requireUser(request)
    const { network } = await readBody(request, CreateQuoteInput)
    const quote = guard(() =>
      db.update((s) =>
        createQuoteFor(s, {
          userId: user.id,
          network,
          now: Date.now(),
          find: finder(s),
          id: nextId(s, 'q'),
        }),
      ),
    )
    scheduleCheckoutTwist(quote)
    return HttpResponse.json(toQuote(quote), { status: 201 })
  }),

  route('post', '/wallet-connections', async ({ request }) => {
    const user = requireUser(request)
    const input = await readBody(request, ConnectWalletInput)
    if (scenario.behavior.walletRejects) {
      throw new MockHttpError(403, 'WALLET_REJECTED', 'A conexão foi recusada na carteira.')
    }
    const wallets = db.get().wallets[user.id]
    const wallet = [wallets?.primary, wallets?.secondary].find((w) => w?.id === input.walletId)
    if (!wallet) {
      throw new MockHttpError(422, 'VALIDATION_ERROR', 'Escolha uma carteira cadastrada.', {
        fieldErrors: { walletId: 'Escolha uma carteira cadastrada.' },
      })
    }
    if (wallet.network !== input.network) {
      throw new MockHttpError(422, 'NETWORK_MISMATCH', 'A carteira é de outra rede.')
    }
    guard(() => assertConnectorSupports(input.connector, input.network))
    const connection = db.update((s) => {
      // Uma conexão ativa por usuário: conectar de novo substitui a anterior.
      for (const c of Object.values(s.connections)) {
        if (c.userId === user.id) delete s.connections[c.id]
      }
      const created = {
        id: nextId(s, 'conn'),
        status: 'connected' as const,
        walletId: wallet.id,
        connector: input.connector,
        network: input.network,
        userId: user.id,
      }
      s.connections[created.id] = created
      return created
    })
    const { userId: _u, ...body } = connection
    return HttpResponse.json(body, { status: 201 })
  }),

  route<{ id: string }>('delete', '/wallet-connections/:id', ({ request, params }) => {
    const user = requireUser(request)
    db.update((s) => {
      if (s.connections[params.id]?.userId === user.id) delete s.connections[params.id]
    })
    return new HttpResponse(null, { status: 204 })
  }),

  route('post', '/orders', async ({ request }) => {
    const user = requireUser(request)
    const key = request.headers.get('Idempotency-Key')
    if (!key) {
      throw new MockHttpError(400, 'VALIDATION_ERROR', 'Envie o cabeçalho Idempotency-Key.')
    }
    const body = await readBody(request, CreateOrderInput)
    const bodyHash = await hashBody(body)
    const result = guard(() =>
      db.update((s) =>
        placeOrder(s, {
          userId: user.id,
          key,
          bodyHash,
          body,
          now: Date.now(),
          behavior: scenario.behavior,
          find: finder(s),
          newId: (prefix) => nextId(s, prefix),
        }),
      ),
    )
    if (result.kind === 'stale') {
      throw new MockHttpError(
        409,
        'QUOTE_STALE',
        'Preço, disponibilidade, cupom ou taxa mudaram. Revise e confirme de novo.',
        { details: { quote: result.quote } },
      )
    }
    if (result.kind === 'replayed') return HttpResponse.json(toOrder(result.order))
    schedule(result.order)
    // Cenário "timeout-pedido": o pedido já existe, mas a resposta chega depois do timeout.
    const wait = scenario.behavior.orderResponseDelayMs
    if (wait > 0) await delay(wait)
    return HttpResponse.json(toOrder(result.order), { status: 202 })
  }),

  route('get', '/orders', ({ request }) => {
    const user = requireUser(request)
    const status = new URL(request.url).searchParams.get('status')
    settleDueOrders()
    const orders = Object.values(db.get().orders)
      .filter((o) => o.userId === user.id && (!status || o.status === status))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(toOrder)
    return HttpResponse.json(orders)
  }),

  route<{ id: string }>('get', '/orders/:id', ({ request, params }) => {
    const user = requireUser(request)
    settleDueOrders()
    const order = db.get().orders[params.id]
    if (!order) throw new MockHttpError(404, 'NOT_FOUND', 'Pedido não encontrado.')
    if (order.userId !== user.id) {
      throw new MockHttpError(403, 'FORBIDDEN', 'Este pedido pertence a outra conta.')
    }
    return HttpResponse.json(toOrder(order))
  }),
]

// Controle: a carteira "cai" do lado da extensão (o próximo envio recebe WALLET_DISCONNECTED).
export const checkoutControlHandlers = [
  // { hold: true } segura a resolução dos pedidos; { hold: false } solta e resolve os vencidos.
  http.post(`${API_BASE}/__mock/orders/hold`, async ({ request }) => {
    const { hold } = (await request.json().catch(() => ({}))) as { hold?: boolean }
    db.update((s) => {
      s.scenarioEffects = s.scenarioEffects.filter((e) => e !== HOLD)
      if (hold) s.scenarioEffects.push(HOLD)
    })
    if (!hold) settleDueOrders()
    return HttpResponse.json({ ok: true, hold: Boolean(hold) })
  }),

  http.post(`${API_BASE}/__mock/wallet/disconnect`, () => {
    db.update((s) => {
      s.connections = {}
    })
    return HttpResponse.json({ ok: true })
  }),
]
