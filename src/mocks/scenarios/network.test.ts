import { describe, expect, it } from 'vitest'
import { prng } from '../lib/prng'
import { createNetworkController } from './network'

const get = (path: string) => ({ method: 'GET', path })

describe('condições de rede simuladas', () => {
  it('prng com a mesma seed repete a sequência', () => {
    const a = prng(42)
    const b = prng(42)
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })

  it('padrão responde com latência fixa curta e sem falha', () => {
    const net = createNetworkController('padrao')
    expect(net.decide(get('/nfts'))).toEqual({ delayMs: 150, effect: null })
  })

  it('offline produz erro de rede em rotas REST', () => {
    const net = createNetworkController('offline')
    expect(net.decide(get('/nfts')).effect).toBe('network')
    expect(net.decide({ method: 'POST', path: '/cart/items' }).effect).toBe('network')
  })

  it('falha transitória falha duas vezes e depois responde', () => {
    const net = createNetworkController('falha-transitoria')
    const effects = [1, 2, 3].map(() => net.decide(get('/nfts')).effect)
    expect(effects).toEqual([
      { status: 503, code: 'SERVICE_UNAVAILABLE' },
      { status: 503, code: 'SERVICE_UNAVAILABLE' },
      null,
    ])
  })

  it('fora de ordem faz a requisição anterior demorar mais que a seguinte', () => {
    const net = createNetworkController('fora-de-ordem')
    const first = net.decide(get('/nfts')).delayMs
    const second = net.decide(get('/nfts')).delayMs
    expect(first).toBeGreaterThan(second)
  })

  it('latência variável é reproduzível', () => {
    const a = createNetworkController('latencia-variavel')
    const b = createNetworkController('latencia-variavel')
    const seq = (n: typeof a) => [1, 2, 3, 4].map(() => n.decide(get('/nfts')).delayMs)
    expect(seq(a)).toEqual(seq(b))
  })

  it('erro de servidor só afeta leituras do catálogo', () => {
    const net = createNetworkController('erro-servidor')
    expect(net.decide(get('/nfts')).effect).toEqual({ status: 500, code: 'INTERNAL_ERROR' })
    expect(net.decide(get('/nfts/emerald-ape-042')).effect).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
    })
    expect(net.decide(get('/cart')).effect).toBeNull()
  })

  it('sem permissão responde 403 em rotas privadas', () => {
    const net = createNetworkController('sem-permissao')
    expect(net.decide(get('/me/profile')).effect).toEqual({ status: 403, code: 'FORBIDDEN' })
    expect(net.decide(get('/nfts')).effect).toBeNull()
  })

  it('favorito com falha só afeta as mutações de favoritos', () => {
    const net = createNetworkController('favorito-falha')
    expect(net.decide({ method: 'PUT', path: '/me/favorites/x' }).effect).toEqual({
      status: 500,
      code: 'INTERNAL_ERROR',
    })
    expect(net.decide(get('/me/favorites')).effect).toBeNull()
  })
})
