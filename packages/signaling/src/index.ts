import 'dotenv/config'
import { WebSocketServer, WebSocket } from 'ws'
import { createServer } from 'http'
import { Redis } from 'ioredis'
import { v4 as uuidv4 } from 'uuid'
import type { ClientMessage, ServerMessage } from '@echo/shared'

const PORT = parseInt(process.env.PORT ?? '3001')
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'

const redis = new Redis(REDIS_URL)
const redisSub = new Redis(REDIS_URL)

// socketId → WebSocket instance (this instance only)
const clients = new Map<string, WebSocket>()

const server = createServer()
const wss = new WebSocketServer({ server })

wss.on('connection', (ws) => {
  const socketId = uuidv4()
  clients.set(socketId, ws)
  console.log(`[signaling] connected: ${socketId}`)

  ws.on('message', async (data) => {
    try {
      const msg: ClientMessage = JSON.parse(data.toString())
      await handleMessage(socketId, msg)
    } catch (err) {
      console.error(`[signaling] parse error from ${socketId}:`, err)
    }
  })

  ws.on('close', async () => {
    console.log(`[signaling] disconnected: ${socketId}`)
    clients.delete(socketId)
    // notify peer
    const peerId = await redis.get(`session:peer:${socketId}`)
    if (peerId) {
      sendToSocket(peerId, { type: 'peer_disconnected' })
      await redis.del(`session:peer:${peerId}`)
    }
    await redis.del(`session:peer:${socketId}`)
    // remove from matching queue
    await redis.publish('matching:leave', JSON.stringify({ socketId }))
  })
})

async function handleMessage(socketId: string, msg: ClientMessage) {
  switch (msg.type) {
    case 'join_queue':
      await redis.publish('matching:join', JSON.stringify({
        socketId, mood: msg.mood, fingerprint: msg.fingerprint,
        token: msg.token, joinedAt: Date.now(), relaxationLevel: 0,
      }))
      break

    case 'leave_queue':
      await redis.publish('matching:leave', JSON.stringify({ socketId }))
      break

    case 'sdp_offer':
    case 'sdp_answer':
    case 'ice_candidate': {
      const target = msg.targetSocketId
      const local = clients.get(target)
      if (local?.readyState === WebSocket.OPEN) {
        local.send(JSON.stringify({ ...msg, fromSocketId: socketId }))
      } else {
        await redis.publish(`relay:${target}`, JSON.stringify({ ...msg, fromSocketId: socketId }))
      }
      break
    }

    case 'disconnect_peer': {
      const peerId = await redis.get(`session:peer:${socketId}`)
      if (peerId) {
        sendToSocket(peerId, { type: 'peer_disconnected' })
        await redis.del(`session:peer:${socketId}`)
        await redis.del(`session:peer:${peerId}`)
      }
      break
    }

    case 'nsfw_signal':
      await redis.publish('moderation:nsfw_signal', JSON.stringify({ socketId, ...msg }))
      break

    case 'report_user':
      await redis.publish('moderation:report', JSON.stringify({ reporterSocketId: socketId, ...msg }))
      sendToSocket(socketId, {
        type: 'error', code: 'server_error',
        message: 'Report received. This user will not be matched with you again.',
      })
      break
  }
}

function sendToSocket(socketId: string, msg: ServerMessage) {
  const ws = clients.get(socketId)
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg))
}

// receive match results from matching service
redisSub.subscribe('signaling:send', (err) => {
  if (err) console.error('[signaling] subscribe error:', err)
})

redisSub.on('message', (_channel, message) => {
  const data = JSON.parse(message)
  sendToSocket(data.socketId, data.message)
})

server.listen(PORT, '0.0.0.0', () => console.log(`[signaling] running on :${PORT}`))
