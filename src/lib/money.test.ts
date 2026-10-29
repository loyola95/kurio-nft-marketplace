import { describe, expect, it } from 'vitest'
import { add, cmp, formatEth, formatEthRange, mul, percent, sub } from './money'

describe('money', () => {
  it('soma sem erro de ponto flutuante', () => {
    expect(add('0.1', '0.2')).toBe('0.3')
  })

  it('multiplica preço por quantidade inteira', () => {
    expect(mul('1.19', 2)).toBe('2.38')
    expect(mul('1.79', 9)).toBe('16.11')
  })

  it('subtrai e calcula porcentagem', () => {
    expect(sub('26.846', '0.016')).toBe('26.83')
    expect(percent('26.83', 10)).toBe('2.683')
  })

  it('compara valores decimais', () => {
    expect(cmp('1.10', '1.1')).toBe(0)
    expect(cmp('0.99', '1')).toBe(-1)
    expect(cmp('12.3', '2')).toBe(1)
  })

  it('formata ETH como no Figma', () => {
    expect(formatEth('1.19')).toBe('1.19 ETH')
    expect(formatEth('26.846')).toBe('26.846 ETH')
    expect(formatEth('2')).toBe('2.00 ETH')
    expect(formatEth('0.016')).toBe('0.016 ETH')
  })

  it('formata a faixa de preço com vírgula como no filtro do Figma', () => {
    expect(formatEthRange('0.02', '12.3')).toBe('0,02 - 12,30 ETH')
  })
})
