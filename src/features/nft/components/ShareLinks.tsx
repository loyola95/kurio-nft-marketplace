import { toast } from 'sonner'
import { Icon } from '@/components/icon'

/** "Compartilhar este NFT": links reais de compartilhamento e cópia do endereço. */
export function ShareLinks({ name }: { name: string }) {
  // Link limpo para compartilhar: sem os parâmetros da simulação (?cenario, ?painel), que
  // abririam o site de quem recebe num cenário de teste. A edição escolhida é mantida.
  const url = (() => {
    if (typeof window === 'undefined') return ''
    const current = new URL(window.location.href)
    const shared = new URL(current.pathname, current.origin)
    const edition = current.searchParams.get('edicao')
    if (edition) shared.searchParams.set('edicao', edition)
    return shared.toString()
  })()
  const text = encodeURIComponent(`${name} na Kurio`)
  const encodedUrl = encodeURIComponent(url)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast.success('Link do NFT copiado.')
    } catch {
      toast.error('Não foi possível copiar o link. Copie pela barra de endereço.')
    }
  }

  const link = 'grid size-5 place-items-center text-foreground hover:text-highlight'
  return (
    <div className="flex items-center gap-2">
      <p className="text-[15px] leading-4 font-bold">Compartilhar este NFT:</p>
      <a
        href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no LinkedIn (abre em nova aba)"
        className={link}
      >
        <Icon name="social-linkedin" size={15} />
      </a>
      <button
        type="button"
        onClick={() => void copy()}
        aria-label="Copiar link do NFT"
        className={link}
      >
        <Icon name="message" size={18} />
      </button>
      <a
        href={`https://x.com/intent/post?text=${text}&url=${encodedUrl}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Compartilhar no X (abre em nova aba)"
        className={link}
      >
        <Icon name="social-twitter" size={16} />
      </a>
    </div>
  )
}
