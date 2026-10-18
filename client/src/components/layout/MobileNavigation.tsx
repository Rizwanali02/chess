import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { Crown, LayoutDashboard, Menu, Swords, Trophy, Users } from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

export function MobileNavigation() {
  const { user } = useAuth()
  const [open, setOpen] = useState(false)

  const items =
    user?.role === 'COACH'
      ? [
          { to: '/coach/dashboard', label: 'Dashboard', icon: LayoutDashboard },
          { to: '/tournaments', label: 'Tournaments', icon: Trophy },
          { to: '/coach/tournaments/new', label: 'Create', icon: Users },
        ]
      : [
          {
            to: '/student/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
          },
          { to: '/tournaments', label: 'Tournaments', icon: Trophy },
          { to: '/matchmaking', label: 'Matchmaking', icon: Swords },
        ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="lg:hidden"
            aria-label="Open navigation"
          />
        }
      >
        <Menu className="size-4" />
      </SheetTrigger>
      <SheetContent side="left" className="w-72 p-0">
        <SheetHeader className="border-b px-4 py-4 text-left">
          <SheetTitle className="flex items-center gap-2">
            <Crown className="size-4" aria-hidden />
            Kingdom of Chess
          </SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3" aria-label="Mobile">
          {items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-muted text-foreground'
                    : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                )
              }
            >
              <item.icon className="size-4" aria-hidden />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </SheetContent>
    </Sheet>
  )
}
