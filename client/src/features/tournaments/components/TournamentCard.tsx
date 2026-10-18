import { Link } from 'react-router-dom'
import { CalendarClock, Timer, Users } from 'lucide-react'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import type { Tournament } from '@/types/api'
import { cn, formatDateTime, formatTimeControl } from '@/lib/utils'

type TournamentCardProps = {
  tournament: Tournament
  participantCount?: number
  className?: string
  actions?: React.ReactNode
}

export function TournamentCard({
  tournament,
  participantCount,
  className,
  actions,
}: TournamentCardProps) {
  return (
    <Card className={cn('h-full', className)}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <CardTitle className="line-clamp-2">{tournament.name}</CardTitle>
          <StatusBadge status={tournament.status} />
        </div>
        <CardDescription>
          {formatTimeControl(
            tournament.initialSeconds,
            tournament.incrementSeconds,
          )}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <CalendarClock className="size-4 shrink-0" aria-hidden />
          <span>{formatDateTime(tournament.startsAt)}</span>
        </div>
        <div className="flex items-center gap-2">
          <Timer className="size-4 shrink-0" aria-hidden />
          <span>
            {formatTimeControl(
              tournament.initialSeconds,
              tournament.incrementSeconds,
            )}
          </span>
        </div>
        {participantCount !== undefined ? (
          <div className="flex items-center gap-2">
            <Users className="size-4 shrink-0" aria-hidden />
            <span>
              {participantCount} participant
              {participantCount === 1 ? '' : 's'}
            </span>
          </div>
        ) : null}
      </CardContent>
      <CardFooter className="justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          render={<Link to={`/tournaments/${tournament.id}`} />}
        >
          View details
        </Button>
        {actions}
      </CardFooter>
    </Card>
  )
}
