import { QueryClient } from '@tanstack/react-query'
import { ApiError } from '@/lib/api-error'

export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (failureCount, error) => {
          if (error instanceof ApiError) {
            if (
              error.code === 'UNAUTHORIZED' ||
              error.code === 'FORBIDDEN' ||
              error.code === 'NOT_FOUND'
            ) {
              return false
            }
          }
          return failureCount < 2
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}
