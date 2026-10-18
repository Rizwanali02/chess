import { useState } from 'react'
import { useQueries, useQuery } from '@tanstack/react-query'
import { Swords } from 'lucide-react'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { PageHeader } from '@/components/shared/PageHeader'
import { MatchmakingPanel } from '@/features/matchmaking/components/MatchmakingPanel'
import { useMatchmaking } from '@/features/matchmaking/hooks/use-matchmaking'
import type { EligibleTournament } from '@/features/matchmaking/types/matchmaking.types'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { apiClient } from '@/lib/api-client'
import { queryKeys } from '@/lib/query-keys'
import type {
  ApiSuccess,
  TournamentListData,
  TournamentParticipant,
} from '@/types/api'

const MAX_PARTICIPANT_CHECKS = 20

export function MatchmakingPage() {
  const { user } = useAuth()
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(
    null,
  )

  const matchmaking = useMatchmaking()

  const openTournamentsQuery = useQuery({
    queryKey: queryKeys.tournaments.list({ status: 'OPEN', page: 1, limit: 50 }),
    queryFn: async ({ signal }) => {
      const response = await apiClient.get<ApiSuccess<TournamentListData>>(
        '/tournaments',
        {
          signal,
          searchParams: { status: 'OPEN', page: 1, limit: 50 },
        },
      )
      return response.data.items
    },
  })

  const openTournaments = openTournamentsQuery.data ?? []
  const tournamentsToCheck = openTournaments.slice(0, MAX_PARTICIPANT_CHECKS)

  const participantQueries = useQueries({
    queries: tournamentsToCheck.map((tournament) => ({
      queryKey: queryKeys.tournaments.participants(tournament.id),
      queryFn: async ({ signal }: { signal?: AbortSignal }) => {
        const response = await apiClient.get<
          ApiSuccess<TournamentParticipant[]>
        >(`/tournaments/${tournament.id}/participants`, { signal })
        return response.data
      },
      enabled: Boolean(user?.id) && openTournamentsQuery.isSuccess,
    })),
  })

  const eligibleTournaments: EligibleTournament[] = user?.id
    ? tournamentsToCheck.flatMap((tournament, index) => {
        const participants = participantQueries[index]?.data
        if (!participants?.some((participant) => participant.id === user.id)) {
          return []
        }
        return [{
          id: tournament.id,
          name: tournament.name,
          initialSeconds: tournament.initialSeconds,
          incrementSeconds: tournament.incrementSeconds,
          startsAt: tournament.startsAt,
          status: 'OPEN' as const,
        }]
      })
    : []

  const participantsLoading = participantQueries.some(
    (query) => query.isLoading || query.isFetching,
  )
  const participantsError = participantQueries.find((query) => query.isError)

  const handleFindMatch = () => {
    if (!selectedTournamentId) return
    void matchmaking.joinQueue(selectedTournamentId)
  }

  if (openTournamentsQuery.isLoading) {
    return <LoadingState label="Loading open tournaments…" />
  }

  if (openTournamentsQuery.isError) {
    return (
      <ErrorState
        title="Could not load tournaments"
        description="Open tournaments are required for matchmaking."
        onRetry={() => {
          void openTournamentsQuery.refetch()
        }}
      />
    )
  }

  if (participantsError) {
    return (
      <ErrorState
        title="Could not verify tournament membership"
        description="We need your joined tournaments before you can queue."
        onRetry={() => {
          participantQueries.forEach((query) => {
            void query.refetch()
          })
        }}
      />
    )
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Matchmaking"
        description="Queue for a live game in an open tournament you have joined."
      />

      {!participantsLoading && eligibleTournaments.length === 0 ? (
        <EmptyState
          icon={<Swords className="size-5" aria-hidden />}
          title="No eligible tournaments"
          description="Join an open tournament first, then return here to find a match."
        />
      ) : (
        <MatchmakingPanel
          tournaments={eligibleTournaments}
          selectedTournamentId={selectedTournamentId}
          onSelectTournament={setSelectedTournamentId}
          status={matchmaking.status}
          connectionStatus={matchmaking.connectionStatus}
          errorMessage={matchmaking.errorMessage}
          onFindMatch={handleFindMatch}
          onCancel={() => {
            void matchmaking.leaveQueue()
          }}
          tournamentsLoading={participantsLoading}
        />
      )}
    </div>
  )
}
