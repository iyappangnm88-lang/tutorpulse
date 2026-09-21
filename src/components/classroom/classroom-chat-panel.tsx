'use client'

import React, { useState, useEffect, useRef } from 'react'
import { MessageSquare, Send, Trash2, Shield, User } from 'lucide-react'
import type { ClassroomChatMessage } from '@/lib/classroom/types'
import {
  sendClassroomMessageAction,
  deleteClassroomMessageAction,
} from '@/app/(dashboard)/dashboard/classroom/interaction-actions'

interface ClassroomChatPanelProps {
  sessionId: string
  currentUserId: string
  isTutor: boolean
  sessionStatus: string
  messages: ClassroomChatMessage[]
  onSendMessage: (msg: ClassroomChatMessage) => void
  onDeleteMessage: (msgId: string) => void
}

export function ClassroomChatPanel({
  sessionId,
  currentUserId,
  isTutor,
  sessionStatus,
  messages,
  onSendMessage,
  onDeleteMessage,
}: ClassroomChatPanelProps) {
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [cooldown, setCooldown] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages.length])

  const isSessionActive = sessionStatus === 'in_progress'

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed || isSending || cooldown || !isSessionActive) return

    setErrorMessage(null)
    setIsSending(true)

    // Basic rate limit: 1-second cooldown
    setCooldown(true)
    setTimeout(() => setCooldown(false), 1000)

    try {
      const res = await sendClassroomMessageAction(sessionId, trimmed)
      if (res.success && res.data) {
        onSendMessage(res.data)
        setDraft('')
      } else {
        setErrorMessage(res.error || 'Failed to send message.')
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Error sending message.')
    } finally {
      setIsSending(false)
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      const res = await deleteClassroomMessageAction(sessionId, messageId)
      if (res.success) {
        onDeleteMessage(messageId)
      }
    } catch (err) {
      console.error('Failed to delete message:', err)
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-gray-950">
      {/* Message List */}
      <div ref={scrollRef} className="flex-1 p-3 overflow-y-auto space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500 text-xs">
            <MessageSquare className="h-8 w-8 text-gray-700 mb-2" />
            <p className="font-semibold text-gray-400">Classroom Chat</p>
            <p className="text-[11px] mt-1 text-gray-500">
              Messages are visible only to participants in this live class session.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderId === currentUserId
            const isMsgFromTutor = m.senderRole === 'host'
            const canDelete = isTutor || isMe

            return (
              <div
                key={m.id}
                className={`group flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-0.5 text-[10px] text-gray-400">
                  <span className="font-bold text-gray-300 flex items-center gap-1">
                    {isMsgFromTutor ? (
                      <Shield className="h-2.5 w-2.5 text-indigo-400 fill-current" />
                    ) : (
                      <User className="h-2.5 w-2.5 text-gray-400" />
                    )}
                    {m.senderName}
                  </span>
                  <span>•</span>
                  <span>
                    {new Date(m.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  {canDelete && isSessionActive && (
                    <button
                      type="button"
                      onClick={() => handleDelete(m.id)}
                      className="opacity-0 group-hover:opacity-100 hover:text-rose-400 p-0.5 transition-opacity"
                      title="Delete message"
                      aria-label="Delete message"
                    >
                      <Trash2 className="h-2.5 w-2.5" />
                    </button>
                  )}
                </div>
                <div
                  className={`px-3 py-2 rounded-2xl text-xs max-w-[85%] break-words shadow-xs ${
                    isMe
                      ? 'bg-indigo-600 text-white rounded-tr-xs'
                      : isMsgFromTutor
                      ? 'bg-gray-800 text-indigo-100 rounded-tl-xs border border-indigo-500/30'
                      : 'bg-gray-800 text-gray-200 rounded-tl-xs border border-gray-700'
                  }`}
                >
                  {m.text}
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Error banner */}
      {errorMessage && (
        <div className="px-3 py-1.5 bg-rose-950/80 text-rose-300 text-[11px] border-t border-rose-900/60 flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white text-xs ml-2"
          >
            ✕
          </button>
        </div>
      )}

      {/* Input Area */}
      <div className="p-2.5 border-t border-gray-800/80 bg-gray-900/70">
        {!isSessionActive ? (
          <div className="text-center py-2 text-xs text-gray-500">
            Chat is disabled because this class session has concluded.
          </div>
        ) : (
          <form onSubmit={handleSend} className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type a message..."
                maxLength={500}
                disabled={isSending || !isSessionActive}
                className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!draft.trim() || isSending || cooldown}
                className="h-8 w-8 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 shadow-xs"
                aria-label="Send message"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            </div>
            {draft.length > 400 && (
              <span className="text-[10px] text-gray-500 self-end">
                {draft.length}/500
              </span>
            )}
          </form>
        )}
      </div>
    </div>
  )
}
