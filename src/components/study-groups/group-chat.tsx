'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, MessageSquare, Sparkles, AlertCircle } from 'lucide-react'
import type { StudyGroupMessage } from '@/lib/types/study-groups'
import { sendStudyGroupMessageAction } from '@/app/student/study-groups/actions'

interface GroupChatProps {
  groupId: string
  initialMessages: StudyGroupMessage[]
  messageCountToday: number
  messageDailyLimit: number
  isMember: boolean
}

export function GroupChat({
  groupId,
  initialMessages,
  messageCountToday: initialCount,
  messageDailyLimit = 20,
  isMember,
}: GroupChatProps) {
  const [messages, setMessages] = useState<StudyGroupMessage[]>(initialMessages)
  const [countToday, setCountToday] = useState(initialCount)
  const [inputValue, setInputValue] = useState('')
  const [isSending, setIsSending] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isLimitReached = countToday >= messageDailyLimit

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault()
    if (!inputValue.trim() || isSending || isLimitReached || !isMember) return

    const text = inputValue.trim()
    setInputValue('')
    setIsSending(true)
    setErrorMsg(null)

    const tempId = 'temp_' + Date.now()
    const optimisticMsg: StudyGroupMessage = {
      id: tempId,
      group_id: groupId,
      user_id: 'me',
      content: text,
      created_at: new Date().toISOString(),
      is_me: true,
      user: {
        id: 'me',
        full_name: 'You',
        avatar_url: null,
      },
    }
    setMessages((prev) => [...prev, optimisticMsg])
    setCountToday((prev) => prev + 1)

    const res = await sendStudyGroupMessageAction(groupId, text)
    setIsSending(false)

    if (!res.success) {
      setErrorMsg(res.error || 'Failed to send message')
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      setCountToday((prev) => Math.max(0, prev - 1))
    } else if (res.data?.messageCountToday !== undefined) {
      setCountToday(res.data.messageCountToday)
    }
  }

  return (
    <div className="flex flex-col h-[480px] sm:h-[520px] rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] shadow-2xs overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-[#293329] bg-gray-50/50 dark:bg-[#111711]/60 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-[#55C832] dark:text-[#6BEA45]" />
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#172B4D] dark:text-[#F4F7F2]">
            Study Chat
          </h2>
        </div>

        {isMember && (
          <div className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-500 dark:text-[#A8B3A5]">
            <span
              className={`px-2 py-0.5 rounded-full font-mono text-[10px] ${
                isLimitReached
                  ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300 font-bold'
                  : 'bg-gray-100 dark:bg-[#1C261C] text-gray-600 dark:text-[#A8B3A5]'
              }`}
            >
              {countToday}/{messageDailyLimit} messages today
            </span>
          </div>
        )}
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 overscroll-contain">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-400 py-8">
            <MessageSquare className="h-8 w-8 stroke-[1.5] mb-2 opacity-40" />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">
              No study messages yet
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
              Discuss study plans, share goals, and motivate each other!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.is_me
            const timeStr = new Date(msg.created_at).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })
            const initial = (msg.user.full_name || 'M').charAt(0).toUpperCase()

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {!isMe && (
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950 text-[#318A25] dark:text-[#6BEA45] text-[10px] font-bold">
                    {initial}
                  </div>
                )}

                <div className={`max-w-[80%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {!isMe && (
                    <span className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5 px-1">
                      {msg.user.full_name}
                    </span>
                  )}
                  <div
                    className={`rounded-2xl px-3.5 py-2 text-xs leading-relaxed shadow-2xs break-words ${
                      isMe
                        ? 'bg-[#55C832] text-white rounded-tr-none font-medium'
                        : 'bg-gray-100/90 dark:bg-[#1C261C] text-[#172B4D] dark:text-[#F4F7F2] rounded-tl-none'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <span className="text-[9px] text-gray-400 dark:text-gray-600 mt-0.5 px-1">
                    {timeStr}
                  </span>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Limit Banner if reached */}
      {isLimitReached && isMember && (
        <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-t border-amber-200/80 dark:border-amber-800/40 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300">
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Daily free limit reached (20/20).</span>
          </div>
          <button
            type="button"
            className="text-[11px] font-bold text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
            onClick={() => alert('Premium tier for unlimited group messaging coming soon!')}
          >
            Unlock Premium
          </button>
        </div>
      )}

      {/* Error alert */}
      {errorMsg && (
        <div className="px-4 py-1.5 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[11px] flex items-center gap-1.5 border-t border-red-100 dark:border-red-900/30 shrink-0">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Input Form */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 sm:p-2.5 border-t border-gray-100 dark:border-[#293329] bg-white dark:bg-[#161D16] flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          disabled={!isMember || isLimitReached || isSending}
          placeholder={
            !isMember
              ? 'Join group to participate in chat'
              : isLimitReached
              ? 'Daily limit reached (20/20)'
              : 'Write a study message...'
          }
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-1 bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] rounded-xl px-3.5 py-2.5 sm:py-2 text-[13px] sm:text-xs text-[#172B4D] dark:text-[#F4F7F2] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#55C832] disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={!inputValue.trim() || !isMember || isLimitReached || isSending}
          className="h-9 w-9 sm:h-8 sm:w-8 flex items-center justify-center rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white shadow-2xs transition-all disabled:opacity-40 cursor-pointer shrink-0"
        >
          <Send className="h-4 w-4 sm:h-3.5 sm:w-3.5" />
        </button>
      </form>
    </div>
  )
}
