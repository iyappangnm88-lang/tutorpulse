'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Share2,
  Users,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  Play,
  LogOut,
  Send,
  X,
  ClipboardCheck,
  Shield,
  Radio,
  Sparkles,
  PenTool,
  Hand,
  Smile,
  BarChart2,
  Check,
  Zap,
  Trophy,
  Wifi,
  Maximize,
  Minimize,
  Pin,
  PinOff,
  VolumeX,
  Volume2,
  MoreVertical,
  Layers,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/toast-context'
import { formatTimeRange } from '@/lib/scheduling'
import { formatFriendlyDate } from '@/lib/calendar-utils'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'

const DigitalWhiteboard = dynamic(
  () => import('@/components/whiteboard/digital-whiteboard').then((mod) => mod.DigitalWhiteboard),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center bg-gray-950 text-gray-400 text-xs">
        Loading whiteboard canvas...
      </div>
    ),
  }
)
import { EndClassDialog } from './end-class-dialog'
import { ClassroomChatPanel } from './classroom-chat-panel'
import { ClassroomPollsPanel } from './classroom-polls-panel'
import { ClassroomQuestionsPanel } from './classroom-questions-panel'
import { ClassroomRankingPanel } from './classroom-ranking-panel'
import { PostClassResultsDialog } from './post-class-results-dialog'
import { ClassroomReactionOverlay } from './classroom-reaction-overlay'
import {
  getClassroomMessagesAction,
  getClassroomPollsAction,
  getClassroomQuestionsAction,
  awardAttendanceRewardAction,
} from '@/app/(dashboard)/dashboard/classroom/interaction-actions'
import type { ClassroomQuestionRow } from '@/types/database'
import {
  startClassSessionAction,
  endClassSessionAction,
  recordClassroomJoinAction,
  recordClassroomLeaveAction,
  getClassroomTokenAction,
} from '@/app/(dashboard)/dashboard/classroom/actions'
import { ClassroomSignalingChannel } from '@/lib/classroom/signaling'
import { WebRtcPeerPool } from '@/lib/classroom/webrtc'
import {
  requestMediaPermissions,
  requestScreenShare,
  stopAllTracks,
} from '@/lib/classroom/permissions'
import type { ClassSessionWithBatch, ClassSessionStatus } from '@/types'
import type {
  ClassroomRole,
  ClassroomParticipant,
  ClassroomChatMessage,
  ClassroomReaction,
  ClassroomPoll,
  ClassroomConnectionState,
} from '@/lib/classroom/types'

interface ClassroomViewProps {
  session: ClassSessionWithBatch
  initialRole: ClassroomRole
  currentUserName: string
  currentUserId?: string
  portalType: 'tutor' | 'parent' | 'student'
}

/**
 * Enhanced Participant Tile with stream attachment, fallback avatar,
 * audio/video status, hand-raise pulse, pin badge, and contextual moderation menu.
 */
function ParticipantTile({
  participantId,
  name,
  role,
  isLocal,
  stream,
  isAudioMuted,
  isVideoMuted,
  isScreenSharing,
  connectionState,
  handRaised,
  isPinned,
  compact = false,
  canModerate = false,
  isSelected = false,
  onSelect,
  onPin,
  onMute,
  onAcknowledgeHand,
}: {
  participantId: string
  name: string
  role: ClassroomRole
  isLocal?: boolean
  stream?: MediaStream | null
  isAudioMuted?: boolean
  isVideoMuted?: boolean
  isScreenSharing?: boolean
  connectionState?: string
  handRaised?: boolean
  isPinned?: boolean
  compact?: boolean
  canModerate?: boolean
  isSelected?: boolean
  onSelect?: () => void
  onPin?: () => void
  onMute?: () => void
  onAcknowledgeHand?: () => void
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  useEffect(() => {
    if (videoRef.current) {
      if (stream && stream.getVideoTracks().length > 0) {
        videoRef.current.srcObject = stream
      } else {
        videoRef.current.srcObject = null
      }
    }
  }, [stream])

  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'P'

  const hasActiveVideo = Boolean(stream && stream.getVideoTracks().length > 0 && !isVideoMuted)

  if (compact) {
    return (
      <div
        onClick={onSelect}
        className={`relative w-28 sm:w-32 h-20 sm:h-24 rounded-xl overflow-hidden bg-gray-900 border transition-all shrink-0 cursor-pointer group select-none shadow-md ${
          isPinned
            ? 'border-[#55C832] ring-2 ring-[#55C832]/50'
            : handRaised
            ? 'border-amber-500 ring-2 ring-amber-500/50'
            : 'border-gray-800/90 hover:border-gray-700'
        }`}
      >
        {/* Video stream */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${
            hasActiveVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
          } ${isLocal && !isScreenSharing ? '-scale-x-100' : ''}`}
        />

        {/* Fallback avatar */}
        {!hasActiveVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900">
            <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-[#172B4D] to-teal-600 flex items-center justify-center text-white text-xs sm:text-sm font-bold shadow-md ring-1 ring-white/10">
              {initials}
            </div>
          </div>
        )}

        {/* Hand Raised Banner */}
        {handRaised && (
          <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-md bg-amber-500 text-black text-[9px] font-extrabold flex items-center gap-0.5 shadow-sm animate-pulse z-10">
            <span>✋</span>
          </div>
        )}

        {/* Pinned Indicator */}
        {isPinned && (
          <div className="absolute top-1 left-1 px-1.5 py-0.5 rounded-md bg-[#55C832] text-white text-[9px] font-bold flex items-center gap-0.5 shadow-sm z-10">
            <Pin className="h-2.5 w-2.5 fill-current" />
          </div>
        )}

        {/* Bottom Label & Mic status */}
        <div className="absolute bottom-1 left-1 right-1 flex items-center justify-between gap-1 px-1.5 py-0.5 rounded-lg bg-black/70 backdrop-blur-sm border border-white/10 text-white z-10">
          <span className="text-[10px] font-semibold truncate max-w-[70px]">
            {isLocal ? 'You' : name}
          </span>
          <div className="shrink-0">
            {isAudioMuted ? (
              <MicOff className="h-2.5 w-2.5 text-rose-400" />
            ) : (
              <Mic className="h-2.5 w-2.5 text-emerald-400" />
            )}
          </div>
        </div>

        {/* Context Menu Popup (when selected) */}
        {isSelected && (
          <div
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-0 bg-gray-950/95 backdrop-blur-md p-1.5 flex flex-col justify-center gap-1 z-20 animate-fade-in text-white"
          >
            {onPin && (
              <button
                type="button"
                onClick={onPin}
                className="w-full py-1 px-1.5 rounded-lg text-[10px] font-semibold bg-gray-800 hover:bg-gray-700 flex items-center justify-center gap-1 text-slate-200 transition-colors"
              >
                {isPinned ? <PinOff className="h-3 w-3 text-amber-400" /> : <Pin className="h-3 w-3 text-[#55C832]" />}
                <span>{isPinned ? 'Unpin' : 'Pin Video'}</span>
              </button>
            )}
            {canModerate && !isLocal && !isAudioMuted && onMute && (
              <button
                type="button"
                onClick={onMute}
                className="w-full py-1 px-1.5 rounded-lg text-[10px] font-semibold bg-rose-950/80 border border-rose-800/80 hover:bg-rose-900 text-rose-300 flex items-center justify-center gap-1 transition-colors"
              >
                <VolumeX className="h-3 w-3 text-rose-400" />
                <span>Mute Mic</span>
              </button>
            )}
            {canModerate && handRaised && onAcknowledgeHand && (
              <button
                type="button"
                onClick={onAcknowledgeHand}
                className="w-full py-1 px-1.5 rounded-lg text-[10px] font-semibold bg-[#55C832] hover:bg-[#318A25] text-white flex items-center justify-center gap-1 transition-colors"
              >
                <Check className="h-3 w-3" />
                <span>Ack Hand</span>
              </button>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      onClick={onSelect}
      className={`relative w-full h-full min-h-[160px] sm:min-h-[220px] rounded-2xl overflow-hidden bg-gray-900 border transition-all flex items-center justify-center shadow-lg group ${
        isPinned
          ? 'border-[#55C832] ring-2 ring-[#55C832]/40'
          : handRaised
          ? 'border-amber-500 ring-2 ring-amber-500/40'
          : 'border-gray-800/90 hover:border-gray-700'
      }`}
    >
      {/* 1. Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasActiveVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${isLocal && !isScreenSharing ? '-scale-x-100' : ''}`}
      />

      {/* 2. Fallback Avatar */}
      {!hasActiveVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-[#172B4D] to-teal-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl ring-2 ring-white/10">
            {initials}
          </div>
          <p className="mt-3 text-xs sm:text-sm font-semibold text-gray-200 truncate max-w-[80%]">
            {name}
          </p>
          <span className="text-[10px] text-gray-500 capitalize">{role}</span>
        </div>
      )}

      {/* 3. Top Status Badges */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
        {isLocal && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-slate-300 backdrop-blur-md border border-white/10">
            You
          </span>
        )}
        {isScreenSharing && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 backdrop-blur-md border border-emerald-800/80 flex items-center gap-1">
            <Share2 className="h-2.5 w-2.5" />
            Screen
          </span>
        )}
        {isPinned && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#55C832] text-white backdrop-blur-md flex items-center gap-1">
            <Pin className="h-2.5 w-2.5 fill-current" />
            Pinned
          </span>
        )}
      </div>

      {/* Hand Raised Top-Right Pill */}
      {handRaised && (
        <div className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full bg-amber-500 text-black text-xs font-extrabold flex items-center gap-1 shadow-lg animate-pulse z-10">
          <span>✋</span>
          <span className="hidden sm:inline">Hand Raised</span>
        </div>
      )}

      {/* 4. Bottom Info Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white min-w-0">
          <span className="text-xs font-semibold truncate max-w-[120px] sm:max-w-[180px]">
            {name}
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
              role === 'host'
                ? 'bg-[#55C832]/80 text-white'
                : 'bg-gray-800/80 text-gray-300'
            }`}
          >
            {role === 'host' ? 'Tutor' : 'Student'}
          </span>
        </div>

        {/* Controls / Audio Indicator */}
        <div className="flex items-center gap-1">
          {onPin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onPin()
              }}
              className="h-7 w-7 rounded-xl flex items-center justify-center bg-black/60 hover:bg-black/90 text-gray-300 hover:text-white backdrop-blur-md border border-white/10 transition-colors"
              title={isPinned ? 'Unpin video' : 'Pin video'}
            >
              {isPinned ? <PinOff className="h-3.5 w-3.5 text-amber-400" /> : <Pin className="h-3.5 w-3.5" />}
            </button>
          )}

          {canModerate && !isLocal && !isAudioMuted && onMute && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onMute()
              }}
              className="h-7 w-7 rounded-xl flex items-center justify-center bg-black/60 hover:bg-rose-950/90 text-gray-300 hover:text-rose-400 backdrop-blur-md border border-white/10 hover:border-rose-800 transition-colors"
              title="Mute student's microphone"
            >
              <VolumeX className="h-3.5 w-3.5" />
            </button>
          )}

          <div
            className={`h-7 w-7 rounded-xl flex items-center justify-center backdrop-blur-md transition-colors ${
              isAudioMuted
                ? 'bg-rose-950/90 text-rose-400 border border-rose-800/80'
                : 'bg-black/60 text-emerald-400 border border-white/10'
            }`}
            title={isAudioMuted ? 'Microphone muted' : 'Microphone active'}
          >
            {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          </div>
        </div>
      </div>
    </div>
  )
}

