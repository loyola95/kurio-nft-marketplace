// Exporta os assets do arquivo Figma do desafio para public/.
// Uso: FIGMA_TOKEN=<token> node scripts/figma-export.mjs
// O token nunca é versionado. São feitas duas chamadas à API do Figma.
import { mkdir, writeFile } from 'node:fs/promises'
import sharp from 'sharp'

const FILE_KEY = 'Ff0SksUi7UFtPWUO8kyNtw'
const token = process.env.FIGMA_TOKEN
if (!token) throw new Error('Defina FIGMA_TOKEN')

// Nós de ícones do arquivo. Usamos instâncias visíveis nas telas porque
// alguns componentes mestres não são renderizados pela API.
const ICONS = {
  logout: 'I70522:3240;70504:3015;70486:527',
  'chevron-down': '4:152',
  'arrow-right': '5:99',
  'arrow-right-2': '4:392',
  star: '11:1195',
  message: '11:1248',
  delete: '11:2029',
  'select-arrow': '9:1589',
  close: '9:947',
  'eye-off': '9:963',
  user: '70420:4541',
  location: '70420:4544',
  activity: '70420:4555',
  download: '70420:4558',
  danger: '70420:4561',
  image: '9:1560',
  search: '15:5331',
  filter: '15:5488',
  home: '15:5519',
  'user-tab': '15:5522',
  shop: '15:5524',
  'arrow-left': '15:5745',
  wallet: '23:1379',
  'search-header': 'I70522:3240;70504:3015;70486:519',
  cart: 'I70522:3240;70504:3015;70486:521',
  heart: '15:5527',
  grid: '15:5529',
  logo: 'I70522:3240;70504:3015;70486:509',
  google: 'I70484:260;70483:242',
  facebook: 'I70484:240;70483:259',
  'social-twitter': 'I70492:696;70491:1274',
  'social-linkedin': 'I70492:696;70491:1276',
  'social-facebook': 'I70492:696;70491:1270',
  'social-instagram': 'I70492:696;70491:1272',
  'social-other': 'I70492:696;70491:1278',
}

// Imagens dos NFTs (imageRef das fills do arquivo).
const ARTWORKS = {
  '8459204731e6eba9d474cbc8ebc37071360d3ba5': 'emerald-ape',
  '2986a7cb16d09de8970824d2dd58bf0bb021702c': 'sage-nomad',
  '9df2ff42dd27ba657621c304557d1a855a4be6a5': 'ivory-baron',
  '87580f2def9af0ce13f4b6f6ce17bb2449bcfc16': 'golden-beat',
}
const WIDTHS = [320, 640, 960]

async function api(path) {
  const res = await fetch(`https://api.figma.com/v1/${path}`, {
    headers: { 'X-Figma-Token': token },
  })
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`)
  return res.json()
}
const download = async (url) => Buffer.from(await (await fetch(url)).arrayBuffer())

await mkdir('public/icons', { recursive: true })
await mkdir('public/images/nfts', { recursive: true })

const ids = Object.values(ICONS).join(',')
const svg = await api(
  `images/${FILE_KEY}?ids=${encodeURIComponent(ids)}&format=svg&svg_outline_text=false`,
)
for (const [name, id] of Object.entries(ICONS)) {
  const url = svg.images[id]
  if (!url) {
    console.warn('sem imagem para', name)
    continue
  }
  await writeFile(`public/icons/${name}.svg`, await download(url))
}

if (process.env.SKIP_ARTWORKS) process.exit(0)
const fills = await api(`files/${FILE_KEY}/images`)
for (const [ref, name] of Object.entries(ARTWORKS)) {
  const original = await download(fills.meta.images[ref])
  for (const w of WIDTHS) {
    await sharp(original)
      .resize(w, w, { fit: 'cover' })
      .webp({ quality: 78 })
      .toFile(`public/images/nfts/${name}-${w}.webp`)
  }
}
console.log('assets exportados')
