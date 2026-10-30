import { toast } from 'sonner'
import { BrandIcon } from '@/components/icon'
import { cn } from '@/lib/utils'

const PROVIDERS = [
  { id: 'google', label: 'Continuar com Google' },
  { id: 'facebook', label: 'Continuar com Facebook' },
] as const

/**
 * "Ou continue com": login social fora do escopo, avisa em vez de simular sucesso. O aviso
 * é um toast (canto inferior direito no desktop), visível sem cobrir o título do modal.
 */
export function SocialButtons({
  className,
  dividerClassName,
  buttonsClassName,
}: {
  className?: string
  dividerClassName?: string
  buttonsClassName?: string
}) {
  return (
    <div className={cn('flex flex-col gap-3', className)}>
      <div className={cn('flex items-center gap-3', dividerClassName)} aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-[13px] leading-4">Ou continue com</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <p className="sr-only">Ou continue com</p>
      <div className={cn('flex flex-col', buttonsClassName)}>
        {PROVIDERS.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() =>
              toast.info(
                `${p.label.replace('Continuar com ', 'Login com ')} não faz parte desta demonstração. Use e-mail e senha.`,
              )
            }
            className="flex h-10 w-full items-center justify-center gap-3 rounded-[5px] border border-border text-[13px] leading-4 font-medium text-text-2 transition-colors hover:border-primary"
          >
            <BrandIcon name={p.id} />
            {p.label}
          </button>
        ))}
      </div>
    </div>
  )
}
