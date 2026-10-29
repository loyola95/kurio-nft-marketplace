import { Skeleton } from '@/components/ui/skeleton'

/** Mesmo esqueleto da tela de detalhe, nas dimensões do conteúdo final. */
export function DetailSkeleton() {
  return (
    <div aria-busy="true" aria-label="Carregando NFT" className="flex flex-col gap-3">
      <Skeleton className="hidden h-4 w-[145px] md:block" />
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="flex flex-col-reverse gap-4 md:w-[573px] md:shrink-0 md:flex-row md:gap-7">
          <div className="flex gap-4 md:flex-col">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-16 rounded-lg md:size-[100px]" />
            ))}
          </div>
          <Skeleton className="aspect-square w-full max-w-[444px] rounded-md" />
        </div>
        <div className="flex flex-1 flex-col gap-5">
          <Skeleton className="h-[37px] w-2/3" />
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-px w-full" />
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-7 w-[209px]" />
          <Skeleton className="h-[50px] w-full" />
          <Skeleton className="h-[84px] w-[308px]" />
        </div>
      </div>
    </div>
  )
}
