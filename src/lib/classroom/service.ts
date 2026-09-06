import { createClient } from '@/lib/supabase/server'
import { getVideoProvider } from './provider'
import type { ClassSessionWithBatch } from '@/types'
import type { ClassroomUser, ClassroomRole, ClassRoomResult, ClassTokenResult } from './types'

export class ClassroomService {
  private provider = getVideoProvider()

  /**
   * Checks if video provider is configured and available.
   * For the default WebRTC engine, this is always true.
   */
  isConfigured(): boolean {
    return this.provider.isConfigured()
  }

  /**
   * Gets active provider name (e.g. 'webrtc').
   */
  getProviderName(): string {
    return this.provider.name
  }

  /**
   * Creates or retrieves a video room identifier for a class session.
   */
  async getOrCreateRoom(session: ClassSessionWithBatch): Promise<ClassRoomResult> {
    if (!this.provider.isConfigured()) {
      return {
        success: false,
        error: 'Video provider is not configured.',
      }
    }

    // If session already has a recorded room ID, verify it
    if (session.meeting_room_id) {
      const existing = await this.provider.getClassRoom(session.meeting_room_id)
      if (existing) {
        return {
          success: true,
          roomId: existing.id,
          roomUrl: `/dashboard/classroom/${session.id}`,
        }
      }
    }

    // Create a new room with the video provider
    const result = await this.provider.createClassRoom(session)

    if (result.success && result.roomId) {
      // Save meeting_room_id and meeting_provider to database
      try {
        const supabase = await createClient()
        await supabase
          .from('class_sessions')
          .update({
            meeting_room_id: result.roomId,
            meeting_provider: this.provider.name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.id)
      } catch (dbErr) {
        console.error('Failed to update class_sessions with meeting_room_id:', dbErr)
      }
    }

    return result
  }

  /**
   * Generates a session token / authorization payload for an authorized user.
   */
  async generateToken(
    session: ClassSessionWithBatch,
    user: ClassroomUser,
    role: ClassroomRole
  ): Promise<ClassTokenResult> {
    if (!this.provider.isConfigured()) {
      return {
        success: false,
        error: 'Video provider is not configured on the server.',
      }
    }

    return this.provider.createClassToken(session, user, role)
  }
}

export const classroomService = new ClassroomService()
