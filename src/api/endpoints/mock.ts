import type { ScenarioName } from '@/contracts/mock'
import { http } from '../http'

// Controle da simulação (só respondem com mocks ativos). Usados pelo painel de cenários.
export const mockControl = {
  state: async () => (await http.get('/__mock/state')).data as Record<string, unknown>,
  reset: () => http.post('/__mock/reset'),
  setScenario: (name: ScenarioName) => http.post('/__mock/scenario', { name }),
  emitNftUpdated: (body: {
    nftId: string
    editionId?: string
    priceEth?: string
    available?: number
  }) => http.post('/__mock/events/nft-updated', body),
  duplicateLastEvent: () => http.post('/__mock/events/duplicate-last'),
  emitStaleEvent: () => http.post('/__mock/events/stale'),
  dropRealtime: () => http.post('/__mock/realtime/drop'),
  expireSession: () => http.post('/__mock/session/expire'),
}
