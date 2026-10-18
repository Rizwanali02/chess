import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { loginRequest } from '@/features/auth/api/auth-api'
import type { LoginRequest } from '@/features/auth/types/auth.types'
import { queryKeys } from '@/lib/query-keys'
import type { AuthUser } from '@/types/api'

function dashboardPathForRole(role: AuthUser['role']): string {
  return role === 'COACH' ? '/coach/dashboard' : '/student/dashboard'
}

export function useLogin(returnTo?: string) {
  const queryClient = useQueryClient()
  const navigate = useNavigate()

  return useMutation({
    mutationFn: (payload: LoginRequest) => loginRequest(payload),
    onSuccess: async (user) => {
      queryClient.setQueryData(queryKeys.auth.me, user)
      const destination =
        returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//')
          ? returnTo
          : dashboardPathForRole(user.role)
      navigate(destination, { replace: true })
    },
  })
}
