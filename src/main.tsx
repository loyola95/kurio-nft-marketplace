import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/styles/globals.css'

async function bootstrap() {
  // O socket.io-client captura o WebSocket global no import. Por isso os mocks
  // precisam estar ativos antes de qualquer módulo da aplicação ser carregado.
  if (import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { startMocks } = await import('@/mocks/browser')
    await startMocks()
    // Um deploy novo troca o service worker do mock com a aba aberta: a página perde a
    // interceptação e a API responde com o HTML do site. Recarrega para religar o mock.
    // (Na primeira visita a troca acontece antes deste ponto, então não recarrega.)
    navigator.serviceWorker?.addEventListener('controllerchange', () => window.location.reload())
  }
  const { default: App } = await import('@/app/App')
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}

void bootstrap()