export function ClassroomView({
  session,
  initialRole,
  currentUserName,
  currentUserId,
  portalType,
}: ClassroomViewProps) {
  const router = useRouter()
  const { toast } = useToast()

  const userId = currentUserId || `user-${Math.random().toString(36).slice(2, 9)}`

  // State Management
  const [status, setStatus] = useState<ClassSessionStatus>(session.status)
  const [connectionState, setConnectionState] = useState<ClassroomConnectionState>('idle')
  const [isStarting, setIsStarting] = useState(false)
  const [isEnding, setIsEnding] = useState(false)
  const [showEndDialog, setShowEndDialog] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [mediaWarning, setMediaWarning] = useState<string | null>(null)

  // Media Track States
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null)
  const [isAudioMuted, setIsAudioMuted] = useState(false)
  const [isVideoMuted, setIsVideoMuted] = useState(false)
  const [isScreenSharing, setIsScreenSharing] = useState(false)

  // Participants & Signaling
  const [remoteStreams, setRemoteStreams] = useState<Map<string, MediaStream>>(new Map())
  const [participants, setParticipants] = useState<ClassroomParticipant[]>([])
  const [messages, setMessages] = useState<ClassroomChatMessage[]>([])
  const [pinnedParticipantId, setPinnedParticipantId] = useState<string | null>(null)
  const [selectedTileId, setSelectedTileId] = useState<string | null>(null)

  // Side Drawer UI
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false)
  const [sidePanelTab, setSidePanelTab] = useState<'participants' | 'chat' | 'polls' | 'questions' | 'ranking'>('participants')

  // Live Classroom Interactions State
  const [reactions, setReactions] = useState<ClassroomReaction[]>([])
  const [polls, setPolls] = useState<ClassroomPoll[]>([])
  const [questions, setQuestions] = useState<ClassroomQuestionRow[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [unreadPollsCount, setUnreadPollsCount] = useState(0)
  const [unreadQuestionsCount, setUnreadQuestionsCount] = useState(0)
  const [isHandRaised, setIsHandRaised] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [showPostClassDialog, setShowPostClassDialog] = useState(false)
  const attendanceAwardedRef = useRef(false)

  // Stage View Mode: Video Grid vs Digital Whiteboard
  const [activeStageView, setActiveStageView] = useState<'video' | 'whiteboard'>('video')

  // Fullscreen Viewport Mode
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        await document.documentElement.requestFullscreen()
      } else if (document.exitFullscreen) {
        await document.exitFullscreen()
      }
    } catch (err) {
      console.warn('Fullscreen toggle failed:', err)
    }
  }, [])

  // References to Engine Instances
  const signalingRef = useRef<ClassroomSignalingChannel | null>(null)
  const peerPoolRef = useRef<WebRtcPeerPool | null>(null)
  const participantLogIdRef = useRef<string | null>(null)

  // =========================================================================
  // WebRTC & Signaling Initialization
  // =========================================================================
  const initializeClassroom = useCallback(async () => {
    if (status !== 'in_progress') return

    setConnectionState('connecting')
    setErrorMessage(null)

    // 1. Acquire Local Camera & Microphone
    const mediaResult = await requestMediaPermissions({
      preferVideo: true,
      preferAudio: true,
    })

    if (mediaResult.error) {
      setMediaWarning(mediaResult.error)
    }

    const stream = mediaResult.stream
    setLocalStream(stream)
    setIsAudioMuted(!mediaResult.audioAvailable)
    setIsVideoMuted(!mediaResult.videoAvailable)

    // 2. Instantiate WebRTC Peer Connection Pool
    const peerPool = new WebRtcPeerPool(userId, {
      onRemoteStream: (peerId, remoteStream) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev)
          next.set(peerId, remoteStream)
          return next
        })
      },
      onPeerConnectionStateChange: (peerId, state) => {
        if (state === 'connected') {
          setConnectionState('connected')
        } else if (state === 'disconnected' || state === 'failed') {
          setConnectionState('reconnecting')
        }
      },
      onSendSignal: (type, data, targetId) => {
        signalingRef.current?.sendSignal(type, data, targetId)
      },
      onPeerDisconnected: (peerId) => {
        setRemoteStreams((prev) => {
          const next = new Map(prev)
          next.delete(peerId)
          return next
        })
      },
    })

    peerPool.setLocalStream(stream)
    peerPoolRef.current = peerPool

    // 3. Connect to Supabase Realtime Signaling Channel
    const signaling = new ClassroomSignalingChannel(
      session.id,
      {
        id: userId,
        name: currentUserName,
        role: initialRole,
        audioEnabled: mediaResult.audioAvailable,
        videoEnabled: mediaResult.videoAvailable,
        isScreenSharing: false,
      },
      {
        onParticipantsSync: (list) => {
          setParticipants(list)
          list.forEach((p) => {
            if (p.id !== userId) {
              peerPool.getOrCreatePeer(p.id)
            }
          })
          setConnectionState('connected')
        },
        onParticipantJoin: (participant) => {
          setParticipants((prev) => {
            const exists = prev.some((p) => p.id === participant.id)
            return exists ? prev : [...prev, participant]
          })
          toast('info', `${participant.name} joined the class`)
          peerPool.getOrCreatePeer(participant.id)
        },
        onParticipantLeave: (peerId) => {
          setParticipants((prev) => prev.filter((p) => p.id !== peerId))
          peerPool.removePeer(peerId)
        },
        onSignal: (msg) => {
          if (msg.type === 'offer' || msg.type === 'answer' || msg.type === 'ice-candidate') {
            peerPool.handleIncomingSignal(msg)
          } else if (msg.type === 'state-change') {
            setParticipants((prev) =>
              prev.map((p) => (p.id === msg.senderId ? { ...p, ...msg.data } : p))
            )
          }
        },
        onChatMessage: (chatMsg) => {
          setMessages((prev) => {
            const exists = prev.some((m) => m.id === chatMsg.id)
            return exists ? prev : [...prev, chatMsg]
          })
          if (!isSidePanelOpen || sidePanelTab !== 'chat') {
            setUnreadCount((c) => c + 1)
          }
        },
        onChatMessageDelete: (messageId) => {
          setMessages((prev) => prev.filter((m) => m.id !== messageId))
        },
        onReaction: (reaction) => {
          setReactions((prev) => [...prev, reaction])
        },
        onHandRaised: (participantId, senderName, timestamp) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === participantId
                ? { ...p, handRaised: true, handRaisedAt: timestamp }
                : p
            )
          )
          if (participantId !== userId) {
            toast('info', `${senderName || 'A student'} raised hand ✋`)
          }
        },
        onHandLowered: (participantId) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === participantId
                ? { ...p, handRaised: false, handRaisedAt: undefined }
                : p
            )
          )
        },
        onHandAcknowledged: (participantId) => {
          setParticipants((prev) =>
            prev.map((p) =>
              p.id === participantId
                ? { ...p, handRaised: false, handRaisedAt: undefined }
                : p
            )
          )
          if (participantId === userId) {
            setIsHandRaised(false)
            toast('success', 'Hand Acknowledged', 'Your tutor acknowledged your raised hand.')
          }
        },
        onMuteStudent: (targetId) => {
          if (targetId === userId) {
            if (stream) {
              const audioTrack = stream.getAudioTracks()[0]
              if (audioTrack) {
                audioTrack.enabled = false
              }
            }
            setIsAudioMuted(true)
            signalingRef.current?.updateState({ audioEnabled: false })
            toast('info', 'Microphone Muted', 'Your tutor muted your microphone.')
          }
        },
        onMuteAll: () => {
          if (initialRole === 'participant') {
            if (stream) {
              const audioTrack = stream.getAudioTracks()[0]
              if (audioTrack) {
                audioTrack.enabled = false
              }
            }
            setIsAudioMuted(true)
            signalingRef.current?.updateState({ audioEnabled: false })
            toast('info', 'Microphone Muted', 'The tutor muted all students.')
          }
        },
        onPollEvent: (event) => {
          getClassroomPollsAction(session.id).then((res) => {
            if (res.success && res.data) {
              setPolls(res.data)
            }
          })
          if (event.type === 'poll:started') {
            if (!isSidePanelOpen || sidePanelTab !== 'polls') {
              setUnreadPollsCount((c) => c + 1)
            }
            toast('info', 'New Poll Launched', 'Check the polls tab to vote.')
          }
        },
        onQuestionEvent: (event) => {
          getClassroomQuestionsAction(session.id).then((res) => {
            if (res.success && res.data) {
              setQuestions(res.data)
            }
          })
          if (event.type === 'question:started') {
            if (!isSidePanelOpen || sidePanelTab !== 'questions') {
              setUnreadQuestionsCount((c) => c + 1)
            }
            toast('info', 'Fast Answer Question Live! ⚡', 'Tap Questions tab to answer and earn Gold Coins!')
          } else if (event.type === 'question:revealed') {
            toast('info', 'Answers Revealed! 🎯', 'Check the results and live leaderboard.')
          }
        },
        onClassStarted: () => {
          setStatus('in_progress')
          toast('success', 'Class Started', 'Your tutor has started the session!')
        },
        onClassEnded: () => {
          setStatus('completed')
          setShowPostClassDialog(true)
          toast('info', 'Class Ended', 'The tutor has concluded the class session.')
        },
        onError: (err) => {
          console.error('Signaling channel error:', err)
          setConnectionState('reconnecting')
        },
      }
    )

    signalingRef.current = signaling

    try {
      await signaling.connect()
      setConnectionState('connected')

      // Record attendance join log
      recordClassroomJoinAction(session.id, currentUserName, initialRole).then((res) => {
        if (res.success && res.participantLogId) {
          participantLogIdRef.current = res.participantLogId
        }
      })
    } catch (err: any) {
      console.error('Failed to establish signaling connection:', err)
      setErrorMessage('Unable to connect to the classroom channel. Please check your internet connection.')
      setConnectionState('failed')
    }
  }, [status, session.id, userId, currentUserName, initialRole, isSidePanelOpen, sidePanelTab, toast])

  // Lifecycle trigger when status becomes in_progress
  useEffect(() => {
    if (status === 'in_progress') {
      initializeClassroom()

      // Fetch initial chat messages
      getClassroomMessagesAction(session.id).then((res) => {
        if (res.success && res.data) {
          setMessages(res.data)
        }
      })

      // Fetch initial classroom polls
      getClassroomPollsAction(session.id).then((res) => {
        if (res.success && res.data) {
          setPolls(res.data)
        }
      })

      // Fetch initial interactive questions
      getClassroomQuestionsAction(session.id).then((res) => {
        if (res.success && res.data) {
          setQuestions(res.data)
        }
      })

      // Award attendance reward if student
      if (initialRole === 'participant' && userId && !attendanceAwardedRef.current) {
        attendanceAwardedRef.current = true
        awardAttendanceRewardAction(session.id, userId).catch((err) => {
          console.warn('Attendance award error:', err)
        })
      }
    }

    return () => {
      peerPoolRef.current?.closeAll()
      signalingRef.current?.disconnect()
      stopAllTracks(localStream)
      stopAllTracks(screenStream)
      if (participantLogIdRef.current) {
        recordClassroomLeaveAction(participantLogIdRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status])

  // Polling & Realtime listening for students when waiting for tutor to start
  useEffect(() => {
    if (initialRole === 'participant' && status === 'scheduled') {
      const supabase = createClient()
      const channel = supabase
        .channel(`classroom_lobby:${session.id}`)
        .on('broadcast', { event: 'signal' }, ({ payload }) => {
          if (payload && payload.type === 'class-started') {
            setStatus('in_progress')
            toast('success', 'Class Started', 'Your tutor has started the session!')
          }
        })
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'class_sessions',
            filter: `id=eq.${session.id}`,
          },
          (payload) => {
            if (payload.new && (payload.new as any).status === 'in_progress') {
              setStatus('in_progress')
              toast('success', 'Class Started', 'Your tutor has started the session!')
            }
          }
        )
        .subscribe()

      const interval = setInterval(async () => {
        const res = await getClassroomTokenAction(session.id)
        if (res.success && res.sessionStatus === 'in_progress') {
          setStatus('in_progress')
          toast('success', 'Class Started', 'Your tutor has started the session!')
        }
      }, 3000)

      return () => {
        clearInterval(interval)
        supabase.removeChannel(channel)
      }
    }
  }, [initialRole, status, session.id, toast])

  // Media Control Actions (Camera, Mic, Screen Share)
  const toggleAudio = () => {
    if (!localStream) return
    const audioTrack = localStream.getAudioTracks()[0]
    if (audioTrack) {
      const nextMuted = audioTrack.enabled
      audioTrack.enabled = !nextMuted
      setIsAudioMuted(nextMuted)
      signalingRef.current?.updateState({ audioEnabled: !nextMuted })
    }
  }

  const toggleVideo = () => {
    if (!localStream) return
    const videoTrack = localStream.getVideoTracks()[0]
    if (videoTrack) {
      const nextMuted = videoTrack.enabled
      videoTrack.enabled = !nextMuted
      setIsVideoMuted(nextMuted)
      signalingRef.current?.updateState({ videoEnabled: !nextMuted })
    }
  }

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      stopAllTracks(screenStream)
      setScreenStream(null)
      setIsScreenSharing(false)
      const cameraTrack = localStream?.getVideoTracks()[0] || null
      await peerPoolRef.current?.replaceVideoTrack(cameraTrack)
      signalingRef.current?.updateState({ isScreenSharing: false })
    } else {
      const res = await requestScreenShare()
      if (res.cancelled) return
      if (res.error) {
        toast('error', 'Screen Share Error', res.error)
        return
      }

      const displayTrack = res.stream?.getVideoTracks()[0]
      if (displayTrack) {
        setScreenStream(res.stream)
        setIsScreenSharing(true)
        await peerPoolRef.current?.replaceVideoTrack(displayTrack)
        signalingRef.current?.updateState({ isScreenSharing: true })

        displayTrack.onended = async () => {
          setIsScreenSharing(false)
          setScreenStream(null)
          const cameraTrack = localStream?.getVideoTracks()[0] || null
          await peerPoolRef.current?.replaceVideoTrack(cameraTrack)
          signalingRef.current?.updateState({ isScreenSharing: false })
        }
      }
    }
  }

  // Remote Moderation Actions (Mute individual, Mute all)
  const handleMuteStudent = async (targetId: string) => {
    await signalingRef.current?.muteStudent(targetId)
    setSelectedTileId(null)
    toast('success', 'Student Muted', 'Sent mute signal to student.')
  }

  const handleMuteAll = async () => {
    await signalingRef.current?.muteAll()
    toast('success', 'All Students Muted', 'Sent mute signal to all students.')
  }

  // Chat handlers
  const handleChatMessageSent = async (msg: ClassroomChatMessage) => {
    setMessages((prev) => {
      const exists = prev.some((m) => m.id === msg.id)
      return exists ? prev : [...prev, msg]
    })
    await signalingRef.current?.sendChatMessage(msg)
  }

  const handleChatMessageDeleted = async (msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId))
    await signalingRef.current?.broadcastChatDelete(msgId)
  }

  // Live interaction handlers (Reactions, Hand-raising, Polls)
  const handleSendReaction = (emoji: string) => {
    signalingRef.current?.sendReaction(emoji)
    setShowReactionPicker(false)
  }

  const handleToggleRaiseHand = async () => {
    if (isHandRaised) {
      await signalingRef.current?.lowerHand()
      setIsHandRaised(false)
      toast('info', 'Hand Lowered')
    } else {
      await signalingRef.current?.raiseHand()
      setIsHandRaised(true)
      toast('success', 'Hand Raised ✋', 'Your tutor has been notified.')
    }
  }

  const handleAcknowledgeHand = async (participantId: string) => {
    await signalingRef.current?.acknowledgeHand(participantId)
    setParticipants((prev) =>
      prev.map((p) =>
        p.id === participantId
          ? { ...p, handRaised: false, handRaisedAt: undefined }
          : p
      )
    )
    setSelectedTileId(null)
    toast('success', 'Hand Acknowledged')
  }

  const handleTogglePin = (targetId: string) => {
    setPinnedParticipantId((prev) => (prev === targetId ? null : targetId))
    setSelectedTileId(null)
  }

  const handlePollCreated = async (newPoll: ClassroomPoll) => {
    setPolls((prev) => [newPoll, ...prev])
    await signalingRef.current?.sendPollBroadcast('poll:started', newPoll.id, { poll: newPoll })
  }

  const handlePollUpdated = async (pollId: string, updates: Partial<ClassroomPoll>) => {
    setPolls((prev) =>
      prev.map((p) => (p.id === pollId ? { ...p, ...updates } : p))
    )
    const eventType = updates.status === 'closed' ? 'poll:closed' : 'poll:revealed'
    await signalingRef.current?.sendPollBroadcast(eventType, pollId, updates)
  }

  const handlePollVoted = async (pollId: string, optionIndex: number) => {
    setPolls((prev) =>
      prev.map((p) => {
        if (p.id !== pollId) return p
        const voteCounts = [...(p.vote_counts || new Array(p.options.length).fill(0))]
        voteCounts[optionIndex] = (voteCounts[optionIndex] || 0) + 1
        return {
          ...p,
          total_votes: (p.total_votes || 0) + 1,
          user_voted_option: optionIndex,
          vote_counts: voteCounts,
        }
      })
    )
    await signalingRef.current?.sendPollBroadcast('poll:response', pollId, { optionIndex })
  }

  // Live Classroom Questions (Fast Answer Engine) Handlers
  const handleQuestionCreated = (newQ: ClassroomQuestionRow) => {
    setQuestions((prev) => [...prev, newQ])
  }

  const handleQuestionUpdated = (questionId: string, updates: Partial<ClassroomQuestionRow>) => {
    setQuestions((prev) =>
      prev.map((q) => (q.id === questionId ? { ...q, ...updates } : q))
    )
  }

  const handleQuestionBroadcast = async (
    type: 'question:started' | 'question:response' | 'question:closed' | 'question:revealed',
    questionId: string,
    data?: any
  ) => {
    await signalingRef.current?.sendQuestionBroadcast(type, questionId, data)
  }

  // Tutor starts the class
  const handleStartClass = async () => {
    setIsStarting(true)
    try {
      const res = await startClassSessionAction(session.id)
      if (!res.success) {
        toast('error', 'Failed to start class', res.error)
        return
      }

      try {
        const supabase = createClient()
        await supabase.channel(`classroom_lobby:${session.id}`).send({
          type: 'broadcast',
          event: 'signal',
          payload: {
            id: `${Date.now()}-start`,
            senderId: userId,
            senderName: currentUserName,
            senderRole: 'host',
            sessionId: session.id,
            type: 'class-started',
            timestamp: Date.now(),
          },
        })
      } catch (broadcastErr) {
        console.warn('Class start broadcast warning:', broadcastErr)
      }

      setStatus('in_progress')
      toast('success', 'Class Started', 'Your online session is now live!')
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Could not start class')
    } finally {
      setIsStarting(false)
    }
  }

  // Tutor ends the class
  const handleConfirmEndClass = async () => {
    setIsEnding(true)
    try {
      // 1. Non-blocking signaling broadcast with short timeout
      try {
        await Promise.race([
          signalingRef.current?.broadcastClassEnded(),
          new Promise((resolve) => setTimeout(resolve, 500)),
        ])
      } catch (broadcastErr) {
        console.warn('Signaling broadcast non-fatal warning during end class:', broadcastErr)
      }

      // 2. Authoritative server action with network timeout guard
      const endClassPromise = endClassSessionAction(session.id)
      const timeoutPromise = new Promise<{ success: boolean; error?: string }>((_, reject) =>
        setTimeout(() => reject(new Error('Server response timed out. Please check your network connection.')), 8000)
      )

      const res = await Promise.race([endClassPromise, timeoutPromise])
      if (!res.success) {
        toast('error', 'Failed to end class', res.error)
        return
      }

      // 3. Immediately release hardware device locks and stop streams
      stopAllTracks(localStream)
      stopAllTracks(screenStream)
      setLocalStream(null)
      setScreenStream(null)
      setIsScreenSharing(false)

      // 4. Safely close peer connections and signaling channel
      try {
        peerPoolRef.current?.closeAll()
      } catch (peerErr) {
        console.warn('Error closing peer connections:', peerErr)
      }

      try {
        await signalingRef.current?.disconnect()
      } catch (sigErr) {
        console.warn('Error disconnecting signaling channel:', sigErr)
      }

      // 5. Update UI state and open summary dialog
      setStatus('completed')
      setShowEndDialog(false)
      setShowPostClassDialog(true)
      toast('success', 'Class Completed', 'The session has concluded successfully.')
    } catch (err: any) {
      toast('error', 'Error', err.message || 'Could not end class')
    } finally {
      setIsEnding(false)
    }
  }

  // Student leaves class
  const handleLeaveClass = async () => {
    try {
      stopAllTracks(localStream)
      stopAllTracks(screenStream)
      setLocalStream(null)
      setScreenStream(null)
      peerPoolRef.current?.closeAll()
      await signalingRef.current?.disconnect()
    } catch (err) {
      console.warn('Error during leave cleanup:', err)
    }

    if (participantLogIdRef.current) {
      recordClassroomLeaveAction(participantLogIdRef.current).catch(console.warn)
    }

    if (status === 'completed') {
      setShowPostClassDialog(true)
    } else {
      router.push(portalType === 'student' ? '/student' : '/parent/dashboard')
    }
  }

  const backHref = portalType === 'tutor' ? '/dashboard' : portalType === 'student' ? '/student' : '/parent'
  const timeRangeDisplay = formatTimeRange(session.start_time, session.end_time)

  // Determine active screen share in room
  const activeScreenSharingPeer = participants.find((p) => p.isScreenSharing && p.id !== userId)
  const isLocalScreenSharing = isScreenSharing && screenStream

  // Remote participants list
  const remoteParticipants = participants.filter((p) => p.id !== userId)

  // Spotlight participant determination
  const spotlightParticipant = pinnedParticipantId
    ? participants.find((p) => p.id === pinnedParticipantId)
    : null

  return (
    <div className="fixed inset-0 z-50 h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden select-none">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER BAR                                                     */}
      {/* ===================================================================== */}
      <header className="h-14 sm:h-16 bg-gray-950/90 border-b border-gray-800/80 backdrop-blur-md px-3 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 shrink-0 z-30">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link
            href={backHref}
            onClick={handleLeaveClass}
            className="flex h-8 w-8 sm:h-9 sm:w-9 items-center justify-center rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors shrink-0"
            title="Leave classroom"
            aria-label="Leave classroom"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate max-w-[140px] sm:max-w-[240px]">
                {session.batch.name}
              </h1>
              {session.batch.subject && (
                <span className="text-[10px] font-semibold text-slate-300 bg-[#0f1d33] border border-[#1f3860] px-2 py-0.5 rounded-full hidden sm:inline-block">
                  {session.batch.subject}
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-[11px] text-gray-400 truncate flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {formatFriendlyDate(session.session_date)} • {timeRangeDisplay}
              </span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          {/* Network Indicator */}
          {status === 'in_progress' && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                connectionState === 'connected'
                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80'
                  : connectionState === 'reconnecting'
                  ? 'bg-amber-950/70 text-amber-400 border-amber-800/80'
                  : connectionState === 'connecting'
                  ? 'bg-[#0f1d33] text-[#55C832] border-[#1f3860]'
                  : 'bg-rose-950/70 text-rose-400 border-rose-800/80'
              }`}
              title={`Network: ${connectionState}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionState === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : connectionState === 'reconnecting'
                    ? 'bg-amber-500 animate-ping'
                    : 'bg-rose-500'
                }`}
              />
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                <span>{connectionState === 'connected' ? 'Live Mesh' : connectionState}</span>
              </span>
            </div>
          )}

          {/* Session Status Pill */}
          {status === 'in_progress' ? (
            <span className="flex items-center gap-1 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80">
              <span className="h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Live</span>
            </span>
          ) : status === 'scheduled' ? (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
              Scheduled
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-gray-800 text-gray-400">
              Completed
            </span>
          )}

          {/* Stage View Switcher (Video vs Whiteboard) */}
          {status === 'in_progress' && (
            <div className="flex items-center gap-0.5 sm:gap-1 bg-gray-900 p-0.5 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setActiveStageView('video')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStageView === 'video'
                    ? 'bg-[#55C832] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Switch to live video stage"
              >
                <Video className="h-3 w-3" />
                <span className="hidden md:inline">Video</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStageView('whiteboard')}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStageView === 'whiteboard'
                    ? 'bg-[#55C832] text-white shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Switch to digital whiteboard"
              >
                <PenTool className="h-3 w-3" />
                <span>Board</span>
              </button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-semibold bg-gray-900 hover:bg-gray-800 text-gray-300 hover:text-white border border-gray-800 cursor-pointer"
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
          >
            {isFullscreen ? (
              <Minimize className="h-3.5 w-3.5 text-[#55C832]" />
            ) : (
              <Maximize className="h-3.5 w-3.5 text-gray-400" />
            )}
          </button>

          {/* Host Start Class Action */}
          {initialRole === 'host' && status === 'scheduled' && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleStartClass}
              loading={isStarting}
              className="h-8 text-xs bg-[#55C832] hover:bg-[#318A25] text-white"
            >
              <Play className="h-3.5 w-3.5 mr-1 fill-current" />
              Start Class
            </Button>
          )}

          {/* Host End Class Action */}
          {initialRole === 'host' && status === 'in_progress' && (
            <>
              <Link
                href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`}
                target="_blank"
                className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
              >
                <ClipboardCheck className="h-3.5 w-3.5 text-emerald-400" />
                Attendance
              </Link>
              <Button
                size="sm"
                variant="danger"
                onClick={() => setShowEndDialog(true)}
                className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white"
              >
                End Class
              </Button>
            </>
          )}

          {/* Participant Leave Action */}
          {initialRole === 'participant' && status === 'in_progress' && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleLeaveClass}
              className="h-8 text-xs border-gray-700 bg-gray-800/80 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              <LogOut className="h-3.5 w-3.5 mr-1" />
              Leave
            </Button>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN BODY AREA (Dominant Stage + Cockpit / Drawer)                 */}
      {/* ===================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Stage Canvas */}
        <main className="flex-1 flex flex-col p-1.5 sm:p-3 overflow-hidden relative">
          <ClassroomReactionOverlay reactions={reactions} />

          {/* Warning Banner */}
          {mediaWarning && (
            <div className="mb-2 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{mediaWarning}</span>
              </div>
              <button
                onClick={() => setMediaWarning(null)}
                className="text-amber-400 hover:text-white p-1"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* State A: Completed */}
          {status === 'completed' ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
                <div className="h-12 w-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-white">Class Session Completed</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  This online class for <span className="text-gray-200 font-semibold">{session.batch.name}</span> has concluded.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Link
                    href={backHref}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#55C832] hover:bg-[#318A25] text-white transition-colors"
                  >
                    Return to {portalType === 'tutor' ? 'Dashboard' : portalType === 'student' ? 'Student Space' : 'Portal'}
                  </Link>
                </div>
              </div>
            </div>
          ) : status === 'scheduled' && initialRole === 'participant' ? (
            /* State B: Student Lobby */
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
                <div className="h-14 w-14 rounded-2xl bg-[#0f1d33] border border-[#1f3860] text-[#55C832] flex items-center justify-center mx-auto relative">
                  <Video className="h-7 w-7" />
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#55C832] animate-ping" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white">
                    Your tutor hasn&apos;t started the class yet
                  </h2>
                  <p className="text-xs text-gray-400">
                    The virtual classroom will automatically launch the instant your tutor starts teaching.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Batch:</span>
                    <span className="font-semibold text-gray-300">{session.batch.name}</span>
                  </div>
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-gray-500">Scheduled:</span>
                    <span className="text-gray-300 font-semibold">{formatFriendlyDate(session.session_date)} • {timeRangeDisplay}</span>
                  </div>
                </div>
                <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-gray-500">
                  <Radio className="h-3.5 w-3.5 text-[#55C832] animate-pulse" />
                  <span>Listening for tutor launch signal...</span>
                </div>
              </div>
            </div>
          ) : status === 'scheduled' && initialRole === 'host' ? (
            /* State C: Tutor Pre-Class Ready */
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
                <div className="h-14 w-14 rounded-2xl bg-[#0f1d33] border border-[#1f3860] text-[#55C832] flex items-center justify-center mx-auto">
                  <Play className="h-7 w-7 fill-current ml-1" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white">Ready to Teach?</h2>
                  <p className="text-xs text-gray-400">
                    Click &quot;Start Live Class Now&quot; to open the online room and connect waiting students.
                  </p>
                </div>
                <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Batch:</span>
                    <span className="font-semibold text-gray-300">{session.batch.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Mode:</span>
                    <span className="text-slate-300 font-semibold capitalize">{session.class_mode}</span>
                  </div>
                </div>
                <Button
                  variant="primary"
                  onClick={handleStartClass}
                  loading={isStarting}
                  className="w-full bg-[#55C832] hover:bg-[#318A25] text-white shadow-md font-semibold text-sm py-2.5"
                >
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  Start Live Class Now
                </Button>
              </div>
            </div>
          ) : activeStageView === 'whiteboard' ? (
            /* State D1: Digital Whiteboard Stage */
            <div className="flex-1 flex flex-col overflow-hidden relative w-full h-full rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
              {/* Whiteboard Canvas */}
              <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
                <DigitalWhiteboard
                  sessionId={session.id}
                  portalType={portalType}
                  currentUserId={userId}
                  currentUserName={currentUserName}
                />
              </div>

              {/* Compact Bottom Participant Strip for Whiteboard */}
              <div className="h-22 sm:h-26 border-t border-gray-800/80 bg-gray-950/95 p-1.5 sm:p-2 overflow-x-auto flex items-center gap-2 shrink-0 z-10 backdrop-blur-md">
                {/* Local user tile */}
                <ParticipantTile
                  participantId={userId}
                  name={currentUserName}
                  role={initialRole}
                  isLocal={true}
                  stream={localStream}
                  isAudioMuted={isAudioMuted}
                  isVideoMuted={isVideoMuted}
                  isScreenSharing={isScreenSharing}
                  connectionState="connected"
                  handRaised={isHandRaised}
                  isPinned={pinnedParticipantId === userId}
                  compact={true}
                  isSelected={selectedTileId === userId}
                  onSelect={() => setSelectedTileId(selectedTileId === userId ? null : userId)}
                  onPin={() => handleTogglePin(userId)}
                />

                {/* Remote participant tiles */}
                {remoteParticipants.map((p) => {
                  const remoteStream = remoteStreams.get(p.id)
                  return (
                    <ParticipantTile
                      key={p.id}
                      participantId={p.id}
                      name={p.name}
                      role={p.role}
                      isLocal={false}
                      stream={remoteStream}
                      isAudioMuted={p.isAudioMuted}
                      isVideoMuted={p.isVideoMuted}
                      isScreenSharing={p.isScreenSharing}
                      connectionState={p.connectionState}
                      handRaised={p.handRaised}
                      isPinned={pinnedParticipantId === p.id}
                      compact={true}
                      canModerate={initialRole === 'host' && p.role !== 'host'}
                      isSelected={selectedTileId === p.id}
                      onSelect={() => setSelectedTileId(selectedTileId === p.id ? null : p.id)}
                      onPin={() => handleTogglePin(p.id)}
                      onMute={() => handleMuteStudent(p.id)}
                      onAcknowledgeHand={() => handleAcknowledgeHand(p.id)}
                    />
                  )
                })}
              </div>
            </div>
          ) : (
            /* State D2: Live Video Classroom Stage (Landscape / Portrait Optimized) */
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
              {/* Screen Share or Pinned Spotlight View */}
              {(isLocalScreenSharing || activeScreenSharingPeer || spotlightParticipant) ? (
                <div className="flex-1 min-h-[220px] rounded-2xl overflow-hidden bg-black border border-[#55C832]/40 relative shadow-2xl flex items-center justify-center">
                  {isLocalScreenSharing || activeScreenSharingPeer ? (
                    <video
                      ref={(el) => {
                        if (el) {
                          if (isLocalScreenSharing && screenStream) {
                            el.srcObject = screenStream
                          } else if (activeScreenSharingPeer) {
                            const remote = remoteStreams.get(activeScreenSharingPeer.id)
                            el.srcObject = remote || null
                          }
                        }
                      }}
                      autoPlay
                      playsInline
                      muted={Boolean(isLocalScreenSharing)}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    <div className="w-full h-full">
                      {spotlightParticipant?.id === userId ? (
                        <ParticipantTile
                          participantId={userId}
                          name={currentUserName}
                          role={initialRole}
                          isLocal={true}
                          stream={localStream}
                          isAudioMuted={isAudioMuted}
                          isVideoMuted={isVideoMuted}
                          isScreenSharing={isScreenSharing}
                          connectionState="connected"
                          handRaised={isHandRaised}
                          isPinned={true}
                          onPin={() => setPinnedParticipantId(null)}
                        />
                      ) : (
                        <ParticipantTile
                          participantId={spotlightParticipant!.id}
                          name={spotlightParticipant!.name}
                          role={spotlightParticipant!.role}
                          isLocal={false}
                          stream={remoteStreams.get(spotlightParticipant!.id)}
                          isAudioMuted={spotlightParticipant!.isAudioMuted}
                          isVideoMuted={spotlightParticipant!.isVideoMuted}
                          isScreenSharing={spotlightParticipant!.isScreenSharing}
                          connectionState={spotlightParticipant!.connectionState}
                          handRaised={spotlightParticipant!.handRaised}
                          isPinned={true}
                          canModerate={initialRole === 'host' && spotlightParticipant!.role !== 'host'}
                          onPin={() => setPinnedParticipantId(null)}
                          onMute={() => handleMuteStudent(spotlightParticipant!.id)}
                          onAcknowledgeHand={() => handleAcknowledgeHand(spotlightParticipant!.id)}
                        />
                      )}
                    </div>
                  )}

                  <div className="absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#0f1d33]/90 text-slate-200 border border-[#1f3860] backdrop-blur-md flex items-center gap-1.5 z-10">
                    <Share2 className="h-3.5 w-3.5 text-[#55C832]" />
                    <span>
                      {isLocalScreenSharing
                        ? 'You are presenting screen'
                        : activeScreenSharingPeer
                        ? `${activeScreenSharingPeer.name} is presenting screen`
                        : `${spotlightParticipant?.name || 'Spotlight'} (Pinned)`}
                    </span>
                  </div>
                </div>
              ) : (
                /* Grid View (Adaptive 1, 2, 3, 4+) */
                <div
                  className={`flex-1 grid gap-2 overflow-y-auto p-0.5 ${
                    remoteParticipants.length === 0
                      ? 'grid-cols-1'
                      : remoteParticipants.length === 1
                      ? 'grid-cols-1 md:grid-cols-2'
                      : remoteParticipants.length <= 3
                      ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
                      : 'grid-cols-2 sm:grid-cols-3'
                  }`}
                >
                  {/* Local User */}
                  <ParticipantTile
                    participantId={userId}
                    name={currentUserName}
                    role={initialRole}
                    isLocal={true}
                    stream={localStream}
                    isAudioMuted={isAudioMuted}
                    isVideoMuted={isVideoMuted}
                    isScreenSharing={isScreenSharing}
                    connectionState="connected"
                    handRaised={isHandRaised}
                    isPinned={pinnedParticipantId === userId}
                    onPin={() => handleTogglePin(userId)}
                  />

                  {/* Remote Participants */}
                  {remoteParticipants.map((p) => {
                    const remoteStream = remoteStreams.get(p.id)
                    return (
                      <ParticipantTile
                        key={p.id}
                        participantId={p.id}
                        name={p.name}
                        role={p.role}
                        isLocal={false}
                        stream={remoteStream}
                        isAudioMuted={p.isAudioMuted}
                        isVideoMuted={p.isVideoMuted}
                        isScreenSharing={p.isScreenSharing}
                        connectionState={p.connectionState}
                        handRaised={p.handRaised}
                        isPinned={pinnedParticipantId === p.id}
                        canModerate={initialRole === 'host' && p.role !== 'host'}
                        onPin={() => handleTogglePin(p.id)}
                        onMute={() => handleMuteStudent(p.id)}
                        onAcknowledgeHand={() => handleAcknowledgeHand(p.id)}
                      />
                    )
                  })}
                </div>
              )}

              {/* Horizontal Participant Strip when in Screen Share or Spotlight Mode */}
              {(isLocalScreenSharing || activeScreenSharingPeer || spotlightParticipant) && (
                <div className="h-22 sm:h-26 border-t border-gray-800/80 bg-gray-950/95 p-1.5 sm:p-2 overflow-x-auto flex items-center gap-2 shrink-0 z-10 backdrop-blur-md">
                  <ParticipantTile
                    participantId={userId}
                    name={currentUserName}
                    role={initialRole}
                    isLocal={true}
                    stream={localStream}
                    isAudioMuted={isAudioMuted}
                    isVideoMuted={isVideoMuted}
                    isScreenSharing={isScreenSharing}
                    connectionState="connected"
                    handRaised={isHandRaised}
                    isPinned={pinnedParticipantId === userId}
                    compact={true}
                    isSelected={selectedTileId === userId}
                    onSelect={() => setSelectedTileId(selectedTileId === userId ? null : userId)}
                    onPin={() => handleTogglePin(userId)}
                  />
                  {remoteParticipants.map((p) => {
                    const remoteStream = remoteStreams.get(p.id)
                    return (
                      <ParticipantTile
                        key={p.id}
                        participantId={p.id}
                        name={p.name}
                        role={p.role}
                        isLocal={false}
                        stream={remoteStream}
                        isAudioMuted={p.isAudioMuted}
                        isVideoMuted={p.isVideoMuted}
                        isScreenSharing={p.isScreenSharing}
                        connectionState={p.connectionState}
                        handRaised={p.handRaised}
                        isPinned={pinnedParticipantId === p.id}
                        compact={true}
                        canModerate={initialRole === 'host' && p.role !== 'host'}
                        isSelected={selectedTileId === p.id}
                        onSelect={() => setSelectedTileId(selectedTileId === p.id ? null : p.id)}
                        onPin={() => handleTogglePin(p.id)}
                        onMute={() => handleMuteStudent(p.id)}
                        onAcknowledgeHand={() => handleAcknowledgeHand(p.id)}
                      />
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </main>

        {/* =================================================================== */}
        {/* 3. TUTOR TEACHING COCKPIT RAIL (Landscape / Quick Access)           */}
        {/* =================================================================== */}
        {initialRole === 'host' && status === 'in_progress' && (
          <aside className="hidden landscape:flex md:flex flex-col w-14 bg-gray-950 border-l border-gray-800/80 items-center py-2 gap-2 shrink-0 z-20">
            {/* Whiteboard Switch */}
            <button
              type="button"
              onClick={() => setActiveStageView(activeStageView === 'whiteboard' ? 'video' : 'whiteboard')}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                activeStageView === 'whiteboard'
                  ? 'bg-[#55C832] text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={activeStageView === 'whiteboard' ? 'Video Grid' : 'Whiteboard'}
            >
              <PenTool className="h-5 w-5" />
            </button>

            {/* Screen Share */}
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <Share2 className="h-5 w-5" />
            </button>

            <div className="w-8 h-[1px] bg-gray-800 my-0.5" />

            {/* Quiz Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isSidePanelOpen && sidePanelTab === 'questions') {
                  setIsSidePanelOpen(false)
                } else {
                  setIsSidePanelOpen(true)
                  setSidePanelTab('questions')
                  setUnreadQuestionsCount(0)
                }
              }}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                isSidePanelOpen && sidePanelTab === 'questions'
                  ? 'bg-emerald-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Fast Answer Quiz"
            >
              <Zap className="h-5 w-5 text-emerald-400" />
              {unreadQuestionsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadQuestionsCount}
                </span>
              )}
            </button>

            {/* Polls Toggle */}
            <button
              type="button"
              onClick={() => {
                if (isSidePanelOpen && sidePanelTab === 'polls') {
                  setIsSidePanelOpen(false)
                } else {
                  setIsSidePanelOpen(true)
                  setSidePanelTab('polls')
                  setUnreadPollsCount(0)
                }
              }}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                isSidePanelOpen && sidePanelTab === 'polls'
                  ? 'bg-[#55C832] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Polls"
            >
              <BarChart2 className="h-5 w-5" />
              {unreadPollsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadPollsCount}
                </span>
              )}
            </button>

            {/* Leaderboard Rank */}
            <button
              type="button"
              onClick={() => {
                if (isSidePanelOpen && sidePanelTab === 'ranking') {
                  setIsSidePanelOpen(false)
                } else {
                  setIsSidePanelOpen(true)
                  setSidePanelTab('ranking')
                }
              }}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer ${
                isSidePanelOpen && sidePanelTab === 'ranking'
                  ? 'bg-amber-600 text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Leaderboard Ranking"
            >
              <Trophy className="h-5 w-5 text-amber-400" />
            </button>

            {/* People / Students Panel */}
            <button
              type="button"
              onClick={() => {
                if (isSidePanelOpen && sidePanelTab === 'participants') {
                  setIsSidePanelOpen(false)
                } else {
                  setIsSidePanelOpen(true)
                  setSidePanelTab('participants')
                }
              }}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                isSidePanelOpen && sidePanelTab === 'participants'
                  ? 'bg-[#55C832] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Students & People"
            >
              <Users className="h-5 w-5" />
              <span className="absolute -bottom-1 -right-1 px-1 rounded-full bg-gray-800 border border-gray-700 text-white text-[8px] font-bold">
                {participants.length}
              </span>
            </button>

            {/* Chat Panel */}
            <button
              type="button"
              onClick={() => {
                if (isSidePanelOpen && sidePanelTab === 'chat') {
                  setIsSidePanelOpen(false)
                } else {
                  setIsSidePanelOpen(true)
                  setSidePanelTab('chat')
                  setUnreadCount(0)
                }
              }}
              className={`h-10 w-10 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${
                isSidePanelOpen && sidePanelTab === 'chat'
                  ? 'bg-[#55C832] text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              title="Chat Messages"
            >
              <MessageSquare className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </button>
          </aside>
        )}

        {/* =================================================================== */}
        {/* 4. COLLAPSIBLE SIDE DRAWER (People, Chat, Quiz, Polls, Rank)       */}
        {/* =================================================================== */}
        {isSidePanelOpen && status === 'in_progress' && (
          <aside className="w-80 sm:w-88 border-l border-gray-800/80 bg-gray-950 flex flex-col shrink-0 z-30 shadow-2xl animate-fade-in absolute sm:relative right-0 top-0 bottom-0">
            {/* Drawer Tabs Header */}
            <div className="h-12 border-b border-gray-800 px-3 flex items-center justify-between gap-1 overflow-x-auto">
              <div className="flex items-center gap-1 bg-gray-900 p-0.5 rounded-xl border border-gray-800 shrink-0">
                <button
                  type="button"
                  onClick={() => setSidePanelTab('participants')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    sidePanelTab === 'participants'
                      ? 'bg-[#55C832] text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  People ({participants.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidePanelTab('questions')
                    setUnreadQuestionsCount(0)
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                    sidePanelTab === 'questions'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Zap className="h-3 w-3 text-emerald-400" />
                    <span>Quiz</span>
                  </span>
                  {unreadQuestionsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-emerald-500 text-white font-bold">
                      {unreadQuestionsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setSidePanelTab('ranking')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                    sidePanelTab === 'ranking'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3 text-amber-400" />
                    <span>Rank</span>
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidePanelTab('chat')
                    setUnreadCount(0)
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                    sidePanelTab === 'chat'
                      ? 'bg-[#55C832] text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Chat
                  {unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold">
                      {unreadCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSidePanelTab('polls')
                    setUnreadPollsCount(0)
                  }}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer relative ${
                    sidePanelTab === 'polls'
                      ? 'bg-[#55C832] text-white shadow-xs'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Polls
                  {unreadPollsCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[9px] bg-rose-500 text-white font-bold">
                      {unreadPollsCount}
                    </span>
                  )}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsSidePanelOpen(false)}
                className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center cursor-pointer shrink-0"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* TAB 1: PEOPLE (With Mute All button for Host) */}
            {sidePanelTab === 'participants' && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                {/* Host Moderation Header: Mute All Students */}
                {initialRole === 'host' && remoteParticipants.length > 0 && (
                  <div className="p-2.5 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-white">Classroom Audio Control</p>
                      <p className="text-[10px] text-gray-400">Manage audio for all enrolled students</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleMuteAll}
                      className="px-2.5 py-1.5 rounded-xl bg-rose-950/80 border border-rose-800/80 hover:bg-rose-900 text-rose-300 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <VolumeX className="h-3.5 w-3.5 text-rose-400" />
                      <span>Mute All</span>
                    </button>
                  </div>
                )}

                {/* Local user row */}
                <div className="p-2.5 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-[#55C832] text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUserName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{currentUserName}</span>
                        <span className="text-[10px] text-[#55C832] font-normal">(You)</span>
                        {isHandRaised && (
                          <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold animate-pulse">
                            ✋ Raised
                          </span>
                        )}
                      </p>
                      <span className="text-[10px] text-gray-400 capitalize">{initialRole}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {isAudioMuted ? (
                      <MicOff className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <Mic className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                    {isVideoMuted ? (
                      <VideoOff className="h-3.5 w-3.5 text-rose-400" />
                    ) : (
                      <Video className="h-3.5 w-3.5 text-emerald-400" />
                    )}
                  </div>
                </div>

                {/* Remote participants list */}
                {remoteParticipants.map((p) => (
                  <div
                    key={p.id}
                    className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-colors ${
                      p.handRaised
                        ? 'bg-amber-950/30 border-amber-800/80 shadow-xs'
                        : 'bg-gray-900/50 border-gray-800/80'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`h-8 w-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                          p.handRaised ? 'bg-amber-600 text-black' : 'bg-gray-800 text-gray-300'
                        }`}
                      >
                        {p.handRaised ? '✋' : p.name[0]?.toUpperCase() || 'P'}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-semibold text-gray-200 truncate">{p.name}</p>
                          {p.handRaised && (
                            <span className="px-1.5 py-0.2 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 text-[9px] font-bold animate-pulse">
                              Raised
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-gray-500 capitalize">{p.role}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {/* Host Hand Ack */}
                      {p.handRaised && initialRole === 'host' && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledgeHand(p.id)}
                          className="px-2 py-1 rounded-lg bg-[#55C832] hover:bg-[#318A25] text-white text-[10px] font-semibold transition-colors flex items-center gap-1 mr-1 shadow-xs cursor-pointer"
                          title="Acknowledge student's raised hand"
                        >
                          <Check className="h-3 w-3" />
                          <span>Ack</span>
                        </button>
                      )}

                      {/* Host Direct Student Mute */}
                      {initialRole === 'host' && !p.isAudioMuted && (
                        <button
                          type="button"
                          onClick={() => handleMuteStudent(p.id)}
                          className="p-1 rounded-lg bg-gray-800 hover:bg-rose-950/80 text-gray-400 hover:text-rose-400 border border-gray-700 hover:border-rose-800 transition-colors"
                          title="Mute student"
                        >
                          <VolumeX className="h-3.5 w-3.5" />
                        </button>
                      )}

                      {p.isAudioMuted ? (
                        <MicOff className="h-3.5 w-3.5 text-rose-400 ml-1" />
                      ) : (
                        <Mic className="h-3.5 w-3.5 text-emerald-400 ml-1" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TAB 2: IN-SESSION CHAT */}
            {sidePanelTab === 'chat' && (
              <ClassroomChatPanel
                sessionId={session.id}
                currentUserId={userId}
                isTutor={initialRole === 'host'}
                sessionStatus={status}
                messages={messages}
                onSendMessage={handleChatMessageSent}
                onDeleteMessage={handleChatMessageDeleted}
              />
            )}

            {/* TAB 3: LIVE CLASSROOM POLLS */}
            {sidePanelTab === 'polls' && (
              <ClassroomPollsPanel
                sessionId={session.id}
                isTutor={initialRole === 'host'}
                sessionStatus={status}
                polls={polls}
                onPollCreated={handlePollCreated}
                onPollUpdated={handlePollUpdated}
                onPollVoted={handlePollVoted}
              />
            )}

            {/* TAB 4: LIVE QUESTIONS (FAST ANSWER ENGINE) */}
            {sidePanelTab === 'questions' && (
              <ClassroomQuestionsPanel
                sessionId={session.id}
                isTutor={initialRole === 'host'}
                sessionStatus={status}
                questions={questions}
                onQuestionCreated={handleQuestionCreated}
                onQuestionUpdated={handleQuestionUpdated}
                onQuestionBroadcast={handleQuestionBroadcast}
                currentUserId={userId}
              />
            )}

            {/* TAB 5: LIVE LEADERBOARD & RANKING */}
            {sidePanelTab === 'ranking' && (
              <ClassroomRankingPanel
                sessionId={session.id}
                isTutor={initialRole === 'host'}
                questions={questions}
                currentUserId={userId}
                participants={participants}
              />
            )}
          </aside>
        )}
      </div>

      {/* ===================================================================== */}
      {/* 5. BOTTOM ACTION CONTROL BAR (Touch-Friendly 44px+ targets)           */}
      {/* ===================================================================== */}
      {status === 'in_progress' && (
        <footer className="h-14 sm:h-16 bg-gray-950/95 border-t border-gray-800/80 backdrop-blur-md px-2 sm:px-4 flex items-center justify-center gap-1.5 sm:gap-3 shrink-0 z-30 overflow-x-auto">
          {/* Microphone Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer shrink-0 ${
              isAudioMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isAudioMuted ? <MicOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Mic className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer shrink-0 ${
              isVideoMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={isVideoMuted ? 'Turn video on' : 'Turn video off'}
          >
            {isVideoMuted ? <VideoOff className="h-4.5 w-4.5 sm:h-5 sm:w-5" /> : <Video className="h-4.5 w-4.5 sm:h-5 sm:w-5" />}
          </button>

          {/* Screen Share Toggle (Tutor Host) */}
          {initialRole === 'host' && (
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer shrink-0 ${
                isScreenSharing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
            >
              <Share2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          )}

          {/* Whiteboard Toggle */}
          <button
            type="button"
            onClick={() => {
              setActiveStageView(activeStageView === 'whiteboard' ? 'video' : 'whiteboard')
            }}
            className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer shrink-0 ${
              activeStageView === 'whiteboard'
                ? 'bg-[#55C832] text-white shadow-lg ring-2 ring-[#55C832]'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={activeStageView === 'whiteboard' ? 'Return to Video Grid' : 'Open Digital Whiteboard'}
          >
            <PenTool className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </button>

          {/* Raise Hand Toggle (Student Participant Only) */}
          {initialRole === 'participant' && (
            <button
              type="button"
              onClick={handleToggleRaiseHand}
              className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer shrink-0 ${
                isHandRaised
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg ring-2 ring-amber-300 animate-pulse'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
              title={isHandRaised ? 'Lower your hand' : 'Raise hand (✋)'}
            >
              <Hand className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>
          )}

          {/* Reaction Picker Popover */}
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowReactionPicker((v) => !v)}
              className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer ${
                showReactionPicker
                  ? 'bg-[#55C832] text-white shadow-lg ring-2 ring-[#55C832]'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
              title="Send live reaction"
            >
              <Smile className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            </button>

            {showReactionPicker && (
              <div className="absolute bottom-14 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-gray-800 rounded-2xl p-1.5 shadow-2xl backdrop-blur-md flex items-center gap-1 z-50 animate-fade-in">
                {['👍', '👏', '❤️', '😊', '❓', '🎉'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReaction(emoji)}
                    className="h-9 w-9 text-lg rounded-xl hover:bg-gray-800 flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Questions (Quiz) Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSidePanelOpen && sidePanelTab === 'questions') {
                setIsSidePanelOpen(false)
              } else {
                setIsSidePanelOpen(true)
                setSidePanelTab('questions')
                setUnreadQuestionsCount(0)
              }
            }}
            className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer relative shrink-0 ${
              isSidePanelOpen && sidePanelTab === 'questions'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="Fast Answer Questions"
          >
            <Zap className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-emerald-400" />
            {unreadQuestionsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-emerald-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-gray-950">
                {unreadQuestionsCount}
              </span>
            )}
          </button>

          {/* Ranking Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSidePanelOpen && sidePanelTab === 'ranking') {
                setIsSidePanelOpen(false)
              } else {
                setIsSidePanelOpen(true)
                setSidePanelTab('ranking')
              }
            }}
            className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer relative shrink-0 ${
              isSidePanelOpen && sidePanelTab === 'ranking'
                ? 'bg-amber-600 text-white shadow-lg ring-2 ring-amber-400'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="Classroom Ranking Leaderboard"
          >
            <Trophy className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-amber-400" />
          </button>

          {/* Polls Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSidePanelOpen && sidePanelTab === 'polls') {
                setIsSidePanelOpen(false)
              } else {
                setIsSidePanelOpen(true)
                setSidePanelTab('polls')
                setUnreadPollsCount(0)
              }
            }}
            className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer relative shrink-0 ${
              isSidePanelOpen && sidePanelTab === 'polls'
                ? 'bg-[#55C832] text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="Classroom Polls"
          >
            <BarChart2 className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            {unreadPollsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-gray-950">
                {unreadPollsCount}
              </span>
            )}
          </button>

          {/* People / Participants Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSidePanelOpen && sidePanelTab === 'participants') {
                setIsSidePanelOpen(false)
              } else {
                setIsSidePanelOpen(true)
                setSidePanelTab('participants')
              }
            }}
            className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer relative shrink-0 ${
              isSidePanelOpen && sidePanelTab === 'participants'
                ? 'bg-[#55C832] text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="View participants"
          >
            <Users className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            <span className="text-[8px] font-bold mt-0.5">{participants.length}</span>
          </button>

          {/* Chat Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSidePanelOpen && sidePanelTab === 'chat') {
                setIsSidePanelOpen(false)
              } else {
                setIsSidePanelOpen(true)
                setSidePanelTab('chat')
                setUnreadCount(0)
              }
            }}
            className={`flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl transition-all cursor-pointer relative shrink-0 ${
              isSidePanelOpen && sidePanelTab === 'chat'
                ? 'bg-[#55C832] text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="Classroom chat"
          >
            <MessageSquare className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4.5 w-4.5 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-gray-950">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Leave / End Class Button */}
          <button
            type="button"
            onClick={initialRole === 'host' ? () => setShowEndDialog(true) : handleLeaveClass}
            className="flex flex-col items-center justify-center h-10 w-10 sm:h-12 sm:w-13 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-lg cursor-pointer shrink-0 ml-1"
            title={initialRole === 'host' ? 'End class for all' : 'Leave classroom'}
          >
            <LogOut className="h-4.5 w-4.5 sm:h-5 sm:w-5" />
          </button>
        </footer>
      )}

      {/* Confirmation Dialog for Tutor Ending Class */}
      {showEndDialog && (
        <EndClassDialog
          isOpen={showEndDialog}
          isEnding={isEnding}
          batchName={session.batch.name}
          onClose={() => setShowEndDialog(false)}
          onConfirm={handleConfirmEndClass}
        />
      )}

      {/* Post-Class Celebration & Summary Dialog */}
      <PostClassResultsDialog
        isOpen={showPostClassDialog}
        onClose={() => {
          setShowPostClassDialog(false)
          if (initialRole === 'host') {
            router.push(`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`)
          } else {
            router.push(portalType === 'student' ? '/student' : '/parent/dashboard')
          }
        }}
        isTutor={initialRole === 'host'}
        batchName={session.batch.name}
        sessionId={session.id}
        batchId={session.batch_id}
        sessionDate={session.session_date}
      />
    </div>
  )
}
