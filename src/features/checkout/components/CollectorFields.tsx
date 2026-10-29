import { Link } from '@tanstack/react-router'
import { Controller, type UseFormReturn } from 'react-hook-form'
import { NETWORK_LABEL, type Network } from '@/contracts/common'
import type { CollectorForm } from '@/contracts/order'
import { WALLET_TYPE_LABEL, type Wallet, type Wallets } from '@/contracts/wallet'
import { EnsControl, FormField, SelectControl } from '@/features/profile/components/FormField'
import { inputClass } from '@/features/profile/components/formStyles'
import { cn } from '@/lib/utils'
import { leftForOtherOrders, unitsLabel, type NetworkOption } from '../model'
import type { Cart } from '@/contracts/cart'

/** No frame o campo começa logo abaixo da faixa de 29px do rótulo (linhas a cada 81px). */
const FIELD = 'gap-0 [&>p]:mt-1'

interface Props {
  form: UseFormReturn<CollectorForm>
  wallet: Wallet | null
  wallets: Wallets
  cart: Cart
  options: NetworkOption[]
  onSelectWallet: (wallet: Wallet | null) => void
  /** Mobile: rede, endereço e tipo são escolhidos nos cartões da etapa seguinte. */
  withWalletFields: boolean
}

/**
 * "Perfil do colecionador". Rede, endereço e tipo vêm da carteira cadastrada
 * (README: usar as carteiras cadastradas); os demais campos são editáveis.
 */
export function CollectorFields({
  form,
  wallet,
  wallets,
  cart,
  options,
  onSelectWallet,
  withWalletFields,
}: Props) {
  const { register, control, formState } = form
  const errors = formState.errors
  const err = (name: keyof CollectorForm) => errors[name]?.message
  const reg = (name: keyof CollectorForm) => (control: { id: string }) => (
    <input {...control} {...register(name)} className={inputClass(err(name))} />
  )

  const other = wallet?.slot === 'secondary' ? wallets.primary : wallets.secondary
  const otherReason = other
    ? options.find((o) => o.network === other.network)?.disabledReason
    : 'sem carteira secundária'
  const leftover = wallet ? leftForOtherOrders(cart, wallet.network) : []

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-x-6 gap-y-3 md:grid-cols-2 md:grid-flow-col md:grid-rows-[repeat(5,auto)]">
        <FormField className={FIELD} label="Nome de exibição" required error={err('displayName')}>
          {reg('displayName')}
        </FormField>
        {withWalletFields && (
          <FormField className={FIELD} label="Rede" required>
            {(c) => (
              <SelectControl
                {...c}
                value={wallet?.network ?? ''}
                onChange={(e) => {
                  const net = e.target.value as Network
                  const next = [wallets.primary, wallets.secondary].find((w) => w?.network === net)
                  onSelectWallet(next ?? null)
                }}
              >
                {!wallet && <option value="">Selecione uma rede</option>}
                {options.map((o) => (
                  <option key={o.network} value={o.network} disabled={Boolean(o.disabledReason)}>
                    {o.label}
                    {o.disabledReason ? ` (${o.disabledReason})` : ''}
                  </option>
                ))}
              </SelectControl>
            )}
          </FormField>
        )}
        {withWalletFields && (
          <FormField
            className={FIELD}
            label="Endereço da carteira"
            required
            error={err('walletAddress')}
          >
            {(c) => (
              <input
                {...c}
                readOnly
                value={form.watch('walletAddress')}
                placeholder="Endereço 0x da carteira"
                className={cn(inputClass(err('walletAddress')), 'text-text-2')}
              />
            )}
          </FormField>
        )}
        {withWalletFields && (
          <FormField className={FIELD} label="Tipo de carteira" required>
            {(c) => (
              <input
                {...c}
                readOnly
                value={wallet ? WALLET_TYPE_LABEL[wallet.walletType] : ''}
                placeholder="Selecione uma carteira"
                className={cn(inputClass(), 'text-text-2')}
              />
            )}
          </FormField>
        )}
        <FormField className={FIELD} label="E-mail" required error={err('email')}>
          {(c) => (
            <input
              {...c}
              {...register('email')}
              type="email"
              autoComplete="email"
              className={inputClass(err('email'))}
            />
          )}
        </FormField>
        <FormField className={FIELD} label="Nome de usuário" required error={err('username')}>
          {reg('username')}
        </FormField>
        <FormField className={FIELD} label="Nome do perfil" required error={err('profileName')}>
          {reg('profileName')}
        </FormField>
        <FormField
          className={FIELD}
          label="ENS ou carteira secundária"
          hideLabel
          error={err('ensOrSecondary')}
        >
          {(c) => (
            <input
              {...c}
              {...register('ensOrSecondary')}
              placeholder="ENS ou carteira secundária (opcional)"
              className={inputClass(err('ensOrSecondary'))}
            />
          )}
        </FormField>
        <FormField
          className={FIELD}
          label="Código de indicação"
          required
          error={err('referralCode')}
        >
          {reg('referralCode')}
        </FormField>
        <FormField className={FIELD} label="Nome ENS" required error={err('ensName')}>
          {(c) => (
            <Controller
              control={control}
              name="ensName"
              render={({ field }) => (
                <EnsControl
                  {...c}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  ref={field.ref}
                  error={err('ensName')}
                />
              )}
            />
          )}
        </FormField>
      </div>

      {withWalletFields && (
        <div className="flex flex-col gap-2">
          <label className="relative flex w-fit cursor-pointer items-center gap-2 text-[15px] leading-5 has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-60 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-ring">
            <input
              type="checkbox"
              checked={wallet?.slot === 'secondary'}
              disabled={Boolean(otherReason)}
              onChange={() => onSelectWallet(other ?? null)}
              className="peer absolute inset-0 z-10 cursor-pointer opacity-0 disabled:cursor-not-allowed"
            />
            <span
              aria-hidden
              className="grid size-[15px] place-items-center rounded-full border-2 border-primary peer-checked:[&>span]:block"
            >
              <span className="hidden size-[7px] rounded-full bg-primary" />
            </span>
            Usar outra carteira?
          </label>
          <p className="text-xs leading-4 text-text-3">
            {other && otherReason
              ? `Sua carteira ${other.nickname} é da rede ${NETWORK_LABEL[other.network]} (${otherReason}). `
              : ''}
            Rede, endereço e tipo vêm da carteira {wallet?.nickname ?? 'cadastrada'}.{' '}
            <Link to="/perfil/carteiras" className="text-highlight hover:underline">
              Gerenciar carteiras
            </Link>
          </p>
        </div>
      )}

      {leftover.length > 0 && (
        <p role="status" className="text-sm leading-5 text-text-2">
          {leftover
            .map(
              (l) =>
                `${unitsLabel(l.units)} da rede ${NETWORK_LABEL[l.network]} ${l.units === 1 ? 'fica' : 'ficam'} no carrinho para outro pedido.`,
            )
            .join(' ')}
        </p>
      )}

      <FormField label="Observação do colecionador (opcional)" compact error={err('note')}>
        {(c) => (
          <textarea
            {...c}
            {...register('note')}
            rows={6}
            className={cn(
              inputClass(err('note')),
              'h-[152px] max-w-[350px] resize-none py-3 leading-5',
            )}
          />
        )}
      </FormField>
    </div>
  )
}
