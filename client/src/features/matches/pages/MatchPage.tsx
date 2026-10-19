import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Chess, type Square } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { ArrowLeft, Flag, RotateCw } from 'lucide-react'
import { ConfirmDialog } from '@/components/shared/ConfirmDialog'
import { ConnectionIndicator } from '@/components/shared/ConnectionIndicator'
import { ErrorState } from '@/components/shared/ErrorState'
import { LoadingState } from '@/components/shared/LoadingState'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { useMatchSocket } from '@/features/matches/hooks/use-match-socket'
import { useTournament } from '@/features/tournaments/hooks/use-tournament'
import type { PromotionPiece } from '@/types/api'
import { formatTimeControl } from '@/lib/utils'
import { toast } from 'sonner'

const promotionOptions: Array<{ piece: PromotionPiece; label: string }> = [
  { piece: 'q', label: 'Queen' },
  { piece: 'r', label: 'Rook' },
  { piece: 'b', label: 'Bishop' },
  { piece: 'n', label: 'Knight' },
]

export function MatchPage() {
  const { matchId } = useParams()
  const { user } = useAuth()
  const game = useMatchSocket(matchId)
  const tournamentQuery = useTournament(game.match?.tournamentId)
  const [clocks, setClocks] = useState({ white: 0, black: 0 })
  const [promotion, setPromotion] = useState<{ from: string; to: string } | null>(null)
  const [resignOpen, setResignOpen] = useState(false)
  const [resigning, setResigning] = useState(false)

  useEffect(() => {
    const match = game.match
    if (!match) return
    const update = () => {
      const elapsed =
        match.status === 'IN_PROGRESS' && match.lastClockStartedAt
          ? Math.max(0, Date.now() - new Date(match.lastClockStartedAt).getTime())
          : 0
      const whiteRemaining = match.whiteTimeRemainingMs ?? 0
      const blackRemaining = match.blackTimeRemainingMs ?? 0
      setClocks({
        white: Math.max(0, whiteRemaining - (match.turn === 'w' ? elapsed : 0)),
        black: Math.max(0, blackRemaining - (match.turn === 'b' ? elapsed : 0)),
      })
    }
    update()
    const timer = window.setInterval(update, 250)
    return () => window.clearInterval(timer)
  }, [game.match])

  const moves = (() => {
    if (!game.match?.pgn) return []
    try {
      const chess = new Chess()
      chess.loadPgn(game.match.pgn)
      return chess.history({ verbose: true })
    } catch {
      return []
    }
  })()

  if (game.isLoading) return <LoadingState label="Restoring match…" />
  if (game.isError || !game.match) {
    return (
      <ErrorState
        title="Could not load this match"
        description="Only the players in a match can view its position and clock."
        onRetry={() => void game.refetchMatch()}
      />
    )
  }

  const match = game.match
  const isWhite = user?.id === match.whitePlayerId
  const isBlack = user?.id === match.blackPlayerId
  const isPlayer = isWhite || isBlack
  const yourTurn = (match.turn === 'w' && isWhite) || (match.turn === 'b' && isBlack)
  const canMove = isPlayer && yourTurn && match.status === 'IN_PROGRESS'

  const movePiece = (from: string, to: string, selectedPromotion?: PromotionPiece) => {
    void game.submitMove(from, to, selectedPromotion)
  }

  const onPieceDrop = ({ sourceSquare, targetSquare }: { sourceSquare: string; targetSquare: string | null }) => {
    if (!targetSquare || !canMove || game.pendingMove || game.connectionStatus !== 'connected') return false
    try {
      const chess = new Chess(match.fen)
      const candidates = chess.moves({ square: sourceSquare as Square, verbose: true })
      const isLegalMove = candidates.some((move) => move.to === targetSquare)
      if (!isLegalMove) {
        toast.error('That move is not legal in the current position.')
        return false
      }
      const needsPromotion = candidates.some(
        (move) => move.to === targetSquare && move.promotion,
      )
      if (needsPromotion) {
        setPromotion({ from: sourceSquare, to: targetSquare })
        return false
      }
      movePiece(sourceSquare, targetSquare)
    } catch {
      toast.error('That move is not legal in the current position.')
    }
    return false
  }

  const displayMoves = Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => ({
    number: index + 1,
    white: moves[index * 2]?.san ?? '',
    black: moves[index * 2 + 1]?.san ?? '',
  }))

  const resultLabel = match.result
    ? match.result === 'DRAW'
      ? 'Draw'
      : match.result === 'WHITE_WIN'
        ? 'White wins'
        : 'Black wins'
    : 'In progress'

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <Button variant="ghost" size="sm" render={<Link to={`/tournaments/${match.tournamentId}`} />}>
        <ArrowLeft data-icon="inline-start" /> Tournament
      </Button>
      <PageHeader
        title="Live match"
        description={`Match ${match.id.slice(0, 8)} · ${resultLabel}`}
        actions={<ConnectionIndicator status={game.connectionStatus} />}
      />

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="mx-auto w-full max-w-[760px] space-y-3">
          <PlayerClock
            label="Black"
            playerId={match.blackPlayerId}
            isCurrentTurn={match.turn === 'b' && match.status === 'IN_PROGRESS'}
            time={clocks.black}
            isYou={isBlack}
          />
          <div className="overflow-hidden rounded-xl border bg-card p-2 shadow-sm sm:p-3">
            <Chessboard
              options={{
                position: match.fen,
                boardOrientation: isBlack ? 'black' : 'white',
                allowDragging: canMove && !game.pendingMove && game.connectionStatus === 'connected',
                canDragPiece: ({ piece }) => canMove && piece.pieceType.startsWith(isWhite ? 'w' : 'b'),
                onPieceDrop,
                boardStyle: { width: '100%', aspectRatio: '1 / 1', borderRadius: '0.5rem' },
                darkSquareStyle: { backgroundColor: '#61765f' },
                lightSquareStyle: { backgroundColor: '#e8e4d7' },
                showAnimations: true,
              }}
            />
          </div>
          <PlayerClock
            label="White"
            playerId={match.whitePlayerId}
            isCurrentTurn={match.turn === 'w' && match.status === 'IN_PROGRESS'}
            time={clocks.white}
            isYou={isWhite}
          />
          {game.joinError && (
            <p className="text-sm text-destructive" role="alert">{game.joinError}</p>
          )}
          {game.connectionStatus !== 'connected' && (
            <div className="flex items-center justify-between gap-3 rounded-lg border bg-muted/50 p-3 text-sm">
              <span>Reconnecting. The latest server position will be restored automatically.</span>
              <Button variant="outline" size="sm" onClick={() => void game.refetchMatch()}>
                <RotateCw data-icon="inline-start" /> Refresh state
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>Game details</CardTitle>
              <StatusBadge status={match.status} kind="match" />
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Time control</span><span>{tournamentQuery.isLoading ? 'Loading…' : tournamentQuery.data ? formatTimeControl(tournamentQuery.data.initialSeconds, tournamentQuery.data.incrementSeconds) : 'Unavailable'}</span></div>
              <div className="flex justify-between gap-4"><span className="text-muted-foreground">Turn</span><span>{match.status === 'COMPLETED' ? resultLabel : match.turn === 'w' ? 'White to move' : 'Black to move'}</span></div>
              {match.isCheck && match.status === 'IN_PROGRESS' && <p className="font-medium text-amber-700">Check</p>}
              {match.status === 'COMPLETED' && <p className="rounded-lg bg-muted p-3 font-semibold">{resultLabel}{game.finished?.reason ? ` · ${game.finished.reason.toLowerCase().replace('_', ' ')}` : ''}</p>}
              {isPlayer && match.status === 'IN_PROGRESS' && (
                <Button variant="destructive" className="w-full" onClick={() => setResignOpen(true)} disabled={resigning}>
                  <Flag data-icon="inline-start" /> Resign
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Move history</CardTitle></CardHeader>
            <CardContent>
              {displayMoves.length ? (
                <ol className="max-h-80 space-y-1 overflow-y-auto text-sm">
                  {displayMoves.map((move) => (
                    <li key={move.number} className="grid grid-cols-[2rem_1fr_1fr] gap-2 rounded px-2 py-1 odd:bg-muted/60">
                      <span className="text-muted-foreground">{move.number}.</span>
                      <span>{move.white}</span>
                      <span>{move.black}</span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-muted-foreground">No moves have been played.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={resignOpen}
        onOpenChange={setResignOpen}
        title="Resign this game?"
        description="Your opponent will win the match. This cannot be undone."
        confirmLabel="Resign"
        variant="destructive"
        loading={resigning}
        onConfirm={() => {
          setResigning(true)
          void game.resign()
            .then(() => setResignOpen(false))
            .catch((error: unknown) => toast.error(error instanceof Error ? error.message : 'Could not resign'))
            .finally(() => setResigning(false))
        }}
      />

      <Dialog open={Boolean(promotion)} onOpenChange={(open) => !open && setPromotion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Promote pawn</DialogTitle></DialogHeader>
          <DialogFooter className="grid grid-cols-2 gap-2 sm:grid-cols-2">
              {promotionOptions.map((option) => (
                <Button key={option.piece} variant="outline" onClick={() => {
                  if (!promotion) return
                  movePiece(promotion.from, promotion.to, option.piece)
                  setPromotion(null)
                }}>
                  {option.label}
                </Button>
              ))}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PlayerClock({ label, playerId, isCurrentTurn, time, isYou }: {
  label: string
  playerId: string
  isCurrentTurn: boolean
  time: number
  isYou: boolean
}) {
  const minutes = Math.floor(time / 60000)
  const seconds = Math.floor((time % 60000) / 1000)
  const tenths = Math.floor((time % 1000) / 100)
  return (
    <div className={`flex items-center justify-between rounded-xl border px-4 py-3 ${isCurrentTurn ? 'border-primary bg-primary/[0.04]' : 'bg-card'}`}>
      <div>
        <p className="font-medium">{label}{isYou ? ' · You' : ''}</p>
        <p className="text-xs text-muted-foreground">Player {playerId.slice(0, 8)}</p>
      </div>
      <p className={`font-mono text-2xl font-semibold tabular-nums ${time < 10000 ? 'text-destructive' : ''}`} aria-label={`${minutes} minutes ${seconds} seconds`}>
        {minutes}:{String(seconds).padStart(2, '0')}<span className="text-base">.{tenths}</span>
      </p>
    </div>
  )
}
