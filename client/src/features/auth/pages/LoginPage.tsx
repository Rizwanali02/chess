import { Crown } from 'lucide-react'
import { LoginForm } from '@/features/auth/components/LoginForm'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export function LoginPage() {
  return (
    <Card className="border-white/10 bg-background/95 shadow-2xl backdrop-blur">
      <CardHeader className="space-y-3">
        <div className="flex items-center gap-2 text-[#1e3a5f] lg:hidden dark:text-[#d4af37]">
          <Crown className="size-5" aria-hidden />
          <span className="font-heading text-sm font-semibold tracking-wide">
            Kingdom of Chess
          </span>
        </div>
        <CardTitle className="font-heading text-2xl">Welcome back</CardTitle>
        <CardDescription>
          Sign in with your coach or student account to enter the arena.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
      </CardContent>
    </Card>
  )
}
