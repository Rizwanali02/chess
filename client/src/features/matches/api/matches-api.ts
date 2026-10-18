import { apiClient } from '@/lib/api-client'
import type { MatchState, PromotionPiece } from '@/types/api'
import type {
  ResignMatchResult,
  SubmitMovePayload,
  SubmitMoveResult,
} from '@/features/matches/types/match.types'

export async function getMatch(
  matchId: string,
  signal?: AbortSignal,
): Promise<MatchState> {
  return apiClient.get<MatchState>(`/matches/${matchId}`, { signal })
}

export async function submitMoveRest(
  matchId: string,
  payload: SubmitMovePayload,
): Promise<SubmitMoveResult> {
  return apiClient.post<SubmitMoveResult>(`/matches/${matchId}/moves`, {
    from: payload.from,
    to: payload.to,
    ...(payload.promotion ? { promotion: payload.promotion } : {}),
  })
}

export async function resignMatchRest(
  matchId: string,
): Promise<ResignMatchResult> {
  return apiClient.post<ResignMatchResult>(`/matches/${matchId}/resign`)
}

export type { PromotionPiece }
