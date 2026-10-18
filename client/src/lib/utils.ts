import { cn as cnMerge } from 'cn'

export function cn(...inputs: Parameters<typeof cnMerge>) {
  return cnMerge(...inputs)
}

export function formatDuration(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function formatClockMs(ms: number | null | undefined): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) {
    return '--:--'
  }
  return formatDuration(Math.ceil(ms / 1000))
}

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

export function formatTimeControl(
  initialSeconds: number,
  incrementSeconds: number,
): string {
  const minutes = Math.floor(initialSeconds / 60)
  const seconds = initialSeconds % 60
  const base =
    seconds === 0 ? `${minutes}+${incrementSeconds}` : `${minutes}m ${seconds}s+${incrementSeconds}`
  return base
}
