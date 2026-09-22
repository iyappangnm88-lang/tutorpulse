'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  UserPlus,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  GraduationCap,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { previewInviteAction, joinTutorByInviteAction } from '@/app/student/actions'

interface JoinTutorModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface PreviewData {
  tutorName: string
  workspaceName: string
  workspaceType: string
  primarySubjects?: string[]
}

export function JoinTutorModal({ isOpen, onClose, onSuccess }: JoinTutorModalProps) {
  const router = useRouter()
  const [inviteCode, setInviteCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)

  if (!isOpen) return null

  function handleReset() {
    setInviteCode('')
    setError(null)
    setPreview(null)
    setSuccessMessage(null)
  }

  function handleClose() {
    handleReset()
    onClose()
  }

  async function handleVerify(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const code = inviteCode.trim().toUpperCase()
    if (!code) return

    setLoading(true)
    setError(null)

    const res = await previewInviteAction(code)
    setLoading(false)

    if (!res.success || !res.data) {
      setError(res.error || 'Invalid invite code.')
      setPreview(null)
    } else {
      setPreview(res.data)
    }
  }

  async function handleConfirmJoin() {
    const code = inviteCode.trim().toUpperCase()
    if (!code) return

    setLoading(true)
    setError(null)

    const res = await joinTutorByInviteAction(code)
    setLoading(false)

    if (!res.success || !res.data) {
      setError(res.error || 'Failed to join tutor.')
    } else {
      setSuccessMessage(`Successfully connected to ${res.data.workspaceName}!`)
      setTimeout(() => {
        handleClose()
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
            <p className="text-xs text-gray-500">Enter the invite code provided by your teacher</p>
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

        {!preview ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Invite Code
              </label>
              <Input
                type="text"
                placeholder="e.g. TP-49A2B7"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono tracking-widest text-center text-base uppercase font-bold"
                disabled={loading || !!successMessage}
                required
                autoFocus
              />
              <p className="text-[11px] text-gray-400 mt-1">
                Your tutor provides an invitation code formatted like <code className="font-mono font-semibold text-gray-600">TP-XXXXXX</code>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !inviteCode.trim() || !!successMessage}
                className="text-xs bg-indigo-600 hover:bg-indigo-700 font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    Verify Code
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Preview Card */}
            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-3">
              <div className="flex items-center gap-2 text-indigo-700 text-xs font-bold">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Invitation Found!
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-gray-500">Tutor:</span>
                  <span className="font-bold text-gray-900">{preview.tutorName}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-indigo-600 shrink-0" />
                  <span className="text-gray-500">Workspace:</span>
                  <span className="font-semibold text-gray-900">{preview.workspaceName}</span>
                  <span className="capitalize px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-700 font-medium">
                    {preview.workspaceType}
                  </span>
                </div>

                {preview.primarySubjects && preview.primarySubjects.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1">
                    {preview.primarySubjects.map((sub) => (
                      <span
                        key={sub}
                        className="rounded-md bg-white border border-indigo-100 px-2 py-0.5 text-[10px] font-medium text-indigo-800"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setPreview(null)}
                disabled={loading}
                className="text-xs text-gray-500"
              >
                Change Code
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="text-xs"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmJoin}
                  disabled={loading || !!successMessage}
                  className="text-xs bg-indigo-600 hover:bg-indigo-700 font-semibold"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      Connecting...
                    </>
                  ) : (
                    'Accept & Connect'
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
