'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Globe, Lock, Sparkles, CheckCircle2, AlertTriangle } from 'lucide-react'
import { createStudyGroupAction } from '../actions'

const COMMON_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'English Literature',
  'General Science',
  'Economics',
]

const COMMON_CLASSES = [
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  'JEE Prep',
  'NEET Prep',
  'SAT Prep',
  'College',
  'General',
]

export default function NewStudyGroupPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [subject, setSubject] = useState('Mathematics')
  const [customSubject, setCustomSubject] = useState('')
  const [classOrExam, setClassOrExam] = useState('Class 10')
  const [customClass, setCustomClass] = useState('')
  const [visibility, setVisibility] = useState<'public' | 'private'>('public')
  const [maxMembers, setMaxMembers] = useState(50)
  const [goal, setGoal] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setErrorMsg('Please enter a group name.')
      return
    }

    setIsSubmitting(true)
    setErrorMsg(null)

    const finalSubject = subject === 'Other' ? customSubject.trim() || 'General' : subject
    const finalClass = classOrExam === 'Other' ? customClass.trim() || 'General' : classOrExam

    const res = await createStudyGroupAction({
      name: name.trim(),
      description: description.trim(),
      subject: finalSubject,
      class_or_exam: finalClass,
      visibility,
      max_members: maxMembers,
      group_goal: goal.trim(),
    })

    setIsSubmitting(false)

    if (!res.success || !res.data) {
      setErrorMsg(res.error || 'Failed to create study group.')
    } else {
      router.push(`/student/study-groups/${res.data.groupId}`)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Back button */}
      <div>
        <Link
          href="/student/study-groups"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Study Groups
        </Link>
      </div>

      {/* Form Container */}
      <div className="rounded-2xl bg-white dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] p-6 sm:p-8 shadow-2xs">
        <div className="mb-6 border-b border-gray-100 dark:border-[#202920] pb-4">
          <h1 className="text-xl font-black text-[#172B4D] dark:text-[#F4F7F2] tracking-tight flex items-center gap-2">
            <Users className="h-5 w-5 text-[#55C832] dark:text-[#6BEA45]" />
            Create Study Group
          </h1>
          <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-1">
            Build your study circle, track shared focus goals, and climb the leaderboard together.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2 border border-red-200 dark:border-red-900/40">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Group Name */}
          <div>
            <label className="block text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] mb-1.5">
              Group Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 10th Grade Math Champions, JEE 2027 Focus Room"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2.5 text-xs text-[#172B4D] dark:text-[#F4F7F2] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#55C832]"
            />
          </div>

          {/* Subject & Class */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] mb-1.5">
                Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2.5 text-xs text-[#172B4D] dark:text-[#F4F7F2] focus:outline-none focus:ring-2 focus:ring-[#55C832]"
              >
                {COMMON_SUBJECTS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>
              {subject === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom subject"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  className="mt-2 w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2 text-xs text-[#172B4D] dark:text-[#F4F7F2] focus:outline-none focus:ring-2 focus:ring-[#55C832]"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] mb-1.5">
                Class / Exam Target
              </label>
              <select
                value={classOrExam}
                onChange={(e) => setClassOrExam(e.target.value)}
                className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2.5 text-xs text-[#172B4D] dark:text-[#F4F7F2] focus:outline-none focus:ring-2 focus:ring-[#55C832]"
              >
                {COMMON_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Other">Other / Custom</option>
              </select>
              {classOrExam === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter custom class/exam"
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  className="mt-2 w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2 text-xs text-[#172B4D] dark:text-[#F4F7F2] focus:outline-none focus:ring-2 focus:ring-[#55C832]"
                />
              )}
            </div>
          </div>

          {/* Study Goal */}
          <div>
            <label className="block text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] mb-1.5">
              Study Goal (Optional)
            </label>
            <div className="relative">
              <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-amber-500" />
              <input
                type="text"
                placeholder="e.g. Focus 15 hours weekly for final exams"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] pl-9 pr-3.5 py-2.5 text-xs text-[#172B4D] dark:text-[#F4F7F2] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#55C832]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] mb-1.5">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              placeholder="What is this group about? What are the study guidelines?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-xl bg-gray-50 dark:bg-[#111711] border border-gray-200 dark:border-[#293329] px-3.5 py-2.5 text-xs text-[#172B4D] dark:text-[#F4F7F2] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#55C832]"
            />
          </div>

          {/* Visibility & Max Members */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
            <div>
              <label className="block text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] mb-2">
                Visibility
              </label>
              <div className="space-y-2">
                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    visibility === 'public'
                      ? 'border-[#55C832] bg-[#55C832]/5 dark:bg-[#6BEA45]/10'
                      : 'border-gray-200 dark:border-[#293329]'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === 'public'}
                    onChange={() => setVisibility('public')}
                    className="mt-0.5 text-[#55C832] focus:ring-[#55C832]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] flex items-center gap-1.5">
                      <Globe className="h-3.5 w-3.5 text-emerald-500" /> Public Group
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5] mt-0.5">
                      Anyone in Nuzigo can discover and join immediately.
                    </p>
                  </div>
                </label>

                <label
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                    visibility === 'private'
                      ? 'border-[#55C832] bg-[#55C832]/5 dark:bg-[#6BEA45]/10'
                      : 'border-gray-200 dark:border-[#293329]'
                  }`}
                >
                  <input
                    type="radio"
                    name="visibility"
                    checked={visibility === 'private'}
                    onChange={() => setVisibility('private')}
                    className="mt-0.5 text-[#55C832] focus:ring-[#55C832]"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] flex items-center gap-1.5">
                      <Lock className="h-3.5 w-3.5 text-gray-400" /> Private Group
                    </span>
                    <p className="text-[11px] text-gray-500 dark:text-[#A8B3A5] mt-0.5">
                      Students must request to join. Admins approve requests.
                    </p>
                  </div>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#172B4D] dark:text-[#F4F7F2] mb-2">
                Member Capacity
              </label>
              <div className="flex gap-2">
                {[25, 50, 100].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setMaxMembers(num)}
                    className={`flex-1 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      maxMembers === num
                        ? 'border-[#55C832] bg-[#55C832]/10 dark:bg-[#6BEA45]/15 text-[#318A25] dark:text-[#6BEA45]'
                        : 'border-gray-200 dark:border-[#293329] text-gray-600 dark:text-gray-400'
                    }`}
                  >
                    {num} seats
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                Recommended 50 for active weekly discussion and accountability.
              </p>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-gray-100 dark:border-[#202920] flex items-center justify-end gap-3">
            <Link
              href="/student/study-groups"
              className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-[#293329] text-gray-600 dark:text-gray-400 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-[#1C261C] transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#55C832] hover:bg-[#318A25] text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>{isSubmitting ? 'Creating Group...' : 'Create Study Group'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
