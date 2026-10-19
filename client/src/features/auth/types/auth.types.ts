import type { ApiSuccess, AuthUser } from '@/types/api'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = ApiSuccess<{ authToken: string; user: AuthUser }>

export type MeResponse = ApiSuccess<AuthUser>
