import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { API_BASE } from './lib/http'
import { applyScenarioFromUrl } from './scenarios'

export async function startMocks(): Promise<void> {
  applyScenarioFromUrl(window.location.search)
  const worker = setupWorker(...handlers)
  await worker.start({
    quiet: true,
    onUnhandledRequest: 'bypass',
    // Worker próprio que deixa assets estáticos fora do MSW (ver public/mockWorker.js).
    serviceWorker: { url: `/mockWorker.js?api=${encodeURIComponent(API_BASE)}` },
  })
}
