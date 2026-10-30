import { useNavigate } from '@tanstack/react-router'
import { useId, useState } from 'react'
import { Icon } from '@/components/icon'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'

/** Busca do cabeçalho: leva ao catálogo com ?q= (o estado da busca vive na URL). */
export function SearchDialog() {
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const navigate = useNavigate()
  const inputId = useId()

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className="grid size-8 place-items-center rounded-md hover:text-highlight"
          aria-label="Buscar NFTs"
        >
          <Icon name="search-header" size={20} />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-[500px] border-border bg-surface">
        <DialogTitle className="text-lg font-bold">Buscar NFTs</DialogTitle>
        <DialogDescription className="text-sm text-text-2">
          Procure por nome do NFT ou da coleção.
        </DialogDescription>
        <form
          role="search"
          className="mt-2 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            setOpen(false)
            void navigate({
              to: '/',
              search: { q: term.trim() || undefined },
              hash: 'catalogo',
            })
          }}
        >
          <label htmlFor={inputId} className="sr-only">
            Termo de busca
          </label>
          <Input
            id={inputId}
            maxLength={60}
            type="search"
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Ex.: Emerald Ape"
          />
          <Button type="submit" size="sm" className="h-10">
            Buscar
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
