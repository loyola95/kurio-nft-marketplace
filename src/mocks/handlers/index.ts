import { realtimeHandlers } from '../realtime/server'
import { authControlHandlers, authHandlers } from './auth'
import { controlHandlers } from './control'
import { eventControlHandlers } from './control-events'
import { nftHandlers } from './nfts'

export const handlers = [
  ...controlHandlers,
  ...authControlHandlers,
  ...eventControlHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...realtimeHandlers,
]
