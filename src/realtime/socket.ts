import { io, type Socket } from 'socket.io-client'

const REALTIME_URL = import.meta.env.VITE_REALTIME_URL ?? 'wss://realtime.kurio.mock'

/**
 * Um socket por sessão. Só WebSocket (sem long polling). O token segue na
 * query da conexão; visitante conecta sem token e recebe apenas eventos públicos.
 */
export function createSocket(token: string | null): Socket {
  return io(REALTIME_URL, {
    transports: ['websocket'],
    query: token ? { token } : {},
    reconnectionDelay: 500,
    reconnectionDelayMax: 4000,
  })
}
