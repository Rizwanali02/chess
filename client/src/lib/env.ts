function requireEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name]
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`Missing environment variable: ${name}`)
  }
  return value.replace(/\/$/, '')
}

export const env = {
  apiBaseUrl: requireEnv('VITE_API_BASE_URL'),
  socketUrl: requireEnv('VITE_SOCKET_URL'),
} as const
