import {
  delay,
  http,
  HttpResponse,
  type DefaultBodyType,
  type HttpResponseResolver,
  type PathParams,
} from 'msw'
import type { ErrorCode } from '@/contracts/errors'
import { scenario } from '../scenarios'

export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'
const HTTP_TIMEOUT_MS = Number(import.meta.env.VITE_HTTP_TIMEOUT_MS ?? 8000)

/** Erro de domínio do backend simulado; vira o envelope de erro da API. */
export class MockHttpError extends Error {
  readonly status: number
  readonly code: ErrorCode
  readonly extra: { fieldErrors?: Record<string, string>; details?: unknown }

  constructor(
    status: number,
    code: ErrorCode,
    message: string,
    extra: { fieldErrors?: Record<string, string>; details?: unknown } = {},
  ) {
    super(message)
    this.status = status
    this.code = code
    this.extra = extra
  }
}

export function errorResponse(
  status: number,
  code: ErrorCode,
  message: string,
  extra: { fieldErrors?: Record<string, string>; details?: unknown } = {},
) {
  return HttpResponse.json({ error: { code, message, ...extra } }, { status })
}

const DEFAULT_MESSAGES: Partial<Record<ErrorCode, string>> = {
  INTERNAL_ERROR: 'Erro interno no servidor.',
  SERVICE_UNAVAILABLE: 'Serviço temporariamente indisponível.',
  FORBIDDEN: 'Você não tem permissão para acessar este recurso.',
}

type Method = 'get' | 'post' | 'put' | 'patch' | 'delete'

/**
 * Registra um handler REST passando pelas condições de rede do cenário atual
 * (latência, falha de conexão, timeout e erros HTTP) antes do resolver.
 */
export function route<Params extends PathParams>(
  method: Method,
  path: string,
  resolver: HttpResponseResolver<Params, DefaultBodyType>,
) {
  return http[method]<Params>(`${API_BASE}${path}`, async (info) => {
    const url = new URL(info.request.url)
    const relative = url.pathname.slice(url.pathname.indexOf(API_BASE) + API_BASE.length) || '/'
    const decision = scenario.network.decide({ method: info.request.method, path: relative })
    if (decision.delayMs > 0) await delay(decision.delayMs)
    const effect = decision.effect
    if (effect === 'network') return HttpResponse.error()
    if (effect === 'timeout') {
      await delay(HTTP_TIMEOUT_MS + 2000)
      return errorResponse(504, 'SERVICE_UNAVAILABLE', 'Tempo de resposta esgotado.')
    }
    if (effect)
      return errorResponse(effect.status, effect.code, DEFAULT_MESSAGES[effect.code] ?? 'Erro.')
    try {
      return await resolver(info)
    } catch (error) {
      if (error instanceof MockHttpError) {
        return errorResponse(error.status, error.code, error.message, error.extra)
      }
      throw error
    }
  })
}

/** Lê o corpo JSON validando com o schema; erro vira 422 com fieldErrors. */
export async function readBody<T>(
  request: Request,
  schema: {
    safeParse(
      v: unknown,
    ):
      | { success: true; data: T }
      | { success: false; error: { issues: { path: PropertyKey[]; message: string }[] } }
  },
): Promise<T> {
  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    throw new MockHttpError(400, 'VALIDATION_ERROR', 'Corpo da requisição inválido.')
  }
  const parsed = schema.safeParse(raw)
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {}
    for (const issue of parsed.error.issues) {
      const key = issue.path.map(String).join('.') || '_'
      fieldErrors[key] ??= issue.message
    }
    throw new MockHttpError(422, 'VALIDATION_ERROR', 'Revise os campos destacados.', {
      fieldErrors,
    })
  }
  return parsed.data
}
