import { useId } from 'react'
import { Icon } from '@/components/icon'
import type { CatalogSort, CatalogTab } from '@/contracts/nft'
import { SORT_LABEL } from '../labels'
import { cn } from '@/lib/utils'
import { useCatalogSearch } from '../useCatalogSearch'

const TABS: { id: CatalogTab; label: string }[] = [
  { id: 'todos', label: 'Todos os NFTs' },
  { id: 'lancamentos', label: 'Novos lançamentos' },
  { id: 'em-alta', label: 'Em alta' },
]

export function CatalogTabs() {
  const { search, update } = useCatalogSearch()
  const active = search.aba ?? 'todos'
  return (
    <div
      role="group"
      aria-label="Seção do catálogo"
      className="flex gap-4 overflow-x-auto [scrollbar-width:none] md:gap-5 md:overflow-visible"
    >
      {TABS.map((tab) => {
        const selected = tab.id === active
        return (
          <button
            key={tab.id}
            type="button"
            aria-pressed={selected}
            onClick={() => update({ aba: tab.id === 'todos' ? undefined : tab.id })}
            className={cn(
              'relative pb-1.5 text-sm leading-4 font-medium whitespace-nowrap hover:text-highlight md:text-[15px]',
              selected ? 'text-highlight max-md:font-bold' : 'text-foreground max-md:font-normal',
            )}
          >
            {tab.label}
            {selected && (
              <span
                aria-hidden
                className="absolute inset-x-0 bottom-0 h-0.5 bg-primary md:-bottom-0.5"
              />
            )}
          </button>
        )
      })}
    </div>
  )
}

/** Select nativo estilizado como o texto "Ordenar por:" do Figma (teclado e leitor de tela de graça). */
export function SortSelect() {
  const { search, update } = useCatalogSearch()
  const id = useId()
  return (
    // Na gaveta do celular o seletor desce para a linha de baixo em vez de ser cortado.
    <div className="flex flex-wrap items-center gap-x-1 gap-y-1 text-[15px] leading-5">
      <label htmlFor={id} className="whitespace-nowrap">
        Ordenar por:
      </label>
      <span className="relative flex items-center">
        <select
          id={id}
          value={search.ordem ?? 'recentes'}
          onChange={(e) => {
            const value = e.target.value as CatalogSort
            update({ ordem: value === 'recentes' ? undefined : value })
          }}
          className="cursor-pointer appearance-none bg-transparent pr-6 text-foreground outline-none focus-visible:outline-2 focus-visible:outline-highlight"
        >
          {Object.entries(SORT_LABEL).map(([value, label]) => (
            <option key={value} value={value} className="bg-surface text-foreground">
              {label}
            </option>
          ))}
        </select>
        <Icon name="chevron-down" size={16} className="pointer-events-none absolute right-0" />
      </span>
    </div>
  )
}
