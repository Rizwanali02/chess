import type {
  ApiSuccess,
  JoinTournamentResult,
  Tournament,
  TournamentDetail,
  TournamentListData,
  TournamentParticipant,
  TournamentStatus,
} from '@/types/api'

export type TournamentListParams = {
  status?: TournamentStatus
  page?: number
  limit?: number
}

export type CreateTournamentPayload = {
  name: string
  initialSeconds: number
  incrementSeconds: number
  startsAt: string
}

export type UpdateTournamentPayload = {
  name?: string
  initialSeconds?: number
  incrementSeconds?: number
  startsAt?: string
  status?: TournamentStatus
}

export type TournamentListResponse = ApiSuccess<TournamentListData>
export type TournamentDetailResponse = ApiSuccess<TournamentDetail>
export type TournamentCreateResponse = ApiSuccess<Tournament>
export type TournamentUpdateResponse = ApiSuccess<Tournament>
export type TournamentJoinResponse = ApiSuccess<JoinTournamentResult>
export type TournamentParticipantsResponse = ApiSuccess<
  TournamentParticipant[]
>
