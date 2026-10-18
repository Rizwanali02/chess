import { LoaderCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

type LoadingStateProps = {
  label?: string
  fullPage?: boolean
  className?: string
}

export function LoadingState({
  label = 'Loading…',
  fullPage = false,
  className,
}: LoadingStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-muted-foreground',
        fullPage ? 'min-h-svh' : 'min-h-48 py-10',
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <LoaderCircle className="size-6 animate-spin text-primary" aria-hidden />
      <p className="text-sm">{label}</p>
    </div>
  )
}
