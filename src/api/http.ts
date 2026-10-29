import axios from 'axios'
import { toApiError } from './errors'
import { cartIdentity, sessionStore } from './identity'

type AuthErrorCode = 'SESSION_EXPIRED' | 'UNAUTHENTICATED'
let authErrorHandler: ((code: AuthErrorCode) => void) | null = null

/** A camada de sessão registra aqui o que fazer quando o token deixa de valer. */
export function setAuthErrorHandler(handler: ((code: AuthErrorCode) => void) | null) {
  authErrorHandler = handler
}

export const http = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api',
  timeout: Number(import.meta.env.VITE_HTTP_TIMEOUT_MS ?? 8000),
  headers: { 'Content-Type': 'application/json' },
})

http.interceptors.request.use((config) => {
  const token = sessionStore.getToken()
  if (token) config.headers.set('Authorization', `Bearer ${token}`)
  else config.headers.set('X-Cart-Id', cartIdentity.get())
  return config
})

http.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error)
    const hadToken = Boolean(sessionStore.getToken())
    if (hadToken && (apiError.code === 'SESSION_EXPIRED' || apiError.code === 'UNAUTHENTICATED')) {
      authErrorHandler?.(apiError.code)
    }
    return Promise.reject(apiError)
  },
)
