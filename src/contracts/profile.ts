import { z } from 'zod'
import { PASSWORD_RULE, USERNAME_RULE } from './auth'

export const Profile = z.object({
  displayName: z.string(),
  username: z.string(),
  email: z.email(),
  ensName: z.string(),
  walletNickname: z.string(),
  avatarUrl: z.string().nullable(),
  version: z.number().int(),
})
export type Profile = z.infer<typeof Profile>

export const UpdateProfileInput = z.object({
  displayName: z
    .string()
    .trim()
    .min(1, 'Informe o nome de exibição')
    .max(40, 'Use no máximo 40 caracteres'),
  username: z
    .string()
    .trim()
    .min(3, 'Use pelo menos 3 caracteres')
    .max(24, 'Use no máximo 24 caracteres')
    .regex(USERNAME_RULE, 'Use letras, números, ponto ou sublinhado'),
  email: z.email('Informe um e-mail válido'),
  ensName: z.union([
    z.string().regex(/^[a-z0-9-]+\.eth$/i, 'O nome ENS termina em .eth'),
    z.literal(''),
  ]),
  walletNickname: z.string().trim().max(40, 'Use no máximo 40 caracteres'),
})
export type UpdateProfileInput = z.infer<typeof UpdateProfileInput>

export const ChangePasswordInput = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z
    .string()
    .regex(PASSWORD_RULE, 'A senha precisa de 8 caracteres, com letras e números'),
})
export type ChangePasswordInput = z.infer<typeof ChangePasswordInput>

export const AvatarResponse = z.object({ avatarUrl: z.string() })

export const AVATAR_MAX_BYTES = 1024 * 1024
export const AVATAR_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
