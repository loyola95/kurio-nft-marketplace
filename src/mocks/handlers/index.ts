import { realtimeHandlers } from '../realtime/server'
import { authControlHandlers, authHandlers } from './auth'
import { cartHandlers } from './cart'
import { checkoutControlHandlers, checkoutHandlers } from './checkout'
import { controlHandlers } from './control'
import { eventControlHandlers } from './control-events'
import { favoriteHandlers } from './favorites'
import { nftHandlers } from './nfts'
import { profileHandlers } from './profile'

export const handlers = [
  ...controlHandlers,
  ...authControlHandlers,
  ...eventControlHandlers,
  ...checkoutControlHandlers,
  ...authHandlers,
  ...nftHandlers,
  ...favoriteHandlers,
  ...cartHandlers,
  ...profileHandlers,
  ...checkoutHandlers,
  ...realtimeHandlers,
]
