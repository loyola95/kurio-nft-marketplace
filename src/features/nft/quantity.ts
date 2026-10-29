/** Converte o texto digitado em quantidade inteira dentro de [min, max]. */
export function normalizeQuantity(raw: string | number, min: number, max: number): number {
  const parsed = typeof raw === 'number' ? raw : Number.parseInt(String(raw).trim(), 10)
  if (!Number.isFinite(parsed)) return min
  const int = Math.trunc(parsed)
  return Math.min(Math.max(int, min), Math.max(min, max))
}
