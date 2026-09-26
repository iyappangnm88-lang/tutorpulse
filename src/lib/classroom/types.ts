import type { ClassSessionWithBatch } from '@/types'

export type ClassroomRole = 'host' | 'participant' | 'spectator'

export type ClassroomConnectionState =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'reconnecting'
  | 'disconnected'
  | 'failed'

export interface ClassroomUser {
  id: string
  name: string
  email?: string | null
  role: ClassroomRole
}

export interface MediaDeviceState {
  audioEnabled: boolean
  videoEnabled: boolean
  isScreenSharing: boolean
}

export interface ClassroomParticipant {
  id: string
  name: string
  role: ClassroomRole
  isAudioMuted: boolean
  isVideoMuted: boolean
  isScreenSharing: boolean
  handRaised?: boolean
  handRaisedAt?: string
  joinedAt: string
  stream?: MediaStream
  connectionState?: RTCPeerConnectionState
}

export type SignalType =
  | 'offer'
  | 'answer'
  | 'ice-candidate'
  | 'state-change'
  | 'class-ended'
  | 'hand:raise'
  | 'hand:lower'
  | 'hand:acknowledge'
  | 'reaction'
  | 'poll:started'
  | 'poll:response'
  | 'poll:closed'
  | 'poll:revealed'
  | 'question:started'
  | 'question:response'
  | 'question:closed'
  | 'question:revealed'

export interface SignalingMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: ClassroomRole
  targetId?: string | null
  sessionId: string
  type: SignalType
  data?: any
  timestamp: number
}

export interface ClassroomChatMessage {
  id: string
  senderId: string
  senderName: string
  senderRole: ClassroomRole
  text: string
  timestamp: string
}

export interface ClassroomReaction {
  id: string
  emoji: string
  senderId: string
  senderName: string
  timestamp: number
}

export interface ClassroomPoll {
  id: string
  workspace_id: string
  class_session_id: string
  tutor_id: string
  question: string
  options: string[]
  status: 'draft' | 'active' | 'closed'
  results_revealed: boolean
  created_at: string
  started_at: string | null
  closed_at: string | null
  total_votes?: number
  vote_counts?: number[]
  user_voted_option?: number | null
}

export interface ClassroomPollResponse {
  id: string
  poll_id: string
  class_session_id: string
  user_id: string
  student_id: string | null
  option_index: number
  created_at: string
}

export interface ClassRoomResult {
  success: boolean
  roomId?: string
  roomUrl?: string
  error?: string
}

export interface ClassTokenResult {
  success: boolean
  token?: string
  roomUrl?: string
  error?: string
}

export interface ClassRoomDetails {
  id: string
  name: string
  url?: string
  privacy?: string
  createdAt?: string
  expiresAt?: string
}

/**
 * Clean Video Provider Abstraction.
 * TutorPulse does not depend directly on any vendor SDK.
 * Providers (WebRTC mesh, LiveKit, SFU, etc.) can be swapped or added without rewriting the application.
 */
export interface VideoProvider {
  readonly name: string

  /**
   * Returns true if the required credentials/capabilities are available.
   * For the browser-native WebRTC provider, this always returns true.
   */
  isConfigured(): boolean

  /**
   * Creates or retrieves a classroom identifier for the session.
   */
  createClassRoom(session: ClassSessionWithBatch): Promise<ClassRoomResult>

  /**
   * Generates a session token or authorization payload for the specified user and role.
   */
  createClassToken(
    session: ClassSessionWithBatch,
    user: ClassroomUser,
    role: ClassroomRole
  ): Promise<ClassTokenResult>

  /**
   * Fetches room status from the provider if available.
   */
  getClassRoom(roomId: string): Promise<ClassRoomDetails | null>

  /**
   * Signals the provider that the class has ended.
   */
  endClassRoom(roomId: string): Promise<boolean>
}
