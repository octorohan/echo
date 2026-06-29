import type { MoodId } from './mood'

export interface QueueEntry {
  socketId: string
  mood: MoodId
  fingerprint: string
  token: string
  joinedAt: number
  relaxationLevel: 0 | 1 | 2
}

export interface MatchPair {
  socketIdA: string
  socketIdB: string
  sessionId: string
  moodA: MoodId
  moodB: MoodId
}

export interface BehaviorScore {
  fingerprint: string
  reportCount: number
  nsfwSignalCount: number
  skipReceivedCount: number
  lastUpdated: number
}
