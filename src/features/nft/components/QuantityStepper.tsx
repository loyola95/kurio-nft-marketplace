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
  size?: 'md' | 'sm'
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
  const atMin = value <= min
  const atMax = value >= max
  const button = cn(
    'grid shrink-0 place-items-center rounded-full border border-background bg-primary text-black transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-40',
    size === 'md' ? 'h-[50px] w-[33px]' : 'size-8',
  )

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className={button}
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={disabled || atMin}
          aria-label={`Diminuir ${label.toLowerCase()}`}
        >
          <span aria-hidden className="block h-0.5 w-[15px] bg-current" />
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
            size === 'md' ? 'text-xl leading-7' : 'text-base',
          )}
        />
        <button
          type="button"
          className={button}
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={disabled || atMax}
          aria-label={`Aumentar ${label.toLowerCase()}`}
        >
          <span aria-hidden className="relative block size-[15px]">
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
