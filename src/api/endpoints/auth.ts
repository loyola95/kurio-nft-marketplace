import {
  AuthResponse,
  SessionResponse,
  type LoginInput,
  type RegisterInput,
} from '@/contracts/auth'
import { http } from '../http'

export async function register(input: RegisterInput) {
  const { data } = await http.post('/auth/register', input)
  return AuthResponse.parse(data)
}

export async function login(input: LoginInput) {
  const { data } = await http.post('/auth/login', input)
  return AuthResponse.parse(data)
}

export async function getSession(signal?: AbortSignal) {
  const { data } = await http.get('/auth/session', { signal })
  return SessionResponse.parse(data)
}

export async function logout() {
  await http.post('/auth/logout')
}
