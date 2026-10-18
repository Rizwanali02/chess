import { Users } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { Skeleton } from '@/components/ui/skeleton'
import type { TournamentParticipant } from '@/types/api'
import { formatDateTime } from '@/lib/utils'

type ParticipantsListProps = {
  participants: TournamentParticipant[] | undefined
  isLoading: boolean
  isError: boolean
  onRetry?: () => void
}

export function ParticipantsList({
  participants,
  isLoading,
  isError,
  onRetry,
}: ParticipantsListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <ErrorState
        title="Could not load participants"
        description="Check your connection and try again."
        onRetry={onRetry}
      />
    )
  }

  if (!participants || participants.length === 0) {
    return (
      <EmptyState
        icon={<Users className="size-5" aria-hidden />}
        title="No participants yet"
        description="Players who join this tournament will appear here."
      />
    )
  }

  return (
    <ul className="divide-y rounded-xl ring-1 ring-foreground/10">
      {participants.map((participant) => (
        <li
          key={participant.id}
          className="flex items-center justify-between gap-3 px-4 py-3"
        >
          <div>
            <p className="text-sm font-medium text-foreground">
              {participant.name}
            </p>
            <p className="text-xs text-muted-foreground">
              Joined {formatDateTime(participant.joinedAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  )
}
