import { useQuery } from '@tanstack/react-query'
import { getTournamentParticipants } from '@/features/tournaments/api/tournaments-api'
import { queryKeys } from '@/lib/query-keys'

export function useParticipants(tournamentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tournaments.participants(tournamentId ?? ''),
    queryFn: ({ signal }) => getTournamentParticipants(tournamentId!, signal),
    enabled: Boolean(tournamentId),
  })
}
