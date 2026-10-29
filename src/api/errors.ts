import { isAxiosError } from 'axios'
import { ApiErrorBody, type ErrorCode } from '@/contracts/errors'

export type ClientErrorCode = ErrorCode | 'NETWORK_ERROR' | 'TIMEOUT' | 'UNKNOWN'

/** Erro único da camada HTTP: o resto do app nunca lida com AxiosError. */
export class ApiError extends Error {
  readonly status: number | null
  readonly code: ClientErrorCode
  readonly fieldErrors?: Record<string, string>
  readonly details?: unknown

  constructor(params: {
    status: number | null
    code: ClientErrorCode
    message: string
    fieldErrors?: Record<string, string>
    details?: unknown
  }) {
    super(params.message)
    this.name = 'ApiError'
    this.status = params.status
    this.code = params.code
    this.fieldErrors = params.fieldErrors
    this.details = params.details
  }
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error
  if (!isAxiosError(error)) {
    return new ApiError({
      status: null,
      code: 'UNKNOWN',
      message: error instanceof Error ? error.message : 'Erro inesperado.',
    })
  }
  if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
    return new ApiError({
      status: null,
      code: 'TIMEOUT',
      message: 'O servidor demorou para responder.',
    })
  }
  if (!error.response) {
    return new ApiError({
      status: null,
      code: 'NETWORK_ERROR',
      message: 'Não foi possível conectar. Verifique sua conexão.',
    })
  }
  const parsed = ApiErrorBody.safeParse(error.response.data)
  if (!parsed.success) {
    return new ApiError({
      status: error.response.status,
      code: 'INTERNAL_ERROR',
      message: 'O servidor respondeu de forma inesperada.',
    })
  }
  return new ApiError({ status: error.response.status, ...parsed.data.error })
}

/** Só vale tentar de novo o que pode ser transitório: rede, timeout e 5xx. */
export function isRetryable(error: unknown): boolean {
  if (!(error instanceof ApiError)) return false
  if (error.code === 'NETWORK_ERROR' || error.code === 'TIMEOUT') return true
  return error.status !== null && error.status >= 500
}

export function isApiError(error: unknown, code?: ClientErrorCode): error is ApiError {
  return error instanceof ApiError && (code === undefined || error.code === code)
}
