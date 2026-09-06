import type { ClassSessionWithBatch } from '@/types'

export type ClassroomRole = 'host' | 'participant' | 'spectator'

export interface ClassroomUser {
  id: string
  name: string
  email?: string | null
  role: ClassroomRole
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
 * Providers (Daily.co, LiveKit, etc.) can be swapped or added without rewriting the application.
 */
export interface VideoProvider {
  readonly name: string

  /**
   * Returns true if the required server-side credentials (e.g. DAILY_API_KEY) are configured.
   */
  isConfigured(): boolean

  /**
   * Creates or retrieves a persistent/ephemeral classroom for the session.
   */
  createClassRoom(session: ClassSessionWithBatch): Promise<ClassRoomResult>

  /**
   * Generates a short-lived access token for the specified user and role.
   * Host gets owner privileges (publish, share screen, manage).
   * Participant gets student privileges.
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
   * Signals the provider that the class has ended (e.g. expiring room or ejecting participants).
   */
  endClassRoom(roomId: string): Promise<boolean>
}
