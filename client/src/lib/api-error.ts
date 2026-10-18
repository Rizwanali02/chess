export type ApiErrorCode =
  | 'NETWORK'
  | 'BAD_REQUEST'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION'
  | 'SERVER'
  | 'UNKNOWN'

export class ApiError extends Error {
  readonly status: number
  readonly code: ApiErrorCode
  readonly details: unknown

  constructor(
    message: string,
    status: number,
    code: ApiErrorCode,
    details?: unknown,
  ) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

function mapStatusToCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return 'BAD_REQUEST'
    case 401:
      return 'UNAUTHORIZED'
    case 403:
      return 'FORBIDDEN'
    case 404:
      return 'NOT_FOUND'
    case 409:
      return 'CONFLICT'
    case 422:
      return 'VALIDATION'
    case 500:
    case 502:
    case 503:
      return 'SERVER'
    default:
      return 'UNKNOWN'
  }
}

function extractMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== 'object') {
    return fallback
  }

  const record = payload as Record<string, unknown>
  const message = record.message

  if (typeof message === 'string' && message.trim()) {
    return message
  }

  if (Array.isArray(message) && message.every((item) => typeof item === 'string')) {
    return message.join(', ')
  }

  if (typeof record.error === 'string' && record.error.trim()) {
    return record.error
  }

  return fallback
}

export async function normalizeApiError(response: Response): Promise<ApiError> {
  let payload: unknown

  try {
    const text = await response.text()
    payload = text ? JSON.parse(text) : null
  } catch {
    payload = null
  }

  const code = mapStatusToCode(response.status)
  const message = extractMessage(
    payload,
    response.statusText || 'Request failed',
  )

  return new ApiError(message, response.status, code, payload)
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error
  }

  if (error instanceof DOMException && error.name === 'AbortError') {
    return new ApiError('Request was cancelled', 0, 'NETWORK')
  }

  if (error instanceof TypeError) {
    return new ApiError(
      'Unable to reach the server. Check your connection and try again.',
      0,
      'NETWORK',
    )
  }

  if (error instanceof Error && error.message) {
    return new ApiError(error.message, 0, 'UNKNOWN')
  }

  return new ApiError('Something went wrong', 0, 'UNKNOWN')
}
