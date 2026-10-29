import { useQuery } from '@tanstack/react-query'
import { NftCard, NftCardSkeleton } from '@/features/catalog/components/NftCard'
import { relatedOptions } from '../queries'

/** "Mais desta coleção": rolagem horizontal no mobile, grade de 5 no desktop. */
export function RelatedNfts({ nftId }: { nftId: string }) {
  const { data, isPending, isError } = useQuery(relatedOptions(nftId))
  if (isError || (data && data.length === 0)) return null
  return (
    <section aria-labelledby="relacionados-titulo" className="flex flex-col gap-8">
      <div className="flex flex-col gap-3">
        <h2 id="relacionados-titulo" className="text-[17px] leading-4 font-bold text-highlight">
          Mais desta coleção
        </h2>
        <hr className="border-primary/30" />
      </div>
      <ul className="-mx-6 flex snap-x gap-7 overflow-x-auto px-6 pb-2 md:mx-0 md:grid md:grid-cols-5 md:overflow-visible md:px-0">
        {isPending
          ? Array.from({ length: 5 }, (_, i) => (
              <li key={i} className="w-[60vw] shrink-0 md:w-auto">
                <NftCardSkeleton />
              </li>
            ))
          : data.map((nft) => (
              <li key={nft.id} className="w-[60vw] shrink-0 snap-start md:w-auto">
                <NftCard nft={nft} />
              </li>
            ))}
      </ul>
    </section>
  )
}
