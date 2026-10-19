
import axios, {
  type AxiosRequestConfig,
  type Method,
} from 'axios'

import { env } from '@/lib/env'
import {
  ApiError,
  normalizeApiError,
  toApiError,
} from '@/lib/api-error'

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

type RequestOptions = {
  method?: HttpMethod
  body?: unknown
  signal?: AbortSignal
  headers?: AxiosRequestConfig['headers']
  searchParams?: Record<
    string,
    string | number | boolean | undefined | null
  >
}

const api = axios.create({
  baseURL: env.apiBaseUrl.replace(/\/+$/, ''),
  withCredentials: true,
  timeout: 15000,
  headers: {
    Accept: 'application/json',
  },
})

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    method = 'GET',
    body,
    signal,
    headers,
    searchParams,
  } = options

  // Pass only the endpoint path here, e.g. /auth/login.
  // Axios will add the baseURL automatically.
  const normalizedPath = path.startsWith('/')
    ? path
    : `/${path}`

  try {
    const response = await api.request<T>({
      url: normalizedPath,
      method: method as Method,
      data: body,
      signal,
      headers,
      params: searchParams,
    })

    if (response.status === 204) {
      return undefined as T
    }

    return response.data
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const response = new Response(
        JSON.stringify(error.response.data ?? {}),
        {
          status: error.response.status,
          statusText: error.response.statusText,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      throw await normalizeApiError(response)
    }

    throw toApiError(error)
  }
}

export const apiClient = {
  get: <T>(
    path: string,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) =>
    request<T>(path, {
      ...options,
      method: 'GET',
    }),

  post: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body,
    }),

  patch: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body,
    }),

  put: <T>(
    path: string,
    body?: unknown,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body,
    }),

  delete: <T>(
    path: string,
    options?: Omit<RequestOptions, 'method' | 'body'>,
  ) =>
    request<T>(path, {
      ...options,
      method: 'DELETE',
    }),
}

export function isApiError(
  error: unknown,
): error is ApiError {
  return error instanceof ApiError
}
