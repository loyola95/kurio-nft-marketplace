import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'
import { applyScenarioFromUrl } from './scenarios'

export async function startMocks(): Promise<void> {
  applyScenarioFromUrl(window.location.search)
  const worker = setupWorker(...handlers)
  await worker.start({
    quiet: true,
    onUnhandledRequest: 'bypass',
    serviceWorker: { url: '/mockServiceWorker.js' },
  })
}
