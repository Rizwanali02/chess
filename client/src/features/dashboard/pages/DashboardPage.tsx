import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Swords, Trophy } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TournamentCard } from '@/features/tournaments/components/TournamentCard'
import { LeaderboardTable } from '@/features/leaderboard/components/LeaderboardTable'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { getTournamentParticipants } from '@/features/tournaments/api/tournaments-api'
import { useTournaments } from '@/features/tournaments/hooks/use-tournaments'
import { queryKeys } from '@/lib/query-keys'
import { useLeaderboard } from '@/features/leaderboard/hooks/use-leaderboard'

export function DashboardPage() {
  const { user } = useAuth()
  const tournamentsQuery = useTournaments({ page: 1, limit: 100 })
  const tournaments = tournamentsQuery.data?.items ?? []
  const participantQueries = useQueries({
    queries: tournaments.map((tournament) => ({
      queryKey: queryKeys.tournaments.participants(tournament.id),
      queryFn: ({ signal }: { signal?: AbortSignal }) =>
        getTournamentParticipants(tournament.id, signal),
      enabled: user?.role === 'STUDENT' && Boolean(user.id),
    })),
  })

  const joinedIds = new Set(
    user?.role === 'STUDENT'
      ? tournaments.flatMap((tournament, index) =>
          participantQueries[index]?.data?.some((entry) => entry.id === user.id)
            ? [tournament.id]
            : [],
        )
      : [],
  )
  const featuredTournamentId =
    user?.role === 'STUDENT' ? [...joinedIds][0] : undefined
  const leaderboardQuery = useLeaderboard(featuredTournamentId)

  if (tournamentsQuery.isLoading) {
    return <LoadingState label="Loading your dashboard…" />
  }

  if (tournamentsQuery.isError) {
    return (
      <ErrorState
        title="Could not load your dashboard"
        description="Tournament data is temporarily unavailable."
        onRetry={() => void tournamentsQuery.refetch()}
      />
    )
  }

  if (!user) return null

  const isCoach = user.role === 'COACH'
  const visibleTournaments = isCoach
    ? tournaments.filter((tournament) => tournament.createdBy === user.id)
    : tournaments.filter((tournament) => joinedIds.has(tournament.id))
  const availableTournaments = tournaments.filter(
    (tournament) => tournament.status === 'OPEN' && !joinedIds.has(tournament.id),
  )
  const participantLoading = participantQueries.some((query) => query.isLoading)
  const participantError = participantQueries.find((query) => query.isError)

  if (!isCoach && participantLoading) {
    return <LoadingState label="Checking your tournament memberships…" />
  }

  if (!isCoach && participantError) {
    return (
      <ErrorState
        title="Could not verify tournament memberships"
        description="Refresh the dashboard to check your joined tournaments."
        onRetry={() => {
          void tournamentsQuery.refetch()
          participantQueries.forEach((query) => void query.refetch())
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome${isCoach ? ', Coach' : ''}`}
        description={
          isCoach
            ? 'Manage your tournaments and follow the competition.'
            : 'Your tournaments and next moves, all in one place.'
        }
        actions={
          <Button
            render={
              <Link
                to={isCoach ? '/coach/tournaments/new' : '/tournaments'}
              />
            }
          >
            {isCoach ? 'Create tournament' : 'Browse tournaments'}
            <ArrowRight data-icon="inline-end" />
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Your tournaments" value={visibleTournaments.length} />
        <SummaryCard
          label="Open tournaments"
          value={tournaments.filter((item) => item.status === 'OPEN').length}
        />
        <SummaryCard
          label="Completed"
          value={visibleTournaments.filter((item) => item.status === 'COMPLETED').length}
        />
      </div>

      {!isCoach && (
        <Card className="border-primary/15 bg-primary/[0.03]">
          <CardContent className="flex flex-col justify-between gap-4 py-5 sm:flex-row sm:items-center">
            <div className="flex items-start gap-3">
              <Swords className="mt-1 size-5 text-primary" aria-hidden />
              <div>
                <p className="font-semibold">Ready for a game?</p>
                <p className="text-sm text-muted-foreground">
                  Find an opponent in an open tournament you have joined.
                </p>
              </div>
            </div>
            <Button render={<Link to="/matchmaking" />}>Find a match</Button>
          </CardContent>
        </Card>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold">
            {isCoach ? 'Your tournaments' : 'Joined tournaments'}
          </h2>
          <Button variant="ghost" size="sm" render={<Link to="/tournaments" />}>
            View all <ArrowRight data-icon="inline-end" />
          </Button>
        </div>
        {visibleTournaments.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visibleTournaments.slice(0, 6).map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        ) : (
          <EmptyState
            icon={<Trophy className="size-5" aria-hidden />}
            title={isCoach ? 'No tournaments created yet' : 'No joined tournaments yet'}
            description={
              isCoach
                ? 'Create your first tournament and invite students to compete.'
                : 'Browse open tournaments and join one to start playing.'
            }
            action={
              <Button
                render={
                  <Link
                    to={isCoach ? '/coach/tournaments/new' : '/tournaments'}
                  />
                }
              >
                {isCoach ? 'Create a tournament' : 'Browse tournaments'}
              </Button>
            }
          />
        )}
      </section>

      {!isCoach && availableTournaments.length > 0 && (
        <section className="space-y-4">
          <h2 className="font-heading text-xl font-semibold">
            Open for registration
          </h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {availableTournaments.slice(0, 3).map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </section>
      )}

      {!isCoach && featuredTournamentId && (
        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-heading text-xl font-semibold">Leaderboard preview</h2>
            <Button
              variant="ghost"
              size="sm"
              render={<Link to={`/tournaments/${featuredTournamentId}/leaderboard`} />}
            >
              Full standings <ArrowRight data-icon="inline-end" />
            </Button>
          </div>
          <LeaderboardTable
            entries={leaderboardQuery.data}
            isLoading={leaderboardQuery.isLoading}
            isError={leaderboardQuery.isError}
            onRetry={() => void leaderboardQuery.refetch()}
            highlightUserId={user.id}
            limit={5}
          />
        </section>
      )}
    </div>
  )
}

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-semibold">{value}</p>
      </CardContent>
    </Card>
  )
}
