import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useLocation } from '@tanstack/react-router'
import { useId, useState, type ReactNode } from 'react'
import { getNft } from '@/api/endpoints/catalog'
import { mockControl } from '@/api/endpoints/mock'
import { sessionStore } from '@/api/identity'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/components/ui/sheet'
import { SCENARIOS, type ScenarioName } from '@/contracts/mock'
import { removeByPrefix } from '@/lib/storage'
import { cn } from '@/lib/utils'

// Painel de cenários (fora do Figma, só na demonstração). Fala apenas com
// /api/__mock/*: as mudanças acontecem no banco simulado e saem pelo Socket.IO,
// como aconteceriam num backend real. Nenhuma regra de negócio mora aqui.

const SCENARIO_HINT: Record<ScenarioName, string> = {
  padrao: 'Tudo funciona, latência curta',
  'catalogo-vazio': 'Catálogo sem NFTs',
  lento: 'Respostas em 2,5 s (skeletons)',
  'latencia-variavel': 'Latência aleatória com seed fixa',
  'fora-de-ordem': 'Resposta antiga do catálogo chega depois',
  offline: 'Sem conexão em todas as rotas',
  'erro-servidor': 'Erro 500 no catálogo',
  'falha-transitoria': '503 nas duas primeiras leituras',
  'sessao-expirada': 'Sessão vence 60 s após o login',
  'sem-permissao': '403 nas rotas privadas',
  'favorito-falha': 'Favoritar falha (rollback)',
  'preco-alterado-no-checkout': 'Preço sobe depois da cotação',
  'esgotado-no-checkout': 'Item esgota depois da cotação',
  'timeout-pedido': 'Pedido criado, resposta após o timeout',
  'pagamento-recusado': 'Pedido termina recusado',
  'carteira-recusada': 'Carteira recusa a conexão',
  'tempo-real-instavel': 'Socket cai a cada 20 s',
}

interface MockStateView {
  scenario?: ScenarioName
  sessions?: number
  orders?: { id: string; status: string }[]
  realtimeConnections?: number
  ordersHeld?: boolean
}

const fieldClass =
  'h-9 w-full rounded-[3px] border border-border bg-transparent px-2.5 text-sm text-foreground outline-none focus:border-primary'
const buttonClass =
  'h-9 rounded-[3px] border border-border-strong px-3 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-highlight disabled:opacity-50'
const primaryClass =
  'h-9 rounded-[3px] bg-primary px-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-highlight disabled:opacity-50'

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-3 border-t border-border pt-4">
      <h3 className="text-sm font-bold text-text-2">{title}</h3>
      {children}
    </section>
  )
}

function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: (id: string) => ReactNode
}) {
  const id = useId()
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-xs text-text-2">
        {label}
      </label>
      {children(id)}
      {hint && (
        <p id={`${id}-dica`} className="text-xs text-text-3">
          {hint}
        </p>
      )}
    </div>
  )
}

