import { useQuery } from '@tanstack/react-query'
import { getTournament } from '@/features/tournaments/api/tournaments-api'
import { queryKeys } from '@/lib/query-keys'

export function useTournament(tournamentId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.tournaments.detail(tournamentId ?? ''),
    queryFn: ({ signal }) => getTournament(tournamentId!, signal),
    enabled: Boolean(tournamentId),
  })
}
