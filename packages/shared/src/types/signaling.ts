import type { MoodId } from './mood'

// Client → Server
export interface JoinQueueMessage {
  type: 'join_queue'
  mood: MoodId
  fingerprint: string
  token: string
}
export interface LeaveQueueMessage { type: 'leave_queue' }
export interface SdpOfferMessage {
  type: 'sdp_offer'
  sdp: RTCSessionDescriptionInit
  targetSocketId: string
}
export interface SdpAnswerMessage {
  type: 'sdp_answer'
  sdp: RTCSessionDescriptionInit
  targetSocketId: string
}
export interface IceCandidateMessage {
  type: 'ice_candidate'
  candidate: RTCIceCandidateInit
  targetSocketId: string
}
export interface DisconnectPeerMessage { type: 'disconnect_peer' }
export interface NsfwSignalMessage {
  type: 'nsfw_signal'
  hash: string
  confidence: number
  sessionId: string
}
export interface ReportUserMessage {
  type: 'report_user'
  sessionId: string
  reason: 'nsfw' | 'harassment' | 'spam' | 'other'
}
export type ClientMessage =
  | JoinQueueMessage | LeaveQueueMessage
  | SdpOfferMessage | SdpAnswerMessage | IceCandidateMessage
  | DisconnectPeerMessage | NsfwSignalMessage | ReportUserMessage

// Server → Client
export interface MatchedMessage {
  type: 'matched'
  role: 'offerer' | 'answerer'
  peerSocketId: string
  sessionId: string
  peerMood: MoodId
}
export interface SdpOfferRelayMessage {
  type: 'sdp_offer'
  sdp: RTCSessionDescriptionInit
  fromSocketId: string
}
export interface SdpAnswerRelayMessage {
  type: 'sdp_answer'
  sdp: RTCSessionDescriptionInit
  fromSocketId: string
}
export interface IceCandidateRelayMessage {
  type: 'ice_candidate'
  candidate: RTCIceCandidateInit
  fromSocketId: string
}
export interface PeerDisconnectedMessage { type: 'peer_disconnected' }
export interface WaitingMessage {
  type: 'waiting'
  position: number
  onlineCount: number
}
export interface ErrorMessage {
  type: 'error'
  code: 'banned' | 'invalid_token' | 'server_error'
  message: string
}
export type ServerMessage =
  | MatchedMessage
  | SdpOfferRelayMessage | SdpAnswerRelayMessage | IceCandidateRelayMessage
  | PeerDisconnectedMessage | WaitingMessage | ErrorMessage
