import type { ReactNode } from 'react'
import { usePageTitle } from '@/lib/usePageTitle'

/** Estrutura comum das telas internas: título da página (h1) e conteúdo. */
export function PageShell({
  title,
  children,
  hideTitle = false,
}: {
  title: string
  children?: ReactNode
  hideTitle?: boolean
}) {
  usePageTitle(title)
  return (
    <div className="flex flex-col gap-8">
      <h1 className={hideTitle ? 'sr-only' : 'text-2xl leading-8 font-bold'}>{title}</h1>
      {children}
    </div>
  )
}
