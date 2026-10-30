import { zodResolver } from '@hookform/resolvers/zod'
import { useRef, useState, type ChangeEvent } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/api/errors'
import { Icon } from '@/components/icon'
import { Skeleton } from '@/components/ui/skeleton'
import { PASSWORD_RULE } from '@/contracts/auth'
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  UpdateProfileInput,
  type Profile,
} from '@/contracts/profile'
import { ErrorState } from '@/features/catalog/components/States'
import { useSession } from '@/features/auth/session'
import { drafts } from '@/lib/drafts'
import { MAX_LENGTH, mapFieldErrors } from '@/lib/forms'
import { usePageTitle } from '@/lib/usePageTitle'
import {
  useChangePassword,
  useProfile,
  useRemoveAvatar,
  useUpdateProfile,
  useUploadAvatar,
} from '../queries'
import { EnsControl, FormField, PasswordControl } from './FormField'
import { inputClass } from './formStyles'

// Um só "Salvar" (como no Figma): dados do perfil e, se preenchida, a troca de senha.
const profileForm = UpdateProfileInput.extend({
  currentPassword: z.string(),
  newPassword: z.string(),
  confirmPassword: z.string(),
}).superRefine((v, ctx) => {
  if (!v.currentPassword && !v.newPassword && !v.confirmPassword) return
  if (!v.currentPassword) {
    ctx.addIssue({ code: 'custom', path: ['currentPassword'], message: 'Informe a senha atual' })
  }
  if (!PASSWORD_RULE.test(v.newPassword)) {
    ctx.addIssue({
      code: 'custom',
      path: ['newPassword'],
      message: 'A senha precisa de 8 caracteres, com letras e números',
    })
  }
  if (v.newPassword !== v.confirmPassword) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'As senhas não coincidem.' })
  }
})
type ProfileValues = z.infer<typeof profileForm>
type DraftValues = Omit<ProfileValues, 'currentPassword' | 'newPassword' | 'confirmPassword'>

const DRAFT = 'perfil'
const EMPTY_PASSWORDS = { currentPassword: '', newPassword: '', confirmPassword: '' }

function fromProfile(p: Profile): DraftValues {
  return {
    displayName: p.displayName,
    username: p.username,
    email: p.email,
    ensName: p.ensName,
    walletNickname: p.walletNickname,
  }
}

function Avatar({ profile }: { profile: Profile }) {
  const upload = useUploadAvatar()
  const remove = useRemoveAvatar()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const pick = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (!(AVATAR_TYPES as readonly string[]).includes(file.type)) {
      setError('Use uma imagem PNG, JPG ou WebP.')
      return
    }
    if (file.size > AVATAR_MAX_BYTES) {
      setError('A imagem precisa ter no máximo 1 MB.')
      return
    }
    setError(null)
    upload.mutate(file, {
      onError: (e) =>
        setError(isApiError(e) ? (e.fieldErrors?.avatar ?? e.message) : 'Não foi possível enviar.'),
    })
  }

  return (
    <div className="relative flex flex-col gap-2.5">
      <p className="text-[15px] leading-[15px]">Avatar</p>
      <div className="flex items-center gap-6">
        <span className="grid size-[50px] shrink-0 place-items-center overflow-hidden rounded-full border border-border bg-surface-2 text-text-2">
          {profile.avatarUrl ? (
            <img src={profile.avatarUrl} alt="Seu avatar" className="size-full object-cover" />
          ) : (
            <Icon name="image" size={26} />
          )}
        </span>
        <div className="flex items-center gap-5">
          <input
            ref={input}
            type="file"
            accept={AVATAR_TYPES.join(',')}
            onChange={pick}
            className="sr-only"
            tabIndex={-1}
            aria-hidden
          />
          <button
            type="button"
            onClick={() => input.current?.click()}
            disabled={upload.isPending}
            aria-label="Alterar avatar"
            className="h-10 w-[98px] rounded-[3px] bg-primary text-sm leading-4 font-bold text-primary-foreground hover:bg-highlight disabled:opacity-60"
          >
            {upload.isPending ? 'Enviando…' : 'Alterar'}
          </button>
          {/* Sempre visível como no Figma; sem avatar fica desabilitado. */}
          <button
            type="button"
            onClick={() => remove.mutate()}
            disabled={!profile.avatarUrl || remove.isPending}
            aria-label="Remover avatar"
            className="text-sm leading-4 hover:text-highlight disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:text-foreground"
          >
            Remover
          </button>
        </div>
      </div>
      {/* Mensagem fora do fluxo: não empurra a seção de senha (posições do Figma). */}
      <p role="status" className="absolute top-full left-0 mt-1 text-xs leading-4 text-danger">
        {error}
      </p>
    </div>
  )
}

