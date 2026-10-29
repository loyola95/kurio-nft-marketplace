import { readJson, removeByPrefix, removeKey, writeJson } from './storage'

// Rascunhos de formulário por usuário (sessionStorage): sobrevivem ao login
// após expiração e somem no logout, sem vazar entre contas.
const key = (userId: string, name: string) => `kurio.draft.${userId}.${name}`

export const drafts = {
  save<T>(userId: string, name: string, value: T) {
    writeJson('session', key(userId, name), value)
  },
  load<T>(userId: string, name: string): T | null {
    return readJson<T>('session', key(userId, name))
  },
  remove(userId: string, name: string) {
    removeKey('session', key(userId, name))
  },
  clear(userId: string) {
    removeByPrefix('session', `kurio.draft.${userId}.`)
  },
}
