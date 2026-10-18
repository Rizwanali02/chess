import { Trophy } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { LeaderboardEntry } from '@/types/api'
import { cn } from '@/lib/utils'

type LeaderboardTableProps = {
  entries: LeaderboardEntry[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
  highlightUserId?: string | null
  limit?: number
  className?: string
}

export function LeaderboardTable({
  entries,
  isLoading,
  isError,
  onRetry,
  highlightUserId,
  limit,
  className,
}: LeaderboardTableProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load leaderboard"
        description="Standings could not be retrieved."
        onRetry={onRetry}
        className={className}
      />
    )
  }

  const rows = limit && entries ? entries.slice(0, limit) : entries

  if (!rows || rows.length === 0) {
    return (
      <EmptyState
        icon={<Trophy className="size-5" aria-hidden />}
        title="No standings yet"
        description="Results will appear after matches are completed."
        className={className}
      />
    )
  }

  return (
    <div className={cn('rounded-xl ring-1 ring-foreground/10', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-14">Rank</TableHead>
            <TableHead>Player</TableHead>
            <TableHead className="text-right">Pts</TableHead>
            <TableHead className="hidden text-right sm:table-cell">P</TableHead>
            <TableHead className="hidden text-right sm:table-cell">W</TableHead>
            <TableHead className="hidden text-right sm:table-cell">D</TableHead>
            <TableHead className="hidden text-right sm:table-cell">L</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((entry) => {
            const highlighted = highlightUserId === entry.userId
            return (
              <TableRow
                key={entry.userId}
                className={highlighted ? 'bg-primary/5' : undefined}
              >
                <TableCell className="font-medium">{entry.rank}</TableCell>
                <TableCell>
                  <span className={highlighted ? 'font-semibold' : undefined}>
                    {entry.name}
                  </span>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {entry.points}
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  {entry.played}
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  {entry.wins}
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  {entry.draws}
                </TableCell>
                <TableCell className="hidden text-right sm:table-cell">
                  {entry.losses}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
