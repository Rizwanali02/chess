import { apiClient } from '@/lib/api-client'
import type {
  CreateTournamentPayload,
  TournamentCreateResponse,
  TournamentDetailResponse,
  TournamentJoinResponse,
  TournamentListParams,
  TournamentListResponse,
  TournamentParticipantsResponse,
  TournamentUpdateResponse,
  UpdateTournamentPayload,
} from '@/features/tournaments/types/tournament.types'
import type {
  JoinTournamentResult,
  Tournament,
  TournamentDetail,
  TournamentListData,
  TournamentParticipant,
} from '@/types/api'

export async function listTournaments(
  params: TournamentListParams = {},
  signal?: AbortSignal,
): Promise<TournamentListData> {
  const response = await apiClient.get<TournamentListResponse>('/tournaments', {
    signal,
    searchParams: {
      status: params.status,
      page: params.page,
      limit: params.limit,
    },
  })
  return response.data
}

export async function getTournament(
  tournamentId: string,
  signal?: AbortSignal,
): Promise<TournamentDetail> {
  const response = await apiClient.get<TournamentDetailResponse>(
    `/tournaments/${tournamentId}`,
    { signal },
  )
  return response.data
}

export async function createTournament(
  payload: CreateTournamentPayload,
): Promise<Tournament> {
  const response = await apiClient.post<TournamentCreateResponse>(
    '/tournaments',
    payload,
  )
  return response.data
}

export async function updateTournament(
  tournamentId: string,
  payload: UpdateTournamentPayload,
): Promise<Tournament> {
  const response = await apiClient.patch<TournamentUpdateResponse>(
    `/tournaments/${tournamentId}`,
    payload,
  )
  return response.data
}

export async function deleteTournament(tournamentId: string): Promise<void> {
  await apiClient.delete<void>(`/tournaments/${tournamentId}`)
}

export async function joinTournament(
  tournamentId: string,
): Promise<JoinTournamentResult> {
  const response = await apiClient.post<TournamentJoinResponse>(
    `/tournaments/${tournamentId}/join`,
  )
  return response.data
}

export async function getTournamentParticipants(
  tournamentId: string,
  signal?: AbortSignal,
): Promise<TournamentParticipant[]> {
  const response = await apiClient.get<TournamentParticipantsResponse>(
    `/tournaments/${tournamentId}/participants`,
    { signal },
  )
  return response.data
}
