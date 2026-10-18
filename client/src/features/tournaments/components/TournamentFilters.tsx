import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TournamentStatus } from '@/types/api'
import { cn } from '@/lib/utils'

const STATUS_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'DRAFT', label: 'Draft' },
  { value: 'OPEN', label: 'Open' },
  { value: 'ONGOING', label: 'Ongoing' },
  { value: 'COMPLETED', label: 'Completed' },
]

type TournamentFiltersProps = {
  status?: TournamentStatus
  onStatusChange: (status: TournamentStatus | undefined) => void
  className?: string
}

export function TournamentFilters({
  status,
  onStatusChange,
  className,
}: TournamentFiltersProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-3', className)}>
      <Select
        value={status ?? 'ALL'}
        onValueChange={(value) => {
          if (value == null || value === 'ALL') {
            onStatusChange(undefined)
            return
          }
          onStatusChange(value as TournamentStatus)
        }}
      >
        <SelectTrigger className="w-44" aria-label="Filter by status">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          {STATUS_OPTIONS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
