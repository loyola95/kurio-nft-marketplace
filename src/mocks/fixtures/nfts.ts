import type { Network } from '@/contracts/common'
import type { Image } from '@/contracts/common'
import type { Category, Edition, Review } from '@/contracts/nft'
import { mul } from '@/lib/money'
import type { MockNft } from '../db/schema'
import { hex, pick, prng, randomInt } from '../lib/prng'

// Contagens por categoria iguais às do filtro do Figma (somam 239).
const CATEGORY_COUNTS: [Category, number][] = [
  ['arte-digital', 33],
  ['fotografia', 12],
  ['musica', 65],
  ['arte-3d', 39],
  ['colecionaveis', 23],
  ['generativa', 17],
  ['jogos', 19],
  ['assinaturas', 13],
  ['utilidade', 18],
]

// O Figma mostra Ethereum 119, Polygon 78 e Solana 86 (283, mais que o total de
// categorias). Mantemos a proporção sobre os 239 itens: 100, 66 e 73.
const NETWORK_COUNTS: [Network, number][] = [
  ['ethereum', 100],
  ['polygon', 66],
  ['solana', 73],
]

type Artwork = 'emerald-ape' | 'sage-nomad' | 'ivory-baron' | 'golden-beat'

const NOUNS: Record<string, { art: Artwork; collection: string; traits: string[] }> = {
  Ape: { art: 'emerald-ape', collection: 'Kurio Apes', traits: ['Óculos', 'Esmeralda'] },
  Monarch: { art: 'emerald-ape', collection: 'Kurio Apes', traits: ['Coroa', 'Jaqueta'] },
  Nomad: { art: 'sage-nomad', collection: 'Nomad Society', traits: ['Chapéu', 'Moletom'] },
  Bloom: { art: 'sage-nomad', collection: 'Nomad Society', traits: ['Flores', 'Moletom'] },
  Drifter: { art: 'sage-nomad', collection: 'Nomad Society', traits: ['Chapéu', 'Mochila'] },
  Vessel: { art: 'ivory-baron', collection: 'Noble Primates', traits: ['Gola alta', 'Blazer'] },
  Baron: { art: 'ivory-baron', collection: 'Noble Primates', traits: ['Blazer', 'Marfim'] },
  Relic: { art: 'ivory-baron', collection: 'Noble Primates', traits: ['Relíquia', 'Blazer'] },
  Beat: { art: 'golden-beat', collection: 'Golden Frequencies', traits: ['Fones', 'Dourado'] },
  Signal: { art: 'golden-beat', collection: 'Golden Frequencies', traits: ['Antena', 'Dourado'] },
  Frequency: { art: 'golden-beat', collection: 'Golden Frequencies', traits: ['Fones', 'Onda'] },
  Echo: { art: 'golden-beat', collection: 'Golden Frequencies', traits: ['Eco', 'Dourado'] },
}

const ADJECTIVES = [
  'Emerald',
  'Sage',
  'Neon',
  'Cosmic',
  'Violet',
  'Ivory',
  'Golden',
  'Amber',
  'Copper',
  'Onyx',
  'Velvet',
  'Crimson',
  'Lunar',
  'Solar',
  'Rustic',
  'Midnight',
]

// Os nove primeiros reproduzem a grade da tela inicial do Figma (nome, preço e ordem).
const FIGMA_GRID: {
  adjective: string
  noun: string
  number: number
  price: string
  compareAt?: string
  badge?: 'RARO'
  /** Raro nos atributos sem selo no card (Emerald Ape no Figma desktop). */
  rare?: boolean
}[] = [
  { adjective: 'Emerald', noun: 'Ape', number: 42, price: '1.19', rare: true },
  { adjective: 'Sage', noun: 'Nomad', number: 9, price: '1.69' },
  // Selo RARO no 3º card, como no frame mobile (P-3).
  {
    adjective: 'Neon',
    noun: 'Vessel',
    number: 552,
    price: '1.99',
    compareAt: '2.29',
    badge: 'RARO',
  },
  { adjective: 'Cosmic', noun: 'Bloom', number: 118, price: '1.29' },
  { adjective: 'Violet', noun: 'Nomad', number: 314, price: '1.39' },
  { adjective: 'Ivory', noun: 'Baron', number: 88, price: '1.79' },
  { adjective: 'Golden', noun: 'Beat', number: 207, price: '0.99' },
  { adjective: 'Golden', noun: 'Signal', number: 160, price: '0.39' },
  { adjective: 'Golden', noun: 'Frequency', number: 71, price: '0.59' },
]

