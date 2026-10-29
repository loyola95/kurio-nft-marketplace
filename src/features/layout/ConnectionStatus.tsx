import { useRealtimeStatus } from '@/realtime/context'
import { cn } from '@/lib/utils'

/** Indicador discreto do tempo real; o texto acompanha a cor. */
export function ConnectionStatus() {
  const status = useRealtimeStatus()
  if (status !== 'reconnecting') {
    return <span className="sr-only" data-realtime={status} />
  }
  return (
    <p
      role="status"
      data-realtime={status}
      className={cn(
        'fixed right-4 bottom-28 z-40 flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-xs md:bottom-4',
      )}
    >
      <span
        aria-hidden
        className="size-2 animate-pulse rounded-full bg-gold motion-reduce:animate-none"
      />
      Reconectando atualizações em tempo real…
    </p>
  )
}
