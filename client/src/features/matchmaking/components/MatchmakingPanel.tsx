import { LoaderCircle, Swords, X } from 'lucide-react'
import { ConnectionIndicator } from '@/components/shared/ConnectionIndicator'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { formatTimeControl } from '@/lib/utils'
import type { ConnectionStatus } from '@/lib/socket-client'
import type {
  EligibleTournament,
  MatchmakingStatus,
} from '@/features/matchmaking/types/matchmaking.types'

type MatchmakingPanelProps = {
  tournaments: EligibleTournament[]
  selectedTournamentId: string | null
  onSelectTournament: (tournamentId: string | null) => void
  status: MatchmakingStatus
  connectionStatus: ConnectionStatus
  errorMessage: string | null
  onFindMatch: () => void
  onCancel: () => void
  tournamentsLoading?: boolean
}

const statusCopy: Record<MatchmakingStatus, string> = {
  idle: 'Select a tournament and find an opponent.',
  connecting: 'Connecting to matchmaking…',
  queued: 'Waiting for an opponent…',
  matched: 'Match found! Opening the board…',
  cancelling: 'Leaving the queue…',
  error: 'Something went wrong with matchmaking.',
}

export function MatchmakingPanel({
  tournaments,
  selectedTournamentId,
  onSelectTournament,
  status,
  connectionStatus,
  errorMessage,
  onFindMatch,
  onCancel,
  tournamentsLoading = false,
}: MatchmakingPanelProps) {
  const busy =
    status === 'connecting' ||
    status === 'queued' ||
    status === 'cancelling' ||
    status === 'matched'
  const selected = tournaments.find((item) => item.id === selectedTournamentId)

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-6">
      <div className="flex items-center justify-between gap-3">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Queue status</p>
          <p className="text-sm text-muted-foreground">{statusCopy[status]}</p>
        </div>
        <ConnectionIndicator status={connectionStatus} />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="mm-tournament">
          Tournament
        </label>
        <Select
          value={selectedTournamentId ?? undefined}
          onValueChange={(value) => {
            if (typeof value === 'string') {
              onSelectTournament(value)
            } else {
              onSelectTournament(null)
            }
          }}
          disabled={busy || tournamentsLoading || tournaments.length === 0}
        >
          <SelectTrigger id="mm-tournament" className="w-full min-w-0">
            <SelectValue placeholder="Choose an open tournament you joined" />
          </SelectTrigger>
          <SelectContent alignItemWithTrigger={false} className="w-(--anchor-width)">
            {tournaments.map((tournament) => (
              <SelectItem key={tournament.id} value={tournament.id}>
                <span className="flex flex-col gap-0.5 text-left">
                  <span>{tournament.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {formatTimeControl(
                      tournament.initialSeconds,
                      tournament.incrementSeconds,
                    )}
                  </span>
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected ? (
          <p className="text-xs text-muted-foreground">
            Time control{' '}
            {formatTimeControl(selected.initialSeconds, selected.incrementSeconds)}
          </p>
        ) : null}
      </div>

      {errorMessage ? (
        <p className="text-sm text-destructive" role="alert">
          {errorMessage}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {status === 'queued' ||
        status === 'cancelling' ||
        (status === 'error' && Boolean(selectedTournamentId)) ? (
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={status === 'cancelling'}
          >
            {status === 'cancelling' ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <X aria-hidden />
            )}
            Cancel queue
          </Button>
        ) : (
          <Button
            type="button"
            onClick={onFindMatch}
            disabled={
              busy ||
              !selectedTournamentId ||
              tournamentsLoading ||
              tournaments.length === 0
            }
          >
            {status === 'connecting' || status === 'matched' ? (
              <LoaderCircle className="animate-spin" aria-hidden />
            ) : (
              <Swords aria-hidden />
            )}
            Find match
          </Button>
        )}
      </div>
    </div>
  )
}
