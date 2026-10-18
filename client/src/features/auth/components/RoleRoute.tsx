import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LoadingState } from '@/components/shared/LoadingState'
import type { UserRole } from '@/types/api'

type RoleRouteProps = {
  roles: UserRole[]
}

export function RoleRoute({ roles }: RoleRouteProps) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return <LoadingState label="Checking access…" fullPage />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />
  }

  return <Outlet />
}
