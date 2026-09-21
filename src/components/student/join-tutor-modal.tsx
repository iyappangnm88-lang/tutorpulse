'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { joinTutorByInviteCodeAction } from '@/app/onboarding/actions'

interface JoinTutorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function JoinTutorModal({ isOpen, onClose, onSuccess }: JoinTutorModalProps) {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  if (!isOpen) return null

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    if (!inviteCode.trim()) return

    setLoading(true)
    setError(null)

    const res = await joinTutorByInviteCodeAction(inviteCode.trim())
    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccessMessage(`Successfully connected to ${res.data?.workspace_name || 'your tutor'}!`)
      setTimeout(() => {
        onClose()
        if (onSuccess) onSuccess()
        router.refresh()
      }, 1200)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl border border-gray-100 relative">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Connect to a Tutor</h2>
            <p className="text-xs text-gray-500">Enter the invite code provided by your tutor</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleJoin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Invite Code</label>
            <Input
              type="text"
              placeholder="e.g. TP-49A2B7"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
              className="font-mono tracking-widest text-center text-base uppercase"
              disabled={loading || !!successMessage}
              required
              autoFocus
            />
            <p className="text-[11px] text-gray-400 mt-1">
              Ask your teacher or check your admission email/message for your unique code.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !inviteCode.trim() || !!successMessage}
              className="text-xs bg-indigo-600 hover:bg-indigo-700"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                  Connecting...
                </>
              ) : (
                'Connect'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
