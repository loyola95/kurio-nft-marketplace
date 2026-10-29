import { http, HttpResponse } from 'msw'
import { ScenarioName } from '@/contracts/mock'
import { db } from '../db/store'
import { API_BASE } from '../lib/http'
import { scenario } from '../scenarios'

type StatsProvider = () => Record<string, unknown>
const statsProviders: StatsProvider[] = []

/** Outros módulos do mock (tempo real, pedidos) contribuem para /__mock/state. */
export function registerMockStats(provider: StatsProvider) {
  statsProviders.push(provider)
}

// Endpoints de controle da simulação. Não passam pelas condições de rede do cenário.
export const controlHandlers = [
  http.get(`${API_BASE}/__mock/state`, () => {
    const s = db.get()
    return HttpResponse.json({
      scenario: s.scenario,
      sessions: s.sessions.length,
      orders: Object.values(s.orders).map((o) => ({
        id: o.id,
        userId: o.userId,
        status: o.status,
      })),
      carts: Object.keys(s.carts).length,
      ...Object.assign({}, ...statsProviders.map((p) => p())),
    })
  }),

  http.post(`${API_BASE}/__mock/reset`, () => {
    db.reset()
    scenario.set('padrao')
    return HttpResponse.json({ ok: true, scenario: 'padrao' })
  }),

  http.post(`${API_BASE}/__mock/scenario`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { name?: unknown }
    const parsed = ScenarioName.safeParse(body.name)
    if (!parsed.success) {
      return HttpResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Cenário desconhecido.' } },
        { status: 422 },
      )
    }
    scenario.set(parsed.data)
    return HttpResponse.json({ ok: true, scenario: parsed.data })
  }),
]
