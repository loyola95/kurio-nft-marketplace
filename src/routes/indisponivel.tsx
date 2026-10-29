import { createFileRoute, Link } from '@tanstack/react-router'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { usePageTitle } from '@/lib/usePageTitle'

const SECTIONS: Record<string, string> = {
  criadores: 'Criadores',
  aprenda: 'Aprenda',
  colecao: 'Minha coleção',
  atividade: 'Atividade',
  estudio: 'Estúdio do criador',
  ajuda: 'Central de ajuda',
  'como-comprar': 'Como comprar NFTs',
  seguranca: 'Carteira e segurança',
  politica: 'Política do mercado',
  denuncia: 'Denunciar item',
  ofertas: 'Ofertas',
  downloads: 'Arquivos baixados',
  suporte: 'Suporte',
  blog: 'Diário da Cunhagem',
}

export const Route = createFileRoute('/indisponivel')({
  validateSearch: z.object({ de: z.string().optional().catch(undefined) }),
  component: Unavailable,
})

// Destino coerente para links fora do escopo da demonstração (não simula sucesso).
function Unavailable() {
  const { de } = Route.useSearch()
  const section = (de && SECTIONS[de]) || 'Esta seção'
  usePageTitle(`${section} indisponível`)
  return (
    <section className="mx-auto flex max-w-[560px] flex-col items-center gap-6 py-20 text-center">
      <h1 className="text-2xl leading-8 font-bold">{section} não faz parte desta demonstração</h1>
      <p className="text-text-2">
        Esta área está fora do escopo do marketplace de demonstração. Você pode continuar explorando
        o catálogo, comprar NFTs e gerenciar sua conta normalmente.
      </p>
      <Button asChild>
        <Link to="/">Voltar ao catálogo</Link>
      </Button>
    </section>
  )
}
