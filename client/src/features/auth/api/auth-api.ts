import { apiClient } from '@/lib/api-client'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
} from '@/features/auth/types/auth.types'
import type { AuthUser } from '@/types/api'

export async function loginRequest(payload: LoginRequest): Promise<AuthUser> {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload)
  const { authToken, user } = response.data

  if (authToken) {
    localStorage.setItem('authToken', authToken)
  }
  console.log('loginRequest: user', authToken)

  return user
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post<void>('/auth/logout')
}

export async function getCurrentUser(signal?: AbortSignal): Promise<AuthUser> {
  const response = await apiClient.get<MeResponse>('/me', { signal })
  return response.data
}
