import { http, HttpResponse } from 'msw'
import type { RealtimeEvent } from '@/contracts/events'
import { db } from '../db/store'
import { defaultEdition, findNft } from '../domain/catalog'
import { API_BASE } from '../lib/http'
import { publishNftUpdated } from '../realtime/events'
import { deliver, dropAllConnections, realtimeStats } from '../realtime/server'
import { registerMockStats } from './control'

registerMockStats(realtimeStats)

const notFound = () =>
  HttpResponse.json(
    { error: { code: 'NOT_FOUND', message: 'NFT não encontrado.' } },
    { status: 404 },
  )

// Disparo de eventos para demonstração e testes. A mudança acontece no banco
// simulado (REST passa a devolver o novo valor) e sai pelo canal Socket.IO.
export const eventControlHandlers = [
  http.post(`${API_BASE}/__mock/events/nft-updated`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as {
      nftId?: string
      editionId?: string
      priceEth?: string
      available?: number
    }
    const ok = db.update((s) => {
      const nft = body.nftId ? findNft(s, body.nftId) : undefined
      if (!nft) return false
      const edition = nft.editions.find((e) => e.id === body.editionId) ?? defaultEdition(nft)
      if (body.priceEth) edition.priceEth = body.priceEth
      if (typeof body.available === 'number') {
        edition.available = Math.max(0, body.available)
        if (edition.status !== 'unavailable') {
          edition.status = edition.available === 0 ? 'sold_out' : 'available'
        }
      }
      return true
    })
    if (!ok) return notFound()
    return HttpResponse.json({ event: publishNftUpdated(body.nftId!) })
  }),

  // Reenvia o último evento com o mesmo id (o cliente deve ignorar).
  http.post(`${API_BASE}/__mock/events/duplicate-last`, () => {
    const last = db.get().lastEvent as RealtimeEvent | null
    if (last) deliver(last)
    return HttpResponse.json({ event: last })
  }),

  // Envia um evento novo com versão antiga e dados velhos (o cliente não deve regredir).
  // Corpo opcional { type }: escolhe o último evento daquele tipo (ex.: order.updated).
  http.post(`${API_BASE}/__mock/events/stale`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { type?: string }
    const state = db.get()
    const last = (body.type ? state.lastEvents[body.type] : state.lastEvent) as RealtimeEvent | null
    if (!last) return HttpResponse.json({ event: null })
    const stale = { ...last, id: crypto.randomUUID(), version: last.version - 1 } as RealtimeEvent
    if (stale.type === 'nft.updated') {
      stale.data = {
        ...stale.data,
        priceEth: '0.01',
        editions: stale.data.editions.map((e) => ({ ...e, priceEth: '0.01' })),
      }
    } else {
      stale.data = { ...stale.data, status: 'pending' }
    }
    deliver(stale)
    return HttpResponse.json({ event: stale })
  }),

  http.post(`${API_BASE}/__mock/realtime/drop`, () => {
    dropAllConnections()
    return HttpResponse.json({ ok: true })
  }),
]
