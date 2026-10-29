import { useId, useState, type ComponentProps } from 'react'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'

export type AuthVariant = 'dialog' | 'page'

/**
 * Campo dos formulários de conta. O Figma só tem placeholder: o label existe
 * para leitores de tela (oculto) e o erro fica associado por aria-describedby.
 */
export function AuthField({
  label,
  error,
  variant,
  password = false,
  toggleClassName,
  className,
  ...input
}: ComponentProps<'input'> & {
  label: string
  error?: string
  variant: AuthVariant
  /** Campo de senha com botão de mostrar/ocultar. */
  password?: boolean
  /** Permite esconder o botão de olho em um tamanho (o Figma desktop não tem no "Confirmar senha"). */
  toggleClassName?: string
}) {
  const id = useId()
  const errorId = `${id}-erro`
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="sr-only">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={password ? (visible ? 'text' : 'password') : input.type}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className={cn(
            'w-full border bg-transparent px-4 text-sm leading-4 text-foreground outline-none placeholder:text-text-3 focus:border-primary',
            variant === 'dialog' ? 'h-10 rounded-[5px]' : 'h-[50px] rounded-[10px]',
            error ? 'border-danger' : 'border-border',
            password && 'pr-12 text-base placeholder:text-sm',
            className,
          )}
          {...input}
        />
        {password && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className={cn(
              'absolute top-1/2 grid -translate-y-1/2 place-items-center after:absolute after:-inset-2',
              variant === 'dialog'
                ? 'right-[11px] text-text-3'
                : 'right-4 text-border-strong hover:text-text-3',
              toggleClassName,
            )}
          >
            <Icon name={visible ? 'eye' : 'eye-off'} size={variant === 'dialog' ? 23 : 18} />
            <span className="sr-only">{visible ? 'Ocultar senha' : 'Mostrar senha'}</span>
          </button>
        )}
      </div>
      {error && (
        <p id={errorId} className="text-xs leading-4 text-danger">
          {error}
        </p>
      )}
    </div>
  )
}
