export const primaryAction =
  'inline-flex h-12 items-center justify-center rounded-[5px] bg-primary px-4 text-base leading-4 font-bold text-primary-foreground transition-colors hover:bg-highlight disabled:cursor-not-allowed disabled:opacity-50'

/** "29 Out, 2026", no formato do Figma ("29 Jul, 2026"). */
export function formatOrderDate(iso: string) {
  const date = new Date(iso)
  const month = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '')
  return `${date.getDate()} ${month.charAt(0).toUpperCase()}${month.slice(1)}, ${date.getFullYear()}`
}

export const secondaryAction =
  'inline-flex h-12 items-center justify-center rounded-[5px] border border-primary px-4 text-base leading-4 font-bold text-highlight transition-colors hover:bg-primary hover:text-primary-foreground'
