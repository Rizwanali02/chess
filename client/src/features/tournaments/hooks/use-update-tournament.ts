import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { updateTournament } from '@/features/tournaments/api/tournaments-api'
import type { UpdateTournamentPayload } from '@/features/tournaments/types/tournament.types'
import { ApiError } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'

export function useUpdateTournament(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (payload: UpdateTournamentPayload) =>
      updateTournament(tournamentId, payload),
    onSuccess: async () => {
      toast.success('Tournament updated')
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournaments.detail(tournamentId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournaments.all,
        }),
      ])
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to update tournament'
      toast.error(message)
    },
  })
}
