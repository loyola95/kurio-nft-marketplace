import { Button } from '@/components/ui/button'
import { ApiError } from '@/api/errors'

export function ErrorState({
  error,
  onRetry,
  title = 'Não foi possível carregar os NFTs',
}: {
  error: unknown
  onRetry: () => void
  title?: string
}) {
  const detail =
    error instanceof ApiError ? error.message : 'Ocorreu um erro inesperado. Tente novamente.'
  return (
    <div role="alert" className="flex flex-col items-start gap-4 rounded-lg bg-surface p-8">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-text-2">{detail}</p>
      <Button type="button" size="sm" onClick={onRetry}>
        Tentar novamente
      </Button>
    </div>
  )
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string
  message: string
  action?: { label: string; onClick: () => void }
}) {
  return (
    <div className="flex flex-col items-start gap-4 rounded-lg bg-surface p-8">
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-sm text-text-2">{message}</p>
      {action && (
        <Button type="button" size="sm" variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
