import { Icon } from '@/components/icon'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Image } from '@/contracts/common'
import { NftImage } from '@/features/catalog/components/NftImage'

/** Lupa no canto da arte (Frame 399 do Figma): abre a obra ampliada. */
export function ZoomImage({ image, name }: { image: Image; name: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          className="grid size-[30px] place-items-center rounded-full border border-border bg-surface-2 text-foreground hover:border-primary"
        >
          <Icon name="search" size={16} />
          <span className="sr-only">Ampliar imagem de {name}</span>
        </button>
      </DialogTrigger>
      <DialogContent className="w-[min(90vw,720px)] max-w-none border-border bg-surface p-4">
        <DialogTitle className="sr-only">{name}</DialogTitle>
        <DialogDescription className="sr-only">Arte ampliada do NFT.</DialogDescription>
        <NftImage
          image={image}
          sizes="720px"
          alt={`${name}, arte ampliada`}
          className="aspect-square w-full rounded-[24px]"
        />
      </DialogContent>
    </Dialog>
  )
}
