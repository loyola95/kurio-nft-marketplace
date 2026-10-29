import { useId, useState, type ComponentProps, type ReactNode } from 'react'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'
import { inputClass } from './formStyles'

interface FieldProps {
  label: string
  required?: boolean
  error?: string
  /** O campo "ENS ou carteira secundária" não tem rótulo visível no Figma. */
  hideLabel?: boolean
  /** Campos de senha: sem asterisco no Figma, rótulo a 12px do campo. */
  compact?: boolean
  /** Formulário de carteiras: campo colado ao rótulo, como no frame. */
  tight?: boolean
  className?: string
  children: (control: {
    id: string
    'aria-invalid'?: true
    'aria-describedby'?: string
    required?: boolean
  }) => ReactNode
}

/** Campo dos frames de perfil e carteiras: rótulo 15px com asterisco #f0805f e controle de 40px. */
export function FormField({
  label,
  required,
  error,
  hideLabel,
  compact,
  tight,
  className,
  children,
}: FieldProps) {
  const id = useId()
  const errorId = `${id}-erro`
  return (
    <div
      className={cn(
        'flex flex-col',
        compact && 'gap-3',
        // Carteiras: o campo começa 25px abaixo do topo do rótulo (sobrepõe 4px da faixa de 29px).
        tight && '[&>*:nth-child(2)]:-mt-1 [&>p]:mt-1',
        !compact && !tight && 'gap-2.5',
        className,
      )}
    >
      {/* O asterisco fica fora do <label>: o nome do campo é só o texto (o "obrigatório" vem do required). */}
      {/* Sem rótulo visível (ENS opcional) a faixa de 29px continua, para alinhar com o campo vizinho. */}
      <div
        className={cn('flex items-center', !compact && 'h-[29px]', hideLabel && 'max-lg:sr-only')}
      >
        <label htmlFor={id} className={cn('text-[15px] leading-[15px]', hideLabel && 'sr-only')}>
          {label}
        </label>
        {required && (
          <span aria-hidden className="ml-0.5 self-start text-[22px] leading-[29px] text-danger">
            *
          </span>
        )}
      </div>
      {children({
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': error ? errorId : undefined,
        required: required || undefined,
      })}
      {error && (
        <p id={errorId} className="-mt-1 text-xs leading-4 text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** Select nativo com a seta do Figma (teclado e leitor de tela de graça). */
export function SelectControl({
  error,
  className,
  children,
  ...props
}: ComponentProps<'select'> & { error?: string }) {
  return (
    <span className="relative block">
      <select {...props} className={cn(inputClass(error), 'appearance-none pr-10', className)}>
        {children}
      </select>
      <Icon
        name="chevron-down"
        size={20}
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-foreground"
      />
    </span>
  )
}

export function PasswordControl({ error, ...props }: ComponentProps<'input'> & { error?: string }) {
  const [visible, setVisible] = useState(false)
  return (
    <span className="relative block">
      <input
        {...props}
        type={visible ? 'text' : 'password'}
        className={cn(inputClass(error), 'pr-12')}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute top-1/2 right-[13px] grid -translate-y-1/2 place-items-center text-text-3 after:absolute after:-inset-2"
      >
        <Icon name={visible ? 'eye' : 'eye-off'} size={22} />
        <span className="sr-only">{visible ? 'Ocultar senha' : 'Mostrar senha'}</span>
      </button>
    </span>
  )
}

/**
 * Nome ENS: o Figma mostra ".eth" num seletor, mas ENS só existe com .eth;
 * vira um sufixo fixo na mesma posição (o valor salvo inclui o ".eth").
 */
export function EnsControl({
  value,
  onChange,
  onBlur,
  error,
  ...props
}: Omit<ComponentProps<'input'>, 'value' | 'onChange'> & {
  value: string
  onChange: (value: string) => void
  error?: string
}) {
  const name = value.replace(/\.eth$/i, '')
  return (
    <span className="flex gap-2.5">
      <span
        aria-hidden
        className="grid h-10 w-[78px] shrink-0 place-items-center rounded-[3px] border border-border text-[15px]"
      >
        .eth
      </span>
      <input
        {...props}
        value={name}
        onBlur={onBlur}
        onChange={(e) => onChange(e.target.value.trim() ? `${e.target.value.trim()}.eth` : '')}
        className={inputClass(error)}
      />
    </span>
  )
}