// Texto do frame "Desktop / Detalhes do NFT" (coleção ajustada para Kurio Apes, como no resto da tela).
const EMERALD_LONG_DESCRIPTION =
  'Emerald Ape #042 é uma obra digital 1/50 finalizada à mão da coleção Kurio Apes. Cada atributo fica armazenado nos metadados do token e verificado na Ethereum. A obra explora identidade, movimento e luz em um mundo digital sem fronteiras.\n\nA propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência registrada na rede. Nova Sato recebe 5% de direitos autorais nas vendas secundárias, apoiando novos trabalhos e lançamentos da comunidade.'

const REVIEWERS = [
  'Lia M.',
  'Caio R.',
  'Nina T.',
  'Rafa P.',
  'Duda S.',
  'Theo A.',
  'Bia C.',
  'Gui F.',
]
const COMMENTS = [
  'Arte impecável, chegou na carteira em segundos.',
  'A procedência bem documentada fez diferença na compra.',
  'Coleção consistente e criador muito presente na comunidade.',
  'Os detalhes em alta resolução são incríveis.',
  'Compraria outra edição sem pensar.',
  'Ótimo custo para uma edição limitada.',
]

const BASE_DATE = Date.UTC(2026, 9, 28, 12, 0, 0)

function image(art: Artwork, alt: string): Image {
  return { src: `/images/nfts/${art}-640.webp`, alt, width: 640, height: 640 }
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

function expand(counts: [string, number][]): string[] {
  return counts.flatMap(([id, n]) => Array.from({ length: n }, () => id))
}

function editionsFor(
  id: string,
  price: string,
  rand: () => number,
  overrides?: Partial<Record<string, Partial<Edition>>>,
): Edition[] {
  const defs: Edition[] = [
    {
      id: `${id}-1-1`,
      label: '1/1',
      supply: 1,
      available: 1,
      maxPerOrder: 1,
      priceEth: mul(price, 4),
      status: 'available',
    },
    {
      id: `${id}-1-10`,
      label: '1/10',
      supply: 10,
      available: randomInt(rand, 2, 10),
      maxPerOrder: 3,
      priceEth: mul(price, 1.5),
      status: 'available',
    },
    {
      id: `${id}-1-50`,
      label: '1/50',
      supply: 50,
      available: randomInt(rand, 12, 50),
      maxPerOrder: 10,
      priceEth: price,
      status: 'available',
    },
    {
      id: `${id}-aberta`,
      label: 'ABERTA',
      supply: null,
      available: 999,
      maxPerOrder: 20,
      priceEth: mul(price, 0.6),
      status: 'available',
    },
  ]
  return defs.map((e) => {
    const o = overrides?.[e.label]
    const merged = { ...e, ...o }
    if (merged.available === 0 && merged.status === 'available') merged.status = 'sold_out'
    return merged
  })
}

export function buildNfts(): MockNft[] {
  const rand = prng(20261028)
  const categories = expand(CATEGORY_COUNTS) as Category[]
  const networks = expand(NETWORK_COUNTS) as Network[]
  // Embaralha de forma determinística, mantendo Ethereum para os itens do Figma.
  const shuffledNetworks = shuffle(networks.slice(9), rand)
  const networkFor = (i: number): Network =>
    i < 9 ? 'ethereum' : (shuffledNetworks[i - 9] ?? 'polygon')
  const shuffledCategories = categories.slice()
  // Os itens do Figma ficam em Arte digital; o restante é embaralhado.
  const figmaCats = Array.from({ length: 9 }, () => 'arte-digital' as Category)
  const rest = shuffledCategories
  for (let k = 0; k < 9; k++) rest.splice(rest.indexOf('arte-digital'), 1)
  shuffle(rest, rand)
  const categoryFor = (i: number): Category => (i < 9 ? figmaCats[i] : rest[i - 9])

  const used = new Set<string>()
  const nfts: MockNft[] = []
  const total = categories.length

  for (let i = 0; i < total; i++) {
    let adjective: string
    let noun: string
    let number: number
    let price: string
    let compareAt: string | null = null
    let badge: 'RARO' | null = null
    let rare = false
    if (i < FIGMA_GRID.length) {
      const g = FIGMA_GRID[i]
      ;({ adjective, noun, number, price } = g)
      compareAt = g.compareAt ?? null
      badge = g.badge ?? null
      rare = g.rare ?? false
    } else {
      do {
        adjective = pick(rand, ADJECTIVES)
        noun = pick(rand, Object.keys(NOUNS))
        number = randomInt(rand, 1, 999)
      } while (used.has(`${adjective}-${noun}-${number}`))
      const cents = randomInt(rand, 5, 1200)
      price = (cents / 100).toFixed(2)
      if (i === 30) price = '0.02'
      if (i === 31) price = '12.30'
      if (rand() < 0.08) compareAt = (Number(price) * 1.2).toFixed(2)
      if (rand() < 0.12) badge = 'RARO'
    }
    used.add(`${adjective}-${noun}-${number}`)
    const padded = String(number).padStart(3, '0')
    const name = `${adjective} ${noun} #${padded}`
    const id = `${adjective}-${noun}-${padded}`.toLowerCase()
    const meta = NOUNS[noun]
    const network = networkFor(i)
    const networkLabel =
      network === 'ethereum' ? 'Ethereum' : network === 'polygon' ? 'Polygon' : 'Solana'

    let overrides: Partial<Record<string, Partial<Edition>>> | undefined
    if (id === 'sage-nomad-009')
      overrides = { '1/1': { available: 0 }, ABERTA: { status: 'unavailable', available: 0 } }
    if (i === 20)
      overrides = {
        '1/1': { available: 0 },
        '1/10': { available: 0 },
        '1/50': { available: 0 },
        ABERTA: { status: 'unavailable', available: 0 },
      }
    const editions = editionsFor(id, price, rand, overrides)

    const reviewCount = id === 'emerald-ape-042' ? 19 : randomInt(rand, 0, 12)
    const reviews: Review[] = Array.from({ length: reviewCount }, (_, r) => ({
      id: `${id}-r${r}`,
      author: pick(rand, REVIEWERS),
      rating: id === 'emerald-ape-042' ? (r < 15 ? 5 : 4) : randomInt(rand, 3, 5),
      comment: pick(rand, COMMENTS),
      createdAt: new Date(BASE_DATE - (r + 1) * 86_400_000).toISOString(),
    }))

    const main = image(meta.art, `${name}, arte digital da coleção ${meta.collection}`)
    nfts.push({
      id,
      slug: id,
      name,
      collection: meta.collection,
      category: categoryFor(i),
      network,
      image: main,
      gallery: [main, ...[2, 3, 4].map((v) => ({ ...main, alt: `${name}, vista ${v}` }))],
      compareAtPriceEth: compareAt,
      badge,
      listedAt: new Date(BASE_DATE - i * 3_600_000).toISOString(),
      popularity: i < 9 ? 1000 - i * 7 : randomInt(rand, 1, 990),
      description: `Um colecionável digital finalizado à mão da coleção ${meta.collection}, verificado na ${networkLabel}, com arte desbloqueável e acesso para colecionadores.`,
      longDescription:
        id === 'emerald-ape-042'
          ? EMERALD_LONG_DESCRIPTION
          : `${name} é uma obra digital finalizada à mão da coleção ${meta.collection}. Cada atributo fica armazenado nos metadados do token e verificado na ${networkLabel}. A propriedade inclui a arte em alta resolução, lançamentos exclusivos para colecionadores e um registro permanente de procedência na rede.`,
      tokenId: `#${String(number).padStart(4, '0')}`,
      contract:
        id === 'emerald-ape-042'
          ? '0x7A42...19E8'
          : `0x${hex(rand, 4).toUpperCase()}...${hex(rand, 4).toUpperCase()}`,
      royaltiesPct: 5,
      attributes: [...meta.traits, badge === 'RARO' || rare ? 'Raro' : 'Comum'],
      reviews,
      editions,
      version: 1,
    })
  }
  return nfts
}
