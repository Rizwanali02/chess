import { useQuery } from '@tanstack/react-query'
import { getTournamentLeaderboard } from '@/features/leaderboard/api/leaderboard-api'
import { queryKeys } from '@/lib/query-keys'

export function useLeaderboard(tournamentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tournaments.leaderboard(tournamentId ?? ''),
    queryFn: ({ signal }) => getTournamentLeaderboard(tournamentId!, signal),
    enabled: Boolean(tournamentId),
  })
}
