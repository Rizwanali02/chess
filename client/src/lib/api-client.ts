import { env } from '@/lib/env'
import { ApiError, normalizeApiError, toApiError } from '@/lib/api-error'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  headers?: HeadersInit
  searchParams?: Record<string, string | number | boolean | undefined | null>
}

function buildUrl(
  path: string,
  searchParams?: RequestOptions['searchParams'],
): string {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`
  const url = new URL(`${env.apiBaseUrl}${normalizedPath}`)

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === '') continue
      url.searchParams.set(key, String(value))
    }
  }

  return url.toString()
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, headers, searchParams } = options

  try {
    const response = await fetch(buildUrl(path, searchParams), {
      method,
      credentials: 'include',
      signal,
      headers: {
        Accept: 'application/json',
        ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    if (response.status === 204) {
      return undefined as T
    }

    if (!response.ok) {
      throw await normalizeApiError(response)
    }

    const contentType = response.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
      return undefined as T
    }

    return (await response.json()) as T
  } catch (error) {
    throw toApiError(error)
  }
}

export const apiClient = {
  get: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) => request<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T>(path: string, options?: Omit<RequestOptions, 'method' | 'body'>) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}
