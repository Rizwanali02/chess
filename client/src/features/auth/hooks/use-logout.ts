import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/lib/api-error'
import { logoutRequest } from '@/features/auth/api/auth-api'
import { disconnectAllSockets } from '@/lib/socket-client'
import { queryKeys } from '@/lib/query-keys'

export function useLogout() {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: () => logoutRequest(),
    onSettled: async () => {
      disconnectAllSockets()
      queryClient.setQueryData(queryKeys.auth.me, null)
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      })
      await queryClient.invalidateQueries({ queryKey: queryKeys.auth.me })
      navigate('/login', { replace: true })
    },
    onError: (error: unknown) => {
      toast.error(
        error instanceof ApiError
          ? `Sign out could not be confirmed: ${error.message}`
          : 'Sign out could not be confirmed. Check your connection.',
      )
    },
  })
}
