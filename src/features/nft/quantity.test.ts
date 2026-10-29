import { describe, expect, it } from 'vitest'
import { normalizeQuantity } from './quantity'

describe('quantidade', () => {
  it('corrige entradas inválidas para um inteiro entre o mínimo e o máximo', () => {
    expect(normalizeQuantity('0', 1, 5)).toBe(1)
    expect(normalizeQuantity('-3', 1, 5)).toBe(1)
    expect(normalizeQuantity('2.5', 1, 5)).toBe(2)
    expect(normalizeQuantity('999', 1, 5)).toBe(5)
    expect(normalizeQuantity('', 1, 5)).toBe(1)
    expect(normalizeQuantity('abc', 1, 5)).toBe(1)
    expect(normalizeQuantity(4, 1, 5)).toBe(4)
  })

  it('com máximo menor que o mínimo, fica no mínimo', () => {
    expect(normalizeQuantity('3', 1, 0)).toBe(1)
  })
})
