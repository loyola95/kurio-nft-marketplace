/** Gerador pseudoaleatório com seed (mulberry32). Mesma seed, mesma sequência. */
export function prng(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function randomInt(rand: () => number, min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min
}

export function pick<T>(rand: () => number, items: readonly T[]): T {
  return items[Math.floor(rand() * items.length)]
}

/** Hex determinístico de tamanho fixo (hashes e endereços simulados). */
export function hex(rand: () => number, length: number): string {
  let out = ''
  for (let i = 0; i < length; i++) out += Math.floor(rand() * 16).toString(16)
  return out
}
