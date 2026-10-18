import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  connectSocket,
  emitWithAck,
  type ConnectionStatus,
} from '@/lib/socket-client'
import type {
  MatchmakingJoinAck,
  MatchmakingLeaveAck,
  MatchmakingStatus,
  SocketErrorPayload,
} from '@/features/matchmaking/types/matchmaking.types'

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message
  }
  return fallback
}

export function useMatchmaking() {
  const [status, setStatus] = useState<MatchmakingStatus>('idle')
  const [connectionStatus, setConnectionStatus] =
    useState<ConnectionStatus>('idle')
  const [tournamentId, setTournamentId] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const tournamentIdRef = useRef<string | null>(null)
  const statusRef = useRef<MatchmakingStatus>('idle')
  const listenersAttachedRef = useRef(false)

  useEffect(() => {
    tournamentIdRef.current = tournamentId
  }, [tournamentId])

  useEffect(() => {
    statusRef.current = status
  }, [status])

  useEffect(() => {
    const socket = connectSocket('matchmaking')

    const handleConnect = () => {
      setConnectionStatus('connected')
      setStatus((current) => {
        if (current === 'connecting' || current === 'error') {
          return 'idle'
        }
        return current
      })
      setErrorMessage(null)
    }

    const handleDisconnect = () => {
      setConnectionStatus('disconnected')
    }

    const handleReconnectAttempt = () => {
      setConnectionStatus('reconnecting')
    }

    const handleConnectError = () => {
      setConnectionStatus('error')
      setStatus('error')
      setErrorMessage('Unable to connect to matchmaking')
    }

    const handleReady = () => {
      setConnectionStatus('connected')
      setStatus((current) => {
        if (current === 'connecting' || current === 'error') {
          return 'idle'
        }
        return current
      })
    }

    const handleSocketError = (payload: SocketErrorPayload) => {
      const message = payload.message || 'Matchmaking connection error'
      setConnectionStatus('error')
      setStatus('error')
      setErrorMessage(message)
      toast.error(message)
    }

    if (!listenersAttachedRef.current) {
      socket.on('connect', handleConnect)
      socket.on('disconnect', handleDisconnect)
      socket.io.on('reconnect_attempt', handleReconnectAttempt)
      socket.on('connect_error', handleConnectError)
      socket.on('socket:ready', handleReady)
      socket.on('socket:error', handleSocketError)
      listenersAttachedRef.current = true
    }

    const initializeTimer = window.setTimeout(() => {
      if (socket.connected) {
        handleConnect()
        return
      }
      setConnectionStatus('connecting')
      setStatus((current) => (current === 'idle' ? 'connecting' : current))
    }, 0)

    return () => {
      window.clearTimeout(initializeTimer)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.io.off('reconnect_attempt', handleReconnectAttempt)
      socket.off('connect_error', handleConnectError)
      socket.off('socket:ready', handleReady)
      socket.off('socket:error', handleSocketError)
      listenersAttachedRef.current = false
    }
  }, [])

  const joinQueue = useCallback(async (selectedTournamentId: string) => {
    if (!selectedTournamentId) {
      toast.error('Select a tournament first')
      return
    }

    const socket = connectSocket('matchmaking')
    setErrorMessage(null)
    setTournamentId(selectedTournamentId)
    setStatus('connecting')

    try {
      if (!socket.connected) {
        await new Promise<void>((resolve, reject) => {
          const timeout = window.setTimeout(() => {
            cleanup()
            reject(new Error('Connection timed out'))
          }, 10000)

          const onConnect = () => {
            cleanup()
            resolve()
          }

          const onError = () => {
            cleanup()
            reject(new Error('Unable to connect to matchmaking'))
          }

          const cleanup = () => {
            window.clearTimeout(timeout)
            socket.off('connect', onConnect)
            socket.off('connect_error', onError)
            socket.off('socket:ready', onConnect)
          }

          socket.once('connect', onConnect)
          socket.once('connect_error', onError)
          socket.once('socket:ready', onConnect)
        })
      }

      const ack = await emitWithAck<MatchmakingJoinAck>(
        socket,
        'matchmaking:join',
        { tournamentId: selectedTournamentId },
      )

      if (ack.status === 'MATCHED') {
        setStatus('matched')
        return
      }

      if (ack.status === 'QUEUED') {
        setStatus('queued')
        toast.success('Joined matchmaking queue')
        return
      }

      throw new Error('Unexpected matchmaking response')
    } catch (error) {
      const message = toErrorMessage(error, 'Failed to join matchmaking')
      setStatus('error')
      setErrorMessage(message)
      toast.error(message)
    }
  }, [])

  const leaveQueue = useCallback(async () => {
    const activeTournamentId = tournamentIdRef.current
    if (!activeTournamentId) {
      setStatus('idle')
      return
    }

    const previousStatus = statusRef.current
    const socket = connectSocket('matchmaking')
    setStatus('cancelling')

    try {
      await emitWithAck<MatchmakingLeaveAck>(socket, 'matchmaking:leave', {
        tournamentId: activeTournamentId,
      })
      setStatus('idle')
      setTournamentId(null)
      toast.success('Left matchmaking queue')
    } catch (error) {
      const message = toErrorMessage(error, 'Failed to leave queue')
      if (message.toLowerCase().includes('not in this tournament queue')) {
        setStatus('idle')
        setTournamentId(null)
        setErrorMessage(null)
        toast.info('You are no longer in the matchmaking queue')
        return
      }
      setStatus(previousStatus === 'queued' ? 'queued' : 'error')
      setErrorMessage(message)
      toast.error(message)
    }
  }, [])

  const reset = useCallback(() => {
    setStatus('idle')
    setErrorMessage(null)
    setTournamentId(null)
  }, [])

  return {
    status,
    connectionStatus,
    tournamentId,
    errorMessage,
    joinQueue,
    leaveQueue,
    reset,
  }
}
