import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'
import { pageWindow } from '../labels'

const box =
  'grid size-[35px] place-items-center rounded-sm border border-border text-lg leading-4 transition-colors hover:border-primary'

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  if (totalPages <= 1) return null
  const pages = pageWindow(page, totalPages)
  const to = (p: number) => ({
    to: '/' as const,
    search: (prev: Record<string, unknown>) => ({ ...prev, pagina: p === 1 ? undefined : p }),
    hash: 'catalogo',
  })

  return (
    <nav aria-label="Paginação do catálogo" className="flex justify-end">
      <ul className="flex gap-2">
        {page > 1 && (
          <li>
            <Link {...to(page - 1)} className={cn(box, 'p-2')} aria-label="Página anterior">
              <Icon name="arrow-right-2" size={18} className="rotate-180" />
            </Link>
          </li>
        )}
        {pages.map((p) => (
          <li key={p}>
            <Link
              {...to(p)}
              aria-label={`Página ${p}`}
              aria-current={p === page ? 'page' : undefined}
              className={cn(
                box,
                p === page && 'border-primary bg-primary font-bold text-primary-foreground',
              )}
            >
              {p}
            </Link>
          </li>
        ))}
        {page < totalPages && (
          <li>
            <Link {...to(page + 1)} className={cn(box, 'p-2')} aria-label="Próxima página">
              <Icon name="arrow-right-2" size={18} />
            </Link>
          </li>
        )}
      </ul>
    </nav>
  )
}
