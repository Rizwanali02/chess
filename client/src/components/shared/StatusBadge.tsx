import { Badge } from '@/components/ui/badge'
import type { MatchStatus, TournamentStatus } from '@/types/api'
import { cn } from '@/lib/utils'

const tournamentStyles: Record<TournamentStatus, string> = {
  DRAFT: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  OPEN: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400',
  ONGOING: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  COMPLETED: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
}

const matchStyles: Record<MatchStatus, string> = {
  WAITING: 'bg-slate-500/15 text-slate-700 dark:text-slate-300',
  IN_PROGRESS: 'bg-amber-500/15 text-amber-700 dark:text-amber-400',
  COMPLETED: 'bg-sky-500/15 text-sky-700 dark:text-sky-400',
}

type StatusBadgeProps = {
  status: TournamentStatus | MatchStatus
  kind?: 'tournament' | 'match'
  className?: string
}

export function StatusBadge({
  status,
  kind = 'tournament',
  className,
}: StatusBadgeProps) {
  const styles =
    kind === 'match'
      ? matchStyles[status as MatchStatus]
      : tournamentStyles[status as TournamentStatus]

  return (
    <Badge
      variant="secondary"
      className={cn('border-0 font-medium capitalize', styles, className)}
    >
      {status.toLowerCase().replace('_', ' ')}
    </Badge>
  )
}
