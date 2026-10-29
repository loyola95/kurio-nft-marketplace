import { useId, useRef, type KeyboardEvent } from 'react'
import type { Edition } from '@/contracts/nft'
import { cn } from '@/lib/utils'

const STATUS_TEXT: Record<Edition['status'], string | null> = {
  available: null,
  sold_out: 'Esgotada',
  unavailable: 'Indisponível',
}

/** Chips de edição (1/1, 1/10, 1/50, ABERTA). Esgotada ou indisponível fica desabilitada com texto. */
export function EditionSelector({
  editions,
  selectedId,
  onSelect,
  compact = false,
}: {
  editions: Edition[]
  selectedId: string
  onSelect: (id: string) => void
  /** Espaçamentos do frame mobile. */
  compact?: boolean
}) {
  // O seletor aparece duas vezes na página (desktop e mobile): id próprio para o rótulo.
  const labelId = useId()
  const group = useRef<HTMLDivElement>(null)
  const selectable = editions.filter((e) => e.status === 'available')

  // Padrão ARIA de radiogroup: Tab entra pela opção marcada; setas, Home e End
  // trocam a edição pulando as esgotadas ou indisponíveis.
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const index = selectable.findIndex((e) => e.id === selectedId)
    const last = selectable.length - 1
    const next =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? index >= last
          ? 0
          : index + 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? index <= 0
            ? last
            : index - 1
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? last
              : null
    if (next === null || !selectable[next]) return
    event.preventDefault()
    const target = selectable[next]
    onSelect(target.id)
    group.current?.querySelector<HTMLElement>(`[data-edition="${target.id}"]`)?.focus()
  }

  return (
    <div className={cn('flex flex-col', compact ? 'gap-2' : 'gap-3')}>
      <p id={labelId} className="text-[15px] leading-4 font-bold">
        Edição:
      </p>
      <div
        ref={group}
        role="radiogroup"
        aria-labelledby={labelId}
        onKeyDown={onKeyDown}
        tabIndex={-1}
        className={cn('flex flex-wrap', compact ? 'gap-3' : 'gap-1.5')}
      >
        {editions.map((e) => {
          const selected = e.id === selectedId
          const blocked = e.status !== 'available'
          const status = STATUS_TEXT[e.status]
          return (
            <button
              key={e.id}
              type="button"
              role="radio"
              aria-checked={selected}
              data-edition={e.id}
              tabIndex={selected ? 0 : -1}
              aria-disabled={blocked || undefined}
              aria-label={status ? `${e.label}, ${status.toLowerCase()}` : e.label}
              title={status ?? undefined}
              onClick={() => !blocked && onSelect(e.id)}
              className={cn(
                'h-7 rounded-full border text-sm leading-4 transition-colors',
                // Respiros do Figma: 4px, 6px na selecionada e 8px no ABERTA.
                e.label === 'ABERTA' ? 'px-2' : selected ? 'px-1.5' : 'px-1',
                selected
                  ? 'border-primary font-medium text-highlight'
                  : 'border-border text-text-2 hover:border-primary',
                blocked &&
                  'cursor-not-allowed text-text-3 line-through opacity-60 hover:border-border',
              )}
            >
              {e.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
