import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/features/auth/hooks/use-auth'
import { connectSocket, disconnectSocket } from '@/lib/socket-client'
import type { MatchmakingMatchedPayload } from '@/types/api'

export function MatchmakingEventHandler() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const handledMatches = useRef(new Set<string>())

  useEffect(() => {
    if (user?.role !== 'STUDENT') return
    const socket = connectSocket('matchmaking')
    const handleMatched = (payload: MatchmakingMatchedPayload) => {
      if (handledMatches.current.has(payload.matchId)) return
      handledMatches.current.add(payload.matchId)
      navigate(`/matches/${payload.matchId}`, { replace: true })
    }

    socket.on('matchmaking:matched', handleMatched)
    return () => {
      socket.off('matchmaking:matched', handleMatched)
      disconnectSocket('matchmaking')
    }
  }, [navigate, user?.id, user?.role])

  return null
}
