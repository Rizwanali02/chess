import type {
  MatchFinishedPayload,
  MatchResult,
  MatchState,
  MatchStatus,
  MoveAcceptedPayload,
  PromotionPiece,
} from '@/types/api'
import type { ConnectionStatus } from '@/lib/socket-client'

export type PlayerColor = 'w' | 'b'

export type BoardOrientation = 'white' | 'black'

export type PendingMove = {
  from: string
  to: string
  promotion?: PromotionPiece
  fenBefore: string
}

export type PromotionRequest = {
  from: string
  to: string
}

export type SubmitMovePayload = {
  from: string
  to: string
  promotion?: PromotionPiece
}

export type SubmitMoveResult = MoveAcceptedPayload

export type ResignMatchResult = {
  matchId: string
  status: 'COMPLETED'
  result: MatchResult
  reason: 'RESIGNATION'
}

export type MatchJoinAck = {
  status: 'JOINED'
  matchId: string
}

export type MoveSubmitAck = {
  status: 'ACCEPTED'
  matchId: string
}

export type ParsedPgnMove = {
  ply: number
  moveNumber: number
  color: PlayerColor
  san: string
  from: string
  to: string
}

export type MatchClockState = {
  whiteMs: number | null
  blackMs: number | null
  activeColor: PlayerColor | null
}

export type UseMatchSocketResult = {
  connectionStatus: ConnectionStatus
  match: MatchState | null
  isJoining: boolean
  joinError: string | null
  lastMoveAccepted: MoveAcceptedPayload | null
  finished: MatchFinishedPayload | null
  refetchMatch: () => Promise<void>
}

export type GameOverInfo = {
  result: MatchResult | null
  reason: string
  status: MatchStatus
}
