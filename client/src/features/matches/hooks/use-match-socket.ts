import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { getMatch } from '@/features/matches/api/matches-api'
import type { MatchJoinAck, MoveSubmitAck } from '@/features/matches/types/match.types'
import { connectSocket, disconnectSocket, emitWithAck, type ConnectionStatus } from '@/lib/socket-client'
import { queryKeys } from '@/lib/query-keys'
import type {
  MatchFinishedPayload,
  MatchState,
  MoveAcceptedPayload,
} from '@/types/api'

export function useMatchSocket(matchId: string | undefined) {
  const queryClient = useQueryClient()
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)
  const [finished, setFinished] = useState<MatchFinishedPayload | null>(null)
  const [pendingMove, setPendingMove] = useState(false)
  const query = useQuery({
    queryKey: queryKeys.matches.detail(matchId ?? ''),
    queryFn: ({ signal }) => getMatch(matchId!, signal),
    enabled: Boolean(matchId),
  })

  const refetchMatch = useCallback(async () => {
    if (!matchId) return
    await queryClient.refetchQueries({
      queryKey: queryKeys.matches.detail(matchId),
      type: 'active',
    })
  }, [matchId, queryClient])

  useEffect(() => {
    if (!matchId) return
    const socket = connectSocket('matches')
    let disposed = false
    let joinSequence = 0
    let roomJoinStarted = false

    const joinRoom = async () => {
      if (roomJoinStarted) return
      roomJoinStarted = true
      const sequence = ++joinSequence
      setIsJoining(true)
      setJoinError(null)
      try {
        await emitWithAck<MatchJoinAck>(socket, 'match:join', { matchId })
        if (disposed || sequence !== joinSequence) return
        setIsJoining(false)
        void refetchMatch()
      } catch (error) {
        roomJoinStarted = false
        if (disposed || sequence !== joinSequence) return
        const message = error instanceof Error ? error.message : 'Unable to join this match'
        setJoinError(message)
        setIsJoining(false)
      }
    }

    const handleConnect = () => {
      setConnectionStatus('connected')
      void joinRoom()
    }
    const handleDisconnect = () => {
      roomJoinStarted = false
      setConnectionStatus('disconnected')
    }
    const handleReconnectAttempt = () => setConnectionStatus('reconnecting')
    const handleConnectError = () => {
      setConnectionStatus('error')
      setJoinError('Connection to the match was lost. Retrying…')
    }
    const handleState = (state: MatchState) => {
      queryClient.setQueryData(queryKeys.matches.detail(matchId), state)
      setIsJoining(false)
      setJoinError(null)
      setFinished(
        state.status === 'COMPLETED'
          ? { matchId, result: state.result, reason: 'COMPLETED', status: state.status }
          : null,
      )
      if (state.status === 'COMPLETED') {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tournaments.leaderboard(state.tournamentId),
        })
      }
    }
    const handleAccepted = (payload: MoveAcceptedPayload) => {
      if (payload.matchId !== matchId) return
      queryClient.setQueryData<MatchState>(queryKeys.matches.detail(matchId), (current) =>
        current
          ? {
              ...current,
              status: payload.status,
              result: payload.result,
              fen: payload.fen,
              pgn: payload.pgn,
              turn: payload.turn,
              isCheck: payload.isCheck,
              isCheckmate: payload.isCheckmate,
              isDraw: payload.isDraw,
              whiteTimeRemainingMs: payload.whiteTimeRemainingMs,
              blackTimeRemainingMs: payload.blackTimeRemainingMs,
              lastClockStartedAt: payload.lastClockStartedAt,
            }
          : current,
      )
      setPendingMove(false)
      if (payload.status === 'COMPLETED') {
        setFinished({
          matchId,
          result: payload.result,
          reason: payload.reason ?? 'GAME_OVER',
          status: payload.status,
          fen: payload.fen,
          pgn: payload.pgn,
          whiteTimeRemainingMs: payload.whiteTimeRemainingMs,
          blackTimeRemainingMs: payload.blackTimeRemainingMs,
        })
        const tournamentId = queryClient.getQueryData<MatchState>(
          queryKeys.matches.detail(matchId),
        )?.tournamentId
        if (tournamentId) {
          void queryClient.invalidateQueries({
            queryKey: queryKeys.tournaments.leaderboard(tournamentId),
          })
        }
      }
    }
    const handleFinished = (payload: MatchFinishedPayload) => {
      if (payload.matchId !== matchId) return
      setFinished(payload)
      setPendingMove(false)
      queryClient.setQueryData<MatchState>(queryKeys.matches.detail(matchId), (current) =>
        current
          ? {
              ...current,
              status: 'COMPLETED',
              result: payload.result,
              ...(payload.fen ? { fen: payload.fen } : {}),
              ...(payload.pgn ? { pgn: payload.pgn } : {}),
              ...(payload.whiteTimeRemainingMs !== undefined
                ? { whiteTimeRemainingMs: payload.whiteTimeRemainingMs }
                : {}),
              ...(payload.blackTimeRemainingMs !== undefined
                ? { blackTimeRemainingMs: payload.blackTimeRemainingMs }
                : {}),
              lastClockStartedAt: null,
              completedAt: new Date().toISOString(),
            }
          : current,
      )
      const tournamentId = queryClient.getQueryData<MatchState>(
        queryKeys.matches.detail(matchId),
      )?.tournamentId
      if (tournamentId) {
        void queryClient.invalidateQueries({
          queryKey: queryKeys.tournaments.leaderboard(tournamentId),
        })
      }
    }
    const handleException = (payload: unknown) => {
      const message =
        typeof payload === 'string'
          ? payload
          : typeof payload === 'object' && payload !== null && 'message' in payload
            ? Array.isArray(payload.message)
              ? payload.message.join(', ')
              : typeof payload.message === 'string'
                ? payload.message
                : 'The server rejected that match action.'
            : 'The server rejected that match action.'
      setPendingMove(false)
      setJoinError(message)
      toast.error(message)
      void refetchMatch()
    }

    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.io.on('reconnect_attempt', handleReconnectAttempt)
    socket.on('connect_error', handleConnectError)
    socket.on('match:state', handleState)
    socket.on('move:accepted', handleAccepted)
    socket.on('match:finished', handleFinished)
    socket.on('exception', handleException)
    const initializeTimer = window.setTimeout(() => {
      if (socket.connected) {
        handleConnect()
        return
      }
      setConnectionStatus('connecting')
    }, 0)

    return () => {
      disposed = true
      window.clearTimeout(initializeTimer)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
      socket.off('connect_error', handleConnectError)
      socket.off('match:state', handleState)
      socket.off('move:accepted', handleAccepted)
      socket.off('match:finished', handleFinished)
      socket.off('exception', handleException)
      setPendingMove(false)
      disconnectSocket('matches')
    }
  }, [matchId, queryClient, refetchMatch])

  const submitMove = useCallback(
    async (from: string, to: string, promotion?: 'q' | 'r' | 'b' | 'n') => {
      if (!matchId) return false
      const socket = connectSocket('matches')
      if (!socket.connected) {
        toast.error('Reconnecting to the match. Try again when connected.')
        return false
      }
      setPendingMove(true)
      setJoinError(null)
      try {
        await emitWithAck<MoveSubmitAck>(socket, 'move:submit', {
          matchId,
          from,
          to,
          ...(promotion ? { promotion } : {}),
        })
        return true
      } catch (error) {
        setPendingMove(false)
        const message = error instanceof Error ? error.message : 'Move was not accepted'
        setJoinError(message)
        toast.error(message)
        void refetchMatch()
        return false
      }
    },
    [matchId, refetchMatch],
  )

  const resign = useCallback(async () => {
    if (!matchId) throw new Error('Match id is missing')
    const socket = connectSocket('matches')
    if (!socket.connected) throw new Error('Reconnect before resigning')
    return emitWithAck<MatchFinishedPayload>(socket, 'match:resign', { matchId })
  }, [matchId])

  return {
    match: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetchMatch,
    connectionStatus,
    isJoining,
    joinError,
    finished,
    pendingMove,
    submitMove,
    resign,
  }
}
