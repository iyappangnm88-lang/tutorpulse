'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  BookOpen,
  User,
  GraduationCap,
  Layers,
  Globe,
  Briefcase,
  Plus,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/toast-context'
import { completeTutorOnboardingAction } from '@/app/onboarding/actions'

const COMMON_SUBJECTS = [
  'Mathematics',
  'Science',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Hindi',
  'Computer Science',
  'Social Science',
  'Economics',
  'Accountancy',
]

const COMMON_GRADES = [
  'Class 1-5',
  'Class 6-8',
  'Class 9-10',
  'Class 11-12',
  'Undergraduate / College',
  'Competitive Exams',
]

const COMMON_LANGUAGES = ['English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Bengali', 'Marathi']

export function TutorOnboardingWizard({ initialName = '' }: { initialName?: string }) {
  const router = useRouter()
  const { toast } = useToast()

  // Wizard Step (1 to 4)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form State
  const [displayName, setDisplayName] = useState(initialName)
  const [bio, setBio] = useState('')
  const [experienceYears, setExperienceYears] = useState<number>(1)
  const [teachingMode, setTeachingMode] = useState<'online' | 'offline' | 'both'>('both')

  // Subjects & Grades State
  const [primarySubjects, setPrimarySubjects] = useState<string[]>(['Mathematics'])
  const [customSubject, setCustomSubject] = useState('')
  const [targetClasses, setTargetClasses] = useState<string[]>(['Class 9-10'])
  const [teachingLanguages, setTeachingLanguages] = useState<string[]>(['English'])

  const toggleSubject = (sub: string) => {
    if (primarySubjects.includes(sub)) {
      setPrimarySubjects(primarySubjects.filter((s) => s !== sub))
    } else {
      setPrimarySubjects([...primarySubjects, sub])
    }
  }

  const addCustomSubject = () => {
    const trimmed = customSubject.trim()
    if (trimmed && !primarySubjects.includes(trimmed)) {
      setPrimarySubjects([...primarySubjects, trimmed])
      setCustomSubject('')
    }
  }

  const toggleGrade = (grade: string) => {
    if (targetClasses.includes(grade)) {
      setTargetClasses(targetClasses.filter((g) => g !== grade))
    } else {
      setTargetClasses([...targetClasses, grade])
    }
  }

  const toggleLanguage = (lang: string) => {
    if (teachingLanguages.includes(lang)) {
      setTeachingLanguages(teachingLanguages.filter((l) => l !== lang))
    } else {
      setTeachingLanguages([...teachingLanguages, lang])
    }
  }

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!displayName.trim()) {
        setError('Please enter your display name to continue.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    } else if (step === 3) {
      if (primarySubjects.length === 0) {
        setError('Please select or add at least one subject you teach.')
        return
      }
      setStep(4)
    }
  }

  const handleComplete = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const res = await completeTutorOnboardingAction({
        displayName: displayName.trim(),
        bio: bio.trim(),
        primarySubjects,
        targetClasses,
        teachingLanguages,
        teachingMode,
        experienceYears,
      })

      if (!res.success) {
        setError(res.error || 'Failed to complete setup. Please try again.')
        return
      }

      toast('success', 'Profile Ready!', 'Welcome to your TutorPulse teaching workspace.')
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-3xl border border-gray-200/90 shadow-xl p-6 sm:p-10 space-y-8 animate-fade-in">
      {/* Progress Indicators */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-gray-500">
          <span>Step {step} of 4</span>
          <span className="text-indigo-600 font-bold">
            {step === 1 && 'Welcome'}
            {step === 2 && 'About You'}
            {step === 3 && 'Teaching Focus'}
            {step === 4 && 'Launch'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-indigo-600 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs sm:text-sm font-medium"
        >
          {error}
        </div>
      )}

      {/* SCREEN 1: Welcome to TutorPulse */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3 mx-auto sm:mx-0 shadow-xs">
              👋
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome to TutorPulse
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Let&apos;s personalize your tutor profile. This name will appear on your batches, attendance sheets, and parent portal.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="displayName" required>
                Your Full Name / Teaching Display Name
              </Label>
              <Input
                id="displayName"
                type="text"
                placeholder="e.g. Dr. Priya Sharma or Mahesh Coaching"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                autoFocus
                className="mt-1.5"
              />
              <p className="text-[11px] text-gray-400 mt-1">
                You can change this anytime in Settings.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 2: Tell students about yourself */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3 mx-auto sm:mx-0 shadow-xs">
              📝
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Tell students about yourself
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Add a brief bio and your teaching style. (Optional, can be updated later).
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="bio">Short Bio or Teaching Philosophy</Label>
              <textarea
                id="bio"
                rows={3}
                placeholder="e.g. 5+ years experience mentoring Class 10 & 12 students in CBSE Mathematics with a focus on conceptual clarity."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full mt-1.5 rounded-xl border border-gray-300 p-3 text-xs sm:text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="experience">Years of Experience</Label>
                <Input
                  id="experience"
                  type="number"
                  min={0}
                  max={60}
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value) || 0)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Teaching Mode</Label>
                <div className="grid grid-cols-3 gap-1.5 mt-1.5">
                  {(['both', 'offline', 'online'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setTeachingMode(mode)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold border capitalize transition-all cursor-pointer ${
                        teachingMode === mode
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-bold shadow-2xs'
                          : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 3: Choose what you teach */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl mb-3 mx-auto sm:mx-0 shadow-xs">
              📚
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Choose what you teach
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Select the subjects and classes you specialize in.
            </p>
          </div>

          <div className="space-y-5">
            {/* Primary Subjects */}
            <div>
              <Label required>Primary Teaching Subjects</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_SUBJECTS.map((sub) => {
                  const isSelected = primarySubjects.includes(sub)
                  return (
                    <button
                      key={sub}
                      type="button"
                      onClick={() => toggleSubject(sub)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {sub}
                    </button>
                  )
                })}
              </div>

              {/* Custom Subject Input */}
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add other subject (e.g. Sanskrit, French, SAT)"
                  value={customSubject}
                  onChange={(e) => setCustomSubject(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomSubject()
                    }
                  }}
                  className="text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addCustomSubject}
                  disabled={!customSubject.trim()}
                  className="shrink-0"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Target Classes */}
            <div>
              <Label>Target Classes / Grades</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMON_GRADES.map((grade) => {
                  const isSelected = targetClasses.includes(grade)
                  return (
                    <button
                      key={grade}
                      type="button"
                      onClick={() => toggleGrade(grade)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {grade}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SCREEN 4: You're ready to teach 🚀 */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-xl mb-3 mx-auto sm:mx-0 shadow-xs">
              🚀
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              You&apos;re ready to teach!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Here is a quick summary of your teaching profile. Both your Offline and Online teaching workspaces are ready.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between border-b border-gray-200/60 pb-2">
              <span className="text-gray-500">Tutor Name</span>
              <span className="font-bold text-gray-900">{displayName}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200/60 pb-2">
              <span className="text-gray-500">Teaching Mode</span>
              <span className="font-semibold text-indigo-600 capitalize">{teachingMode}</span>
            </div>
            <div className="flex justify-between border-b border-gray-200/60 pb-2">
              <span className="text-gray-500">Subjects</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">
                {primarySubjects.join(', ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Classes</span>
              <span className="font-medium text-gray-900 text-right max-w-[60%] truncate">
                {targetClasses.join(', ') || 'All Grades'}
              </span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-100 text-[11px] sm:text-xs text-indigo-700 flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your profile is private by default. When the student marketplace launches, you can choose whether to publish your profile.
            </p>
          </div>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-200/80">
        {step > 1 ? (
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(step - 1)}
            disabled={isSubmitting}
            className="rounded-xl text-xs font-semibold"
          >
            <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
            Back
          </Button>
        ) : (
          <div />
        )}

        {step < 4 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="px-6 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleComplete}
            loading={isSubmitting}
            className="px-6 h-11 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md shadow-indigo-500/20 flex items-center gap-1.5"
          >
            <span>Enter Tutor Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
