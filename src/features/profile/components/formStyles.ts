import { cn } from '@/lib/utils'

/** Campo de 40px com raio 3 e borda #3f2319 dos frames de perfil e carteiras. No celular o
 * placeholder usa 13px: "ENS ou carteira secundária (opcional)" não cabia em 390px. */
export const inputClass = (error?: string) =>
  cn(
    'h-10 w-full rounded-[3px] border bg-transparent px-3 text-[15px] leading-[15px] text-foreground outline-none placeholder:text-text-3 focus:border-primary max-sm:placeholder:text-[13px]',
    error ? 'border-danger' : 'border-border',
  )
