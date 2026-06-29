import 'dotenv/config'
import { Redis } from 'ioredis'
import { v4 as uuidv4 } from 'uuid'
import { MOODS, MOOD_ADJACENCY } from '@echo/shared'
import type { MoodId, QueueEntry, MatchPair } from '@echo/shared'

const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const RELAX_1 = parseInt(process.env.RELAXATION_LEVEL_1_MS ?? '30000')
const RELAX_2 = parseInt(process.env.RELAXATION_LEVEL_2_MS ?? '60000')
const BAN_THRESHOLD = parseInt(process.env.BAN_SCORE_THRESHOLD ?? '10')

const redis = new Redis(REDIS_URL)
const redisSub = new Redis(REDIS_URL)
const redisPub = new Redis(REDIS_URL)

// in-memory queue: socketId → QueueEntry
const queue = new Map<string, QueueEntry>()

async function addToQueue(entry: QueueEntry) {
  const score = await getBehaviorScore(entry.fingerprint)
  if (score >= BAN_THRESHOLD) {
    await redisPub.publish('signaling:send', JSON.stringify({
      socketId: entry.socketId,
      message: { type: 'error', code: 'banned', message: 'You have been temporarily restricted.' }
    }))
    return
  }
  queue.set(entry.socketId, entry)
  console.log(`[matching] queued ${entry.socketId} mood=${entry.mood} total=${queue.size}`)
  await tryMatch(entry.socketId)
}

function removeFromQueue(socketId: string) {
  queue.delete(socketId)
}

async function tryMatch(socketId: string) {
  const entry = queue.get(socketId)
  if (!entry) return

  const waitMs = Date.now() - entry.joinedAt
  entry.relaxationLevel = waitMs >= RELAX_2 ? 2 : waitMs >= RELAX_1 ? 1 : 0

  const compatible = getCompatibleMoods(entry.mood, entry.relaxationLevel)

  for (const [candidateId, candidate] of queue) {
    if (candidateId === socketId) continue
    if (!compatible.includes(candidate.mood)) continue

    queue.delete(socketId)
    queue.delete(candidateId)

    const sessionId = uuidv4()
    await createMatch({ socketIdA: socketId, socketIdB: candidateId, sessionId, moodA: entry.mood, moodB: candidate.mood })
    return
  }
}

function getCompatibleMoods(mood: MoodId, relaxation: 0 | 1 | 2): MoodId[] {
  const def = MOODS.find(m => m.id === mood)!
  if (relaxation === 2) return MOODS.map(m => m.id)
  if (relaxation === 1) return [...new Set([...def.compatibleWith, ...(MOOD_ADJACENCY[mood] ?? [])])]
  return def.compatibleWith
}

async function createMatch(pair: MatchPair) {
  console.log(`[matching] matched ${pair.socketIdA} ↔ ${pair.socketIdB} session=${pair.sessionId}`)

  await redis.setex(`session:peer:${pair.socketIdA}`, 3600, pair.socketIdB)
  await redis.setex(`session:peer:${pair.socketIdB}`, 3600, pair.socketIdA)

  await redisPub.publish('signaling:send', JSON.stringify({
    socketId: pair.socketIdA,
    message: { type: 'matched', role: 'offerer', peerSocketId: pair.socketIdB, sessionId: pair.sessionId, peerMood: pair.moodB }
  }))
  await redisPub.publish('signaling:send', JSON.stringify({
    socketId: pair.socketIdB,
    message: { type: 'matched', role: 'answerer', peerSocketId: pair.socketIdA, sessionId: pair.sessionId, peerMood: pair.moodA }
  }))
}

async function getBehaviorScore(fingerprint: string): Promise<number> {
  const data = await redis.get(`behavior:${fingerprint}`)
  if (!data) return 0
  const s = JSON.parse(data)
  return (s.reportCount * 3) + (s.nsfwSignalCount * 4) + (s.skipReceivedCount * 0.5)
}

async function incrementSignal(fingerprint: string, field: 'reportCount' | 'nsfwSignalCount' | 'skipReceivedCount') {
  const key = `behavior:${fingerprint}`
  const data = await redis.get(key)
  const s = data ? JSON.parse(data) : { reportCount: 0, nsfwSignalCount: 0, skipReceivedCount: 0 }
  s[field]++
  await redis.setex(key, 60 * 60 * 24 * 7, JSON.stringify(s))
}

// re-try relaxed matches every 5 seconds
setInterval(async () => {
  for (const socketId of queue.keys()) await tryMatch(socketId)
}, 5000)

redisSub.subscribe('matching:join', 'matching:leave', 'moderation:nsfw_signal', 'moderation:report', (err) => {
  if (err) console.error('[matching] subscribe error:', err)
})

redisSub.on('message', async (channel, message) => {
  const data = JSON.parse(message)
  if (channel === 'matching:join') await addToQueue(data as QueueEntry)
  if (channel === 'matching:leave') removeFromQueue(data.socketId)
  if (channel === 'moderation:nsfw_signal') {
    const fp = await redis.get(`fingerprint:${data.socketId}`)
    if (fp) await incrementSignal(fp, 'nsfwSignalCount')
  }
  if (channel === 'moderation:report') {
    const fp = await redis.get(`fingerprint:${data.socketId}`)
    if (fp) await incrementSignal(fp, 'reportCount')
  }
})

console.log('[matching] service started')
