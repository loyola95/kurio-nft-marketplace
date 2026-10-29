import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { Icon } from '@/components/icon'
import { Dialog, DialogClose, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { HomePage } from '@/features/catalog/components/HomePage'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { usePageTitle } from '@/lib/usePageTitle'
import { cn } from '@/lib/utils'
import type { AuthSearch } from '../authSearch'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { SocialButtons } from './SocialButtons'

type Mode = 'login' | 'register'

const COPY: Record<Mode, { title: string; lead: string; pageTitle: string }> = {
  login: {
    title: 'Entrar',
    lead: 'Entre para gerenciar sua carteira, coleção e perfil de criador.',
    pageTitle: 'Entrar',
  },
  register: {
    title: 'Criar conta',
    lead: 'Crie seu perfil de colecionador e conecte uma carteira quando quiser.',
    pageTitle: 'Criar perfil de colecionador',
  },
}

function ExpiredNotice({ className }: { className?: string }) {
  return (
    <p
      role="status"
      className={cn(
        'rounded-[5px] border border-primary/40 bg-primary/10 px-3 py-2 text-center text-[13px] leading-4',
        className,
      )}
    >
      Sua sessão expirou. Entre novamente para continuar de onde parou.
    </p>
  )
}

/** Login e cadastro: modal sobre a Início no desktop, página inteira no mobile (frames do Figma). */
export function AuthScreen({ mode }: { mode: Mode }) {
  const search = useSearch({ strict: false }) as AuthSearch
  const desktop = useMediaQuery('(min-width: 768px)')
  usePageTitle(COPY[mode].title)
  return desktop ? (
    <>
      <HomePage />
      <AuthDialog mode={mode} search={search} />
    </>
  ) : (
    <AuthPage mode={mode} search={search} />
  )
}

function AuthDialog({ mode, search }: { mode: Mode; search: AuthSearch }) {
  const navigate = useNavigate()
  const keep = { redirect: search.redirect, motivo: search.motivo }
  const tab = (target: Mode) =>
    cn('hover:text-highlight', target === mode ? 'text-highlight' : 'text-foreground')

  return (
    <Dialog open onOpenChange={(open) => !open && void navigate({ to: '/' })}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-transparent supports-backdrop-filter:backdrop-blur-none"
        aria-describedby={undefined}
        // Abre com o foco no primeiro campo, não no botão de fechar.
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          ;(event.currentTarget as HTMLElement).querySelector<HTMLInputElement>('input')?.focus()
        }}
        className={cn(
          // 500px de largura a 160px do topo (Sign In/Sign Up Modal), com a faixa laranja de 10px na base.
          'top-[clamp(16px,calc(100dvh-672px),160px)] block w-[500px] max-w-[calc(100%-2rem)] translate-y-0 sm:max-w-[500px] gap-0 overflow-hidden rounded-lg bg-surface p-0 pb-[10px] text-foreground ring-0 after:absolute after:inset-x-0 after:bottom-0 after:h-[10px] after:bg-primary',
          mode === 'login' ? 'min-h-[600px]' : 'min-h-[656px]',
        )}
      >
        <DialogTitle className="sr-only">{COPY[mode].title}</DialogTitle>
        <DialogClose className="absolute top-[11px] right-3 grid size-[18px] place-items-center text-primary after:absolute after:-inset-3 hover:text-highlight">
          <Icon name="close" size={18} />
          <span className="sr-only">Fechar</span>
        </DialogClose>

        <div className="flex flex-col items-center gap-10 px-12 pt-12">
          <nav
            aria-label="Acesso à conta"
            className="flex items-center gap-2 text-xl leading-4 font-medium"
          >
            <Link
              to="/entrar"
              search={keep}
              replace
              aria-current={mode === 'login' ? 'page' : undefined}
              className={tab('login')}
            >
              Entrar
            </Link>
            <span aria-hidden className="h-5 w-px bg-danger" />
            <Link
              to="/cadastro"
              search={keep}
              replace
              aria-current={mode === 'register' ? 'page' : undefined}
              className={tab('register')}
            >
              Criar conta
            </Link>
          </nav>
          <p className="min-h-8 text-center text-[13px] leading-4">{COPY[mode].lead}</p>
        </div>

        <div className="flex flex-col px-20 pt-6">
          {search.motivo === 'expirada' && <ExpiredNotice className="mb-3" />}
          {mode === 'login' ? (
            <LoginForm variant="dialog" redirect={search.redirect} />
          ) : (
            <RegisterForm variant="dialog" redirect={search.redirect} />
          )}
        </div>

        <SocialButtons
          className={cn('pt-6 pb-6', mode === 'register' && 'gap-4')}
          buttonsClassName={cn('px-20', mode === 'login' ? 'gap-3' : 'gap-4')}
        />
      </DialogContent>
    </Dialog>
  )
}

function AuthPage({ mode, search }: { mode: Mode; search: AuthSearch }) {
  const keep = { redirect: search.redirect, motivo: search.motivo }
  return (
    <section aria-labelledby="auth-titulo" className="flex flex-col gap-10 px-1 pt-14 pb-6">
      <Link
        to="/"
        className="grid h-[136px] place-items-center text-[32px] leading-[42px] font-bold"
      >
        KURIO
        <span className="sr-only"> (voltar para a Início)</span>
      </Link>
      <div className="flex flex-col gap-4">
        <h1
          id="auth-titulo"
          className={cn('text-center font-bold', mode === 'login' ? 'text-xl/4' : 'text-lg/4')}
        >
          {COPY[mode].pageTitle}
        </h1>
        {search.motivo === 'expirada' && <ExpiredNotice />}
      </div>
      {mode === 'login' ? (
        <LoginForm variant="page" redirect={search.redirect} />
      ) : (
        <RegisterForm variant="page" redirect={search.redirect} />
      )}
      <SocialButtons buttonsClassName="gap-4" />
      <p className="text-center text-[15px] leading-5 text-text-2">
        {mode === 'login' ? 'Novo na Kurio? ' : 'Já tem uma conta? '}
        <Link
          to={mode === 'login' ? '/cadastro' : '/entrar'}
          search={keep}
          className="underline-offset-2 hover:text-highlight hover:underline"
        >
          {mode === 'login' ? 'Crie uma conta' : 'Entre'}
        </Link>
      </p>
    </section>
  )
}
