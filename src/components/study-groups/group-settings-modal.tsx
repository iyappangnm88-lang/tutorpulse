'use client'

import React, { useState } from 'react'
import {
  X,
  Settings,
  Shield,
  Trash2,
  CheckCircle2,
  XCircle,
  Crown,
  AlertTriangle,
} from 'lucide-react'
import type {
  StudyGroup,
  StudyGroupMember,
  StudyGroupJoinRequest,
} from '@/lib/types/study-groups'
import {
  updateStudyGroupAction,
  updateMemberRoleAction,
  removeMemberAction,
  transferOwnershipAction,
  deleteStudyGroupAction,
  manageJoinRequestAction,
} from '@/app/student/study-groups/actions'
import { useRouter } from 'next/navigation'

interface GroupSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  group: StudyGroup
  members: StudyGroupMember[]
  joinRequests: StudyGroupJoinRequest[]
  currentUserId: string
  myRole: 'owner' | 'admin' | 'member' | null
}

export function GroupSettingsModal({
  isOpen,
  onClose,
  group,
  members,
  joinRequests,
  currentUserId,
  myRole,
}: GroupSettingsModalProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'requests' | 'members' | 'settings'>('members')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [subject, setSubject] = useState(group.subject)
  const [classOrExam, setClassOrExam] = useState(group.class_or_exam || '')
  const [visibility, setVisibility] = useState<'public' | 'private'>(group.visibility)
  const [goal, setGoal] = useState(group.group_goal || '')
  const [maxMembers, setMaxMembers] = useState(group.max_members)

  if (!isOpen) return null

  const isOwner = myRole === 'owner'

  async function handleSaveSettings(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setErrorMsg(null)

    const res = await updateStudyGroupAction(group.id, {
      name,
      description,
      subject,
      class_or_exam: classOrExam,
      visibility,
      group_goal: goal,
      max_members: maxMembers,
    })

    setIsSubmitting(false)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to save settings')
    } else {
      router.refresh()
      onClose()
    }
  }

  async function handleManageRequest(requestId: string, action: 'approve' | 'reject') {
    setIsSubmitting(true)
    const res = await manageJoinRequestAction(requestId, action)
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to process request')
    } else {
      router.refresh()
    }
  }

  async function handleRoleChange(targetUserId: string, newRole: 'admin' | 'member') {
    setIsSubmitting(true)
    const res = await updateMemberRoleAction(group.id, targetUserId, newRole)
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to update role')
    } else {
      router.refresh()
    }
  }

  async function handleRemoveMember(targetUserId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return
    setIsSubmitting(true)
    const res = await removeMemberAction(group.id, targetUserId)
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to remove member')
    } else {
      router.refresh()
    }
  }

  async function handleTransferOwnership(targetUserId: string) {
    if (!confirm('Are you sure you want to transfer group ownership? You will become an admin.')) return
    setIsSubmitting(true)
    const res = await transferOwnershipAction(group.id, targetUserId)
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to transfer ownership')
    } else {
      router.refresh()
    }
  }

  async function handleDeleteGroup() {
    if (!confirm('Are you sure you want to permanently delete this study group? This cannot be undone.')) return
    setIsSubmitting(true)
    const res = await deleteStudyGroupAction(group.id)
    setIsSubmitting(false)
    if (!res.success) {
      setErrorMsg(res.error || 'Failed to delete group')
    } else {
      router.push('/student/study-groups')
      router.refresh()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-xl rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200 dark:border-[#293329] shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-[#293329]">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-[#55C832] dark:text-[#6BEA45]" />
            <h3 className="text-base font-bold text-[#172B4D] dark:text-[#F4F7F2]">
              Group Management & Settings
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[#202920] transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-gray-100 dark:border-[#293329] px-5 gap-4 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('members')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'members'
                ? 'border-[#55C832] text-[#318A25] dark:text-[#6BEA45]'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Members ({members.length})
          </button>

          {group.visibility === 'private' && (
            <button
              type="button"
              onClick={() => setActiveTab('requests')}
              className={`py-3 border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'border-[#55C832] text-[#318A25] dark:text-[#6BEA45]'
                  : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
              }`}
            >
              Requests
              {joinRequests.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300">
                  {joinRequests.length}
                </span>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`py-3 border-b-2 transition-all cursor-pointer ${
              activeTab === 'settings'
                ? 'border-[#55C832] text-[#318A25] dark:text-[#6BEA45]'
                : 'border-transparent text-gray-500 hover:text-gray-800 dark:hover:text-gray-300'
            }`}
          >
            Edit Info
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {activeTab === 'members' && (
            <div className="space-y-3">
              {members.map((member) => {
                const isMe = member.user_id === currentUserId
                const rawName = member.user?.full_name || (isMe ? 'You' : 'Student')
                const displayName = rawName === 'You' ? (isMe ? 'You' : 'Member') : `${rawName}${isMe ? ' (You)' : ''}`
                const initial = (rawName || 'S').charAt(0).toUpperCase()

                return (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-100 dark:border-[#202920]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[#318A25] text-xs font-bold">
                        {initial}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] truncate">
                          {displayName}
                        </p>
                        <span className="text-[10px] font-semibold text-gray-500 capitalize">
                          {member.role}
                        </span>
                      </div>
                    </div>

                    {isOwner && !isMe && (
                      <div className="flex items-center gap-2">
                        {member.role === 'member' ? (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleRoleChange(member.user_id, 'admin')}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-[#318A25] dark:text-[#6BEA45] hover:bg-emerald-100 transition-colors"
                          >
                            Promote Admin
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isSubmitting}
                            onClick={() => handleRoleChange(member.user_id, 'member')}
                            className="px-2 py-1 rounded-lg text-[11px] font-semibold bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 transition-colors"
                          >
                            Demote
                          </button>
                        )}

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleTransferOwnership(member.user_id)}
                          className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 transition-colors"
                          title="Transfer Ownership"
                        >
                          <Crown className="h-3.5 w-3.5" />
                        </button>

                        <button
                          type="button"
                          disabled={isSubmitting}
                          onClick={() => handleRemoveMember(member.user_id)}
                          className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                          title="Remove Member"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {activeTab === 'requests' && (
            <div className="space-y-3">
              {joinRequests.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-xs">
                  No pending join requests.
                </div>
              ) : (
                joinRequests.map((req) => (
                  <div
                    key={req.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-100 dark:border-[#202920]"
                  >
                    <div>
                      <p className="text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2]">
                        {req.user?.full_name || 'Anonymous User'}
                      </p>
                      {req.user?.grade_level && (
                        <p className="text-[10px] text-gray-500">{req.user.grade_level}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleManageRequest(req.id, 'approve')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-[#55C832] text-white text-xs font-bold shadow-2xs hover:bg-[#318A25] transition-colors"
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve
                      </button>
                      <button
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleManageRequest(req.id, 'reject')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-700 dark:text-gray-300 text-xs font-semibold hover:bg-gray-300 transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Group Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#55C832] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#55C832] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Class / Exam
                </label>
                <input
                  type="text"
                  value={classOrExam}
                  onChange={(e) => setClassOrExam(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#55C832] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Study Goal
                </label>
                <input
                  type="text"
                  placeholder="e.g. Focus 10 hours weekly for Board Exams"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#55C832] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2 text-xs focus:ring-2 focus:ring-[#55C832] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Visibility
                </label>
                <div className="flex gap-4 text-xs font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'public'}
                      onChange={() => setVisibility('public')}
                      className="text-[#55C832] focus:ring-[#55C832]"
                    />
                    <span>Public (Anyone can join)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="visibility"
                      checked={visibility === 'private'}
                      onChange={() => setVisibility('private')}
                      className="text-[#55C832] focus:ring-[#55C832]"
                    />
                    <span>Private (Request required)</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-2xs transition-all disabled:opacity-50"
                >
                  Save Changes
                </button>
              </div>

              {isOwner && (
                <div className="mt-8 pt-4 border-t border-red-100 dark:border-red-950/40 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-red-600">Danger Zone</p>
                    <p className="text-[10px] text-gray-400">Permanently delete this group and all data.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleDeleteGroup}
                    className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold border border-red-200 transition-colors"
                  >
                    Delete Group
                  </button>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
