import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Trophy } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { TournamentCard } from '@/features/tournaments/components/TournamentCard'
import { TournamentFilters } from '@/features/tournaments/components/TournamentFilters'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useTournaments } from '@/features/tournaments/hooks/use-tournaments'
import type { TournamentStatus } from '@/types/api'

export function TournamentsPage() {
  const { user } = useAuth()
  const [status, setStatus] = useState<TournamentStatus | undefined>()
  const [page, setPage] = useState(1)
  const query = useTournaments({ status, page, limit: 12 })

  if (query.isLoading) return <LoadingState label="Loading tournaments…" />
  if (query.isError) {
    return (
      <ErrorState
        title="Could not load tournaments"
        description="Check your connection and try again."
        onRetry={() => void query.refetch()}
      />
    )
  }

  const tournaments = query.data?.items ?? []
  return (
    <div className="space-y-6">
      <PageHeader
        title="Tournaments"
        description="Find a competition, check the time control, and follow the standings."
        actions={
          user?.role === 'COACH' ? (
            <Button render={<Link to="/coach/tournaments/new" />}>
              <Plus data-icon="inline-start" /> Create tournament
            </Button>
          ) : undefined
        }
      />
      <TournamentFilters
        status={status}
        onStatusChange={(nextStatus) => {
          setStatus(nextStatus)
          setPage(1)
        }}
      />
      {tournaments.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<Trophy className="size-5" aria-hidden />}
          title="No tournaments found"
          description={
            status
              ? `There are no ${status.toLowerCase()} tournaments right now.`
              : 'New tournaments will appear here when they are published.'
          }
          action={
            user?.role === 'COACH' ? (
              <Button render={<Link to="/coach/tournaments/new" />}>
                Create tournament
              </Button>
            ) : undefined
          }
        />
      )}
      {query.data && query.data.totalPages > 1 && (
        <nav className="flex items-center justify-center gap-4" aria-label="Tournament pages">
          <Button
            variant="outline"
            disabled={page <= 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            Previous
          </Button>
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Page {query.data.page} of {query.data.totalPages}
          </p>
          <Button
            variant="outline"
            disabled={page >= query.data.totalPages}
            onClick={() => setPage((current) => Math.min(query.data!.totalPages, current + 1))}
          >
            Next
          </Button>
        </nav>
      )}
    </div>
  )
}
