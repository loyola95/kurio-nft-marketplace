import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation } from '@tanstack/react-query'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { register as registerAccount } from '@/api/endpoints/auth'
import { RegisterInput } from '@/contracts/auth'
import { MAX_LENGTH, mapFieldErrors } from '@/lib/forms'
import { cn } from '@/lib/utils'
import { useCompleteAuth } from '../useCompleteAuth'
import { AuthField, type AuthVariant } from './AuthField'

const registerSchema = RegisterInput.extend({ confirm: z.string() }).refine(
  (v) => v.password === v.confirm,
  { path: ['confirm'], message: 'As senhas não coincidem.' },
)
type RegisterValues = z.infer<typeof registerSchema>

export function RegisterForm({ variant, redirect }: { variant: AuthVariant; redirect?: string }) {
  const complete = useCompleteAuth()
  const [formError, setFormError] = useState<string | null>(null)
  const form = useForm<RegisterValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: { username: '', email: '', password: '', confirm: '' },
  })
  const mutation = useMutation({
    mutationFn: ({ confirm: _confirm, ...input }: RegisterValues) => registerAccount(input),
    onSuccess: (response) => complete(response, redirect),
    onError: (error) => {
      if (mapFieldErrors(form.setError, error, ['username', 'email', 'password'])) return
      setFormError('Não foi possível criar a conta agora. Tente novamente.')
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
          label="Nome de usuário"
          autoComplete="username"
          placeholder="Nome de usuário"
          error={errors.username?.message}
          {...form.register('username')}
          maxLength={MAX_LENGTH.username}
        />
        <AuthField
          variant={variant}
          label="E-mail"
          type="email"
          autoComplete="email"
          placeholder="Digite seu e-mail"
          error={errors.email?.message}
          {...form.register('email')}
          maxLength={MAX_LENGTH.email}
        />
        <AuthField
          variant={variant}
          label="Senha"
          password
          autoComplete="new-password"
          placeholder="Senha"
          error={errors.password?.message}
          {...form.register('password')}
          maxLength={MAX_LENGTH.password}
        />
        <AuthField
          variant={variant}
          label="Confirmar senha"
          password
          // No desktop o Figma não tem o olho neste campo.
          toggleClassName="md:hidden"
          autoComplete="new-password"
          placeholder="Confirmar senha"
          error={errors.confirm?.message}
          {...form.register('confirm')}
          maxLength={MAX_LENGTH.confirm}
        />
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
        {mutation.isPending ? 'Criando conta…' : page ? 'Criar perfil' : 'Criar conta'}
      </button>
    </form>
  )
}
