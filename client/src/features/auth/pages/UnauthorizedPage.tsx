import { Link } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/components/ui/button'

export function UnauthorizedPage() {
  const { user } = useAuth()
  const home =
    user?.role === 'COACH' ? '/coach/dashboard' : '/student/dashboard'

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <ShieldAlert className="size-6" aria-hidden />
      </div>
      <div className="space-y-2">
        <h1 className="font-heading text-2xl font-semibold">Access denied</h1>
        <p className="max-w-md text-sm text-muted-foreground">
          You do not have permission to view this page with your current role.
        </p>
      </div>
      <Button render={<Link to={home} />}>Back to dashboard</Button>
    </div>
  )
}
