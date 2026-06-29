import { useEffect, useRef, useCallback } from 'react'
import type { MoodId, ClientMessage, ServerMessage } from '@echo/shared'
import { getOrCreateToken } from '../lib/token'
import { getFingerprint } from '../lib/fingerprint'

const SIGNALING_URL = import.meta.env.VITE_SIGNALING_URL ?? 'ws://localhost:3001'

interface Options {
  mood: MoodId
  onPeerMood: (mood: MoodId) => void
  onStatusChange: (status: 'matching' | 'connected' | 'disconnected') => void
}

export interface SignalingHandle {
  send: (msg: ClientMessage) => void
  onMessage: (handler: (msg: ServerMessage) => void) => void
  peerSocketId: React.MutableRefObject<string | null>
  pendingMessages: React.MutableRefObject<ServerMessage[]>
  rejoinQueue: () => void
}

export function useSignaling({ mood, onPeerMood, onStatusChange }: Options): SignalingHandle {
  const wsRef = useRef<WebSocket | null>(null)
  const messageHandlerRef = useRef<((msg: ServerMessage) => void) | null>(null)
  const peerSocketId = useRef<string | null>(null)
  const pendingMessages = useRef<ServerMessage[]>([])
  const currentMood = useRef(mood)
  currentMood.current = mood

  async function joinQueue(ws: WebSocket) {
    const token = getOrCreateToken()
    const fingerprint = await getFingerprint()
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'join_queue',
        mood: currentMood.current,
        fingerprint,
        token,
      }))
    }
  }

  useEffect(() => {
    let ws: WebSocket
    let destroyed = false

    function connect() {
      ws = new WebSocket(SIGNALING_URL)
      wsRef.current = ws

      ws.onopen = () => {
        if (destroyed) return
        joinQueue(ws)
        onStatusChange('matching')
      }

      ws.onmessage = (event) => {
        if (destroyed) return
        const msg: ServerMessage = JSON.parse(event.data)

        if (msg.type === 'matched') {
          peerSocketId.current = msg.peerSocketId
          onPeerMood(msg.peerMood)
          onStatusChange('connected')
        }

        if (msg.type === 'peer_disconnected') {
          peerSocketId.current = null
          onStatusChange('matching')
          // small delay before re-queuing to avoid race with WebRTC teardown
          setTimeout(() => {
            if (!destroyed && ws.readyState === WebSocket.OPEN) {
              joinQueue(ws)
            }
          }, 800)
        }

        if (messageHandlerRef.current) {
          messageHandlerRef.current(msg)
        } else {
          pendingMessages.current.push(msg)
        }
      }

      ws.onclose = () => {
        if (!destroyed) onStatusChange('disconnected')
      }
    }

    connect()
    return () => {
      destroyed = true
      ws?.close()
    }
  }, [mood])

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg))
    }
  }, [])

  const onMessage = useCallback((handler: (msg: ServerMessage) => void) => {
    messageHandlerRef.current = handler
    const pending = pendingMessages.current.splice(0)
    pending.forEach(msg => handler(msg))
  }, [])

  const rejoinQueue = useCallback(() => {
    const ws = wsRef.current
    if (ws) joinQueue(ws)
  }, [])

  return { send, onMessage, peerSocketId, pendingMessages, rejoinQueue }
}