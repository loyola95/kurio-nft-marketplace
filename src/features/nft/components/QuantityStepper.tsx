import { useId, useState } from 'react'
import { cn } from '@/lib/utils'
import { normalizeQuantity } from '../quantity'

/**
 * Seletor de quantidade do Figma (botões laranja em pílula). Só aceita inteiros
 * entre min e max; o "−" desabilita no mínimo e o "+" no máximo.
 */
export function QuantityStepper({
  value,
  min = 1,
  max,
  onChange,
  label = 'Quantidade',
  limitMessage,
  size = 'md',
  disabled = false,
}: {
  value: number
  min?: number
  max: number
  onChange: (value: number) => void
  label?: string
  limitMessage?: string
  /** md: detalhe desktop; sm: pílulas 20x30 (detalhe mobile e carrinho desktop); round: círculos 24px do carrinho mobile. */
  size?: 'md' | 'sm' | 'round'
  disabled?: boolean
}) {
  // Rascunho só enquanto o usuário digita; fora disso o campo mostra o valor real.
  const [draft, setDraft] = useState<string | null>(null)
  const inputId = useId()
  const hintId = useId()

  const commit = (raw: string) => {
    const next = normalizeQuantity(raw, min, max)
    setDraft(null)
    if (next !== value) onChange(next)
  }
  const action = label.charAt(0).toLowerCase() + label.slice(1)
  const atMin = value <= min
  const atMax = value >= max
  const button = cn(
    'grid shrink-0 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed',
    size === 'round'
      ? 'relative size-6 border-border bg-surface-2 text-foreground after:absolute after:-inset-2 hover:border-primary disabled:text-border-strong disabled:hover:border-border'
      : 'border-background bg-primary text-black hover:bg-highlight disabled:hover:bg-primary',
    size === 'md' && 'h-[50px] w-[33px]',
    size === 'sm' &&
      'relative h-[30px] w-5 shadow-[0_4px_12px_-2px_rgb(20_13_10/0.15)] after:absolute after:-inset-x-2 after:-inset-y-1',
    // No limite o botão só desabilita (o Figma mantém a cor); edição indisponível apaga tudo.
    disabled && 'opacity-40',
  )

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={button}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || atMin}
          aria-label={`Diminuir ${action}`}
        >
          <span
            aria-hidden
            className={cn('block h-0.5 bg-current', size === 'md' ? 'w-[15px]' : 'w-[9px]')}
          />
        </button>
        <label htmlFor={inputId} className="sr-only">
          {label}
        </label>
        <input
          id={inputId}
          inputMode="numeric"
          value={draft ?? String(value)}
          disabled={disabled}
          aria-describedby={atMax && limitMessage ? hintId : undefined}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={(e) => commit(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit(e.currentTarget.value)
          }}
          className={cn(
            'w-8 bg-transparent text-center outline-none focus-visible:outline-2 focus-visible:outline-highlight',
            size === 'md' && 'text-xl leading-7',
            size === 'sm' && 'text-lg leading-[25px] font-medium',
            size === 'round' && 'text-base leading-[22px]',
          )}
          // No mobile o campo acompanha a largura dos dígitos (o "1" do Figma tem 11px).
          style={size !== 'md' ? { width: `${(draft ?? String(value)).length || 1}ch` } : undefined}
        />
        <button
          type="button"
          className={button}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || atMax}
          aria-label={`Aumentar ${action}`}
        >
          <span
            aria-hidden
            className={cn('relative block', size === 'md' ? 'size-[15px]' : 'size-[9px]')}
          >
            <span className="absolute top-1/2 left-0 h-0.5 w-full -translate-y-1/2 bg-current" />
            <span className="absolute top-0 left-1/2 h-full w-0.5 -translate-x-1/2 bg-current" />
          </span>
        </button>
      </div>
      {atMax && limitMessage && (
        <p id={hintId} className="text-xs text-text-2">
          {limitMessage}
        </p>
      )}
    </div>
  )
}
