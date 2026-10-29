import { z } from 'zod'
import { IsoDate } from './common'

export const User = z.object({
  id: z.string(),
  username: z.string(),
  email: z.email(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
})
export type User = z.infer<typeof User>

export const Session = z.object({ token: z.string(), expiresAt: IsoDate })
export type Session = z.infer<typeof Session>

export const AuthResponse = z.object({ user: User, session: Session })
export type AuthResponse = z.infer<typeof AuthResponse>

export const SessionResponse = z.object({ user: User, expiresAt: IsoDate })
export type SessionResponse = z.infer<typeof SessionResponse>

export const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/
export const USERNAME_RULE = /^[a-z0-9_.]+$/i

export const LoginInput = z.object({
  email: z.email('Informe um e-mail válido'),
  password: z.string().min(1, 'Informe sua senha'),
})
export type LoginInput = z.infer<typeof LoginInput>

export const RegisterInput = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Use pelo menos 3 caracteres')
    .max(24, 'Use no máximo 24 caracteres')
    .regex(USERNAME_RULE, 'Use letras, números, ponto ou sublinhado'),
  email: z.email('Informe um e-mail válido'),
  password: z
    .string()
    .regex(PASSWORD_RULE, 'A senha precisa de 8 caracteres, com letras e números'),
})
export type RegisterInput = z.infer<typeof RegisterInput>
