'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GraduationCap, BookOpen, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/contexts/toast-context'
import { selectRoleAction } from '../actions'

export default function RoleSelectionPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [selectedRole, setSelectedRole] = useState<'tutor' | 'student' | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (!selectedRole) {
      setError('Please select how you will use TutorPulse to continue.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const res = await selectRoleAction(selectedRole)
      if (!res.success) {
        setError(res.error || 'Failed to select role. Please try again.')
        return
      }

      toast('info', 'Role selected', `Setting up your ${selectedRole === 'tutor' ? 'Tutor' : 'Student'} profile.`)
      if (selectedRole === 'tutor') {
        router.push('/onboarding/tutor')
      } else {
        router.push('/onboarding/student')
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in">
      {/* Page Title & Intro */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold tracking-wide">
          <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
          <span>Step 1 of 2</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
          How will you use TutorPulse?
        </h1>
        <p className="text-sm text-gray-600 max-w-md mx-auto leading-relaxed">
          Choose your account type to get started. Your teaching or learning tools will be tailored to your choice.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium"
        >
          {error}
        </div>
      )}

      {/* Two Large Choice Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        {/* Card 1: Tutor */}
        <div
          onClick={() => setSelectedRole('tutor')}
          className={`relative group rounded-3xl p-6 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
            selectedRole === 'tutor'
              ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-4 ring-indigo-500/10'
              : 'border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-sm'
          }`}
          role="radio"
          aria-checked={selectedRole === 'tutor'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              setSelectedRole('tutor')
            }
          }}
        >
          {selectedRole === 'tutor' && (
            <div className="absolute top-4 right-4 text-indigo-600">
              <CheckCircle2 className="h-6 w-6 fill-indigo-600 text-white" />
            </div>
          )}

          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-100/80 text-indigo-600 flex items-center justify-center text-2xl shadow-xs">
              👨🏫
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Tutor
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                Manage students, batches, classes and teaching.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200/60 space-y-1.5 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <span>Offline & Online Workspaces</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <span>Attendance, Fees & Reports</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
              <span>Live Whiteboard & Classroom</span>
            </div>
          </div>
        </div>

        {/* Card 2: Student */}
        <div
          onClick={() => setSelectedRole('student')}
          className={`relative group rounded-3xl p-6 border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between text-left ${
            selectedRole === 'student'
              ? 'border-indigo-600 bg-indigo-50/40 shadow-md ring-4 ring-indigo-500/10'
              : 'border-gray-200/90 bg-white hover:border-gray-300 hover:shadow-sm'
          }`}
          role="radio"
          aria-checked={selectedRole === 'student'}
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === ' ' || e.key === 'Enter') {
              e.preventDefault()
              setSelectedRole('student')
            }
          }}
        >
          {selectedRole === 'student' && (
            <div className="absolute top-4 right-4 text-indigo-600">
              <CheckCircle2 className="h-6 w-6 fill-indigo-600 text-white" />
            </div>
          )}

          <div className="space-y-4">
            <div className="h-14 w-14 rounded-2xl bg-violet-100/80 text-violet-600 flex items-center justify-center text-2xl shadow-xs">
              🎓
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">
                Student
              </h3>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 leading-relaxed">
                Join tutors, attend classes and track your learning.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200/60 space-y-1.5 text-[11px] text-gray-500">
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
              <span>Join Live Classes & Video</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
              <span>Homework & Test Tracking</span>
            </div>
            <div className="flex items-center gap-1.5 font-medium text-gray-700">
              <span className="h-1.5 w-1.5 rounded-full bg-violet-600" />
              <span>Independent Student Account</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action CTA */}
      <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-xs text-gray-500 text-center sm:text-left">
          You can also link parent accounts automatically when signing in via Google.
        </p>

        <Button
          onClick={handleContinue}
          loading={isSubmitting}
          disabled={!selectedRole}
          size="lg"
          className="w-full sm:w-auto px-8 h-12 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2"
        >
          <span>Continue as {selectedRole ? (selectedRole === 'tutor' ? 'Tutor' : 'Student') : '...'}</span>
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}
