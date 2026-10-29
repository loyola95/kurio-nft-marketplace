import { ws } from 'msw'
import { toSocketIo } from '@mswjs/socket.io-binding'
import type { RealtimeEvent } from '@/contracts/events'
import { db } from '../db/store'
import { scenario } from '../scenarios'

// Transporte: socket.io-client → WebSocket interceptado pelo MSW (ws.link) com o
// protocolo Socket.IO do @mswjs/socket.io-binding. O MSW remove "/socket.io/" do
// caminho antes de comparar, por isso o link aponta só para o host.
const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? 'wss://realtime.kurio.mock'
const HEARTBEAT_MS = 10_000

interface Connection {
  id: number
  userId: string | null
  socket: ReturnType<typeof toSocketIo>
  close: () => void
}

const connections = new Map<number, Connection>()
let nextConnectionId = 1

/** O token vai na query da conexão (o binding não repassa o pacote de auth do Socket.IO). */
function userFromToken(token: string | null): string | null {
  if (!token) return null
  const session = db.get().sessions.find((s) => s.token === token)
  if (!session || Date.parse(session.expiresAt) <= Date.now()) return null
  return session.userId
}

export const realtime = ws.link(REALTIME_URL)

export const realtimeHandlers = [
  realtime.addEventListener('connection', (connection) => {
    const url = new URL(connection.client.url)
    const id = nextConnectionId++
    const socket = toSocketIo(connection)
    // O binding anuncia pingInterval, mas não envia ping: sem isso o cliente
    // derruba a conexão por "ping timeout" a cada ~30 s.
    const heartbeat = window.setInterval(() => connection.client.send('2'), HEARTBEAT_MS)
    connections.set(id, {
      id,
      userId: userFromToken(url.searchParams.get('token')),
      socket,
      close: () => connection.client.close(),
    })
    connection.client.addEventListener('close', () => {
      window.clearInterval(heartbeat)
      connections.delete(id)
    })
  }),
]

/** Envia o evento só para quem pode recebê-lo: order.updated vai apenas para o dono. */
export function publish(event: RealtimeEvent) {
  db.update((s) => {
    s.lastEvent = event
    s.lastEvents[event.type] = event
  })
  deliver(event)
}

export function deliver(event: RealtimeEvent) {
  for (const conn of connections.values()) {
    if (event.type === 'order.updated' && conn.userId !== event.userId) continue
    conn.socket.client.emit(event.type, event)
  }
}

export function dropAllConnections() {
  for (const conn of [...connections.values()]) conn.close()
}

export function realtimeStats() {
  const list = [...connections.values()]
  return {
    realtimeConnections: list.length,
    realtimeUsers: list.map((c) => c.userId),
  }
}

// Cenário "tempo-real-instavel": derruba as conexões periodicamente.
let flakyTimer: number | undefined
function syncFlaky() {
  window.clearInterval(flakyTimer)
  const every = scenario.behavior.realtimeDropEveryMs
  if (every) flakyTimer = window.setInterval(dropAllConnections, every)
}
syncFlaky()
scenario.onChange(syncFlaky)
