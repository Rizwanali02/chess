import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { deleteTournament } from '@/features/tournaments/api/tournaments-api'
import { ApiError } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'

export function useDeleteTournament(tournamentId: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => deleteTournament(tournamentId),
    onSuccess: async () => {
      toast.success('Tournament deleted')
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.all,
      })
      navigate('/tournaments')
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to delete tournament'
      toast.error(message)
    },
  })
}
