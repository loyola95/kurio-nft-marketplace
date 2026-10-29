// Acesso a localStorage/sessionStorage que nunca quebra a página
// (janela privada, bloqueio de cookies, cota excedida).

type Kind = 'local' | 'session'

function area(kind: Kind): Storage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage
  } catch {
    return null
  }
}

export function readJson<T>(kind: Kind, key: string): T | null {
  try {
    const raw = area(kind)?.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  } catch {
    return null
  }
}

export function writeJson(kind: Kind, key: string, value: unknown): void {
  try {
    area(kind)?.setItem(key, JSON.stringify(value))
  } catch {
    // Sem armazenamento: o estado vale só nesta aba.
  }
}

export function removeKey(kind: Kind, key: string): void {
  try {
    area(kind)?.removeItem(key)
  } catch {
    // ignorado
  }
}

export function removeByPrefix(kind: Kind, prefix: string): void {
  try {
    const storage = area(kind)
    if (!storage) return
    for (const key of Object.keys(storage)) if (key.startsWith(prefix)) storage.removeItem(key)
  } catch {
    // ignorado
  }
}
