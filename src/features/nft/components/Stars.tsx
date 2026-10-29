import { Icon } from '@/components/icon'
import { cn } from '@/lib/utils'

/** Cinco estrelas do Figma (#d28a4c); decorativas, a nota vai em texto ao lado. */
export function Stars({ rating }: { rating: number }) {
  return (
    <span aria-hidden className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name="star"
          size={15}
          className={cn(i < Math.round(rating) ? 'text-primary' : 'text-border-strong')}
        />
      ))}
    </span>
  )
}
