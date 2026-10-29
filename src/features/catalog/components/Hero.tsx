import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { featuredOptions } from '../queries'
import { NftImage } from './NftImage'

/** Destaques do topo (desktop e tablet). A arte troca pelos indicadores; sem autoplay. */
export function Hero() {
  const { data } = useQuery(featuredOptions)
  const [index, setIndex] = useState(0)
  const slides = data?.hero ?? []
  const current = slides[index]

  return (
    <section
      aria-labelledby="hero-titulo"
      className="hidden h-[450px] items-center gap-[110px] md:flex md:gap-10 lg:gap-[110px] lg:pl-10"
    >
      <div className="flex max-w-[600px] flex-1 flex-col gap-11">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-1">
            <p className="text-sm leading-4 font-medium">Bem-vindo à Kurio</p>
            <h1
              id="hero-titulo"
              className="mt-2 text-[32px] leading-[52px] font-bold lg:text-[43px] lg:leading-[70px]"
            >
              SEJA DONO DO FUTURO
              <br />
              DA ARTE DIGITAL
            </h1>
            <p className="max-w-[557px] text-sm leading-6 text-text-2">
              Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
              digital rara, apoie artistas e tenha uma parte da cultura da internet.
            </p>
          </div>
          <Button asChild className="w-[140px] pr-9 pl-7">
            <Link to="/" hash="catalogo">
              EXPLORAR
            </Link>
          </Button>
        </div>
        {slides.length > 1 && (
          <div role="group" aria-label="Destaques" className="flex justify-end gap-2">
            {slides.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Mostrar destaque ${i + 1}: ${s.name}`}
                aria-pressed={i === index}
                onClick={() => setIndex(i)}
                className={cn(
                  'size-2 rounded-full bg-primary transition-opacity after:absolute after:-m-3 after:size-8',
                  i === index ? 'opacity-100' : 'opacity-40 hover:opacity-70',
                )}
              />
            ))}
          </div>
        )}
      </div>
      <div className="aspect-square w-[340px] shrink-0 lg:w-[450px]">
        {current ? (
          <Link to="/nft/$nftId" params={{ nftId: current.id }} className="block">
            <NftImage
              image={current.image}
              priority
              sizes="(min-width: 1024px) 450px, 340px"
              className="aspect-square w-full rounded-[24px]"
              alt={`${current.name}, NFT em destaque`}
            />
          </Link>
        ) : (
          <Skeleton className="size-full rounded-[24px]" />
        )}
      </div>
    </section>
  )
}

/** Banner do topo no frame "Mobile / Início". */
export function MobileHero() {
  const { data } = useQuery(featuredOptions)
  const nft = data?.hero[0]
  return (
    <section
      aria-labelledby="hero-mobile-titulo"
      className="relative h-[190px] overflow-hidden rounded-xl bg-surface md:hidden"
    >
      {nft ? (
        <NftImage
          image={nft.image}
          priority
          sizes="100vw"
          alt=""
          className="absolute inset-0 h-full w-full opacity-35"
        />
      ) : (
        <Skeleton className="absolute inset-0 rounded-none" />
      )}
      <div className="relative flex h-full flex-col justify-center gap-4 p-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium">Bem-vindo à Kurio</p>
          <h1 id="hero-mobile-titulo" className="text-[22px] leading-[29px] font-bold">
            SEJA DONO DA CULTURA DIGITAL
          </h1>
          <p className="text-xs leading-4 text-text-2">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
        </div>
        <Button asChild size="sm" className="w-fit">
          <Link to="/" hash="catalogo">
            EXPLORAR
          </Link>
        </Button>
      </div>
    </section>
  )
}
