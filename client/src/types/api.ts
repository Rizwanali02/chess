export type UserRole = 'COACH' | 'STUDENT'

export type TournamentStatus = 'DRAFT' | 'OPEN' | 'ONGOING' | 'COMPLETED'

export type MatchStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED'

export type MatchResult = 'WHITE_WIN' | 'BLACK_WIN' | 'DRAW'

export type AuthUser = {
  id: string
  email: string
  role: UserRole
}

export type ApiSuccess<T> = {
  success: true
  data: T
  meta: null | unknown
}

export type Tournament = {
  id: string
  name: string
  createdBy: string
  initialSeconds: number
  incrementSeconds: number
  startsAt: string
  status: TournamentStatus
  createdAt: string
  updatedAt: string
}

export type TournamentDetail = Tournament & {
  participantCount: number
}

export type TournamentListData = {
  items: Tournament[]
  page: number
  limit: number
  total: number
  totalPages: number
}

export type TournamentParticipant = {
  id: string
  name: string
  joinedAt: string
}

export type JoinTournamentResult = {
  id: string
  tournamentId: string
  userId: string
  joinedAt: string
}

export type LeaderboardEntry = {
  rank: number
  userId: string
  name: string
  points: number
  played: number
  wins: number
  draws: number
  losses: number
}

export type MatchState = {
  id: string
  tournamentId: string
  whitePlayerId: string
  blackPlayerId: string
  status: MatchStatus
  result: MatchResult | null
  fen: string
  pgn: string
  turn: 'w' | 'b'
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  whiteTimeRemainingMs: number | null
  blackTimeRemainingMs: number | null
  lastClockStartedAt: string | null
  startedAt: string | null
  completedAt: string | null
}

export type MoveAcceptedPayload = {
  status: 'IN_PROGRESS' | 'COMPLETED'
  matchId: string
  move?: unknown
  fen: string
  pgn: string
  turn: 'w' | 'b'
  result: MatchResult | null
  whiteTimeRemainingMs: number
  blackTimeRemainingMs: number
  lastClockStartedAt: string | null
  isCheck: boolean
  isCheckmate: boolean
  isDraw: boolean
  reason?: string
}

export type MatchFinishedPayload = {
  matchId: string
  result: MatchResult | null
  reason: string
  status?: MatchStatus
  fen?: string
  pgn?: string
  whiteTimeRemainingMs?: number
  blackTimeRemainingMs?: number
}

export type MatchmakingMatchedPayload = {
  matchId: string
  tournamentId: string
  whitePlayerId: string
  blackPlayerId: string
  status: MatchStatus
}

export type PromotionPiece = 'q' | 'r' | 'b' | 'n'
