import { useState } from 'react'
import type { Image } from '@/contracts/common'
import { NftImage } from '@/features/catalog/components/NftImage'
import { cn } from '@/lib/utils'

// O arquivo tem uma arte por NFT; as vistas da galeria são enquadramentos da mesma obra.
const VIEW_CLASS = [
  '',
  'scale-[1.35] object-[50%_30%]',
  'scale-[1.6] object-[50%_80%]',
  'scale-[1.2] object-[50%_50%]',
]

export function Gallery({ images, name }: { images: Image[]; name: string }) {
  const [active, setActive] = useState(0)
  const current = images[active] ?? images[0]
  return (
    <div className="flex flex-col-reverse gap-4 md:flex-row md:gap-7">
      <div role="group" aria-label="Vistas da obra" className="flex gap-4 md:flex-col">
        {images.map((img, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Mostrar vista ${i + 1} de ${images.length}`}
            aria-pressed={i === active}
            onClick={() => setActive(i)}
            className={cn(
              'size-16 overflow-hidden rounded-lg bg-surface md:size-[100px]',
              i === active ? 'ring-1 ring-primary' : 'opacity-80 hover:opacity-100',
            )}
          >
            <NftImage
              image={img}
              alt=""
              sizes="100px"
              className={cn('size-full rounded-lg', VIEW_CLASS[i % VIEW_CLASS.length])}
            />
          </button>
        ))}
      </div>
      <div className="grid aspect-square w-full max-w-[444px] place-items-center overflow-hidden rounded-md bg-surface p-4 md:p-5">
        <div className="size-full overflow-hidden rounded-[24px]">
          <NftImage
            image={current}
            priority
            alt={active === 0 ? `${name}, arte principal` : `${name}, vista ${active + 1}`}
            sizes="(min-width: 768px) 404px, 90vw"
            className={cn('size-full', VIEW_CLASS[active % VIEW_CLASS.length])}
          />
        </div>
      </div>
    </div>
  )
}
