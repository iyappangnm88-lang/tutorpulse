import type { SignalingMessage } from './types'

export interface WebRtcPeerCallbacks {
  onRemoteStream: (peerId: string, stream: MediaStream) => void
  onPeerConnectionStateChange: (peerId: string, state: RTCPeerConnectionState) => void
  onSendSignal: (type: 'offer' | 'answer' | 'ice-candidate', data: any, targetId: string) => void
  onPeerDisconnected: (peerId: string) => void
}

interface PeerConnectionEntry {
  pc: RTCPeerConnection
  remoteStream: MediaStream
  isPolite: boolean
  makingOffer: boolean
  ignoreOffer: boolean
  isSettingRemoteAnswerPending: boolean
  candidateQueue: RTCIceCandidateInit[]
  senders: Map<string, RTCRtpSender> // 'audio' | 'video'
}

const DEFAULT_RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
  iceCandidatePoolSize: 2,
}

/**
 * WebRTC Mesh Peer Connection Pool.
 * Orchestrates direct peer-to-peer audio/video streaming between participants in a small tuition batch.
 * Implements the W3C Perfect Negotiation pattern for race-free signaling and automatic ICE candidate queuing.
 */
export class WebRtcPeerPool {
  private localParticipantId: string
  private localStream: MediaStream | null = null
  private peers = new Map<string, PeerConnectionEntry>()
  private callbacks: WebRtcPeerCallbacks
  private config: RTCConfiguration

  constructor(
    localParticipantId: string,
    callbacks: WebRtcPeerCallbacks,
    config: RTCConfiguration = DEFAULT_RTC_CONFIG
  ) {
    this.localParticipantId = localParticipantId
    this.callbacks = callbacks
    this.config = config
  }

  /**
   * Sets or updates the local media stream (camera + mic).
   * Attaches tracks to any existing peer connections.
   */
  setLocalStream(stream: MediaStream | null): void {
    this.localStream = stream

    if (!stream) return

    // Add or replace tracks for all existing peer connections
    this.peers.forEach((entry) => {
      this.attachLocalTracksToPeer(entry)
    })
  }

  /**
   * Replaces the currently transmitted video track on all peer connections.
   * Used for seamless screen sharing activation and deactivation.
   */
  async replaceVideoTrack(newTrack: MediaStreamTrack | null): Promise<void> {
    const promises: Promise<void>[] = []

    this.peers.forEach((entry) => {
      const sender = entry.senders.get('video')
      if (sender) {
        promises.push(sender.replaceTrack(newTrack))
      } else if (newTrack) {
        // If no video sender existed yet, add track
        const newSender = entry.pc.addTrack(newTrack, this.localStream || new MediaStream())
        entry.senders.set('video', newSender)
      }
    })

    await Promise.all(promises)
  }

