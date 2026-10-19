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

    onSettled: async (_data, error) => {
      localStorage.removeItem('authToken')
      localStorage.removeItem('auth_token')

      disconnectAllSockets()

      queryClient.setQueryData(queryKeys.auth.me, null)
      queryClient.removeQueries({
        predicate: (query) => query.queryKey[0] !== 'auth',
      })

      navigate('/login', { replace: true })

      if (error) {
        toast.error(
          error instanceof ApiError
            ? `Local logout complete. ${error.message}`
            : 'Local logout complete, but server session could not be confirmed.',
        )
      } else {
        toast.success('Logout successful. Session cleared.')
      }
    },
  })
}