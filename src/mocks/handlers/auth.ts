import { http, HttpResponse } from 'msw'
import { LoginInput, RegisterInput } from '@/contracts/auth'
import type { MockState, MockUser } from '../db/schema'
import { db, nextId } from '../db/store'
import { bearerToken, hashPassword, randomSalt, requireUser, toUser } from '../lib/auth'
import { API_BASE, MockHttpError, readBody, route } from '../lib/http'
import { scenario } from '../scenarios'

function openSession(state: MockState, user: MockUser) {
  const token = crypto.randomUUID()
  const expiresAt = new Date(Date.now() + scenario.behavior.sessionTtlMs).toISOString()
  state.sessions.push({ token, userId: user.id, expiresAt })
  return { token, expiresAt }
}

export const authHandlers = [
  route('post', '/auth/register', async ({ request }) => {
    const input = await readBody(request, RegisterInput)
    const state = db.get()
    const email = input.email.toLowerCase()
    const fieldErrors: Record<string, string> = {}
    if (state.users.some((u) => u.email.toLowerCase() === email)) {
      fieldErrors.email = 'Este e-mail já está cadastrado.'
    }
    if (state.users.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
      fieldErrors.username = 'Este nome de usuário já está em uso.'
    }
    if (fieldErrors.email) {
      throw new MockHttpError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', {
        fieldErrors,
      })
    }
    if (fieldErrors.username) {
      throw new MockHttpError(409, 'USERNAME_TAKEN', 'Este nome de usuário já está em uso.', {
        fieldErrors,
      })
    }
    const salt = randomSalt()
    const passwordHash = await hashPassword(salt, input.password)
    const result = db.update((s) => {
      const user: MockUser = {
        id: nextId(s, 'u'),
        username: input.username,
        email,
        displayName: input.username,
        salt,
        passwordHash,
        avatarUrl: null,
        ensName: '',
        walletNickname: '',
        profileVersion: 1,
      }
      s.users.push(user)
      s.favorites[user.id] = []
      s.wallets[user.id] = { primary: null, secondary: null }
      return { user: toUser(user), session: openSession(s, user) }
    })
    return HttpResponse.json(result, { status: 201 })
  }),

  route('post', '/auth/login', async ({ request }) => {
    const input = await readBody(request, LoginInput)
    const user = db.get().users.find((u) => u.email.toLowerCase() === input.email.toLowerCase())
    const valid = user && (await hashPassword(user.salt, input.password)) === user.passwordHash
    if (!user || !valid) {
      throw new MockHttpError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }
    const session = db.update((s) => openSession(s, user))
    return HttpResponse.json({ user: toUser(user), session })
  }),

  route('get', '/auth/session', ({ request }) => {
    const user = requireUser(request)
    const token = bearerToken(request)
    const session = db.get().sessions.find((s) => s.token === token)!
    return HttpResponse.json({ user: toUser(user), expiresAt: session.expiresAt })
  }),

  route('post', '/auth/logout', ({ request }) => {
    const token = bearerToken(request)
    db.update((s) => {
      s.sessions = s.sessions.filter((x) => x.token !== token)
    })
    return new HttpResponse(null, { status: 204 })
  }),
]

// Controle: expira todas as sessões agora (cenário "sessão expirada" sob demanda).
export const authControlHandlers = [
  http.post(`${API_BASE}/__mock/session/expire`, () => {
    db.update((s) => {
      s.sessions = s.sessions.map((x) => ({ ...x, expiresAt: new Date(0).toISOString() }))
    })
    return HttpResponse.json({ ok: true })
  }),
]