  /**
   * Initiates or retrieves a peer connection with a remote participant.
   */
  getOrCreatePeer(peerId: string): PeerConnectionEntry {
    let entry = this.peers.get(peerId)
    if (entry) {
      return entry
    }

    // W3C Perfect Negotiation: Polite peer is deterministically chosen
    const isPolite = this.localParticipantId > peerId
    const pc = new RTCPeerConnection(this.config)
    const remoteStream = new MediaStream()

    entry = {
      pc,
      remoteStream,
      isPolite,
      makingOffer: false,
      ignoreOffer: false,
      isSettingRemoteAnswerPending: false,
      candidateQueue: [],
      senders: new Map(),
    }

    this.peers.set(peerId, entry)

    // 1. ICE Candidate Handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        this.callbacks.onSendSignal('ice-candidate', event.candidate.toJSON(), peerId)
      }
    }

    // 2. Remote Track Handler
    pc.ontrack = (event) => {
      const incomingTrack = event.track
      if (incomingTrack) {
        if (!remoteStream.getTrackById(incomingTrack.id)) {
          remoteStream.addTrack(incomingTrack)
        }
        incomingTrack.onended = () => {
          remoteStream.removeTrack(incomingTrack)
        }
      } else if (event.streams[0]) {
        event.streams[0].getTracks().forEach((t) => {
          if (!remoteStream.getTrackById(t.id)) {
            remoteStream.addTrack(t)
          }
          t.onended = () => {
            remoteStream.removeTrack(t)
          }
        })
      }

      // If stream has tracks, trigger callback
      if (remoteStream.getTracks().length > 0) {
        this.callbacks.onRemoteStream(peerId, remoteStream)
      }
    }

    // 3. Connection State Handler
    pc.onconnectionstatechange = () => {
      const state = pc.connectionState
      this.callbacks.onPeerConnectionStateChange(peerId, state)

      if (state === 'failed' || state === 'disconnected') {
        console.warn(`Peer ${peerId} connection state: ${state}. Attempting recovery if polite.`)
        if (isPolite && pc.signalingState !== 'closed') {
          this.restartIce(peerId)
        }
      } else if (state === 'closed') {
        this.callbacks.onPeerDisconnected(peerId)
      }
    }

    // 4. Perfect Negotiation: negotiationneeded
    pc.onnegotiationneeded = async () => {
      try {
        if (!entry) return
        entry.makingOffer = true
        await pc.setLocalDescription()
        if (pc.localDescription) {
          this.callbacks.onSendSignal('offer', pc.localDescription.toJSON(), peerId)
        }
      } catch (err) {
        console.error(`Error during onnegotiationneeded for peer ${peerId}:`, err)
      } finally {
        if (entry) {
          entry.makingOffer = false
        }
      }
    }

    // Attach any existing local tracks
    this.attachLocalTracksToPeer(entry)

    return entry
  }

  /**
   * Attaches audio and video tracks from localStream to a specific peer connection.
   */
  private attachLocalTracksToPeer(entry: PeerConnectionEntry): void {
    if (!this.localStream) return

    const pc = entry.pc

    this.localStream.getTracks().forEach((track) => {
      const kind = track.kind as 'audio' | 'video'
      const existingSender = entry.senders.get(kind)

      if (existingSender) {
        existingSender.replaceTrack(track).catch((err) => {
          console.warn(`replaceTrack error on peer:`, err)
        })
      } else {
        try {
          const sender = pc.addTrack(track, this.localStream!)
          entry.senders.set(kind, sender)
        } catch (err) {
          console.warn(`addTrack error on peer:`, err)
        }
      }
    })
  }

  /**
   * Processes incoming WebRTC signaling messages (offers, answers, ICE candidates)
   * using the W3C Perfect Negotiation protocol.
   */
  async handleIncomingSignal(msg: SignalingMessage): Promise<void> {
    const peerId = msg.senderId
    const entry = this.getOrCreatePeer(peerId)
    const pc = entry.pc

    try {
      if (msg.type === 'offer') {
        const offer = msg.data as RTCSessionDescriptionInit
        const offerCollision = entry.makingOffer || pc.signalingState !== 'stable'

        entry.ignoreOffer = !entry.isPolite && offerCollision
        if (entry.ignoreOffer) {
          console.log(`[Impolite] Ignoring colliding offer from peer ${peerId}`)
          return
        }

        entry.isSettingRemoteAnswerPending = false
        await pc.setRemoteDescription(new RTCSessionDescription(offer))

        // Drain any queued ICE candidates received before remote description
        await this.drainCandidateQueue(entry)

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        if (pc.localDescription) {
          this.callbacks.onSendSignal('answer', pc.localDescription.toJSON(), peerId)
        }
      } else if (msg.type === 'answer') {
        const answer = msg.data as RTCSessionDescriptionInit
        entry.isSettingRemoteAnswerPending = true
        await pc.setRemoteDescription(new RTCSessionDescription(answer))
        entry.isSettingRemoteAnswerPending = false

        // Drain queued ICE candidates
        await this.drainCandidateQueue(entry)
      } else if (msg.type === 'ice-candidate') {
        const candidateInit = msg.data as RTCIceCandidateInit
        if (!candidateInit || !candidateInit.candidate) return

        if (!pc.remoteDescription) {
          // Remote description not yet set, queue candidate
          entry.candidateQueue.push(candidateInit)
        } else {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidateInit))
          } catch (iceErr) {
            if (!entry.ignoreOffer) {
              console.warn(`Failed to add ICE candidate for peer ${peerId}:`, iceErr)
            }
          }
        }
      }
    } catch (err) {
      console.error(`Error processing incoming signal (${msg.type}) from ${peerId}:`, err)
    }
  }

  /**
   * Drains the queue of ICE candidates received before remote description was set.
   */
  private async drainCandidateQueue(entry: PeerConnectionEntry): Promise<void> {
    while (entry.candidateQueue.length > 0) {
      const candidate = entry.candidateQueue.shift()
      if (candidate) {
        try {
          await entry.pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.warn('Failed to add queued ICE candidate:', err)
        }
      }
    }
  }

  /**
   * Triggers an ICE restart with a specific peer.
   */
  async restartIce(peerId: string): Promise<void> {
    const entry = this.peers.get(peerId)
    if (!entry || entry.pc.signalingState === 'closed') return

    try {
      entry.makingOffer = true
      const offer = await entry.pc.createOffer({ iceRestart: true })
      await entry.pc.setLocalDescription(offer)
      if (entry.pc.localDescription) {
        this.callbacks.onSendSignal('offer', entry.pc.localDescription.toJSON(), peerId)
      }
    } catch (err) {
      console.error(`ICE restart failed for peer ${peerId}:`, err)
    } finally {
      entry.makingOffer = false
    }
  }

  /**
   * Removes and closes the peer connection for a participant who left.
   */
  removePeer(peerId: string): void {
    const entry = this.peers.get(peerId)
    if (!entry) return

    try {
      entry.pc.ontrack = null
      entry.pc.onicecandidate = null
      entry.pc.onconnectionstatechange = null
      entry.pc.onnegotiationneeded = null
      entry.pc.close()
    } catch (err) {
      console.warn(`Error closing peer connection for ${peerId}:`, err)
    }

    this.peers.delete(peerId)
    this.callbacks.onPeerDisconnected(peerId)
  }

  /**
   * Cleans up all active peer connections in the mesh pool.
   */
  closeAll(): void {
    this.peers.forEach((entry, peerId) => {
      try {
        entry.pc.ontrack = null
        entry.pc.onicecandidate = null
        entry.pc.onconnectionstatechange = null
        entry.pc.onnegotiationneeded = null
        entry.pc.close()
      } catch {}
    })
    this.peers.clear()
  }
}
