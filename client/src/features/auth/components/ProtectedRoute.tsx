import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { LoadingState } from '@/components/shared/LoadingState'
import { ErrorState } from '@/components/shared/ErrorState'

export function ProtectedRoute() {
  const { user, isLoading, isError, error, refetch } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return <LoadingState label="Checking your session…" fullPage />
  }

  if (isError) {
    return (
      <ErrorState
        fullPage
        title="Unable to verify session"
        description={
          error instanceof Error
            ? error.message
            : 'Please try again or sign in.'
        }
        onRetry={() => {
          void refetch()
        }}
      />
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }

  return <Outlet />
}
