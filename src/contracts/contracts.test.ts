import { describe, expect, it } from 'vitest'
import { EthAmount } from './common'
import { RealtimeEvent } from './events'
import { ApiErrorBody } from './errors'

describe('contratos', () => {
  it('EthAmount aceita só decimal em string', () => {
    expect(EthAmount.safeParse('1.19').success).toBe(true)
    expect(EthAmount.safeParse('0').success).toBe(true)
    for (const bad of ['1e3', '-1', '1.2.3', '', 1.19]) {
      expect(EthAmount.safeParse(bad).success).toBe(false)
    }
  })

  it('evento de tempo real exige identidade, recurso e versão', () => {
    const base = {
      id: 'e1',
      type: 'nft.updated',
      resource: { type: 'nft', id: 'nft-1' },
      version: 2,
      occurredAt: '2026-10-29T10:00:00.000Z',
      data: { nftId: 'nft-1', priceEth: '1.25', available: 3, editions: [] },
    }
    expect(RealtimeEvent.safeParse(base).success).toBe(true)
    const { id: _id, ...semId } = base
    expect(RealtimeEvent.safeParse(semId).success).toBe(false)
    const { version: _v, ...semVersao } = base
    expect(RealtimeEvent.safeParse(semVersao).success).toBe(false)
  })

  it('envelope de erro carrega código e erros de campo', () => {
    const parsed = ApiErrorBody.parse({
      error: {
        code: 'EMAIL_TAKEN',
        message: 'E-mail em uso',
        fieldErrors: { email: 'Já cadastrado' },
      },
    })
    expect(parsed.error.fieldErrors?.email).toBe('Já cadastrado')
  })
})
