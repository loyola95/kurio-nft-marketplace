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
}: {
  editions: Edition[]
  selectedId: string
  onSelect: (id: string) => void
}) {
  return (
    <div className="flex flex-col gap-3">
      <p id="edicao-rotulo" className="text-[15px] leading-4 font-bold">
        Edição:
      </p>
      <div role="radiogroup" aria-labelledby="edicao-rotulo" className="flex flex-wrap gap-1.5">
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
              aria-disabled={blocked || undefined}
              aria-label={status ? `${e.label}, ${status.toLowerCase()}` : e.label}
              title={status ?? undefined}
              onClick={() => !blocked && onSelect(e.id)}
              className={cn(
                'h-7 rounded-full border px-1.5 text-sm leading-4 transition-colors',
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
