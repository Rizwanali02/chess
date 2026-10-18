import type { TournamentStatus } from '@/types/api'

export const queryKeys = {
  auth: {
    me: ['auth', 'me'] as const,
  },
  tournaments: {
    all: ['tournaments'] as const,
    list: (params?: { status?: TournamentStatus; page?: number; limit?: number }) =>
      ['tournaments', 'list', params ?? {}] as const,
    detail: (tournamentId: string) =>
      ['tournaments', 'detail', tournamentId] as const,
    participants: (tournamentId: string) =>
      ['tournaments', 'participants', tournamentId] as const,
    leaderboard: (tournamentId: string) =>
      ['tournaments', 'leaderboard', tournamentId] as const,
  },
  matches: {
    detail: (matchId: string) => ['matches', 'detail', matchId] as const,
  },
} as const
