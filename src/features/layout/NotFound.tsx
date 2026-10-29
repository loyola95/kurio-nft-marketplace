import { Link } from '@tanstack/react-router'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/lib/usePageTitle'

export function NotFound({
  title = 'Página não encontrada',
  message = 'O endereço que você abriu não existe ou foi removido.',
}: {
  title?: string
  message?: string
}) {
  usePageTitle(title)
  return (
    <section className="mx-auto flex max-w-[520px] flex-col items-center gap-6 py-20 text-center">
      <p className="text-[43px] leading-[70px] font-bold text-highlight" aria-hidden>
        404
      </p>
      <h1 className="text-2xl leading-8 font-bold">{title}</h1>
      <p className="text-text-2">{message}</p>
      <Button asChild>
        <Link to="/">Voltar ao catálogo</Link>
      </Button>
    </section>
  )
}
