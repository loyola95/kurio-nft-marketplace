import { lazy, Suspense, useRef, useState } from 'react'
import { Icon } from '@/components/icon'
import { readJson, removeKey, writeJson } from '@/lib/storage'

// O painel só é baixado quando alguém chega perto do botão (não pesa no carregamento).
const ScenarioPanel = lazy(() => import('./ScenarioPanel'))

const HIDE_KEY = 'kurio.painel'

/** ?painel=0 esconde o painel pelo resto da aba (baselines visuais); ?painel=1 mostra de novo. */
function hiddenByUrl(): boolean {
  const value = new URLSearchParams(window.location.search).get('painel')
  if (value === '0') writeJson('session', HIDE_KEY, '0')
  if (value === '1') removeKey('session', HIDE_KEY)
  return readJson<string>('session', HIDE_KEY) === '0'
}

/**
 * Botão do painel de cenários: aba de 24px na borda direita, no meio da altura.
 * Cabe na margem lateral da página (24px no mobile), longe da barra inferior,
 * e não cobre conteúdo clicável; 24px é o alvo de toque mínimo (WCAG 2.5.8).
 * Só existe com os mocks ativos (build de demonstração).
 */
export function ScenarioLauncher() {
  const [hidden] = useState(hiddenByUrl)
  const [open, setOpen] = useState(false)
  const [load, setLoad] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  if (import.meta.env.VITE_ENABLE_MOCKS !== 'true' || hidden) return null

  return (
    <>
      <button
        ref={button}
        type="button"
        aria-label="Abrir painel de cenários"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Painel de cenários da simulação"
        onPointerEnter={() => setLoad(true)}
        onFocus={() => setLoad(true)}
        onClick={() => {
          setLoad(true)
          setOpen(true)
        }}
        className="fixed top-1/2 right-0 z-40 grid h-12 w-6 -translate-y-1/2 place-items-center rounded-l-md border border-r-0 border-border-strong bg-surface-2/90 text-text-2 transition-colors hover:text-highlight focus-visible:text-highlight"
      >
        <Icon name="activity" size={16} />
      </button>
      {load && (
        <Suspense fallback={null}>
          <ScenarioPanel
            open={open}
            onOpenChange={setOpen}
            // O painel abre sem o gatilho do Radix: o foco volta ao botão ao fechar.
            onCloseFocus={() => button.current?.focus()}
          />
        </Suspense>
      )}
    </>
  )
}