function ProfileForm({ profile, userId }: { profile: Profile; userId: string }) {
  const update = useUpdateProfile()
  const password = useChangePassword()
  const [saved, setSaved] = useState<string | null>(null)
  // Rascunho lido uma vez, na montagem: só vale se difere do que está salvo.
  const [initial] = useState(() => {
    const draft = drafts.load<DraftValues>(userId, DRAFT)
    const server = fromProfile(profile)
    const differs = Boolean(draft && JSON.stringify(draft) !== JSON.stringify(server))
    return { values: differs ? draft! : server, restored: differs }
  })
  const [restored, setRestored] = useState(initial.restored)
  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileForm),
    defaultValues: { ...initial.values, ...EMPTY_PASSWORDS },
  })
  const { errors, isDirty } = form.formState

  // Rascunho por usuário: se a sessão expirar no meio, o formulário volta preenchido.
  // O change de cada campo sobe até o form; as senhas nunca vão para o rascunho.
  const saveDraft = () => {
    const { currentPassword: _c, newPassword: _n, confirmPassword: _p, ...rest } = form.getValues()
    drafts.save(userId, DRAFT, rest)
  }

  const submit = form.handleSubmit(async (values) => {
    setSaved(null)
    // Sem alteração, "Perfil atualizado." seria um falso aviso de sucesso.
    if (!isDirty && !restored) {
      setSaved('Nenhuma alteração para salvar.')
      return
    }
    const { currentPassword, newPassword, confirmPassword: _confirm, ...data } = values
    const messages: string[] = []
    try {
      await update.mutateAsync(data)
      drafts.remove(userId, DRAFT)
      setRestored(false)
      messages.push('Perfil atualizado.')
      if (newPassword) {
        await password.mutateAsync({ currentPassword, newPassword })
        form.reset({ ...data, ...EMPTY_PASSWORDS })
        messages.push('Senha alterada.')
      }
      setSaved(messages.join(' '))
    } catch (error) {
      if (messages.length) setSaved(messages.join(' '))
      const fields = [
        'displayName',
        'username',
        'email',
        'ensName',
        'walletNickname',
        'currentPassword',
        'newPassword',
      ] as const
      if (!mapFieldErrors(form.setError, error, fields) && !isApiError(error, 'SESSION_EXPIRED')) {
        form.setError('root', { message: 'Não foi possível salvar agora. Tente novamente.' })
      }
    }
  })

  const busy = update.isPending || password.isPending

  return (
    <form noValidate onSubmit={submit} onChange={saveDraft} className="flex flex-col gap-8">
      {restored && (
        <p
          role="status"
          className="rounded-[3px] border border-primary/40 bg-primary/10 px-3 py-2 text-sm"
        >
          Restauramos as alterações que você não tinha salvado.
        </p>
      )}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-x-7">
        <FormField label="Nome de exibição" required error={errors.displayName?.message}>
          {(a) => (
            <input
              {...a}
              {...form.register('displayName')}
              maxLength={MAX_LENGTH.displayName}
              className={inputClass(errors.displayName?.message)}
            />
          )}
        </FormField>
        <FormField label="Nome de usuário" required error={errors.username?.message}>
          {(a) => (
            <input
              {...a}
              autoComplete="username"
              {...form.register('username')}
              maxLength={MAX_LENGTH.username}
              className={inputClass(errors.username?.message)}
            />
          )}
        </FormField>
        <FormField label="E-mail" required error={errors.email?.message}>
          {(a) => (
            <input
              {...a}
              type="email"
              autoComplete="email"
              {...form.register('email')}
              maxLength={MAX_LENGTH.email}
              className={inputClass(errors.email?.message)}
            />
          )}
        </FormField>
        <FormField label="Nome ENS" required error={errors.ensName?.message}>
          {(a) => (
            <Controller
              control={form.control}
              name="ensName"
              render={({ field }) => (
                <EnsControl
                  {...a}
                  value={field.value}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  error={errors.ensName?.message}
                />
              )}
            />
          )}
        </FormField>
        <FormField label="Apelido da carteira" required error={errors.walletNickname?.message}>
          {(a) => (
            <input
              {...a}
              {...form.register('walletNickname')}
              maxLength={MAX_LENGTH.walletNickname}
              className={inputClass(errors.walletNickname?.message)}
            />
          )}
        </FormField>
        <Avatar profile={profile} />
      </div>

      <fieldset className="flex flex-col gap-6 lg:max-w-[417px]">
        <legend className="mb-6 text-base leading-4 font-medium">Alterar senha</legend>
        <FormField compact label="Senha atual" error={errors.currentPassword?.message}>
          {(a) => (
            <PasswordControl
              {...a}
              autoComplete="current-password"
              {...form.register('currentPassword')}
              maxLength={MAX_LENGTH.currentPassword}
              error={errors.currentPassword?.message}
              fieldName="senha atual"
            />
          )}
        </FormField>
        <FormField compact label="Nova senha" error={errors.newPassword?.message}>
          {(a) => (
            <PasswordControl
              {...a}
              autoComplete="new-password"
              {...form.register('newPassword')}
              maxLength={MAX_LENGTH.newPassword}
              error={errors.newPassword?.message}
              fieldName="nova senha"
            />
          )}
        </FormField>
        <FormField compact label="Confirmar nova senha" error={errors.confirmPassword?.message}>
          {(a) => (
            <PasswordControl
              {...a}
              autoComplete="new-password"
              {...form.register('confirmPassword')}
              maxLength={MAX_LENGTH.confirmPassword}
              error={errors.confirmPassword?.message}
              fieldName="confirmação da senha"
            />
          )}
        </FormField>
      </fieldset>

      <div className="flex flex-col items-start gap-3">
        <button
          type="submit"
          disabled={busy}
          className="h-10 min-w-[131px] rounded-[3px] bg-primary px-6 text-sm leading-4 font-bold whitespace-nowrap text-primary-foreground hover:bg-highlight disabled:opacity-60"
        >
          {busy ? 'Salvando…' : 'Salvar'}
        </button>
        {errors.root && (
          <p role="alert" className="text-sm text-danger">
            {errors.root.message}
          </p>
        )}
        <p role="status" className="min-h-5 text-sm text-text-2">
          {saved}
        </p>
      </div>
    </form>
  )
}

/** "Perfil do colecionador" (frame Desktop / Perfil do Colecionador). */
export function ProfilePage() {
  usePageTitle('Perfil do colecionador')
  const { user } = useSession()
  const { data, isPending, isError, error, refetch } = useProfile()

  return (
    <section aria-labelledby="perfil-titulo" className="flex flex-col gap-8">
      <h1 id="perfil-titulo" className="text-base leading-4 font-bold">
        Perfil do colecionador
      </h1>
      {isPending ? (
        <div aria-hidden className="grid gap-6 lg:grid-cols-2 lg:gap-x-7">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-[79px]" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          title="Não foi possível carregar seu perfil"
          error={error}
          onRetry={() => void refetch()}
        />
      ) : (
        user && <ProfileForm profile={data} userId={user.id} />
      )}
    </section>
  )
}
