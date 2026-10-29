import { setupWorker } from 'msw/browser'

export async function startMocks(): Promise<void> {
  const worker = setupWorker()
  await worker.start({ quiet: true, onUnhandledRequest: 'bypass' })
}
