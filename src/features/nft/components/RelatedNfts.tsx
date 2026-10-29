import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/NftCard'
import { cn } from '@/lib/utils'
import { relatedOptions } from '../queries'

const PAGE_SIZE = 5

/**
 * "Mais desta coleção": rolagem horizontal no mobile; no desktop, carrossel de 5
 * com os indicadores do Figma (Carousel Dots: 12px, o ativo preenchido).
 */
export function RelatedNfts({
  nftId,
  title = 'Mais desta coleção',
}: {
  nftId: string
  /** O carrinho usa a mesma vitrine como "Colecionadores também viram". */
  title?: string
}) {
  const { data, isPending, isError } = useQuery(relatedOptions(nftId))
  const [page, setPage] = useState(0)
  if (isError || (data && data.length === 0)) return null

  const pages = data ? Math.ceil(data.length / PAGE_SIZE) : 1
  const current = Math.min(page, pages - 1)
  const inPage = (i: number) => Math.floor(i / PAGE_SIZE) === current

  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 id="relacionados-titulo" className="text-[17px] leading-4 font-bold text-highlight">
          {title}
        </h2>
        <hr className="border-primary/30" />
      </div>
      <div className="flex flex-col gap-8">
        <ul className="-mx-6 flex snap-x gap-7 overflow-x-auto px-6 pb-2 [scrollbar-width:none] md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0 md:pb-0">
          {isPending
            ? Array.from({ length: PAGE_SIZE }, (_, i) => (
                <li key={i} className="w-[60vw] shrink-0 md:w-auto">
                  <NftCardSkeleton />
                </li>
              ))
            : data.map((nft, i) => (
                <li
                  key={nft.id}
                  className={cn(
                    'w-[60vw] shrink-0 snap-start md:w-auto',
                    !inPage(i) && 'md:hidden',
                  )}
                >
                  <NftCard nft={nft} compact />
                </li>
              ))}
        </ul>
        {pages > 1 && (
          <div
            role="group"
            aria-label={`Páginas de ${title}`}
            // WCAG 2.5.8: 24px entre os centros, área de toque de 24px sem sobrepor a vizinha.
            className="hidden justify-center gap-3 md:flex"
          >
            {Array.from({ length: pages }, (_, i) => (
              <button
                key={i}
                type="button"
                aria-label={`Página ${i + 1} de ${pages}`}
                aria-pressed={i === current}
                onClick={() => setPage(i)}
                className={cn(
                  'relative size-3 rounded-full border-[1.3px] border-primary after:absolute after:-inset-1.5',
                  i === current && 'bg-primary',
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