export default function ScenarioPanel({
  open,
  onOpenChange,
  onCloseFocus,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCloseFocus: () => void
}) {
  const qc = useQueryClient()
  const { pathname } = useLocation()
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)
  const [chosenScenario, setScenario] = useState<ScenarioName | null>(null)
  // O NFT aberto na tela é o alvo padrão dos eventos.
  const routeNft = /^\/nft\/([^/]+)/.exec(pathname)?.[1] ?? 'emerald-ape-042'
  // null = segue o NFT da rota; vira texto quando a pessoa digita outro id.
  const [typedNftId, setNftId] = useState<string | null>(null)
  const nftId = typedNftId ?? routeNft
  const [editionId, setEditionId] = useState('')
  const [price, setPrice] = useState('')
  const [available, setAvailable] = useState('')

  const nft = useQuery({
    queryKey: ['devtools', 'nft', nftId],
    queryFn: ({ signal }) => getNft(nftId, signal),
    enabled: open && nftId.trim().length > 0,
    retry: false,
  })

  const mockState = useQuery({
    queryKey: ['devtools', 'state'],
    queryFn: async () => (await mockControl.state()) as MockStateView,
    enabled: open,
    staleTime: 0,
  })
  const state = mockState.data ?? null
  const scenario = chosenScenario ?? state?.scenario ?? 'padrao'
  const refresh = () => mockState.refetch()

  const run = async (done: string, action: () => Promise<unknown>) => {
    setBusy(true)
    try {
      await action()
      setStatus(done)
      await refresh()
    } catch {
      setStatus('A simulação não respondeu. Tente de novo.')
    } finally {
      setBusy(false)
    }
  }

  const edition = editionId || nft.data?.editions.find((e) => e.label === '1/50')?.id || ''

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        onCloseAutoFocus={(event) => {
          event.preventDefault()
          onCloseFocus()
        }}
        className="w-[360px] max-w-[92vw] gap-0 overflow-y-auto border-border bg-background p-0"
      >
        <div className="flex flex-col gap-1.5 p-5 pb-4">
          <SheetTitle className="text-lg font-bold">Painel de cenários</SheetTitle>
          <SheetDescription className="text-sm leading-5 text-text-2">
            Controla o backend simulado (MSW) da demonstração. As mudanças valem para REST e
            Socket.IO.
          </SheetDescription>
        </div>

        <div className="flex flex-col gap-4 px-5 pb-6">
          <p role="status" className="min-h-5 text-sm leading-5 text-highlight">
            {status}
          </p>

          {state && (
            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 rounded-md bg-surface p-3 text-xs leading-5">
              <dt className="text-text-2">Cenário atual</dt>
              <dd>{state.scenario}</dd>
              <dt className="text-text-2">Conexões em tempo real</dt>
              <dd>{state.realtimeConnections ?? 0}</dd>
              <dt className="text-text-2">Pedidos</dt>
              <dd>{state.orders?.length ?? 0}</dd>
              <dt className="col-span-2 text-text-2">
                Pedidos seguros em pendente: {state.ordersHeld ? 'sim' : 'não'}
              </dt>
            </dl>
          )}

          <Section title="Cenário">
            <Field label="Cenário" hint={SCENARIO_HINT[scenario]}>
              {(id) => (
                <select
                  id={id}
                  value={scenario}
                  onChange={(e) => setScenario(e.target.value as ScenarioName)}
                  aria-describedby={`${id}-dica`}
                  className={fieldClass}
                >
                  {SCENARIOS.map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className={primaryClass}
                onClick={() =>
                  void run(`Cenário "${scenario}" aplicado.`, async () => {
                    await mockControl.setScenario(scenario)
                    await qc.invalidateQueries()
                  })
                }
              >
                Aplicar cenário
              </button>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() =>
                  void run('Dados restaurados.', async () => {
                    await mockControl.reset()
                    // Sessão, carrinho e rascunhos locais apontavam para o banco antigo.
                    sessionStore.clear()
                    removeByPrefix('local', 'kurio.cartId')
                    removeByPrefix('session', 'kurio.checkout.')
                    removeByPrefix('session', 'kurio.draft.')
                    window.location.assign('/')
                  })
                }
              >
                Restaurar dados iniciais
              </button>
            </div>
          </Section>

          <Section title="Evento nft.updated">
            <Field label="NFT (id)">
              {(id) => (
                <input
                  id={id}
                  value={nftId}
                  onChange={(e) => {
                    setNftId(e.target.value.trim())
                    setEditionId('')
                  }}
                  className={fieldClass}
                />
              )}
            </Field>
            <Field label="Edição">
              {(id) => (
                <select
                  id={id}
                  value={edition}
                  onChange={(e) => setEditionId(e.target.value)}
                  disabled={!nft.data}
                  className={fieldClass}
                >
                  {nft.data?.editions.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.label} · {e.priceEth} ETH · {e.available} disp.
                    </option>
                  ))}
                </select>
              )}
            </Field>
            {nft.isError && <p className="text-xs text-danger">NFT não encontrado.</p>}
            <div className="grid grid-cols-2 gap-2">
              <Field label="Novo preço (ETH)">
                {(id) => (
                  <input
                    id={id}
                    inputMode="decimal"
                    placeholder="ex.: 1.50"
                    value={price}
                    onChange={(e) => setPrice(e.target.value.replace(',', '.'))}
                    className={fieldClass}
                  />
                )}
              </Field>
              <Field label="Disponível">
                {(id) => (
                  <input
                    id={id}
                    inputMode="numeric"
                    placeholder="ex.: 0"
                    value={available}
                    onChange={(e) => setAvailable(e.target.value.replace(/\D/g, ''))}
                    className={fieldClass}
                  />
                )}
              </Field>
            </div>
            <button
              type="button"
              disabled={busy || !nft.data || (!price && !available)}
              className={cn(primaryClass, 'self-start')}
              onClick={() =>
                void run('Evento nft.updated enviado.', () =>
                  mockControl.emitNftUpdated({
                    nftId,
                    editionId: edition,
                    ...(/^\d+(\.\d{1,18})?$/.test(price) && { priceEth: price }),
                    ...(available !== '' && { available: Number(available) }),
                  }),
                )
              }
            >
              Enviar nft.updated
            </button>
          </Section>

          <Section title="Tempo real">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() =>
                  void run('Último evento reenviado (mesmo id).', mockControl.duplicateLastEvent)
                }
              >
                Reenviar último evento
              </button>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() =>
                  void run('Evento antigo de NFT enviado.', () =>
                    mockControl.emitStaleEvent('nft.updated'),
                  )
                }
              >
                Evento antigo de NFT
              </button>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() =>
                  void run('Evento antigo de pedido enviado.', () =>
                    mockControl.emitStaleEvent('order.updated'),
                  )
                }
              >
                Evento antigo de pedido
              </button>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() => void run('Conexões derrubadas.', mockControl.dropRealtime)}
              >
                Derrubar conexão
              </button>
            </div>
          </Section>

          <Section title="Sessão, carteira e pedidos">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() => void run('Sessões expiradas.', mockControl.expireSession)}
              >
                Expirar sessão
              </button>
              <button
                type="button"
                disabled={busy}
                className={buttonClass}
                onClick={() => void run('Carteira desconectada.', mockControl.disconnectWallet)}
              >
                Desconectar carteira
              </button>
            </div>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span aria-hidden>Segurar pedidos pendentes</span>
              <button
                type="button"
                role="switch"
                aria-checked={Boolean(state?.ordersHeld)}
                aria-label="Segurar pedidos pendentes"
                disabled={busy}
                onClick={() =>
                  void run(
                    state?.ordersHeld ? 'Pedidos liberados.' : 'Pedidos seguros em pendente.',
                    () => mockControl.holdOrders(!state?.ordersHeld),
                  )
                }
                className={cn(
                  'relative h-6 w-11 shrink-0 rounded-full border border-border-strong transition-colors disabled:opacity-50',
                  state?.ordersHeld ? 'bg-primary' : 'bg-surface-2',
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    'absolute top-0.5 left-0.5 size-[18px] rounded-full bg-foreground transition-transform',
                    state?.ordersHeld && 'translate-x-5',
                  )}
                />
              </button>
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  )
}
