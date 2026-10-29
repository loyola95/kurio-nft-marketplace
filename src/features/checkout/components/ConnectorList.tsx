import { useId } from 'react'
import { Icon } from '@/components/icon'
import { NETWORK_LABEL, type Network } from '@/contracts/common'
import {
  WALLET_NETWORKS,
  WALLET_TYPE_LABEL,
  type WalletConnection,
  type WalletType,
} from '@/contracts/wallet'
import { cn } from '@/lib/utils'

// Ordem do frame mobile; no desktop a linha do WalletConnect é a do selo de carteiras.
const CONNECTORS: WalletType[] = ['walletconnect', 'metamask', 'coinbase']

interface Props {
  network: Network | null
  connection: WalletConnection | null
  connecting: WalletType | null
  error: string | null
  onConnect: (connector: WalletType) => void
  onDisconnect: () => void
  variant: 'desktop' | 'mobile'
}

function Mark({ connector }: { connector: WalletType }) {
  return (
    <span
      aria-hidden
      className="grid size-10 shrink-0 place-items-center rounded-full border border-border bg-surface-2 text-sm leading-[18px] font-bold text-highlight"
    >
      {connector === 'coinbase' ? (
        <Icon name="wallet" size={24} />
      ) : connector === 'metamask' ? (
        'M'
      ) : (
        'W'
      )}
    </span>
  )
}

function Dot({ checked }: { checked: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-4 shrink-0 place-items-center rounded-full border-[1.2px]',
        checked ? 'border-primary' : 'border-primary max-lg:border-border-strong',
      )}
    >
      {checked && <span className="size-2 rounded-full bg-primary lg:size-2.5" />}
    </span>
  )
}

/**
 * "Carteira e rede": escolher um conector conecta a carteira (simulado na API,
 * que pode aceitar, recusar ou desconectar). Só conectores da rede ficam ativos.
 */
export function ConnectorList({
  network,
  connection,
  connecting,
  error,
  onConnect,
  onDisconnect,
  variant,
}: Props) {
  const titleId = useId()
  const statusId = useId()
  const mobile = variant === 'mobile'
  const selected = connecting ?? connection?.connector ?? null

  return (
    <div className={cn('flex flex-col', mobile ? 'gap-4' : 'gap-5')}>
      <h2
        id={titleId}
        className={cn(
          'font-bold',
          mobile ? 'text-base leading-4' : 'text-center text-[17px] leading-4',
        )}
      >
        Carteira e rede
      </h2>
      <div
        role="radiogroup"
        aria-labelledby={titleId}
        aria-describedby={statusId}
        tabIndex={-1}
        data-connectors
        className={cn('flex flex-col outline-none', mobile ? 'gap-4' : 'gap-4')}
      >
        {CONNECTORS.map((connector) => {
          const supported = network ? WALLET_NETWORKS[connector].includes(network) : false
          const checked = selected === connector
          return (
            <label
              key={connector}
              className={cn(
                'relative flex cursor-pointer items-center has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring',
                mobile
                  ? 'h-[65px] gap-[11px] rounded-[15px] bg-surface pr-[17px] pl-3.5'
                  : cn(
                      'h-[45px] gap-2.5 rounded-[3px] border px-3',
                      checked ? 'border-primary' : 'border-border',
                    ),
              )}
            >
              <input
                type="radio"
                name="conector"
                value={connector}
                checked={checked}
                disabled={!supported || connecting !== null}
                onChange={() => onConnect(connector)}
                className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              {mobile ? <Mark connector={connector} /> : <Dot checked={checked} />}
              <span
                className={cn(
                  'flex min-w-0 flex-1 items-center gap-2.5',
                  mobile ? 'text-sm leading-4' : 'text-[15px] leading-5',
                )}
              >
                {WALLET_TYPE_LABEL[connector]}
                {!supported && network && (
                  <span className="text-xs text-text-3">
                    (não conecta na {NETWORK_LABEL[network]})
                  </span>
                )}
                {/* Selo de carteiras compatíveis do frame desktop (comentário #14: respiro interno). */}
                {!mobile && connector === 'walletconnect' && (
                  <span
                    aria-hidden
                    className="ml-auto rounded-md border border-border-strong bg-surface-3 px-2 py-1.5 text-[9px] leading-3 font-bold whitespace-nowrap text-highlight max-sm:hidden"
                  >
                    METAMASK • WALLETCONNECT • COINBASE
                  </span>
                )}
              </span>
              {mobile && <Dot checked={checked} />}
            </label>
          )
        })}
      </div>

      <div
        id={statusId}
        role="status"
        className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm leading-5 empty:-mt-5 empty:max-lg:-mt-4"
      >
        {connecting ? (
          <span className="text-text-2">Conectando com {WALLET_TYPE_LABEL[connecting]}…</span>
        ) : connection ? (
          <>
            <span className="text-text-2">
              Carteira conectada com {WALLET_TYPE_LABEL[connection.connector]}
            </span>
            <button
              type="button"
              onClick={onDisconnect}
              className="font-bold text-highlight hover:underline"
            >
              Desconectar
            </button>
          </>
        ) : error ? (
          <span className="text-danger">{error}</span>
        ) : null}
      </div>
    </div>
  )
}
