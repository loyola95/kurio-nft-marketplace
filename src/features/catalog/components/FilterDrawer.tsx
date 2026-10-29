import { Icon } from '@/components/icon'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { CatalogPage } from '@/contracts/nft'
import { SortSelect } from './CatalogToolbar'
import { FilterPanel } from './FilterPanel'

/** Filtros em gaveta no mobile e tablet; o Sheet prende e devolve o foco. */
export function FilterDrawer({
  facets,
  activeCount,
  variant = 'icon',
}: {
  facets: CatalogPage['facets'] | undefined
  activeCount: number
  variant?: 'icon' | 'button'
}) {
  const label = activeCount ? `Filtros (${activeCount} ativos)` : 'Filtros'
  return (
    <Sheet>
      <SheetTrigger asChild>
        {variant === 'icon' ? (
          <button
            type="button"
            aria-label={label}
            className="relative grid size-[45px] shrink-0 place-items-center rounded-[14px] bg-[linear-gradient(135deg,rgb(210_138_76/0.45),rgb(210_138_76))] text-primary-foreground"
          >
            <Icon name="filter" size={22} />
            {activeCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-foreground text-[11px] font-bold text-background"
              >
                {activeCount}
              </span>
            )}
          </button>
        ) : (
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-md border border-border px-3 text-sm hover:border-primary"
          >
            <Icon name="filter" size={18} />
            {label}
          </button>
        )}
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[340px] max-w-[90vw] overflow-y-auto border-border bg-background p-0"
      >
        <div className="flex flex-col gap-2 p-5 pb-0">
          <SheetTitle className="text-lg font-bold">Filtros</SheetTitle>
          <SheetDescription className="text-sm text-text-2">
            Os resultados atualizam a cada filtro escolhido.
          </SheetDescription>
          <div className="py-3">
            <SortSelect />
          </div>
        </div>
        <FilterPanel facets={facets} />
      </SheetContent>
    </Sheet>
  )
}
