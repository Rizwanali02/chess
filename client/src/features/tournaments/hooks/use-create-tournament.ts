import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createTournament } from '@/features/tournaments/api/tournaments-api'
import type { CreateTournamentPayload } from '@/features/tournaments/types/tournament.types'
import { ApiError } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'

export function useCreateTournament() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: CreateTournamentPayload) => createTournament(payload),
    onSuccess: async (tournament) => {
      toast.success('Tournament created')
      await queryClient.invalidateQueries({
        queryKey: queryKeys.tournaments.all,
      })
      navigate(`/tournaments/${tournament.id}`)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to create tournament'
      toast.error(message)
    },
  })
}
