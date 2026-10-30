import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { login } from '@/api/endpoints/auth'
import { isApiError } from '@/api/errors'
import { LoginInput } from '@/contracts/auth'
import { MAX_LENGTH, mapFieldErrors } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { useCompleteAuth } from '../useCompleteAuth'
import { AuthField, type AuthVariant } from './AuthField'

export function LoginForm({ variant, redirect }: { variant: AuthVariant; redirect?: string }) {
  const complete = useCompleteAuth()
  const [formError, setFormError] = useState<string | null>(null)
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
      <div className="flex flex-col gap-3">
        <AuthField
          variant={variant}
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="contato@email.com"
          error={errors.email?.message}
          {...form.register('email')}
          maxLength={MAX_LENGTH.email}
        />
        <AuthField
          variant={variant}
          label="Senha"
          password
          autoComplete="current-password"
          placeholder="Senha"
          error={errors.password?.message}
          {...form.register('password')}
          maxLength={MAX_LENGTH.password}
        />
        <button
          type="button"
          onClick={() => toast.info('A recuperação de senha não faz parte desta demonstração.')}
          className="self-end text-sm leading-4 text-highlight hover:underline"
        >
          Esqueceu a senha?
        </button>
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
