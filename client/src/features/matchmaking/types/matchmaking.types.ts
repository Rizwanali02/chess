import type { MatchmakingMatchedPayload } from '@/types/api'

export type MatchmakingStatus =
  | 'idle'
  | 'connecting'
  | 'queued'
  | 'matched'
  | 'cancelling'
  | 'error'

export type MatchmakingJoinAck =
  | { status: 'QUEUED' }
  | { status: 'MATCHED'; matchId: string }

export type MatchmakingLeaveAck = {
  status: 'LEFT_QUEUE'
}

export type SocketReadyPayload = {
  userId: string
}

export type SocketErrorPayload = {
  message: string
}

export type MatchmakingMatchedEvent = MatchmakingMatchedPayload

export type EligibleTournament = {
  id: string
  name: string
  initialSeconds: number
  incrementSeconds: number
  startsAt: string
  status: 'OPEN'
}
