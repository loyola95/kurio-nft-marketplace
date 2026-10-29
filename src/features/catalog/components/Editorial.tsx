import { Link } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const PROMOS = [
  {
    title: ['Lançamentos gênesis', 'de edição limitada'],
    text: 'Colecione edições escassas diretamente dos criadores antes da revelação pública.',
    image: '/images/nfts/emerald-ape-640.webp',
    search: { aba: 'lancamentos' as const },
  },
  {
    title: ['Arte digital selecionada', 'e muito mais'],
    text: 'Explore novos artistas, coleções verificadas e obras digitais que definem a cultura.',
    image: '/images/nfts/ivory-baron-640.webp',
    search: { categorias: ['arte-digital' as const] },
  },
]

const POSTS = [
  {
    date: '12 de setembro',
    read: '6 min',
    title: 'Como funciona a propriedade de NFTs',
    text: 'Aprenda a colecionar, negociar e verificar ativos digitais.',
    image: '/images/nfts/ivory-baron-640.webp',
  },
  {
    date: '13 de setembro',
    read: '2 min',
    title: '10 artistas digitais para acompanhar',
    text: 'Conheça criadores que moldam a cultura digital.',
    image: '/images/nfts/emerald-ape-640.webp',
  },
  {
    date: '15 de setembro',
    read: '3 min',
    title: 'Raridade, atributos e procedência',
    text: 'Entenda raridade, procedência, direitos autorais e utilidade.',
    image: '/images/nfts/sage-nomad-640.webp',
  },
  {
    date: '15 de setembro',
    read: '2 min',
    title: 'Como proteger sua carteira',
    text: 'Proteja sua carteira, seus ativos e sua identidade.',
    image: '/images/nfts/golden-beat-640.webp',
  },
]

// Arcos decorativos do Mask Group (Ellipse 7 e 8), recortados pelo card.
const ARC = 'pointer-events-none absolute size-64 rounded-full border-primary'

/** Cards de 586x250 do Figma: texto alinhado à direita com respiro de 30px e posições fixas. */
export function Promos() {
  return (
    <section aria-label="Coleções em destaque" className="grid gap-7 xl:grid-cols-2">
      {PROMOS.map((p) => (
        <article
          key={p.title[0]}
          className="relative h-[250px] overflow-hidden rounded-lg bg-surface"
        >
          <img
            src={p.image}
            alt=""
            width={292}
            height={250}
            loading="lazy"
            className="absolute inset-y-0 left-0 h-full w-[292px] rounded-[18px] object-cover"
          />
          <span aria-hidden className={cn(ARC, 'top-[142px] -left-[191px] border-2')} />
          <span aria-hidden className={cn(ARC, 'top-[134px] -left-[199px] border')} />
          <div className="absolute top-[37px] right-[30px] flex w-[263px] flex-col items-end text-right">
            <h2 className="text-lg leading-6 font-bold whitespace-nowrap">
              {p.title[0]}
              <br />
              {p.title[1]}
            </h2>
            <p className="mt-[9px] text-sm leading-6 text-text-2">{p.text}</p>
          </div>
          <Button
            asChild
            size="sm"
            className="absolute top-[164px] right-[30px] h-10 w-[140px] text-sm font-medium"
          >
            <Link to="/" search={p.search} hash="catalogo">
              Explorar
              <Icon name="arrow-right" size={18} />
            </Link>
          </Button>
        </article>
      ))}
    </section>
  )
}

export function Blog() {
  return (
    <section aria-labelledby="blog-titulo" className="flex flex-col gap-10">
      <header className="flex flex-col gap-3 text-center">
        <h2 id="blog-titulo" className="text-[28px] leading-[37px] font-bold">
          Diário da Cunhagem
        </h2>
        <p className="text-sm leading-[18px] text-text-2">
          Histórias, guias e insights para colecionadores sobre o universo da propriedade digital.
        </p>
      </header>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSTS.map((post) => (
          <li key={post.title}>
            <article className="relative flex h-full flex-col overflow-hidden rounded-lg bg-surface">
              <img
                src={post.image}
                alt=""
                width={268}
                height={195}
                loading="lazy"
                className="aspect-[268/195] w-full object-cover"
              />
              <div className="flex flex-1 flex-col gap-2 px-4 pt-3 pb-4">
                <p className="min-h-8 text-xs leading-4 font-medium text-text-2">
                  {post.date}
                  {/* Dois espaços de cada lado da barra, como no Figma. */}
                  {'  |  '}Leitura de {post.read}
                </p>
                <h3 className="min-h-[42px] text-base leading-[21px] font-bold">{post.title}</h3>
                <p className="min-h-8 text-xs leading-4 font-medium text-text-2">{post.text}</p>
                <Link
                  to="/indisponivel"
                  search={{ de: 'blog' }}
                  className="mt-auto text-xs leading-4 font-bold text-highlight after:absolute after:inset-0 hover:underline"
                >
                  Ler mais <span aria-hidden>→</span>
                  <span className="sr-only">: {post.title}</span>
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ul>
    </section>
  )
}
