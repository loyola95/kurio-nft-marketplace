import type { User } from '@/contracts/auth'
import type { MockState, MockUser } from '../db/schema'
import { db } from '../db/store'
import { MockHttpError } from './http'

export async function hashPassword(salt: string, password: string): Promise<string> {
  const bytes = new TextEncoder().encode(salt + password)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, '0')).join('')
}

export function randomSalt(): string {
  return `s-${crypto.randomUUID().slice(0, 8)}`
}

export function toUser(user: MockUser): User {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.displayName,
    avatarUrl: user.avatarUrl,
  }
}

export function bearerToken(request: Request): string | null {
  const header = request.headers.get('Authorization')
  return header?.startsWith('Bearer ') ? header.slice(7) : null
}

/** Usuário da sessão; sem sessão válida responde 401 (sem token ou expirada). */
export function requireUser(request: Request, state: MockState = db.get()): MockUser {
  const user = optionalUser(request, state)
  if (!user) throw new MockHttpError(401, 'UNAUTHENTICATED', 'Faça login para continuar.')
  return user
}

export function optionalUser(request: Request, state: MockState = db.get()): MockUser | null {
  const token = bearerToken(request)
  if (!token) return null
  const session = state.sessions.find((s) => s.token === token)
  if (!session) throw new MockHttpError(401, 'SESSION_EXPIRED', 'Sua sessão expirou.')
  if (Date.parse(session.expiresAt) <= Date.now()) {
    db.update((s) => {
      s.sessions = s.sessions.filter((x) => x.token !== token)
    })
    throw new MockHttpError(401, 'SESSION_EXPIRED', 'Sua sessão expirou.')
  }
  const user = state.users.find((u) => u.id === session.userId)
  if (!user) throw new MockHttpError(401, 'SESSION_EXPIRED', 'Sua sessão expirou.')
  return user
}
