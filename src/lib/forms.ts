import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { isApiError } from '@/api/errors'

/**
 * Leva os erros de campo vindos da API para o formulário.
 * Retorna true se algum campo recebeu erro (o chamador decide a mensagem geral).
 */
export function mapFieldErrors<T extends FieldValues>(
  setError: UseFormSetError<T>,
  error: unknown,
  fields: readonly Path<T>[],
): boolean {
  if (!isApiError(error) || !error.fieldErrors) return false
  let mapped = false
  for (const [field, message] of Object.entries(error.fieldErrors)) {
    if ((fields as readonly string[]).includes(field)) {
      setError(field as Path<T>, { type: 'server', message }, { shouldFocus: !mapped })
      mapped = true
    }
  }
  return mapped
}
