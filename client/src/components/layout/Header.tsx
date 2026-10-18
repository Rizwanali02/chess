import { useState } from 'react'
import { LogOut } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useLogout } from '@/features/auth/hooks/use-logout'
import { MobileNavigation } from '@/components/layout/MobileNavigation'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export function Header() {
  const { user } = useAuth()
  const logout = useLogout()
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-3 border-b bg-background/90 px-4 backdrop-blur supports-backdrop-filter:bg-background/75">
        <div className="flex items-center gap-3">
          <MobileNavigation />
          <div className="lg:hidden">
            <p className="font-heading text-sm font-semibold">Kingdom of Chess</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <>
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium">{user.email}</p>
                <Badge variant="secondary" className="mt-0.5 capitalize">
                  {user.role.toLowerCase()}
                </Badge>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setConfirmOpen(true)}
                disabled={logout.isPending}
              >
                <LogOut data-icon="inline-start" />
                Sign out
              </Button>
            </>
          ) : null}
        </div>
      </header>
      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Sign out?"
        description="You will need to sign in again to access tournaments and matches."
        confirmLabel="Sign out"
        variant="destructive"
        loading={logout.isPending}
        onConfirm={() => logout.mutate()}
      />
    </>
  )
}
