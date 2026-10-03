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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#161D16] rounded-3xl p-6 sm:p-7 shadow-2xl border border-gray-100 dark:border-[#293329] text-gray-900 dark:text-[#F4F7F2] relative transition-colors">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#55C832]/20 text-[#318A25] dark:text-[#6BEA45] shrink-0">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-950 dark:text-[#F4F7F2]">Connect to a Tutor</h2>
            <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">Enter the invite code provided by your teacher</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-2xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2.5">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMessage}</span>
          </div>
        )}

        {!preview ? (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-[#A8B3A5] uppercase tracking-wider mb-1.5">
                Invite Code
              </label>
              <Input
                type="text"
                placeholder="e.g. TP-49A2B7"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                className="font-mono tracking-widest text-center text-base uppercase font-bold h-12 rounded-xl bg-gray-50 dark:bg-[#0B0F0C] border-gray-200 dark:border-[#293329] text-gray-900 dark:text-white"
                disabled={loading || !!successMessage}
                required
                autoFocus
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                Your tutor provides an invitation code formatted like <code className="font-mono font-semibold text-gray-700 dark:text-gray-300">TP-XXXXXX</code>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
                className="text-xs min-h-[44px] px-4 rounded-xl border-gray-200 dark:border-[#293329] dark:bg-[#1C261C] dark:text-[#A8B3A5] dark:hover:text-white cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !inviteCode.trim() || !!successMessage}
                className="text-xs min-h-[44px] px-5 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-[#0B0F0C] dark:text-[#0B0F0C] font-bold shadow-md cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <span>Verify Code</span>
                    <ArrowRight className="ml-1.5 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {/* Preview Card */}
            <div className="rounded-2xl border border-gray-200 dark:border-[#293329] bg-[#FAFBEF]/50 dark:bg-[#0B0F0C] p-4 sm:p-5 space-y-3">
              <div className="flex items-center gap-2 text-[#318A25] dark:text-[#6BEA45] text-xs font-bold">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span>Invitation Found!</span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[#318A25] dark:text-[#6BEA45] shrink-0" />
                  <span className="text-gray-500 dark:text-[#A8B3A5]">Tutor:</span>
                  <span className="font-bold text-gray-900 dark:text-[#F4F7F2]">{preview.tutorName}</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <Building2 className="h-4 w-4 text-[#318A25] dark:text-[#6BEA45] shrink-0" />
                  <span className="text-gray-500 dark:text-[#A8B3A5]">Workspace:</span>
                  <span className="font-semibold text-gray-900 dark:text-[#F4F7F2]">{preview.workspaceName}</span>
                  <span className="capitalize px-2 py-0.5 rounded-full text-[10px] bg-[#55C832]/20 text-[#318A25] dark:text-[#6BEA45] font-bold border border-[#55C832]/30">
                    {preview.workspaceType}
                  </span>
                </div>

                {preview.primarySubjects && preview.primarySubjects.length > 0 && (
                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {preview.primarySubjects.map((sub) => (
                      <span
                        key={sub}
                        className="rounded-lg bg-white dark:bg-[#1C261C] border border-gray-200 dark:border-[#293329] px-2.5 py-1 text-[11px] font-semibold text-[#172B4D] dark:text-[#F4F7F2]"
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
                className="text-xs min-h-[44px] px-3 text-gray-500 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white"
              >
                Change Code
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading}
                  className="text-xs min-h-[44px] px-4 rounded-xl border-gray-200 dark:border-[#293329] dark:bg-[#1C261C] dark:text-[#A8B3A5]"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleConfirmJoin}
                  disabled={loading || !!successMessage}
                  className="text-xs min-h-[44px] px-5 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-[#0B0F0C] font-bold shadow-md cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
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
