export interface PrivateRoom {
  code: string
  createdAt: number
  lastActiveAt: number
  participants: string[]
  maxParticipants: 5
}

export interface ReconnectToken {
  token: string
  sessionId: string
  expiresAt: number
  usedAt?: number
}

export interface PostChatNote {
  sessionId: string
  noteA?: string
  noteB?: string
  expiresAt: number
}
