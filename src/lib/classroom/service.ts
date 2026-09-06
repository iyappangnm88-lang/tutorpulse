import { createClient } from '@/lib/supabase/server'
import { getVideoProvider } from './provider'
import type { ClassSessionWithBatch } from '@/types'
import type { ClassroomUser, ClassroomRole, ClassRoomResult, ClassTokenResult } from './types'

export class ClassroomService {
  private provider = getVideoProvider()

  /**
   * Checks if video provider credentials are configured.
   */
  isConfigured(): boolean {
    return this.provider.isConfigured()
  }

  /**
   * Gets provider name
   */
  getProviderName(): string {
    return this.provider.name
  }

  /**
   * Creates or retrieves a video room for a class session.
   * If a room was already created in a previous connection, returns it.
   */
  async getOrCreateRoom(session: ClassSessionWithBatch): Promise<ClassRoomResult> {
    if (!this.provider.isConfigured()) {
      return {
        success: false,
        error: 'Video provider is not configured. Please add DAILY_API_KEY to enable live classrooms.',
      }
    }

    // If session already has a recorded room ID, check if it's active
    if (session.meeting_room_id) {
      const existing = await this.provider.getClassRoom(session.meeting_room_id)
      if (existing && existing.url) {
        return {
          success: true,
          roomId: existing.name,
          roomUrl: existing.url,
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
   * Generates a short-lived, role-based meeting token for an authorized user.
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

    // Ensure room exists first
    const roomRes = await this.getOrCreateRoom(session)
    if (!roomRes.success) {
      return {
        success: false,
        error: roomRes.error || 'Failed to ensure classroom room exists.',
      }
    }

    return this.provider.createClassToken(session, user, role)
  }
}

export const classroomService = new ClassroomService()
