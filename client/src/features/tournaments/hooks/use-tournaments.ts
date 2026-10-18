import { useQuery } from '@tanstack/react-query'
import { listTournaments } from '@/features/tournaments/api/tournaments-api'
import type { TournamentListParams } from '@/features/tournaments/types/tournament.types'
import { queryKeys } from '@/lib/query-keys'

export function useTournaments(params: TournamentListParams = {}) {
  return useQuery({
    queryKey: queryKeys.tournaments.list(params),
    queryFn: ({ signal }) => listTournaments(params, signal),
  })
}
