'use client'

import React, { useState } from 'react'
import { Sparkles, Search, UserPlus, GraduationCap, ArrowRight, ShieldCheck, Video, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { JoinTutorModal } from '@/components/student/join-tutor-modal'

export default function StudentMarketplacePage() {
  const [joinModalOpen, setJoinModalOpen] = useState(false)

  const sampleCategories = [
    'Mathematics',
    'Physics',
    'Chemistry',
    'Biology',
    'Computer Science',
    'English Literature',
    'Economics',
    'History',
  ]

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-violet-50/50 p-8 text-center shadow-2xs relative overflow-hidden">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100/80 px-3 py-1 text-xs font-semibold text-indigo-800 mb-3">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          Tutor Directory & Marketplace • Coming Soon
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          Find Top Verified Tutors for Any Subject
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-gray-600 max-w-xl mx-auto leading-relaxed">
          We&apos;re building a curated marketplace of verified educators offering interactive online classes, personalized 1-on-1 coaching, and structured batch learning.
        </p>

        {/* Mock Search Bar */}
        <div className="mt-6 max-w-lg mx-auto flex items-center gap-2 p-1.5 rounded-xl border border-gray-200 bg-white shadow-xs">
          <div className="flex items-center gap-2 flex-1 px-3 text-gray-400">
            <Search className="h-4 w-4" />
            <input
              type="text"
              placeholder="Search by subject, grade, or tutor name..."
              className="w-full text-xs text-gray-700 outline-none bg-transparent"
              disabled
            />
          </div>
          <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2.5 py-1 rounded-lg">
            Preview
          </span>
        </div>

        {/* Category Pills */}
        <div className="mt-5 flex flex-wrap justify-center gap-2 max-w-2xl mx-auto">
          {sampleCategories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-medium text-gray-600 shadow-2xs"
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      {/* Already have a tutor card */}
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
            <UserPlus className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">Already learning with a tutor?</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Enter your tutor&apos;s unique invite code to unlock their live classroom and assignments right now.
            </p>
          </div>
        </div>

        <Button
          onClick={() => setJoinModalOpen(true)}
          className="text-xs bg-indigo-600 hover:bg-indigo-700 shrink-0 font-semibold"
        >
          <UserPlus className="mr-1.5 h-3.5 w-3.5" />
          Enter Invite Code
        </Button>
      </div>

      {/* Feature highlights preview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-2xs">
          <ShieldCheck className="h-5 w-5 text-indigo-600 mb-2" />
          <h4 className="text-xs font-bold text-gray-900">Verified Instructors</h4>
          <p className="text-[11px] text-gray-500 mt-1">
            Browse teacher backgrounds, qualifications, verified student reviews, and course curricula.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-2xs">
          <Video className="h-5 w-5 text-violet-600 mb-2" />
          <h4 className="text-xs font-bold text-gray-900">Interactive Classroom</h4>
          <p className="text-[11px] text-gray-500 mt-1">
            Experience ultra-low-latency WebRTC live classes with multi-page whiteboard and chat.
          </p>
        </div>

        <div className="rounded-xl border border-gray-100 bg-white p-4 shadow-2xs">
          <BookOpen className="h-5 w-5 text-amber-600 mb-2" />
          <h4 className="text-xs font-bold text-gray-900">Structured Progress</h4>
          <p className="text-[11px] text-gray-500 mt-1">
            Homework deadlines, practice tests, and detailed progress analytics all in one portal.
          </p>
        </div>
      </div>

      {/* Join Tutor Modal */}
      <JoinTutorModal
        isOpen={joinModalOpen}
        onClose={() => setJoinModalOpen(false)}
      />
    </div>
  )
}
