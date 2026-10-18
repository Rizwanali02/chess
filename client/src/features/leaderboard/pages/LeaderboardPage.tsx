import { Link, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { LeaderboardTable } from '@/features/leaderboard/components/LeaderboardTable'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useLeaderboard } from '@/features/leaderboard/hooks/use-leaderboard'
import { useTournament } from '@/features/tournaments/hooks/use-tournament'

export function LeaderboardPage() {
  const { tournamentId } = useParams()
  const { user } = useAuth()
  const tournament = useTournament(tournamentId)
  const leaderboard = useLeaderboard(tournamentId)

  if (tournament.isLoading) return <LoadingState label="Loading tournament…" />
  if (tournament.isError || !tournament.data) {
    return <ErrorState title="Could not load tournament" onRetry={() => void tournament.refetch()} />
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link to={`/tournaments/${tournament.data.id}`} />}>
        <ArrowLeft data-icon="inline-start" /> Tournament details
      </Button>
      <PageHeader
        title="Leaderboard"
        description={`Official standings for ${tournament.data.name}. Scores come from completed match results.`}
      />
      <Card>
        <CardContent className="pt-6">
          <LeaderboardTable
            entries={leaderboard.data}
            isLoading={leaderboard.isLoading}
            isError={leaderboard.isError}
            onRetry={() => void leaderboard.refetch()}
            highlightUserId={user?.id}
          />
        </CardContent>
      </Card>
    </div>
  )
}
