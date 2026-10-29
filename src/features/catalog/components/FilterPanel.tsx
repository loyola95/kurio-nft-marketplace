import { useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Slider } from '@/components/ui/slider'
import type { CatalogPage } from '@/contracts/nft'
import { formatEthRange } from '@/lib/money'
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

function PriceFilter({ range }: { range: Facets['priceRange'] }) {
  const { search, update } = useCatalogSearch()
  const min = Number(range.min)
  const max = Number(range.max)
  const applied: [number, number] = [
    search.precoMin ? Number(search.precoMin) : min,
    search.precoMax ? Number(search.precoMax) : max,
  ]
  const [value, setValue] = useState<[number, number]>(applied)
  const labelId = useId()

  const text = formatEthRange(value[0].toFixed(2), value[1].toFixed(2))
  return (
    <div className="flex flex-col gap-3 pl-3">
      <Slider
        min={min}
        max={max}
        step={0.01}
        value={value}
        minStepsBetweenThumbs={1}
        onValueChange={(v) => setValue([v[0], v[1]])}
        thumbLabels={['Preço mínimo', 'Preço máximo']}
        getValueText={(v) => `${v.toFixed(2).replace('.', ',')} ETH`}
        className="h-[21px]"
      />
      <p id={labelId} className="text-[15px] leading-5">
        Preço: {text}
      </p>
      <Button
        type="button"
        size="sm"
        className="h-9 w-[92px] rounded-md px-3 text-base leading-5 font-bold"
        onClick={() =>
          update({
            precoMin: value[0] > min ? value[0].toFixed(2) : undefined,
            precoMax: value[1] < max ? value[1].toFixed(2) : undefined,
          })
        }
      >
        Aplicar
      </Button>
    </div>
  )
}

export function FilterPanel({ facets }: { facets: Facets | undefined }) {
  const { search, toggle, clear, hasFilters } = useCatalogSearch()

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
        <ul className="pl-3">
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
