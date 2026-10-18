import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LoadingState } from '@/components/shared/LoadingState'

export function PublicOnlyRoute() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState label="Loading…" fullPage />
  }

  if (user) {
    const destination =
      user.role === 'COACH' ? '/coach/dashboard' : '/student/dashboard'
    return <Navigate to={destination} replace />
  }

  return <Outlet />
}
