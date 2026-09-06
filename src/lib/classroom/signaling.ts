import { createClient } from '@/lib/supabase/client'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  ClassroomRole,
  ClassroomParticipant,
  SignalingMessage,
  ClassroomChatMessage,
  SignalType,
} from './types'

export interface SignalingCallbacks {
  onParticipantsSync?: (participants: ClassroomParticipant[]) => void
  onParticipantJoin?: (participant: ClassroomParticipant) => void
  onParticipantLeave?: (participantId: string) => void
  onSignal?: (signal: SignalingMessage) => void
  onChatMessage?: (message: ClassroomChatMessage) => void
  onClassEnded?: () => void
  onError?: (err: Error) => void
}

export interface LocalParticipantMeta {
  id: string
  name: string
  role: ClassroomRole
  audioEnabled: boolean
  videoEnabled: boolean
  isScreenSharing: boolean
}

/**
 * Supabase Realtime Signaling Client for TutorPulse Online Classroom.
 * Connects to a private session-scoped channel `classroom:{sessionId}`.
 * Provides presence tracking, WebRTC signaling dispatch, and in-session chat.
 */
export class ClassroomSignalingChannel {
  private supabase = createClient()
  private channel: RealtimeChannel | null = null
  private sessionId: string
  private localMeta: LocalParticipantMeta
  private callbacks: SignalingCallbacks = {}
  private isSubscribed = false

  constructor(sessionId: string, localMeta: LocalParticipantMeta, callbacks?: SignalingCallbacks) {
    this.sessionId = sessionId
    this.localMeta = localMeta
    if (callbacks) {
      this.callbacks = callbacks
    }
  }

