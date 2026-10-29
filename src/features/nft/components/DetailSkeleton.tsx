import { Skeleton } from '@/components/ui/skeleton'

/** Mesmo esqueleto da tela de detalhe, nas dimensões do conteúdo final. */
export function DetailSkeleton() {
  return (
    // Pelo menos a altura da tela: o rodapé fica fora da vista e não pula quando o conteúdo chega (CLS).
    <div aria-busy="true" aria-label="Carregando NFT" className="flex min-h-dvh flex-col gap-3">
      {/* Mobile: mesmo hero do frame (botões, arte de 356px e folha subindo 114px). */}
      <div className="-mx-6 -mt-6 md:hidden">
        <div className="relative h-[506px] bg-linear-135 from-surface to-surface-2 pt-[23px] pr-[25px] pl-7">
          <div className="flex items-center justify-between">
            <Skeleton className="size-[35px] rounded-full" />
            <Skeleton className="size-[35px] rounded-full" />
          </div>
          <Skeleton data-art-skeleton className="mt-2 h-[356px] w-full rounded-3xl" />
        </div>
        <div className="relative -mt-[114px] flex flex-col gap-4 rounded-t-[31px] bg-surface px-6 pt-8 pb-6">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-7 w-[209px]" />
        </div>
      </div>
      <Skeleton className="hidden h-4 w-[145px] md:block" />
      <div className="hidden flex-col gap-8 md:flex md:flex-row">
        <div className="flex flex-col-reverse gap-4 md:w-[573px] md:shrink-0 md:flex-row md:gap-7">
          <div className="flex gap-4 md:flex-col">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="size-16 rounded-lg md:size-[100px]" />
            ))}
          </div>
          <Skeleton data-art-skeleton className="aspect-square w-full max-w-[444px] rounded-md" />
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
