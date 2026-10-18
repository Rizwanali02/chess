import { io, type Socket } from 'socket.io-client'
import { env } from '@/lib/env'

export type ConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'error'

type Namespace = 'matchmaking' | 'matches'

const sockets = new Map<Namespace, Socket>()

function createSocket(namespace: Namespace): Socket {
  const socket = io(`${env.socketUrl}/${namespace}`, {
    autoConnect: false,
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 10000,
  })

  sockets.set(namespace, socket)
  return socket
}

export function getSocket(namespace: Namespace): Socket {
  return sockets.get(namespace) ?? createSocket(namespace)
}

export function connectSocket(namespace: Namespace): Socket {
  const socket = getSocket(namespace)
  if (!socket.connected) {
    socket.connect()
  }
  return socket
}

export function disconnectSocket(namespace: Namespace): void {
  const socket = sockets.get(namespace)
  if (!socket) return
  socket.removeAllListeners()
  socket.disconnect()
  sockets.delete(namespace)
}

export function disconnectAllSockets(): void {
  for (const namespace of Array.from(sockets.keys())) {
    disconnectSocket(namespace)
  }
}

export function emitWithAck<TResponse>(
  socket: Socket,
  event: string,
  payload: unknown,
  timeoutMs = 10000,
): Promise<TResponse> {
  return new Promise((resolve, reject) => {
    const timer = window.setTimeout(() => {
      reject(new Error(`Socket acknowledgement timed out for ${event}`))
    }, timeoutMs)

    socket
      .timeout(timeoutMs)
      .emit(event, payload, (error: Error | null, response: TResponse) => {
        window.clearTimeout(timer)
        if (error) {
          reject(error)
          return
        }
        resolve(response)
      })
  })
}
