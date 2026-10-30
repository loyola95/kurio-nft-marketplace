import { zodResolver } from '@hookform/resolvers/zod'
import { useId, useRef, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { isApiError } from '@/api/errors'
import { Skeleton } from '@/components/ui/skeleton'
import { NETWORK_LABEL, type Network } from '@/contracts/common'
import {
  WALLET_TYPE_LABEL,
  WalletInput,
  type Wallet,
  type WalletSlot,
  type WalletType,
} from '@/contracts/wallet'
import { ErrorState } from '@/features/catalog/components/States'
import { mapFieldErrors } from '@/lib/forms'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import { useSaveWallet, useWallets } from '../queries'
import { EnsControl, FormField, SelectControl } from './FormField'
import { inputClass } from './formStyles'

type FormValues = Omit<WalletInput, 'network' | 'walletType'> & {
  network: Network | ''
  walletType: WalletType | ''
}

const EMPTY: FormValues = {
  displayName: '',
  nickname: '',
  network: '',
  profileName: '',
  address: '',
  ensOrSecondary: '',
  walletType: '',
  referralCode: '',
  email: '',
  ensName: '',
}

const FIELDS = Object.keys(EMPTY) as (keyof FormValues)[]

const toValues = (w: Wallet | null): FormValues =>
  w ? (Object.fromEntries(FIELDS.map((k) => [k, w[k]])) as FormValues) : EMPTY

// Selects vazios: mensagem própria em vez do erro genérico do enum.
const resolver = zodResolver(
  WalletInput as never,
  {
    error: (issue: { path?: PropertyKey[]; code: string }) =>
      issue.code === 'invalid_value' && issue.path?.[0] === 'network'
        ? 'Selecione uma rede'
        : issue.code === 'invalid_value' && issue.path?.[0] === 'walletType'
          ? 'Selecione uma carteira'
          : undefined,
  } as never,
)

function WalletForm({
  slot,
  wallet,
  initial,
  onSaved,
}: {
  slot: WalletSlot
  wallet: Wallet | null
  initial: FormValues
  onSaved: (message: string) => void
}) {
  const save = useSaveWallet(slot)
  const form = useForm<FormValues>({ resolver: resolver as never, defaultValues: initial })
  const { errors, isDirty } = form.formState
  const e = (k: keyof FormValues) => errors[k]?.message

  const submit = form.handleSubmit((values) => {
    // Carteira já cadastrada e nada alterado: "salva" seria um falso aviso de sucesso.
    if (wallet && !isDirty) {
      onSaved('Nenhuma alteração para salvar.')
      return
    }
    save.mutate(
      { id: wallet?.id, input: values as WalletInput },
      {
        onSuccess: (saved) => {
          form.reset(toValues(saved))
          onSaved(slot === 'primary' ? 'Carteira principal salva.' : 'Carteira secundária salva.')
        },
        onError: (error) => {
          if (
            !mapFieldErrors(form.setError, error, FIELDS) &&
            !isApiError(error, 'SESSION_EXPIRED')
          ) {
            form.setError('root', {
              message: 'Não foi possível salvar a carteira. Tente novamente.',
            })
          }
        },
      },
    )
  })

  const text = (
    k: keyof FormValues,
    label: string,
    opts: { placeholder?: string; type?: string; required?: boolean; hideLabel?: boolean } = {},
  ) => (
    <FormField
      tight
      label={label}
      required={opts.required ?? true}
      hideLabel={opts.hideLabel}
      error={e(k)}
    >
      {(a) => (
        <input
          {...a}
          type={opts.type}
          placeholder={opts.placeholder}
          {...form.register(k)}
          className={inputClass(e(k))}
        />
      )}
    </FormField>
  )

  return (
    <form noValidate onSubmit={submit} className="flex flex-col gap-8">
      {/* Ordem em linhas (esquerda, direita) para o Tab seguir a leitura do Figma. */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-7">
        {text('displayName', 'Nome de exibição')}
        {text('nickname', 'Apelido da carteira')}
        <FormField tight label="Rede" required error={e('network')}>
          {(a) => (
            <SelectControl {...a} {...form.register('network')} error={e('network')}>
              <option value="" disabled>
                Selecione uma rede
              </option>
              {(Object.keys(NETWORK_LABEL) as Network[]).map((n) => (
                <option key={n} value={n}>
                  {NETWORK_LABEL[n]}
                </option>
              ))}
            </SelectControl>
          )}
        </FormField>
        {text('profileName', 'Nome do perfil')}
        {text('address', 'Endereço da carteira', { placeholder: 'Endereço 0x da carteira' })}
        {text('ensOrSecondary', 'ENS ou carteira secundária (opcional)', {
          placeholder: 'ENS ou carteira secundária (opcional)',
          required: false,
          hideLabel: true,
        })}
        <FormField tight label="Tipo de carteira" required error={e('walletType')}>
          {(a) => (
            <SelectControl {...a} {...form.register('walletType')} error={e('walletType')}>
              <option value="" disabled>
                Selecione uma carteira
              </option>
              {(Object.keys(WALLET_TYPE_LABEL) as WalletType[]).map((t) => (
                <option key={t} value={t}>
                  {WALLET_TYPE_LABEL[t]}
                </option>
              ))}
            </SelectControl>
          )}
        </FormField>
        {text('referralCode', 'Código de indicação')}
        {text('email', 'E-mail', { type: 'email' })}
        <FormField tight label="Nome ENS" required error={e('ensName')}>
          {(a) => (
            <Controller
              control={form.control}
              name="ensName"
              render={({ field }) => (
                <EnsControl
                  {...a}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={e('ensName')}
                />
              )}
            />
          )}
        </FormField>
      </div>
      <div className="flex flex-col items-start gap-2">
        <button
          type="submit"
          disabled={save.isPending}
          className="h-10 min-w-[131px] rounded-[3px] bg-primary px-6 text-sm leading-4 font-bold whitespace-nowrap text-primary-foreground hover:bg-highlight disabled:opacity-60"
        >
          {save.isPending ? 'Salvando…' : 'Salvar carteira'}
        </button>
        {errors.root && (
          <p role="alert" className="text-sm text-danger">
            {errors.root.message}
          </p>
        )}
      </div>
    </form>
  )
}

function SlotSection({
  slot,
  wallet,
  primary,
}: {
  slot: WalletSlot
  wallet: Wallet | null
  primary: Wallet | null
}) {
  const titleId = useId()
  const [open, setOpen] = useState(slot === 'primary' || Boolean(wallet))
  const [sameAsPrimary, setSameAsPrimary] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const firstField = useRef<HTMLDivElement>(null)
  const title = slot === 'primary' ? 'Carteira principal' : 'Carteira secundária'

  // "Igual à carteira principal" copia tudo menos o endereço (spec 6.10).
  const initial =
    !wallet && sameAsPrimary && primary ? { ...toValues(primary), address: '' } : toValues(wallet)

  const add = () => {
    setOpen(true)
    requestAnimationFrame(() => firstField.current?.querySelector('input')?.focus())
  }

  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id={titleId} className="text-[17px] leading-4 font-bold">
          {title}
        </h2>
        <div className="flex items-center gap-2">
          {slot === 'secondary' && !wallet && primary && (
            <label className="flex cursor-pointer items-center gap-2 text-[15px] leading-4">
              {/* Círculo do Figma; o checkbox nativo fica transparente por cima (clicável e acessível). */}
              <span className="relative grid size-[17px] place-items-center">
                <input
                  type="checkbox"
                  checked={sameAsPrimary}
                  onChange={(ev) => setSameAsPrimary(ev.target.checked)}
                  className="peer absolute inset-0 cursor-pointer opacity-0"
                />
                <span
                  aria-hidden
                  className="grid size-[17px] place-items-center rounded-full border border-primary peer-checked:[&>span]:block peer-focus-visible:outline-2 peer-focus-visible:outline-highlight"
                >
                  <span className="hidden size-[9px] rounded-full bg-primary" />
                </span>
              </span>
              Igual à carteira principal
            </label>
          )}
          {!wallet && (
            <button
              type="button"
              onClick={add}
              className="text-base leading-4 font-medium text-highlight hover:underline lg:text-[17px] lg:font-bold"
            >
              Adicionar
            </button>
          )}
        </div>
      </div>
      <p className="text-sm leading-[15px] text-text-2">
        {slot === 'primary'
          ? 'Estas carteiras ficam disponíveis no pagamento e para receber NFTs comprados.'
          : !open && 'Você ainda não adicionou uma carteira secundária.'}
      </p>
      {open && (
        <div ref={firstField} className={cn(slot === 'primary' ? 'mt-6' : 'mt-4')}>
          <WalletForm
            key={JSON.stringify(initial)}
            slot={slot}
            wallet={wallet}
            initial={initial}
            onSaved={setMessage}
          />
        </div>
      )}
      <p role="status" className="text-sm text-text-2 empty:hidden">
        {message}
      </p>
    </section>
  )
}

/** "Carteiras" (frame Desktop / Carteiras): principal e secundária. */
export function WalletsPage() {
  usePageTitle('Carteiras')
  const { data, isPending, isError, error, refetch } = useWallets()
  return (
    <div className="flex flex-col gap-6">
      <h1 className="sr-only">Carteiras</h1>
      {isPending ? (
        <Skeleton className="h-[560px]" />
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar suas carteiras"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        <>
          <SlotSection slot="primary" wallet={data.primary} primary={data.primary} />
          <SlotSection slot="secondary" wallet={data.secondary} primary={data.primary} />
        </>
      )}
    </div>
  )
}
