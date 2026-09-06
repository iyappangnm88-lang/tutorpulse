import type {
  VideoProvider,
  ClassroomUser,
  ClassroomRole,
  ClassRoomResult,
  ClassTokenResult,
  ClassRoomDetails,
} from '../types'
import type { ClassSessionWithBatch } from '@/types'

/**
 * Daily.co Video Provider Implementation.
 * Enterprise WebRTC infrastructure using Daily's server-side REST API.
 * Never exposes API keys or host tokens to client-side code.
 */
export class DailyVideoProvider implements VideoProvider {
  readonly name = 'daily'

  private get apiKey(): string | undefined {
    return process.env.DAILY_API_KEY
  }

  private get baseUrl(): string {
    return 'https://api.daily.co/v1'
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0)
  }

  private getRoomName(session: ClassSessionWithBatch): string {
    // Sanitized alphanumeric identifier conforming to Daily.co room name requirements
    const cleanSessionId = session.id.replace(/-/g, '').slice(0, 12)
    const cleanBatchId = session.batch_id.replace(/-/g, '').slice(0, 8)
    return `tp-${cleanSessionId}-${cleanBatchId}`
  }

  async createClassRoom(session: ClassSessionWithBatch): Promise<ClassRoomResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'DAILY_API_KEY is not configured on the server.',
      }
    }

    const roomName = this.getRoomName(session)

    try {
      // Calculate room expiration: 48 hours after session date
      const sessionDate = new Date(session.session_date)
      const expSeconds = Math.floor(sessionDate.getTime() / 1000) + 172800 // +48 hours

      const res = await fetch(`${this.baseUrl}/rooms`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: roomName,
          privacy: 'private', // Enforce private room access only via server-minted tokens
          properties: {
            enable_chat: true,
            enable_screenshare: true,
            start_video_off: false,
            start_audio_off: false,
            exp: expSeconds > Math.floor(Date.now() / 1000) ? expSeconds : Math.floor(Date.now() / 1000) + 86400,
          },
        }),
      })

      if (res.ok) {
        const data = await res.json()
        return {
          success: true,
          roomId: data.name,
          roomUrl: data.url,
        }
      }

      // If room already exists, fetch existing room details
      if (res.status === 400) {
        const errData = await res.json().catch(() => ({}))
        if (errData.error === 'invalid-request-error' && String(errData.info || '').includes('already exists')) {
          const existing = await this.getClassRoom(roomName)
          if (existing && existing.url) {
            return {
              success: true,
              roomId: existing.name,
              roomUrl: existing.url,
            }
          }
        }
        return {
          success: false,
          error: errData.info || errData.error || 'Failed to create Daily.co classroom room.',
        }
      }

      const errText = await res.text()
      return {
        success: false,
        error: `Daily.co API error (${res.status}): ${errText}`,
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Network error while connecting to Daily.co API.',
      }
    }
  }

  async createClassToken(
    session: ClassSessionWithBatch,
    user: ClassroomUser,
    role: ClassroomRole
  ): Promise<ClassTokenResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        error: 'DAILY_API_KEY is not configured on the server.',
      }
    }

    const roomName = this.getRoomName(session)

    try {
      // Short-lived token valid for 4 hours
      const expSeconds = Math.floor(Date.now() / 1000) + 14400
      const isOwner = role === 'host'

      const res = await fetch(`${this.baseUrl}/meeting-tokens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            room_name: roomName,
            user_name: user.name,
            user_id: user.id,
            is_owner: isOwner,
            enable_screenshare: isOwner, // Tutors can share screen
            exp: expSeconds,
          },
        }),
      })

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        return {
          success: false,
          error: errData.info || errData.error || `Daily.co token mint error (${res.status})`,
        }
      }

      const data = await res.json()
      const token = data.token

      // Retrieve room to construct full access URL
      const roomDetails = await this.getClassRoom(roomName)
      const baseRoomUrl = roomDetails?.url || `https://api.daily.co/${roomName}`
      const roomUrl = `${baseRoomUrl}?t=${token}`

      return {
        success: true,
        token,
        roomUrl,
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Failed to generate classroom access token.',
      }
    }
  }

  async getClassRoom(roomId: string): Promise<ClassRoomDetails | null> {
    if (!this.isConfigured()) return null

    try {
      const res = await fetch(`${this.baseUrl}/rooms/${encodeURIComponent(roomId)}`, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })

      if (!res.ok) return null
      const data = await res.json()

      return {
        id: data.id || data.name,
        name: data.name,
        url: data.url,
        privacy: data.privacy,
        createdAt: data.created_at,
      }
    } catch {
      return null
    }
  }

  async endClassRoom(roomId: string): Promise<boolean> {
    if (!this.isConfigured()) return false

    try {
      const res = await fetch(`${this.baseUrl}/rooms/${encodeURIComponent(roomId)}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
        },
      })
      return res.ok
    } catch {
      return false
    }
  }
}
