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

/**
 * Limite de caracteres por campo, aplicado como `maxLength` para o campo parar de aceitar
 * texto no limite (os schemas também validam). Mesmos valores dos contratos; e-mail segue o
 * máximo da especificação, senhas e endereços um teto folgado.
 */
export const MAX_LENGTH: Record<string, number | undefined> = {
  displayName: 40,
  username: 24,
  email: 254,
  walletNickname: 40,
  nickname: 40,
  profileName: 40,
  referralCode: 20,
  address: 64,
  ensOrSecondary: 64,
  ensName: 36,
  note: 280,
  password: 64,
  confirm: 64,
  currentPassword: 64,
  newPassword: 64,
  confirmPassword: 64,
}
