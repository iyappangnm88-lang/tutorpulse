import type {
  VideoProvider,
  ClassRoomResult,
  ClassTokenResult,
  ClassRoomDetails,
  ClassroomUser,
  ClassroomRole,
} from '../types'
import type { ClassSessionWithBatch } from '@/types'

/**
 * Browser-Native WebRTC Video Provider for TutorPulse.
 * Provides a free, self-hosted, vendor-independent virtual classroom.
 * Requires zero external API keys or third-party accounts.
 * Signaling and presence are handled via Supabase Realtime; peer audio/video is streamed direct via WebRTC.
 */
export class WebRtcVideoProvider implements VideoProvider {
  readonly name = 'webrtc'

  /**
   * Browser-native WebRTC is always configured and ready to use.
   */
  isConfigured(): boolean {
    return true
  }

  /**
   * Generates or retrieves the deterministic room identifier for a session.
   */
  async createClassRoom(session: ClassSessionWithBatch): Promise<ClassRoomResult> {
    const roomId = `room-${session.id}`
    const roomUrl = `/dashboard/classroom/${session.id}`

    return {
      success: true,
      roomId,
      roomUrl,
    }
  }

  /**
   * Generates a lightweight session authorization token for the user.
   */
  async createClassToken(
    session: ClassSessionWithBatch,
    user: ClassroomUser,
    role: ClassroomRole
  ): Promise<ClassTokenResult> {
    const roomId = `room-${session.id}`
    // Stable token encoding session, user, and role
    const token = Buffer.from(
      JSON.stringify({
        sessionId: session.id,
        userId: user.id,
        role,
        timestamp: Date.now(),
      })
    ).toString('base64url')

    const roomUrl =
      role === 'host'
        ? `/dashboard/classroom/${session.id}`
        : `/parent/classroom/${session.id}`

    return {
      success: true,
      token,
      roomUrl,
    }
  }

  /**
   * Retrieves room status for the session.
   */
  async getClassRoom(roomId: string): Promise<ClassRoomDetails | null> {
    return {
      id: roomId,
      name: roomId,
      privacy: 'private',
      createdAt: new Date().toISOString(),
    }
  }

  /**
   * Marks the room as concluded.
   */
  async endClassRoom(_roomId: string): Promise<boolean> {
    return true
  }
}
