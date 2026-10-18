import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Pencil, Trash2, Trophy, Users } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ParticipantsList } from '@/features/tournaments/components/ParticipantsList'
import { TournamentForm } from '@/features/tournaments/components/TournamentForm'
import { LeaderboardTable } from '@/features/leaderboard/components/LeaderboardTable'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useJoinTournament } from '@/features/tournaments/hooks/use-join-tournament'
import { useDeleteTournament } from '@/features/tournaments/hooks/use-delete-tournament'
import { useParticipants } from '@/features/tournaments/hooks/use-participants'
import { useTournament } from '@/features/tournaments/hooks/use-tournament'
import { useUpdateTournament } from '@/features/tournaments/hooks/use-update-tournament'
import { useLeaderboard } from '@/features/leaderboard/hooks/use-leaderboard'
import { formatDateTime, formatTimeControl } from '@/lib/utils'

export function TournamentDetailPage() {
  const { tournamentId } = useParams()
  const { user } = useAuth()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const tournamentQuery = useTournament(tournamentId)
  const participantsQuery = useParticipants(tournamentId)
  const leaderboardQuery = useLeaderboard(tournamentId)
  const tournament = tournamentQuery.data
  const join = useJoinTournament(tournamentId ?? '')
  const update = useUpdateTournament(tournamentId ?? '')
  const remove = useDeleteTournament(tournamentId ?? '')

  if (tournamentQuery.isLoading) return <LoadingState label="Loading tournament…" />
  if (tournamentQuery.isError || !tournament) {
    return (
      <ErrorState
        title="Tournament unavailable"
        description="This tournament could not be loaded. It may have been removed."
        onRetry={() => void tournamentQuery.refetch()}
      />
    )
  }

  const isOwner = user?.role === 'COACH' && user.id === tournament.createdBy
  const participants = participantsQuery.data ?? []
  const isJoined = user?.role === 'STUDENT' && participants.some((item) => item.id === user.id)

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button variant="ghost" size="sm" render={<Link to="/tournaments" />}>
        <ArrowLeft data-icon="inline-start" /> All tournaments
      </Button>
      <PageHeader
        title={tournament.name}
        description="Tournament details, participants, and official standings."
        actions={
          <>
            {user?.role === 'STUDENT' && tournament.status === 'OPEN' && (
              <Button
                onClick={() => join.mutate()}
                disabled={join.isPending || isJoined || participantsQuery.isLoading}
              >
                {isJoined ? 'Joined' : join.isPending ? 'Joining…' : 'Join tournament'}
              </Button>
            )}
            {isOwner && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setEditing((value) => !value)}
                >
                  <Pencil data-icon="inline-start" /> {editing ? 'Close editor' : 'Edit'}
                </Button>
                {tournament.status === 'DRAFT' && (
                  <Button
                    onClick={() => update.mutate({ status: 'OPEN' })}
                    disabled={update.isPending}
                  >
                    Publish
                  </Button>
                )}
                {tournament.status === 'OPEN' && (
                  <Button
                    onClick={() => update.mutate({ status: 'ONGOING' })}
                    disabled={update.isPending}
                  >
                    Start tournament
                  </Button>
                )}
                {tournament.status === 'ONGOING' && (
                  <Button
                    onClick={() => update.mutate({ status: 'COMPLETED' })}
                    disabled={update.isPending}
                  >
                    Complete
                  </Button>
                )}
                {(tournament.status === 'DRAFT' || tournament.status === 'OPEN') && (
                  <Button
                    variant="destructive"
                    onClick={() => setDeleteOpen(true)}
                  >
                    <Trash2 data-icon="inline-start" /> Delete
                  </Button>
                )}
              </>
            )}
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardContent className="space-y-2 py-5"><p className="text-sm text-muted-foreground">Status</p><StatusBadge status={tournament.status} /></CardContent></Card>
        <Card><CardContent className="space-y-2 py-5"><p className="text-sm text-muted-foreground">Time control</p><p className="font-semibold">{formatTimeControl(tournament.initialSeconds, tournament.incrementSeconds)}</p></CardContent></Card>
        <Card><CardContent className="space-y-2 py-5"><p className="text-sm text-muted-foreground">Starts</p><p className="font-semibold">{formatDateTime(tournament.startsAt)}</p></CardContent></Card>
      </div>

      {editing && isOwner && (
        <Card>
          <CardHeader><CardTitle>Edit tournament</CardTitle></CardHeader>
          <CardContent>
            <TournamentForm
              mode="edit"
              defaultValues={{
                name: tournament.name,
                initialSeconds: tournament.initialSeconds,
                incrementSeconds: tournament.incrementSeconds,
                startsAt: tournament.startsAt,
                status: tournament.status,
              }}
              submitting={update.isPending}
              onSubmit={(values) => {
                update.mutate(values, { onSuccess: () => setEditing(false) })
              }}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Users className="size-5 text-muted-foreground" aria-hidden />
            <CardTitle>Participants</CardTitle>
            <span className="ml-auto text-sm text-muted-foreground">
              {tournament.participantCount}
            </span>
          </CardHeader>
          <CardContent>
            <ParticipantsList
              participants={participantsQuery.data}
              isLoading={participantsQuery.isLoading}
              isError={participantsQuery.isError}
              onRetry={() => void participantsQuery.refetch()}
            />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex-row items-center gap-2">
            <Trophy className="size-5 text-muted-foreground" aria-hidden />
            <CardTitle>Leaderboard</CardTitle>
            <Button
              className="ml-auto"
              variant="ghost"
              size="sm"
              render={<Link to={`/tournaments/${tournament.id}/leaderboard`} />}
            >
              Full table
            </Button>
          </CardHeader>
          <CardContent>
            <LeaderboardTable
              entries={leaderboardQuery.data}
              isLoading={leaderboardQuery.isLoading}
              isError={leaderboardQuery.isError}
              onRetry={() => void leaderboardQuery.refetch()}
              highlightUserId={user?.id}
              limit={5}
            />
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete this tournament?"
        description="This action cannot be undone. Tournaments with matches cannot be deleted."
        confirmLabel="Delete tournament"
        variant="destructive"
        loading={remove.isPending}
        onConfirm={() => remove.mutate()}
      />
    </div>
  )
}
