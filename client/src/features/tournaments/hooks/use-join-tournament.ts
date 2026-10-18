import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { joinTournament } from '@/features/tournaments/api/tournaments-api'
import { ApiError } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'

export function useJoinTournament(tournamentId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => joinTournament(tournamentId),
    onSuccess: async () => {
      toast.success('Joined tournament')
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournaments.detail(tournamentId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournaments.participants(tournamentId),
        }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.tournaments.all,
        }),
      ])
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError ? error.message : 'Unable to join tournament'
      toast.error(message)
    },
  })
}
