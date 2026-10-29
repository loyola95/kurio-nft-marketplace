import { describe, expect, it } from 'vitest'
import { isValidAddress } from '@/contracts/wallet'
import { buildSeed } from './seed'
import { createStore, type KeyValueStorage } from './store'

function memory(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>()
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  }
}

describe('banco simulado', () => {
  it('seed é determinístico e tem as contagens do Figma', () => {
    const a = buildSeed()
    const b = buildSeed()
    expect(a).toEqual(b)
    expect(a.nfts).toHaveLength(239)
    const count = (cat: string) => a.nfts.filter((n) => n.category === cat).length
    expect(count('arte-digital')).toBe(33)
    expect(count('musica')).toBe(65)
    expect(a.nfts.slice(0, 3).map((n) => n.name)).toEqual([
      'Emerald Ape #042',
      'Sage Nomad #009',
      'Neon Vessel #552',
    ])
    const prices = a.nfts.map((n) => Number(n.editions.find((e) => e.label === '1/50')!.priceEth))
    expect(Math.min(...prices)).toBe(0.02)
    expect(Math.max(...prices)).toBe(12.3)
    expect(new Set(a.nfts.map((n) => n.id)).size).toBe(239)
  })

  it('carteiras das fixtures têm endereço válido para a rede', () => {
    for (const w of Object.values(buildSeed().wallets).flatMap((x) => [x.primary, x.secondary])) {
      if (w) expect(isValidAddress(w.network, w.address)).toBe(true)
    }
  })

  it('persiste mutações e recarrega do armazenamento', () => {
    const storage = memory()
    const store = createStore(storage)
    store.update((s) => {
      s.favorites['u-ana'] = []
    })
    const reloaded = createStore(storage)
    expect(reloaded.get().favorites['u-ana']).toEqual([])
  })

  it('reset restaura exatamente o seed', () => {
    const store = createStore(memory())
    store.update((s) => {
      s.nfts[0].editions[0].priceEth = '99'
      s.sequence = 5
    })
    store.reset()
    expect(store.get()).toEqual(buildSeed())
  })
})
