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
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/contexts/toast-context'
import { formatTimeRange } from '@/lib/scheduling'
import { DigitalWhiteboard } from '@/components/whiteboard/digital-whiteboard'
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
 * Individual participant video tile with stream attachment, camera-off avatar fallback,
 * role badge, audio indicator, and live connection status.
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

  const initials = name
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'P'

  const hasActiveVideo = Boolean(stream && stream.getVideoTracks().length > 0 && !isVideoMuted)

  return (
    <div className="relative w-full h-full min-h-[180px] sm:min-h-[220px] rounded-2xl overflow-hidden bg-gray-900 border border-gray-800/90 flex items-center justify-center shadow-lg group">
      {/* 1. Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal} // Always mute local video element to avoid self-echo
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          hasActiveVideo ? 'opacity-100' : 'opacity-0 pointer-events-none'
        } ${isLocal && !isScreenSharing ? '-scale-x-100' : ''}`}
      />

      {/* 2. Fallback Avatar (when video is muted or absent) */}
      {!hasActiveVideo && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900">
          <div className="h-16 w-16 sm:h-20 sm:w-20 rounded-2xl bg-gradient-to-tr from-indigo-700 to-teal-500 flex items-center justify-center text-white text-xl sm:text-2xl font-bold shadow-xl ring-2 ring-white/10">
            {initials}
          </div>
          <p className="mt-3 text-xs sm:text-sm font-semibold text-gray-200 truncate max-w-[80%]">
            {name}
          </p>
          <span className="text-[10px] text-gray-500 capitalize">{role}</span>
        </div>
      )}

      {/* 3. Top Status Pill (Screen share / Local indicator) */}
      <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
        {isLocal && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/60 text-indigo-300 backdrop-blur-md border border-white/10">
            You
          </span>
        )}
        {isScreenSharing && (
          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-400 backdrop-blur-md border border-emerald-800/80 flex items-center gap-1">
            <Share2 className="h-2.5 w-2.5" />
            Screen
          </span>
        )}
      </div>

      {/* 4. Bottom Info Overlay */}
      <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2 z-10">
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-white min-w-0">
          <span className="text-xs font-semibold truncate max-w-[130px] sm:max-w-[180px]">
            {name}
          </span>
          <span
            className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md ${
              role === 'host'
                ? 'bg-indigo-600/80 text-white'
                : 'bg-gray-800/80 text-gray-300'
            }`}
          >
            {role === 'host' ? 'Tutor' : 'Student'}
          </span>
        </div>

        {/* Audio Mute Icon */}
        <div
          className={`h-7 w-7 rounded-xl flex items-center justify-center backdrop-blur-md transition-colors ${
            isAudioMuted
              ? 'bg-rose-950/90 text-rose-400 border border-rose-800/80'
              : 'bg-black/60 text-emerald-400 border border-white/10'
          }`}
          title={isAudioMuted ? 'Microphone muted' : 'Microphone active'}
          aria-label={isAudioMuted ? 'Microphone muted' : 'Microphone active'}
        >
          {isAudioMuted ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
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
          // Initiate peer connection with all discovered participants
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
            // Update remote participant state
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
      // Teardown connections on unmount or status change
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

  // Polling for students when waiting for tutor to start
  useEffect(() => {
    if (initialRole === 'participant' && status === 'scheduled') {
      const interval = setInterval(async () => {
        const res = await getClassroomTokenAction(session.id)
        if (res.success && res.sessionStatus === 'in_progress') {
          setStatus('in_progress')
          toast('success', 'Class Started', 'Your tutor has started the session!')
        }
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [initialRole, status, session.id, toast])

  // =========================================================================
  // Media Control Actions (Camera, Mic, Screen Share)
  // =========================================================================
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
      // Stop screen sharing -> restore camera track
      stopAllTracks(screenStream)
      setScreenStream(null)
      setIsScreenSharing(false)
      const cameraTrack = localStream?.getVideoTracks()[0] || null
      await peerPoolRef.current?.replaceVideoTrack(cameraTrack)
      signalingRef.current?.updateState({ isScreenSharing: false })
    } else {
      // Start screen sharing
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

        // Handle native browser "Stop Sharing" button
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
    toast('success', 'Hand Acknowledged')
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
      await signalingRef.current?.broadcastClassEnded()
      const res = await endClassSessionAction(session.id)
      if (!res.success) {
        toast('error', 'Failed to end class', res.error)
        return
      }
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
    peerPoolRef.current?.closeAll()
    await signalingRef.current?.disconnect()
    stopAllTracks(localStream)
    stopAllTracks(screenStream)
    if (participantLogIdRef.current) {
      await recordClassroomLeaveAction(participantLogIdRef.current)
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

  return (
    <div className="h-screen w-screen bg-gray-950 text-white flex flex-col overflow-hidden select-none">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER BAR                                                     */}
      {/* ===================================================================== */}
      <header className="h-16 bg-gray-950/90 border-b border-gray-800/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between gap-3 shrink-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            href={backHref}
            onClick={handleLeaveClass}
            className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
            title="Leave classroom"
            aria-label="Leave classroom"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xs sm:text-sm font-bold text-white truncate">
                {session.batch.name}
              </h1>
              {session.batch.subject && (
                <span className="text-[10px] font-semibold text-indigo-300 bg-indigo-950/80 border border-indigo-800/60 px-2 py-0.5 rounded-full hidden sm:inline-block">
                  {session.batch.subject}
                </span>
              )}
            </div>
            <p className="text-[11px] text-gray-400 truncate flex items-center gap-1.5">
              <Clock className="h-3 w-3 shrink-0" />
              <span>
                {session.session_date} • {timeRangeDisplay}
              </span>
            </p>
          </div>
        </div>

        {/* Status Indicators & Control Buttons */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Network Quality Indicator Pill */}
          {status === 'in_progress' && (
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${
                connectionState === 'connected'
                  ? 'bg-emerald-950/70 text-emerald-400 border-emerald-800/80 shadow-xs'
                  : connectionState === 'reconnecting'
                  ? 'bg-amber-950/70 text-amber-400 border-amber-800/80'
                  : connectionState === 'connecting'
                  ? 'bg-blue-950/70 text-blue-400 border-blue-800/80'
                  : 'bg-rose-950/70 text-rose-400 border-rose-800/80'
              }`}
              title={`Network Quality: ${
                connectionState === 'connected'
                  ? 'Excellent (WebRTC Peer Mesh Active)'
                  : connectionState === 'reconnecting'
                  ? 'Unstable Network (Reconnecting...)'
                  : connectionState === 'connecting'
                  ? 'Connecting to classroom server...'
                  : 'Poor/Disconnected'
              }`}
            >
              <span
                className={`h-2 w-2 rounded-full ${
                  connectionState === 'connected'
                    ? 'bg-emerald-500 animate-pulse'
                    : connectionState === 'reconnecting'
                    ? 'bg-amber-500 animate-ping'
                    : connectionState === 'connecting'
                    ? 'bg-blue-400 animate-pulse'
                    : 'bg-rose-500'
                }`}
              />
              <span className="flex items-center gap-1">
                <Wifi className="h-3 w-3" />
                <span>
                  {connectionState === 'connected'
                    ? 'Excellent'
                    : connectionState === 'reconnecting'
                    ? 'Unstable'
                    : connectionState === 'connecting'
                    ? 'Connecting'
                    : 'Poor'}
                </span>
              </span>
            </div>
          )}

          {/* Session Status Pill */}
          {status === 'in_progress' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-950/80 text-rose-400 border border-rose-800/80 shadow-xs">
              <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Live Class</span>
            </span>
          ) : status === 'scheduled' ? (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-950/80 text-amber-400 border border-amber-800/80">
              Scheduled
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-gray-800 text-gray-400 border border-gray-700">
              Completed
            </span>
          )}

          {/* Stage View Switcher (Video Grid vs Whiteboard) */}
          {status === 'in_progress' && (
            <div className="flex items-center gap-1 bg-gray-900 p-0.5 rounded-xl border border-gray-800">
              <button
                type="button"
                onClick={() => setActiveStageView('video')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStageView === 'video'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Switch to full video grid"
              >
                <Video className="h-3 w-3" />
                <span className="hidden sm:inline">Video</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveStageView('whiteboard')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  activeStageView === 'whiteboard'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-gray-400 hover:text-white'
                }`}
                title="Switch to digital whiteboard"
              >
                <PenTool className="h-3 w-3" />
                <span>Whiteboard</span>
              </button>
            </div>
          )}

          {/* Host Start Class Action */}
          {initialRole === 'host' && status === 'scheduled' && (
            <Button
              size="sm"
              variant="primary"
              onClick={handleStartClass}
              loading={isStarting}
              className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500 text-white shadow-xs"
            >
              <Play className="h-3.5 w-3.5 mr-1.5 fill-current" />
              Start Class
            </Button>
          )}

          {/* Host End Class Action */}
          {initialRole === 'host' && status === 'in_progress' && (
            <>
              <Link
                href={`/dashboard/attendance?batchId=${session.batch_id}&date=${session.session_date}&sessionId=${session.id}`}
                target="_blank"
                className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700 transition-colors"
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
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              Leave
            </Button>
          )}
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN BODY AREA (Video Stage + Drawer)                              */}
      {/* ===================================================================== */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Main Stage Canvas */}
        <main className="flex-1 flex flex-col p-2 sm:p-4 overflow-hidden relative">
          {/* Phase 5: Floating Reactions Overlay */}
          <ClassroomReactionOverlay reactions={reactions} />
          {/* Media Permission Warning Banner */}
          {mediaWarning && (
            <div className="mb-2 px-3 py-2 rounded-xl bg-amber-950/80 border border-amber-800/80 text-amber-300 text-xs flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />
                <span>{mediaWarning}</span>
              </div>
              <button
                onClick={() => setMediaWarning(null)}
                className="text-amber-400 hover:text-white p-1"
                aria-label="Dismiss warning"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* State A: Session Completed */}
          {status === 'completed' ? (
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
                <div className="h-12 w-12 rounded-2xl bg-emerald-950/80 border border-emerald-800/80 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <h2 className="text-base font-bold text-white">Class Session Completed</h2>
                <p className="text-xs text-gray-400 leading-relaxed">
                  This online class for <span className="text-gray-200 font-semibold">{session.batch.name}</span> has concluded. Attendance timestamps and participation records have been preserved.
                </p>
                <div className="pt-2 flex items-center justify-center gap-2">
                  <Link
                    href={backHref}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-colors shadow-xs"
                  >
                    Return to {portalType === 'tutor' ? 'Dashboard' : portalType === 'student' ? 'Student Space' : 'Portal'}
                  </Link>
                </div>
              </div>
            </div>
          ) : status === 'scheduled' && initialRole === 'participant' ? (
            /* State B: Student Waiting Room */
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
                <div className="h-14 w-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center mx-auto relative">
                  <Video className="h-7 w-7" />
                  <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-indigo-500 animate-ping" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white">
                    Your tutor hasn&apos;t started the class yet
                  </h2>
                  <p className="text-xs text-gray-400">
                    Please stay on this page. The virtual classroom will automatically launch the instant your tutor starts teaching.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Batch:</span>
                    <span className="font-semibold text-gray-300">{session.batch.name}</span>
                  </div>
                  {session.batch.subject && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subject:</span>
                      <span className="text-gray-300">{session.batch.subject}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-500">Scheduled:</span>
                    <span className="text-gray-300">{timeRangeDisplay}</span>
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-center gap-2 text-[11px] text-gray-500">
                  <Radio className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                  <span>Listening for tutor launch signal...</span>
                </div>
              </div>
            </div>
          ) : status === 'scheduled' && initialRole === 'host' ? (
            /* State C: Tutor Pre-Class Stage */
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="max-w-md w-full rounded-2xl bg-gray-900 border border-gray-800 p-6 sm:p-8 text-center space-y-4 shadow-2xl">
                <div className="h-14 w-14 rounded-2xl bg-indigo-950/80 border border-indigo-800/80 text-indigo-400 flex items-center justify-center mx-auto">
                  <Play className="h-7 w-7 fill-current ml-1" />
                </div>

                <div className="space-y-1">
                  <h2 className="text-base font-bold text-white">Ready to Teach?</h2>
                  <p className="text-xs text-gray-400">
                    Click &quot;Start Class&quot; to open the online room. Enrolled students waiting in the lobby will connect automatically.
                  </p>
                </div>

                <div className="rounded-xl border border-gray-800 bg-gray-950/60 p-3 text-xs text-left space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Batch:</span>
                    <span className="font-semibold text-gray-300">{session.batch.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Class Mode:</span>
                    <span className="text-indigo-300 font-semibold capitalize">{session.class_mode}</span>
                  </div>
                </div>

                <Button
                  variant="primary"
                  onClick={handleStartClass}
                  loading={isStarting}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md font-semibold text-sm py-2.5"
                >
                  <Play className="h-4 w-4 mr-2 fill-current" />
                  Start Live Class Now
                </Button>
              </div>
            </div>
          ) : activeStageView === 'whiteboard' ? (
            /* State D1: Active Digital Whiteboard Teaching Stage */
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative w-full h-full rounded-2xl border border-gray-800 bg-gray-950 shadow-2xl">
              {/* Main Whiteboard Canvas */}
              <div className="flex-1 flex flex-col overflow-hidden relative min-h-0">
                <DigitalWhiteboard
                  sessionId={session.id}
                  portalType={portalType}
                  currentUserId={userId}
                  currentUserName={currentUserName}
                />
              </div>

              {/* Video Strip (keeps tutor and student videos active and visible) */}
              <div className="h-28 md:h-auto md:w-56 lg:w-64 border-t md:border-t-0 md:border-l border-gray-800/80 bg-gray-950/90 p-2 overflow-x-auto md:overflow-y-auto flex md:flex-col gap-2 shrink-0 z-10 backdrop-blur-md">
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 hidden md:block">
                  Live Video ({participants.length})
                </div>
                <div className="min-w-[130px] md:min-w-0 md:w-full h-24 md:h-32 shrink-0">
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
                  />
                </div>
                {remoteParticipants.map((p) => {
                  const remoteStream = remoteStreams.get(p.id)
                  return (
                    <div key={p.id} className="min-w-[130px] md:min-w-0 md:w-full h-24 md:h-32 shrink-0">
                      <ParticipantTile
                        participantId={p.id}
                        name={p.name}
                        role={p.role}
                        isLocal={false}
                        stream={remoteStream}
                        isAudioMuted={p.isAudioMuted}
                        isVideoMuted={p.isVideoMuted}
                        isScreenSharing={p.isScreenSharing}
                        connectionState={p.connectionState}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            /* State D2: Active Live WebRTC Video Grid */
            <div className="flex-1 flex flex-col gap-2 sm:gap-3 overflow-hidden">
              {/* Screen Share Spotlight (if active) */}
              {(isLocalScreenSharing || activeScreenSharingPeer) && (
                <div className="flex-[3] min-h-[260px] rounded-2xl overflow-hidden bg-black border border-indigo-500/50 relative shadow-2xl flex items-center justify-center">
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
                  <div className="absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-bold bg-indigo-950/90 text-indigo-300 border border-indigo-700/80 backdrop-blur-md flex items-center gap-1.5">
                    <Share2 className="h-3.5 w-3.5 text-indigo-400" />
                    <span>
                      {isLocalScreenSharing
                        ? 'You are sharing your screen'
                        : `${activeScreenSharingPeer?.name || 'Presenter'} is sharing screen`}
                    </span>
                  </div>
                </div>
              )}

              {/* Participant Video Grid */}
              <div
                className={`flex-1 grid gap-2 sm:gap-3 overflow-y-auto p-1 ${
                  isLocalScreenSharing || activeScreenSharingPeer
                    ? 'flex-1 max-h-[160px] sm:max-h-[190px] grid-flow-col auto-cols-[220px] sm:auto-cols-[260px] overflow-x-auto'
                    : remoteParticipants.length === 0
                    ? 'grid-cols-1'
                    : remoteParticipants.length === 1
                    ? 'grid-cols-1 md:grid-cols-2'
                    : remoteParticipants.length <= 3
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
                    : 'grid-cols-2 sm:grid-cols-3'
                }`}
              >
                {/* 1. Local Participant Tile */}
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
                />

                {/* 2. Remote Participants Tiles */}
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
                    />
                  )
                })}
              </div>
            </div>
          )}
        </main>

        {/* =================================================================== */}
        {/* 3. COLLAPSIBLE SIDE DRAWER (Participants & Chat)                    */}
        {/* =================================================================== */}
        {isSidePanelOpen && status === 'in_progress' && (
          <aside className="w-80 sm:w-88 border-l border-gray-800/80 bg-gray-950 flex flex-col shrink-0 z-20 shadow-2xl animate-fade-in">
            {/* Drawer Tabs */}
            <div className="h-12 border-b border-gray-800 px-3 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1 bg-gray-900 p-0.5 rounded-xl border border-gray-800">
                <button
                  type="button"
                  onClick={() => setSidePanelTab('participants')}
                  className={`px-2 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    sidePanelTab === 'participants'
                      ? 'bg-indigo-600 text-white shadow-xs'
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
                      ? 'bg-indigo-600 text-white shadow-xs'
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
                      ? 'bg-indigo-600 text-white shadow-xs'
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
                className="h-7 w-7 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 flex items-center justify-center cursor-pointer"
                aria-label="Close panel"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* TAB 1: PARTICIPANTS */}
            {sidePanelTab === 'participants' && (
              <div className="flex-1 p-3 overflow-y-auto space-y-2">
                {/* Local user row */}
                <div className="p-2.5 rounded-xl bg-gray-900/90 border border-gray-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      {currentUserName[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                        <span>{currentUserName}</span>
                        <span className="text-[10px] text-indigo-400 font-normal">(You)</span>
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
                      {p.handRaised && initialRole === 'host' && (
                        <button
                          type="button"
                          onClick={() => handleAcknowledgeHand(p.id)}
                          className="px-2 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-[10px] font-semibold transition-colors flex items-center gap-1 mr-1 shadow-xs cursor-pointer"
                          title="Acknowledge student's raised hand"
                        >
                          <Check className="h-3 w-3" />
                          <span>Ack</span>
                        </button>
                      )}
                      {p.isAudioMuted ? (
                        <MicOff className="h-3.5 w-3.5 text-rose-400" />
                      ) : (
                        <Mic className="h-3.5 w-3.5 text-emerald-400" />
                      )}
                      {p.isVideoMuted ? (
                        <VideoOff className="h-3.5 w-3.5 text-rose-400" />
                      ) : (
                        <Video className="h-3.5 w-3.5 text-emerald-400" />
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
      {/* 4. BOTTOM ACTION CONTROL BAR (Touch-Friendly, 44px+ targets)          */}
      {/* ===================================================================== */}
      {status === 'in_progress' && (
        <footer className="h-18 bg-gray-950/95 border-t border-gray-800/80 backdrop-blur-md px-4 flex items-center justify-center gap-2 sm:gap-4 shrink-0 z-30">
          {/* Microphone Toggle */}
          <button
            type="button"
            onClick={toggleAudio}
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer ${
              isAudioMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
            aria-label={isAudioMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isAudioMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
          </button>

          {/* Camera Toggle */}
          <button
            type="button"
            onClick={toggleVideo}
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer ${
              isVideoMuted
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={isVideoMuted ? 'Turn video on' : 'Turn video off'}
            aria-label={isVideoMuted ? 'Turn video on' : 'Turn video off'}
          >
            {isVideoMuted ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
          </button>

          {/* Screen Share Toggle (Tutor Host) */}
          {initialRole === 'host' && (
            <button
              type="button"
              onClick={toggleScreenShare}
              className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer ${
                isScreenSharing
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
              title={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
              aria-label={isScreenSharing ? 'Stop sharing screen' : 'Share your screen'}
            >
              <Share2 className="h-5 w-5" />
            </button>
          )}

          {/* Whiteboard Toggle */}
          <button
            type="button"
            onClick={() => {
              setActiveStageView(activeStageView === 'whiteboard' ? 'video' : 'whiteboard')
            }}
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer ${
              activeStageView === 'whiteboard'
                ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title={activeStageView === 'whiteboard' ? 'Return to Video Grid' : 'Open Digital Whiteboard'}
            aria-label="Digital Whiteboard"
          >
            <PenTool className="h-5 w-5" />
            <span className="text-[8px] font-bold mt-0.5 hidden sm:inline">Board</span>
          </button>

          {/* Raise Hand Toggle (Student Participant Only) */}
          {initialRole === 'participant' && (
            <button
              type="button"
              onClick={handleToggleRaiseHand}
              className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer ${
                isHandRaised
                  ? 'bg-amber-500 hover:bg-amber-400 text-black shadow-lg ring-2 ring-amber-300 animate-pulse'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
              title={isHandRaised ? 'Lower your hand' : 'Raise hand (✋)'}
              aria-label={isHandRaised ? 'Lower your hand' : 'Raise hand'}
            >
              <Hand className="h-5 w-5" />
              <span className="text-[8px] font-bold mt-0.5">{isHandRaised ? 'Lower' : 'Hand'}</span>
            </button>
          )}

          {/* Reaction Picker Popover */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowReactionPicker((v) => !v)}
              className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer ${
                showReactionPicker
                  ? 'bg-indigo-600 text-white shadow-lg ring-2 ring-indigo-400'
                  : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              }`}
              title="Send live reaction"
              aria-label="Send live reaction"
            >
              <Smile className="h-5 w-5" />
              <span className="text-[8px] font-bold mt-0.5 hidden sm:inline">React</span>
            </button>

            {showReactionPicker && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-gray-800 rounded-2xl p-2 shadow-2xl backdrop-blur-md flex items-center gap-1.5 z-50 animate-fade-in">
                {['👍', '👏', '❤️', '😊', '❓'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSendReaction(emoji)}
                    className="h-10 w-10 text-xl rounded-xl hover:bg-gray-800 flex items-center justify-center transition-transform hover:scale-125 cursor-pointer"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Questions (Quiz) Panel Toggle */}
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
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer relative ${
              isSidePanelOpen && sidePanelTab === 'questions'
                ? 'bg-emerald-600 text-white shadow-lg ring-2 ring-emerald-400'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="Fast Answer Questions"
            aria-label="Fast Answer Questions"
          >
            <Zap className="h-5 w-5 text-emerald-400" />
            {unreadQuestionsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-emerald-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-gray-950">
                {unreadQuestionsCount}
              </span>
            )}
            <span className="text-[8px] font-bold mt-0.5 hidden sm:inline">Quiz</span>
          </button>

          {/* Leaderboard Ranking Panel Toggle */}
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
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer relative ${
              isSidePanelOpen && sidePanelTab === 'ranking'
                ? 'bg-amber-600 text-white shadow-lg ring-2 ring-amber-400'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="Classroom Ranking Leaderboard"
            aria-label="Classroom Ranking Leaderboard"
          >
            <Trophy className="h-5 w-5 text-amber-400" />
            <span className="text-[8px] font-bold mt-0.5 hidden sm:inline">Rank</span>
          </button>

          {/* Polls Panel Toggle */}
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
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer relative ${
              isSidePanelOpen && sidePanelTab === 'polls'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="Classroom polls"
            aria-label="Classroom polls"
          >
            <BarChart2 className="h-5 w-5" />
            {unreadPollsCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-gray-950">
                {unreadPollsCount}
              </span>
            )}
            <span className="text-[8px] font-bold mt-0.5 hidden sm:inline">Polls</span>
          </button>

          {/* Participants Panel Toggle */}
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
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer relative ${
              isSidePanelOpen && sidePanelTab === 'participants'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="View participants"
            aria-label="View participants"
          >
            <Users className="h-5 w-5" />
            <span className="text-[9px] font-bold mt-0.5">{participants.length}</span>
          </button>

          {/* Chat Panel Toggle */}
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
            className={`flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl transition-all cursor-pointer relative ${
              isSidePanelOpen && sidePanelTab === 'chat'
                ? 'bg-indigo-600 text-white shadow-lg'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-200'
            }`}
            title="Classroom chat"
            aria-label="Classroom chat"
          >
            <MessageSquare className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-gray-950">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Leave Button */}
          <button
            type="button"
            onClick={initialRole === 'host' ? () => setShowEndDialog(true) : handleLeaveClass}
            className="flex flex-col items-center justify-center h-12 w-12 sm:h-12 sm:w-14 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white transition-all shadow-lg cursor-pointer ml-1"
            title={initialRole === 'host' ? 'End class for all' : 'Leave classroom'}
            aria-label={initialRole === 'host' ? 'End class for all' : 'Leave classroom'}
          >
            <LogOut className="h-5 w-5" />
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
