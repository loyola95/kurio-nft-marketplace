import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import type { CatalogPage } from '@/contracts/nft'
import { cn } from '@/lib/utils'
import { useCatalogSearch } from '../useCatalogSearch'

type Facets = CatalogPage['facets']

function FacetRow({
  label,
  count,
  selected,
  onToggle,
  boldCount = false,
}: {
  label: string
  count: number
  selected: boolean
  onToggle: () => void
  /** No Figma as contagens de Coleções são em negrito e as de Rede, não. */
  boldCount?: boolean
}) {
  return (
    <li>
      <button
        type="button"
        aria-pressed={selected}
        onClick={onToggle}
        className={cn(
          'relative flex h-10 w-full items-center justify-between gap-2 text-left text-[15px] leading-10 transition-colors hover:text-highlight',
          selected ? 'text-highlight' : 'text-text-2',
        )}
      >
        {/* Estado não depende só da cor: o check ocupa o recuo de 12px da lista quando ativo. */}
        {selected && (
          <span aria-hidden className="absolute -left-3 text-[11px] leading-none">
            ✓
          </span>
        )}
        <span>{label}</span>
        <span className={boldCount ? 'font-bold' : undefined}>({count})</span>
      </button>
    </li>
  )
}

const toInput = (v: number) => v.toFixed(2).replace('.', ',')

/**
 * Faixa de preço do Figma (slider + "Preço: 0,02 - 12,30 ETH" + Aplicar). Os dois
 * números da linha são campos editáveis (comentário #60): digitar move o slider,
 * arrastar atualiza os números e Enter aplica. Valores fora da faixa são corrigidos.
 */
function PriceFilter({ range }: { range: Facets['priceRange'] }) {
  const { search, update } = useCatalogSearch()
  const min = Number(range.min)
  const max = Number(range.max)
  const applied: [number, number] = [
    search.precoMin ? Number(search.precoMin) : min,
    search.precoMax ? Number(search.precoMax) : max,
  ]
  const [value, setValue] = useState<[number, number]>(applied)
  // Texto em edição de cada campo; null mostra o valor do slider.
  const [typing, setTyping] = useState<[string | null, string | null]>([null, null])
  const labelId = useId()

  const clampPair = (next: [number, number], edited: 0 | 1): [number, number] => {
    const [lo, hi] = next.map((n) => Math.min(max, Math.max(min, n))) as [number, number]
    if (lo <= hi - 0.01) return [lo, hi]
    return edited === 0 ? [Math.max(min, hi - 0.01), hi] : [lo, Math.min(max, lo + 0.01)]
  }

  const commit = (index: 0 | 1): [number, number] => {
    const raw = typing[index]
    setTyping([null, null])
    if (raw === null) return value
    const parsed = Number(raw.replace(',', '.'))
    if (!Number.isFinite(parsed) || raw.trim() === '') return value
    const next: [number, number] = [...value]
    next[index] = Math.round(parsed * 100) / 100
    const clamped = clampPair(next, index)
    setValue(clamped)
    return clamped
  }

  const apply = (v: [number, number]) =>
    update({
      precoMin: v[0] > min ? v[0].toFixed(2) : undefined,
      precoMax: v[1] < max ? v[1].toFixed(2) : undefined,
    })

  const field = (index: 0 | 1, label: string) => (
    <input
      aria-label={label}
      inputMode="decimal"
      value={typing[index] ?? toInput(value[index])}
      onChange={(e) => {
        const next: [string | null, string | null] = [...typing]
        next[index] = e.target.value.replace(/[^\d.,]/g, '')
        setTyping(next)
      }}
      onBlur={() => commit(index)}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          apply(commit(index))
        }
      }}
      className="w-[5ch] border-b border-dashed border-text-3 bg-transparent text-center outline-none hover:border-primary focus:border-solid focus:border-primary focus:bg-surface-2"
    />
  )

  return (
    <div className="flex flex-col gap-3 pl-3">
      <Slider
        min={min}
        max={max}
        step={0.01}
        value={value}
        minStepsBetweenThumbs={1}
        onValueChange={(v) => {
          setTyping([null, null])
          setValue([v[0], v[1]])
        }}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        getValueText={(v) => `${v.toFixed(2).replace('.', ',')} ETH`}
        className="h-[21px]"
      />
      <p id={labelId} className="text-[15px] leading-5">
        Preço: {field(0, 'Preço mínimo em ETH')} - {field(1, 'Preço máximo em ETH')} ETH
        <span className="sr-only">. Digite os valores ou use o controle deslizante.</span>
      </p>
      <Button
        type="button"
        size="sm"
        className="h-9 w-[92px] rounded-md px-3 text-base leading-5 font-bold"
        // Sem mudança em relação ao filtro aplicado, "Aplicar" não teria efeito.
        disabled={
          value[0] === applied[0] && value[1] === applied[1] && typing.every((t) => t === null)
        }
        onClick={() => apply(value)}
      >
        Aplicar
      </Button>
    </div>
  )
}

