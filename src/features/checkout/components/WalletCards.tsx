import { Link } from '@tanstack/react-router'
import { useId } from 'react'
import { NETWORK_LABEL } from '@/contracts/common'
import type { Wallet } from '@/contracts/wallet'
import { cn } from '@/lib/utils'
import { shortAddress, type NetworkOption } from '../model'

/** Frame "Mobile / Pagamento": cartões das carteiras cadastradas (escolher = escolher a rede). */
export function WalletCards({
  wallets,
  options,
  selectedId,
  onSelect,
}: {
  wallets: Wallet[]
  options: NetworkOption[]
  selectedId: string | null
  onSelect: (wallet: Wallet) => void
}) {
  const titleId = useId()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 id={titleId} className="text-base leading-4 font-bold">
          Carteira conectada
        </h2>
        <Link
          to="/perfil/carteiras"
          className="text-sm leading-4 font-bold text-highlight hover:underline"
        >
          Trocar carteira
        </Link>
      </div>
      <div role="radiogroup" aria-labelledby={titleId} className="flex flex-col gap-5">
        {wallets.map((wallet) => {
          const reason = options.find((o) => o.network === wallet.network)?.disabledReason
          const checked = wallet.id === selectedId
          return (
            <label
              key={wallet.id}
              className="relative flex min-h-[93px] cursor-pointer items-center gap-5 rounded-[14px] bg-surface py-[15px] pr-12 pl-[19px] has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring"
            >
              <input
                type="radio"
                name="carteira"
                checked={checked}
                disabled={Boolean(reason)}
                onChange={() => onSelect(wallet)}
                className="absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
              />
              <span
                aria-hidden
                className={cn(
                  'grid size-4 shrink-0 place-items-center rounded-full border-[1.2px]',
                  checked ? 'border-primary' : 'border-border-strong',
                )}
              >
                {checked && <span className="size-2 rounded-full bg-primary" />}
              </span>
              <span className="flex min-w-0 flex-col gap-[7px]">
                <span className="text-base leading-4 font-bold">{wallet.nickname}</span>
                <span className="text-sm leading-[22px] text-text-2">
                  {wallet.ensOrSecondary || shortAddress(wallet.address)}
                  <br />
                  Rede {wallet.slot === 'primary' ? 'principal ' : ''}
                  {NETWORK_LABEL[wallet.network]}
                  {reason && <span className="text-text-3"> ({reason})</span>}
                </span>
              </span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
