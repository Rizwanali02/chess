import { Wifi, WifiOff, LoaderCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { ConnectionStatus } from '@/lib/socket-client'
import { cn } from '@/lib/utils'

type ConnectionIndicatorProps = {
  status: ConnectionStatus
  className?: string
}

const labels: Record<ConnectionStatus, string> = {
  idle: 'Idle',
  connecting: 'Connecting',
  connected: 'Connected',
  reconnecting: 'Reconnecting',
  disconnected: 'Disconnected',
  error: 'Connection error',
}

export function ConnectionIndicator({
  status,
  className,
}: ConnectionIndicatorProps) {
  const isConnected = status === 'connected'
  const isBusy = status === 'connecting' || status === 'reconnecting'

  return (
    <Badge
      variant="outline"
      className={cn(
        'gap-1.5 font-normal',
        isConnected && 'border-emerald-500/40 text-emerald-700 dark:text-emerald-400',
        (status === 'disconnected' || status === 'error') &&
          'border-destructive/40 text-destructive',
        className,
      )}
    >
      {isBusy ? (
        <LoaderCircle className="size-3.5 animate-spin" aria-hidden />
      ) : isConnected ? (
        <Wifi className="size-3.5" aria-hidden />
      ) : (
        <WifiOff className="size-3.5" aria-hidden />
      )}
      <span>{labels[status]}</span>
    </Badge>
  )
}
