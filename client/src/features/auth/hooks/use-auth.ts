import { useQuery } from '@tanstack/react-query'
import { getCurrentUser } from '@/features/auth/api/auth-api'
import { ApiError } from '@/lib/api-error'
import { queryKeys } from '@/lib/query-keys'
import type { AuthUser } from '@/types/api'

export function useAuth() {
  const query = useQuery<AuthUser | null>({
    queryKey: queryKeys.auth.me,
    queryFn: async ({ signal }) => {
      try {
        return await getCurrentUser(signal)
      } catch (error) {
        if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
          return null
        }
        throw error
      }
    },
    staleTime: 60_000,
    retry: false,
  })

  return {
    user: query.data ?? null,
    isAuthenticated: Boolean(query.data),
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  }
}
