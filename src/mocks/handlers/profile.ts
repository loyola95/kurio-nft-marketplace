import { HttpResponse } from 'msw'
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  ChangePasswordInput,
  UpdateProfileInput,
} from '@/contracts/profile'
import type { Profile } from '@/contracts/profile'
import { WalletInput, WalletSlot } from '@/contracts/wallet'
import type { Wallet } from '@/contracts/wallet'
import type { MockUser } from '../db/schema'
import { db, nextId } from '../db/store'
import { hashPassword, randomSalt, requireUser } from '../lib/auth'
import { MockHttpError, readBody, route } from '../lib/http'

const toProfile = (u: MockUser): Profile => ({
  displayName: u.displayName,
  username: u.username,
  email: u.email,
  ensName: u.ensName,
  walletNickname: u.walletNickname,
  avatarUrl: u.avatarUrl,
  version: u.profileVersion,
})

async function toDataUrl(file: File) {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ''
  for (const b of bytes) binary += String.fromCharCode(b)
  return `data:${file.type};base64,${btoa(binary)}`
}

/** Corpo da carteira: slot no POST, WalletInput validado como o formulário. */
const CreateWalletBody = {
  safeParse(raw: unknown) {
    const slot = WalletSlot.safeParse((raw as { slot?: unknown })?.slot)
    const input = WalletInput.safeParse(raw)
    if (!slot.success) {
      return {
        success: false as const,
        error: { issues: [{ path: ['slot'], message: 'Escolha principal ou secundária' }] },
      }
    }
    return input.success
      ? { success: true as const, data: { slot: slot.data, ...input.data } }
      : { success: false as const, error: input.error }
  },
}

export const profileHandlers = [
  route('get', '/me/profile', ({ request }) => HttpResponse.json(toProfile(requireUser(request)))),

  route('patch', '/me/profile', async ({ request }) => {
    const user = requireUser(request)
    const input = await readBody(request, UpdateProfileInput)
    const others = db.get().users.filter((u) => u.id !== user.id)
    if (others.some((u) => u.email.toLowerCase() === input.email.toLowerCase())) {
      throw new MockHttpError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado.', {
        fieldErrors: { email: 'Este e-mail já está cadastrado.' },
      })
    }
    if (others.some((u) => u.username.toLowerCase() === input.username.toLowerCase())) {
      throw new MockHttpError(409, 'USERNAME_TAKEN', 'Este nome de usuário já está em uso.', {
        fieldErrors: { username: 'Este nome de usuário já está em uso.' },
      })
    }
    const updated = db.update((s) => {
      const u = s.users.find((x) => x.id === user.id)!
      Object.assign(u, {
        ...input,
        email: input.email.toLowerCase(),
        profileVersion: u.profileVersion + 1,
      })
      return toProfile(u)
    })
    return HttpResponse.json(updated)
  }),

  route('put', '/me/avatar', async ({ request }) => {
    const user = requireUser(request)
    const file = (await request.formData().catch(() => null))?.get('avatar')
    if (!(file instanceof File)) {
      throw new MockHttpError(422, 'VALIDATION_ERROR', 'Envie uma imagem.', {
        fieldErrors: { avatar: 'Envie uma imagem.' },
      })
    }
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      throw new MockHttpError(422, 'VALIDATION_ERROR', 'Use uma imagem PNG, JPG ou WebP.', {
        fieldErrors: { avatar: 'Use uma imagem PNG, JPG ou WebP.' },
      })
    }
    if (file.size > AVATAR_MAX_BYTES) {
      throw new MockHttpError(422, 'VALIDATION_ERROR', 'A imagem precisa ter no máximo 1 MB.', {
        fieldErrors: { avatar: 'A imagem precisa ter no máximo 1 MB.' },
      })
    }
    const avatarUrl = await toDataUrl(file)
    db.update((s) => {
      const u = s.users.find((x) => x.id === user.id)!
      u.avatarUrl = avatarUrl
      u.profileVersion += 1
    })
    return HttpResponse.json({ avatarUrl })
  }),

  route('delete', '/me/avatar', ({ request }) => {
    const user = requireUser(request)
    db.update((s) => {
      const u = s.users.find((x) => x.id === user.id)!
      u.avatarUrl = null
      u.profileVersion += 1
    })
    return new HttpResponse(null, { status: 204 })
  }),

  route('post', '/me/password', async ({ request }) => {
    const user = requireUser(request)
    const input = await readBody(request, ChangePasswordInput)
    if ((await hashPassword(user.salt, input.currentPassword)) !== user.passwordHash) {
      throw new MockHttpError(422, 'INVALID_PASSWORD', 'Senha atual incorreta.', {
        fieldErrors: { currentPassword: 'Senha atual incorreta.' },
      })
    }
    if (input.currentPassword === input.newPassword) {
      throw new MockHttpError(422, 'VALIDATION_ERROR', 'Use uma senha diferente da atual.', {
        fieldErrors: { newPassword: 'Use uma senha diferente da atual.' },
      })
    }
    const salt = randomSalt()
    const passwordHash = await hashPassword(salt, input.newPassword)
    db.update((s) => {
      const u = s.users.find((x) => x.id === user.id)!
      u.salt = salt
      u.passwordHash = passwordHash
    })
    return new HttpResponse(null, { status: 204 })
  }),

  route('get', '/me/wallets', ({ request }) => {
    const user = requireUser(request)
    return HttpResponse.json(db.get().wallets[user.id] ?? { primary: null, secondary: null })
  }),

  route('post', '/me/wallets', async ({ request }) => {
    const user = requireUser(request)
    const { slot, ...input } = await readBody(request, CreateWalletBody)
    const wallet = db.update((s) => {
      const slots = (s.wallets[user.id] ??= { primary: null, secondary: null })
      const saved: Wallet = {
        ...input,
        id: slots[slot]?.id ?? nextId(s, 'w'),
        slot,
        updatedAt: new Date().toISOString(),
      }
      slots[slot] = saved
      return saved
    })
    return HttpResponse.json(wallet, { status: 201 })
  }),

  route<{ id: string }>('put', '/me/wallets/:id', async ({ request, params }) => {
    const user = requireUser(request)
    const input = await readBody(request, WalletInput)
    const wallet = db.update((s) => {
      const slots = s.wallets[user.id]
      const slot =
        slots && (['primary', 'secondary'] as const).find((k) => slots[k]?.id === params.id)
      if (!slots || !slot) throw new MockHttpError(404, 'NOT_FOUND', 'Carteira não encontrada.')
      const saved: Wallet = { ...input, id: params.id, slot, updatedAt: new Date().toISOString() }
      slots[slot] = saved
      return saved
    })
    return HttpResponse.json(wallet)
  }),
]