  /**
   * Connects to the Realtime signaling channel and registers presence.
   */
  async connect(): Promise<void> {
    if (this.channel) {
      return
    }

    const channelName = `classroom:${this.sessionId}`

    this.channel = this.supabase.channel(channelName, {
      config: {
        presence: {
          key: this.localMeta.id,
        },
        broadcast: {
          self: false,
          ack: false,
        },
      },
    })

    // 1. Presence Sync & Updates
    this.channel
      .on('presence', { event: 'sync' }, () => {
        if (!this.channel) return
        const state = this.channel.presenceState()
        const participants: ClassroomParticipant[] = []

        Object.keys(state).forEach((key) => {
          const presences = state[key]
          if (presences && presences.length > 0) {
            const latest = presences[presences.length - 1] as any
            participants.push({
              id: latest.id || key,
              name: latest.name || 'Participant',
              role: latest.role || 'participant',
              isAudioMuted: latest.audioEnabled === false,
              isVideoMuted: latest.videoEnabled === false,
              isScreenSharing: Boolean(latest.isScreenSharing),
              joinedAt: latest.joinedAt || new Date().toISOString(),
            })
          }
        })

        this.callbacks.onParticipantsSync?.(participants)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        if (!newPresences) return
        newPresences.forEach((presence: any) => {
          if (presence.id && presence.id !== this.localMeta.id) {
            this.callbacks.onParticipantJoin?.({
              id: presence.id,
              name: presence.name || 'Participant',
              role: presence.role || 'participant',
              isAudioMuted: presence.audioEnabled === false,
              isVideoMuted: presence.videoEnabled === false,
              isScreenSharing: Boolean(presence.isScreenSharing),
              joinedAt: presence.joinedAt || new Date().toISOString(),
            })
          }
        })
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        if (!leftPresences) return
        leftPresences.forEach((presence: any) => {
          if (presence.id) {
            this.callbacks.onParticipantLeave?.(presence.id)
          }
        })
      })

    // 2. Broadcast Signaling (WebRTC offers, answers, ICE candidates, state)
    this.channel.on('broadcast', { event: 'signal' }, ({ payload }) => {
      const msg = payload as SignalingMessage
      if (!msg || msg.senderId === this.localMeta.id) {
        return
      }

      // If targeted to a specific peer, ignore if not targeted to this client
      if (msg.targetId && msg.targetId !== this.localMeta.id) {
        return
      }

      if (msg.type === 'class-ended') {
        this.callbacks.onClassEnded?.()
        return
      }

      this.callbacks.onSignal?.(msg)
    })

    // 3. Broadcast Session Chat
    this.channel.on('broadcast', { event: 'chat:message' }, ({ payload }) => {
      const chatMsg = payload as ClassroomChatMessage
      if (!chatMsg) return
      this.callbacks.onChatMessage?.(chatMsg)
    })

    // Subscribe to channel
    return new Promise((resolve, reject) => {
      if (!this.channel) return resolve()

      this.channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          this.isSubscribed = true
          try {
            await this.channel?.track({
              id: this.localMeta.id,
              name: this.localMeta.name,
              role: this.localMeta.role,
              audioEnabled: this.localMeta.audioEnabled,
              videoEnabled: this.localMeta.videoEnabled,
              isScreenSharing: this.localMeta.isScreenSharing,
              joinedAt: new Date().toISOString(),
            })
            resolve()
          } catch (trackErr: any) {
            console.error('Signaling channel presence track error:', trackErr)
            resolve()
          }
        } else if (status === 'CHANNEL_ERROR') {
          this.callbacks.onError?.(new Error('Signaling channel connection error.'))
          reject(new Error('Channel subscription error.'))
        }
      })
    })
  }

  /**
   * Updates local participant presence state (e.g. muted/unmuted, screen sharing).
   */
  async updateState(updates: Partial<LocalParticipantMeta>): Promise<void> {
    this.localMeta = { ...this.localMeta, ...updates }
    if (this.channel && this.isSubscribed) {
      try {
        await this.channel.track({
          id: this.localMeta.id,
          name: this.localMeta.name,
          role: this.localMeta.role,
          audioEnabled: this.localMeta.audioEnabled,
          videoEnabled: this.localMeta.videoEnabled,
          isScreenSharing: this.localMeta.isScreenSharing,
          joinedAt: new Date().toISOString(),
        })

        // Also broadcast state change for instantaneous UI sync
        await this.sendSignal('state-change', {
          audioEnabled: this.localMeta.audioEnabled,
          videoEnabled: this.localMeta.videoEnabled,
          isScreenSharing: this.localMeta.isScreenSharing,
        })
      } catch (err) {
        console.warn('Failed to update signaling presence state:', err)
      }
    }
  }

  /**
   * Sends a WebRTC signaling message to peers.
   */
  async sendSignal(type: SignalType, data?: any, targetId?: string | null): Promise<void> {
    if (!this.channel) return

    const payload: SignalingMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: this.localMeta.id,
      senderName: this.localMeta.name,
      senderRole: this.localMeta.role,
      targetId: targetId ?? null,
      sessionId: this.sessionId,
      type,
      data,
      timestamp: Date.now(),
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'signal',
        payload,
      })
    } catch (err) {
      console.error(`Failed to send signaling message (${type}):`, err)
    }
  }

  /**
   * Sends a session-scoped text chat message.
   */
  async sendChatMessage(text: string): Promise<ClassroomChatMessage | null> {
    if (!this.channel || !text.trim()) return null

    const message: ClassroomChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      senderId: this.localMeta.id,
      senderName: this.localMeta.name,
      senderRole: this.localMeta.role,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    }

    try {
      await this.channel.send({
        type: 'broadcast',
        event: 'chat:message',
        payload: message,
      })
      // Trigger callback locally as well
      this.callbacks.onChatMessage?.(message)
      return message
    } catch (err) {
      console.error('Failed to send classroom chat message:', err)
      return null
    }
  }

  /**
   * Tutor ends the class: notifies all connected peers via Realtime broadcast.
   */
  async broadcastClassEnded(): Promise<void> {
    await this.sendSignal('class-ended', {}, null)
  }

  /**
   * Disconnects from the channel and cleans up presence.
   */
  async disconnect(): Promise<void> {
    if (this.channel) {
      try {
        await this.channel.untrack()
      } catch {}
      try {
        await this.supabase.removeChannel(this.channel)
      } catch {}
      this.channel = null
      this.isSubscribed = false
    }
  }
}
