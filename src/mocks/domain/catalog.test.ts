import { describe, expect, it } from 'vitest'
import { CatalogQuery, type CatalogQueryInput } from '@/contracts/nft'
import { cmp } from '@/lib/money'
import { buildSeed } from '../db/seed'
import { queryCatalog } from './catalog'

const state = buildSeed()
const run = (q: CatalogQueryInput) => queryCatalog(state, CatalogQuery.parse(q))

describe('consulta do catálogo', () => {
  it('padrão devolve a grade do Figma na primeira página', () => {
    const page = run({})
    expect(page.items).toHaveLength(9)
    expect(page.items.map((n) => n.name).slice(0, 8)).toEqual([
      'Emerald Ape #042',
      'Sage Nomad #009',
      'Neon Vessel #552',
      'Cosmic Bloom #118',
      'Violet Nomad #314',
      'Ivory Baron #088',
      'Golden Beat #207',
      'Golden Signal #160',
    ])
    expect(page.total).toBe(239)
    expect(page.totalPages).toBe(27)
  })

  it('combina categoria, rede e faixa de preço', () => {
    const page = run({
      categories: ['musica', 'fotografia'],
      networks: ['polygon'],
      priceMin: '1',
      priceMax: '5',
      pageSize: 48,
    })
    expect(page.total).toBeGreaterThan(0)
    for (const n of page.items) {
      expect(['musica', 'fotografia']).toContain(n.category)
      expect(n.network).toBe('polygon')
      expect(cmp(n.priceEth, '1')).toBeGreaterThanOrEqual(0)
      expect(cmp(n.priceEth, '5')).toBeLessThanOrEqual(0)
    }
  })

  it('busca ignora acento e caixa e procura em nome e coleção', () => {
    const byName = run({ q: 'EMERALD ape', pageSize: 48 })
    expect(byName.items.every((n) => n.name.toLowerCase().includes('emerald ape'))).toBe(true)
    const byCollection = run({ q: 'nomad society', pageSize: 48 })
    expect(byCollection.total).toBeGreaterThan(0)
    expect(byCollection.items.every((n) => n.collection === 'Nomad Society')).toBe(true)
  })

  it('ordena por menor e maior preço e por nome', () => {
    const asc = run({ sort: 'menor-preco' }).items.map((n) => n.priceEth)
    expect(asc[0]).toBe('0.02')
    expect(asc.every((p, i) => i === 0 || cmp(asc[i - 1], p) <= 0)).toBe(true)
    const desc = run({ sort: 'maior-preco' }).items.map((n) => n.priceEth)
    expect(desc[0]).toBe('12.30')
    const names = run({ sort: 'nome' }).items.map((n) => n.name)
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'pt-BR')))
  })

  it('pagina e mantém o total fora do intervalo', () => {
    const p2 = run({ page: 2 })
    expect(p2.page).toBe(2)
    expect(p2.items[0].id).not.toBe(run({}).items[0].id)
    const out = run({ page: 99 })
    expect(out.items).toEqual([])
    expect(out.total).toBe(239)
  })

  it('facetas contam o catálogo inteiro, como no Figma', () => {
    const page = run({ categories: ['jogos'] })
    const facet = (id: string) => page.facets.categories.find((c) => c.id === id)?.count
    expect(facet('arte-digital')).toBe(33)
    expect(facet('musica')).toBe(65)
    expect(page.facets.priceRange).toEqual({ min: '0.02', max: '12.30' })
  })

  it('abas filtram lançamentos e itens em alta', () => {
    expect(run({ tab: 'lancamentos', pageSize: 48 }).total).toBe(24)
    expect(run({ tab: 'em-alta', pageSize: 48 }).total).toBe(30)
  })
})
