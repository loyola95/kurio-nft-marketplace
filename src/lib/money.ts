import Big from 'big.js'

// Valores em ETH trafegam como string decimal. Toda conta passa pelo big.js
// para não perder precisão (0.1 + 0.2 precisa dar 0.3).
Big.DP = 18
Big.RM = Big.roundHalfUp

const normalize = (value: Big): string => value.toFixed()

export function add(a: string, b: string): string {
  return normalize(new Big(a).plus(b))
}

export function sub(a: string, b: string): string {
  return normalize(new Big(a).minus(b))
}

export function mul(a: string, quantity: number): string {
  return normalize(new Big(a).times(quantity))
}

export function percent(a: string, pct: number): string {
  return normalize(new Big(a).times(pct).div(100))
}

export function cmp(a: string, b: string): -1 | 0 | 1 {
  return new Big(a).cmp(b) as -1 | 0 | 1
}

export function max(a: string, b: string): string {
  return cmp(a, b) >= 0 ? normalize(new Big(a)) : normalize(new Big(b))
}

export function min(a: string, b: string): string {
  return cmp(a, b) <= 0 ? normalize(new Big(a)) : normalize(new Big(b))
}

export function sum(values: string[]): string {
  return normalize(values.reduce((acc, v) => acc.plus(v), new Big(0)))
}

/** Pelo menos duas casas decimais, sem cortar casas significativas: "2.00", "26.846". */
function toDisplay(value: string): string {
  const fixed = new Big(value).toFixed()
  const [int, dec = ''] = fixed.split('.')
  return `${int}.${dec.padEnd(2, '0')}`
}

export function formatEth(value: string): string {
  return `${toDisplay(value)} ETH`
}

/** Faixa do filtro de preço, no formato do Figma: "0,02 - 12,30 ETH". */
export function formatEthRange(minValue: string, maxValue: string): string {
  const pt = (v: string) => toDisplay(v).replace('.', ',')
  return `${pt(minValue)} - ${pt(maxValue)} ETH`
}
