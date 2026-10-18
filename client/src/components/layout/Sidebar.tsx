import { NavLink } from 'react-router-dom'
import {
  Crown,
  LayoutDashboard,
  Swords,
  Trophy,
  Users,
} from 'lucide-react'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { cn } from '@/lib/utils'

type NavItem = {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

export function Sidebar() {
  const { user } = useAuth()

  const items: NavItem[] =
    user?.role === 'COACH'
      ? [
          {
            to: '/coach/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            end: true,
          },
          { to: '/tournaments', label: 'Tournaments', icon: Trophy },
          { to: '/coach/tournaments/new', label: 'Create', icon: Users },
        ]
      : [
          {
            to: '/student/dashboard',
            label: 'Dashboard',
            icon: LayoutDashboard,
            end: true,
          },
          { to: '/tournaments', label: 'Tournaments', icon: Trophy },
          { to: '/matchmaking', label: 'Matchmaking', icon: Swords },
        ]

  return (
    <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
      <div className="flex items-center gap-3 border-b border-sidebar-border px-5 py-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Crown className="size-5" aria-hidden />
        </div>
        <div>
          <p className="font-heading text-sm font-semibold tracking-wide">
            Kingdom of Chess
          </p>
          <p className="text-xs text-muted-foreground">Tournament arena</p>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-1 p-3" aria-label="Main">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/70 hover:text-foreground',
              )
            }
          >
            <item.icon className="size-4" aria-hidden />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
