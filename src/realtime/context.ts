import { createContext, useContext } from 'react'

export type RealtimeStatus = 'connecting' | 'connected' | 'reconnecting'

export const RealtimeContext = createContext<{ status: RealtimeStatus }>({ status: 'connecting' })

export function useRealtimeStatus(): RealtimeStatus {
  return useContext(RealtimeContext).status
}
