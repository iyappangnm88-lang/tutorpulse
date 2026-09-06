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