export function FilterPanel({
  facets,
  failed = false,
}: {
  facets: Facets | undefined
  /** O catálogo falhou: sem facetas, os skeletons ficariam pulsando para sempre. */
  failed?: boolean
}) {
  const { search, toggle, clear, hasFilters } = useCatalogSearch()

  if (failed && !facets) {
    return (
      <div className="flex flex-col gap-3 bg-surface p-5">
        <h2 className="text-lg leading-4 font-bold">Filtros</h2>
        <p className="text-sm leading-[22px] text-text-2">
          Os filtros aparecem quando o catálogo carregar.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-10 bg-surface p-5">
      <section aria-labelledby="filtro-colecoes" className="flex flex-col gap-3">
        <h2 id="filtro-colecoes" className="text-lg leading-4 font-bold">
          Coleções
        </h2>
        <ul className="px-3">
          {facets
            ? facets.categories.map((c) => (
                <FacetRow
                  key={c.id}
                  label={c.label}
                  count={c.count}
                  selected={search.categorias?.includes(c.id) ?? false}
                  onToggle={() => toggle('categorias', c.id)}
                  boldCount
                />
              ))
            : Array.from({ length: 9 }, (_, i) => (
                <li key={i} className="flex h-10 items-center">
                  <Skeleton className="h-4 w-full" />
                </li>
              ))}
        </ul>
      </section>

      <section aria-labelledby="filtro-preco" className="flex flex-col gap-3">
        <h2 id="filtro-preco" className="text-lg leading-4 font-bold">
          Faixa de preço
        </h2>
        {facets ? (
          // A key remonta o controle quando a URL muda (histórico, limpar filtros).
          <PriceFilter
            key={`${search.precoMin ?? ''}-${search.precoMax ?? ''}`}
            range={facets.priceRange}
          />
        ) : (
          <Skeleton className="ml-3 h-[101px]" />
        )}
      </section>

      <section aria-labelledby="filtro-rede" className="flex flex-col gap-3">
        <h2 id="filtro-rede" className="text-lg leading-4 font-bold">
          Rede
        </h2>
        <ul className="px-3">
          {facets
            ? facets.networks.map((n) => (
                <FacetRow
                  key={n.id}
                  label={n.label}
                  count={n.count}
                  selected={search.redes?.includes(n.id) ?? false}
                  onToggle={() => toggle('redes', n.id)}
                />
              ))
            : Array.from({ length: 3 }, (_, i) => (
                <li key={i} className="flex h-10 items-center">
                  <Skeleton className="h-4 w-full" />
                </li>
              ))}
        </ul>
      </section>

      {hasFilters && (
        <Button type="button" variant="outline" size="sm" onClick={clear}>
          Limpar filtros
        </Button>
      )}
    </div>
  )
}
