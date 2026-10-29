import { useEffect } from 'react'

const DEFAULT_DESCRIPTION =
  'Kurio: descubra, colecione e compre NFTs selecionados de criadores emergentes e consagrados.'

/** Título e descrição por tela (acessibilidade e SEO). */
export function usePageTitle(title: string, description: string = DEFAULT_DESCRIPTION) {
  useEffect(() => {
    document.title = title ? `${title} | Kurio` : 'Kurio | Marketplace de NFTs'
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [title, description])
}
