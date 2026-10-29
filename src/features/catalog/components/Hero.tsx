import { useQuery } from '@tanstack/react-query'
import { Link } from '@tanstack/react-router'
import { useState } from 'react'
import { Icon } from '@/components/icon'
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

// Brilhos circulares do banner mobile (Ellipse 49 e 50 do Figma).
const GLOW =
  'pointer-events-none absolute size-[248px] rounded-full bg-[linear-gradient(160deg,rgb(221_154_95/0.43),rgb(210_138_76/0.04))]'

/** Banner do topo no frame "Mobile / Início": texto à esquerda, duas artes sobrepostas à direita. */
export function MobileHero() {
  const { data } = useQuery(featuredOptions)
  const [index, setIndex] = useState(0)
  const slides = data?.hero ?? []
  const current = slides[index]
  const next = slides.length > 1 ? slides[(index + 1) % slides.length] : undefined

  return (
    <section
      aria-labelledby="hero-mobile-titulo"
      className="relative h-[190px] overflow-hidden rounded-[30px] bg-[linear-gradient(135deg,rgb(210_138_76/0.2),rgb(210_138_76/0.1))] md:hidden"
    >
      <span aria-hidden className={cn(GLOW, '-top-[31px] -left-20')} />
      <span aria-hidden className={cn(GLOW, '-top-2.5 left-[73px] opacity-85')} />

      <div className="relative flex h-full gap-2 px-4 pt-1.5 pb-7">
        <div className="flex w-[188px] shrink-0 flex-col">
          <p className="text-xs leading-4 font-medium">Bem-vindo à Kurio</p>
          <h1 id="hero-mobile-titulo" className="mt-1.5 text-lg leading-[29px] font-bold">
            SEJA DONO DA
            <br />
            CULTURA DIGITAL
          </h1>
          <p className="mt-1.5 text-xs leading-[18px] text-text-2">
            Descubra NFTs selecionados de criadores do mundo todo.
          </p>
          <Link
            to="/"
            hash="catalogo"
            className="mt-auto flex w-fit items-center gap-2 text-xs leading-[14px] font-bold text-highlight hover:underline"
          >
            EXPLORAR
            <Icon name="arrow-right" size={16} className="text-primary" />
          </Link>
        </div>

        <div className="relative mt-[5px] size-[138px] shrink-0">
          {current ? (
            <Link to="/nft/$nftId" params={{ nftId: current.id }} className="block">
              <NftImage
                image={current.image}
                priority
                sizes="138px"
                className="size-[138px] rounded-2xl"
                alt={`${current.name}, NFT em destaque`}
              />
            </Link>
          ) : (
            <Skeleton className="size-full rounded-2xl" />
          )}
          {next && (
            <NftImage
              image={next.image}
              sizes="58px"
              alt=""
              className="absolute top-[88px] left-3.5 size-[58px] rounded-2xl"
            />
          )}
        </div>
      </div>

      {slides.length > 1 && (
        <div
          role="group"
          aria-label="Destaques"
          className="absolute bottom-[5px] left-1/2 flex -translate-x-1/2 gap-1.5"
        >
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Mostrar destaque ${i + 1}: ${s.name}`}
              aria-pressed={i === index}
              onClick={() => setIndex(i)}
              className={cn(
                'relative size-[7px] rounded-full bg-primary transition-opacity after:absolute after:-inset-2',
                i === index ? 'opacity-100' : 'opacity-60',
              )}
            />
          ))}
        </div>
      )}
    </section>
  )
}
