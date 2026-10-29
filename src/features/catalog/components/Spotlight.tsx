import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { Skeleton } from '@/components/ui/skeleton'
import { formatEth } from '@/lib/money'
import { featuredOptions } from '../queries'
import { NftImage } from './NftImage'

/** Banner "NFT em destaque / oferta limitada" da barra lateral. */
export function Spotlight() {
  const { data } = useQuery(featuredOptions)
  const nft = data?.spotlight
  return (
    <section
      aria-labelledby="destaque-titulo"
      className="relative flex flex-col gap-4 overflow-hidden pt-6 pb-1"
      style={{
        background: 'linear-gradient(180deg, rgba(210,138,76,0.10) 0%, rgba(210,138,76,0.03) 100%)',
      }}
    >
      <div className="flex flex-col gap-4 px-5">
        <h2 id="destaque-titulo" className="text-2xl leading-8 font-bold text-highlight">
          NFT EM DESTAQUE
        </h2>
        <p className="text-[22px] leading-4 font-bold">OFERTA LIMITADA</p>
      </div>
      {nft ? (
        <Link
          to="/nft/$nftId"
          params={{ nftId: nft.id }}
          className="group relative block"
          aria-label={`${nft.name}, ${formatEth(nft.priceEth)}`}
        >
          <NftImage
            image={nft.image}
            sizes="310px"
            className="aspect-[310/368] w-full rounded-[22px] transition-transform group-hover:scale-[1.01] motion-reduce:transition-none"
          />
        </Link>
      ) : (
        <Skeleton className="aspect-[310/368] w-full rounded-[22px]" />
      )}
      <span
        aria-hidden
        className="pointer-events-none absolute right-[17px] bottom-[127px] size-[45px] rounded-[29px] opacity-30"
        style={{ background: 'linear-gradient(135deg, #d28a4c 0%, rgba(210,138,76,0) 100%)' }}
      />
    </section>
  )
}
