import { AxiosError, AxiosHeaders, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import { ApiError, isRetryable, toApiError } from './errors'

function httpError(status: number, data: unknown): AxiosError {
  const config = { headers: new AxiosHeaders() }
  const response = { status, data, statusText: '', headers: {}, config } as AxiosResponse
  return new AxiosError('falhou', AxiosError.ERR_BAD_RESPONSE, config, {}, response)
}

describe('normalização de erros da API', () => {
  it('503 vira SERVICE_UNAVAILABLE e é retentável', () => {
    const error = toApiError(
      httpError(503, { error: { code: 'SERVICE_UNAVAILABLE', message: 'Indisponível' } }),
    )
    expect(error).toBeInstanceOf(ApiError)
    expect(error.code).toBe('SERVICE_UNAVAILABLE')
    expect(error.status).toBe(503)
    expect(isRetryable(error)).toBe(true)
  })

  it('422 preserva fieldErrors e não é retentável', () => {
    const error = toApiError(
      httpError(422, {
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Revise',
          fieldErrors: { email: 'Inválido' },
        },
      }),
    )
    expect(error.fieldErrors).toEqual({ email: 'Inválido' })
    expect(isRetryable(error)).toBe(false)
  })

  it('falha de conexão vira NETWORK_ERROR retentável', () => {
    const error = toApiError(new AxiosError('Network Error', AxiosError.ERR_NETWORK))
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.status).toBeNull()
    expect(isRetryable(error)).toBe(true)
  })

  it('timeout do cliente vira TIMEOUT', () => {
    const error = toApiError(new AxiosError('timeout', AxiosError.ECONNABORTED))
    expect(error.code).toBe('TIMEOUT')
    expect(isRetryable(error)).toBe(true)
  })

  it('resposta sem envelope vira INTERNAL_ERROR com o status original', () => {
    const error = toApiError(httpError(500, '<html>'))
    expect(error.code).toBe('INTERNAL_ERROR')
    expect(error.status).toBe(500)
  })

  it('erro que não é do Axios é preservado como ApiError genérico', () => {
    const error = toApiError(new Error('boom'))
    expect(error.code).toBe('UNKNOWN')
    expect(isRetryable(error)).toBe(false)
  })
})
