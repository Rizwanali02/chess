import { apiClient } from '@/lib/api-client'
import type { LeaderboardEntry } from '@/types/api'

export async function getTournamentLeaderboard(
  tournamentId: string,
  signal?: AbortSignal,
): Promise<LeaderboardEntry[]> {
  return apiClient.get<LeaderboardEntry[]>(
    `/tournaments/${tournamentId}/leaderboard`,
    { signal },
  )
}
