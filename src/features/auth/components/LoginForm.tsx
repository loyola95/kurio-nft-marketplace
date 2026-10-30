import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { login } from '@/api/endpoints/auth'
import { isApiError } from '@/api/errors'
import { LoginInput } from '@/contracts/auth'
import { mapFieldErrors } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { useCompleteAuth } from '../useCompleteAuth'
import { AuthField, type AuthVariant } from './AuthField'

/** Dica de acesso da demonstração, vinda da configuração (o componente não guarda credenciais). */
const DEMO_HINT = import.meta.env.VITE_DEMO_HINT?.trim()

export function LoginForm({ variant, redirect }: { variant: AuthVariant; redirect?: string }) {
  const complete = useCompleteAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const [forgotNotice, setForgotNotice] = useState('')
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginInput),
    defaultValues: { email: '', password: '' },
  })
  const mutation = useMutation({
    mutationFn: login,
    onSuccess: (response) => complete(response, redirect),
    onError: (error) => {
      if (mapFieldErrors(form.setError, error, ['email', 'password'])) return
      setFormError(
        isApiError(error, 'INVALID_CREDENTIALS')
          ? 'E-mail ou senha incorretos.'
          : 'Não foi possível entrar agora. Tente novamente.',
      )
    },
  })
  const { errors } = form.formState
  const page = variant === 'page'

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit((values) => {
        setFormError(null)
        mutation.mutate(values)
      })}
      className="flex flex-col"
    >
      {DEMO_HINT && (
        <p className="mb-3 rounded-[5px] border border-border-strong bg-surface-3 px-3 py-2 text-center text-xs leading-5 text-text-2">
          {DEMO_HINT}
        </p>
      )}
      <div className="flex flex-col gap-3">
        <AuthField
          variant={variant}
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          error={errors.email?.message}
          {...form.register('email')}
        />
        <AuthField
          variant={variant}
          label="Senha"
          password
          autoComplete="current-password"
          placeholder="Senha"
          error={errors.password?.message}
          {...form.register('password')}
        />
        <button
          type="button"
          onClick={() =>
            setForgotNotice('A recuperação de senha não faz parte desta demonstração.')
          }
          className="self-end text-sm leading-4 text-highlight hover:underline"
        >
          Esqueceu a senha?
        </button>
        {/* Aviso no próprio formulário, perto do link (um toast cobriria o título do modal). */}
        <p role="status" className="text-right text-xs leading-4 text-highlight empty:hidden">
          {forgotNotice}
        </p>
      </div>
      {formError && (
        <p role="alert" className="mt-4 text-center text-sm text-danger">
          {formError}
        </p>
      )}
      <button
        type="submit"
        disabled={mutation.isPending}
        className={cn(
          'w-full bg-primary text-base leading-4 font-bold text-primary-foreground transition-colors hover:bg-highlight disabled:cursor-wait disabled:opacity-70',
          page ? 'mt-10 h-[60px] rounded-[10px]' : 'mt-6 h-[45px] rounded-[5px]',
        )}
      >
        {mutation.isPending ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}
