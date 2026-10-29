import { useEffect, useId, useRef, useState } from 'react'
import { Icon } from '@/components/icon'
import { useCatalogSearch } from '../useCatalogSearch'

/**
 * Busca do catálogo. Escreve ?q= na URL com 300 ms de espera depois da última
 * tecla; cada busca concluída vira uma entrada no histórico.
 */
export function CatalogSearchBar({ className }: { className?: string }) {
  const { search, update } = useCatalogSearch()
  const [term, setTerm] = useState(search.q ?? '')
  const id = useId()
  const lastPushed = useRef(search.q ?? '')

  // Histórico e "limpar filtros" alteram a URL: o campo acompanha.
  useEffect(() => {
    const fromUrl = search.q ?? ''
    if (fromUrl !== lastPushed.current) {
      lastPushed.current = fromUrl
      setTerm(fromUrl)
    }
  }, [search.q])

  useEffect(() => {
    const trimmed = term.trim()
    if (trimmed === lastPushed.current) return
    const timer = window.setTimeout(() => {
      lastPushed.current = trimmed
      update({ q: trimmed || undefined })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [term, update])

  return (
    <form role="search" className={className} onSubmit={(e) => e.preventDefault()}>
      <label htmlFor={id} className="sr-only">
        Buscar NFTs por nome ou coleção
      </label>
      {/* O campo não tem contorno próprio: o foco aparece no contêiner, como no resto do site. */}
      <div className="flex h-[45px] items-center gap-2 rounded-[10px] bg-surface px-3 has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-ring">
        <Icon name="search" size={22} className="text-text-3" />
        <input
          id={id}
          type="search"
          value={term}
          onChange={(e) => setTerm(e.target.value)}
          placeholder="Explorar coleções"
          className="min-w-0 flex-1 bg-transparent text-sm font-bold text-foreground outline-none placeholder:text-text-3"
        />
      </div>
    </form>
  )
}
