'use client'

import React, { useState } from 'react'
import { Copy, Check, Share2 } from 'lucide-react'

interface InviteCodeBadgeProps {
  inviteCode: string
  workspaceType: 'offline' | 'online'
}

export function InviteCodeBadge({ inviteCode, workspaceType }: InviteCodeBadgeProps) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback
    }
  }

  return (
    <div className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3 py-1.5 backdrop-blur-xs border border-white/15 text-xs text-white">
      <span className="text-[11px] text-white/70 font-medium">Student Invite Code:</span>
      <span className="font-mono font-bold tracking-wider text-amber-200">{inviteCode}</span>
      <button
        type="button"
        onClick={handleCopy}
        className="ml-1 p-1 rounded-md hover:bg-white/15 transition-colors text-white/80 hover:text-white"
        title="Copy invite code for students"
        aria-label="Copy student invite code"
      >
        {copied ? (
          <Check className="h-3.5 w-3.5 text-emerald-400" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </button>
    </div>
  )
}
