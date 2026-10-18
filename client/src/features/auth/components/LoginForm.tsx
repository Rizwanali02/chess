import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Eye, EyeOff, LoaderCircle } from 'lucide-react'
import { useLocation } from 'react-router-dom'
import {
  loginSchema,
  type LoginFormValues,
} from '@/features/auth/schemas/login-schema'
import { useLogin } from '@/features/auth/hooks/use-login'
import { ApiError } from '@/lib/api-error'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

export function LoginForm() {
  const location = useLocation()
  const returnTo =
    typeof location.state === 'object' &&
    location.state &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : undefined

  const login = useLogin(returnTo)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  })

  const submitting = isSubmitting || login.isPending
  const apiError =
    login.error instanceof ApiError
      ? login.error
      : login.error
        ? new ApiError('Unable to sign in', 0, 'UNKNOWN')
        : null

  return (
    <form
      className="space-y-4"
      onSubmit={handleSubmit((values) => login.mutate(values))}
      noValidate
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          aria-invalid={Boolean(errors.email)}
          disabled={submitting}
          {...register('email')}
        />
        {errors.email ? (
          <p className="text-xs text-destructive">{errors.email.message}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password)}
            className="pr-10"
            disabled={submitting}
            {...register('password')}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff /> : <Eye />}
          </Button>
        </div>
        {errors.password ? (
          <p className="text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>

      {apiError ? (
        <Alert variant="destructive">
          <AlertDescription>
            {apiError.code === 'UNAUTHORIZED'
              ? 'Invalid email or password.'
              : apiError.code === 'NETWORK'
                ? apiError.message
                : apiError.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <>
            <LoaderCircle className="animate-spin" data-icon="inline-start" />
            Signing in…
          </>
        ) : (
          'Sign in'
        )}
      </Button>
    </form>
  )
}
