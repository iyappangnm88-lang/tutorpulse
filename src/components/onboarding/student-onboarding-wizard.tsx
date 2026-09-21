'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  School,
  Key,
  Compass,
  Check,
  Search,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/contexts/toast-context'
import { completeStudentOnboardingAction } from '@/app/onboarding/actions'

const COMMON_STUDENT_GRADES = [
  'Class 6',
  'Class 7',
  'Class 8',
  'Class 9',
  'Class 10',
  'Class 11',
  'Class 12',
  'College / Degree',
  'Competitive Exam Aspirant',
]

const COMMON_INTERESTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'Computer Science / Coding',
  'Social Studies',
  'Economics',
]

export function StudentOnboardingWizard({ initialName = '' }: { initialName?: string }) {
  const router = useRouter()
  const { toast } = useToast()

  // Steps (1 to 3)
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Student Fields
  const [fullName, setFullName] = useState(initialName)
  const [gradeLevel, setGradeLevel] = useState('Class 10')
  const [schoolName, setSchoolName] = useState('')
  const [interests, setInterests] = useState<string[]>(['Mathematics', 'Physics'])

  // Invitation choice
  const [inviteChoice, setInviteChoice] = useState<'has_code' | 'explore'>('explore')
  const [inviteCode, setInviteCode] = useState('')

  const toggleInterest = (sub: string) => {
    if (interests.includes(sub)) {
      setInterests(interests.filter((i) => i !== sub))
    } else {
      setInterests([...interests, sub])
    }
  }

  const handleNext = () => {
    setError(null)
    if (step === 1) {
      if (!fullName.trim()) {
        setError('Please enter your full name.')
        return
      }
      if (!gradeLevel.trim()) {
        setError('Please select your class or grade level.')
        return
      }
      setStep(2)
    } else if (step === 2) {
      setStep(3)
    }
  }

  const handleComplete = async (overrideExplore?: boolean) => {
    setError(null)
    setIsSubmitting(true)

    const codeToSubmit = overrideExplore || inviteChoice === 'explore' ? '' : inviteCode.trim()

    try {
      const res = await completeStudentOnboardingAction({
        fullName: fullName.trim(),
        gradeLevel: gradeLevel.trim(),
        schoolName: schoolName.trim() || undefined,
        interests,
        inviteCode: codeToSubmit || undefined,
      })

      if (!res.success) {
        setError(res.error || 'Failed to complete setup. Please try again.')
        return
      }

      if (res.data?.connectedTutor) {
        toast('success', 'Connected to Tutor!', `You have joined ${res.data.connectedTutor.workspace_name}.`)
      } else {
        toast('success', 'Account Ready!', 'Welcome to your student learning space.')
      }

      router.push('/student')
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
          <span>Step {step} of 3</span>
          <span className="text-violet-600 font-bold">
            {step === 1 && 'About You'}
            {step === 2 && 'Subjects & Interests'}
            {step === 3 && 'Tutor Connection'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
          <div
            className="h-full bg-violet-600 transition-all duration-300 rounded-full"
            style={{ width: `${(step / 3) * 100}%` }}
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

      {/* STEP 1: Student Profile & Grade */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-xl mb-3 mx-auto sm:mx-0 shadow-xs">
              🎓
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Welcome to TutorPulse!
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Tell us your name and current class so we can organize your homework, classes, and progress reports.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="studentName" required>
                Your Full Name
              </Label>
              <Input
                id="studentName"
                type="text"
                placeholder="e.g. Rahul Sharma"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoFocus
                className="mt-1.5"
              />
            </div>

            <div>
              <Label required>Class / Grade</Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {COMMON_STUDENT_GRADES.map((grade) => (
                  <button
                    key={grade}
                    type="button"
                    onClick={() => setGradeLevel(grade)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-left cursor-pointer ${
                      gradeLevel === grade
                        ? 'border-violet-600 bg-violet-50 text-violet-700 font-bold shadow-2xs'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {grade}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="schoolName">School or College Name (Optional)</Label>
              <Input
                id="schoolName"
                type="text"
                placeholder="e.g. Kendriya Vidyalaya or St. Xavier's"
                value={schoolName}
                onChange={(e) => setSchoolName(e.target.value)}
                className="mt-1.5 text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: Interests & Goals */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-xl mb-3 mx-auto sm:mx-0 shadow-xs">
              📖
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              What do you want to learn?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              Select the subjects you are taking or looking for tutoring in.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 pt-2">
              {COMMON_INTERESTS.map((sub) => {
                const isSelected = interests.includes(sub)
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => toggleInterest(sub)}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-violet-600 text-white shadow-xs'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {sub}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: Invitation Choice */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center text-xl mb-3 mx-auto sm:mx-0 shadow-xs">
              🤝
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              Do you have a TutorPulse invitation?
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 leading-relaxed">
              If your tutor gave you an invite link or code (like TP-XXXXXX), you can connect immediately. Or explore TutorPulse directly!
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Option A: Join with Invite Code */}
            <div
              onClick={() => setInviteChoice('has_code')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                inviteChoice === 'has_code'
                  ? 'border-violet-600 bg-violet-50/40 shadow-sm ring-2 ring-violet-500/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
                  <Key className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">I have an Invite Code</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Enter the 6-character code given by your tutor to connect.
                </p>
              </div>

              {inviteChoice === 'has_code' && (
                <div className="mt-4 pt-3 border-t border-violet-200/60" onClick={(e) => e.stopPropagation()}>
                  <Label htmlFor="code" className="text-[11px] font-bold text-violet-900 uppercase">
                    Invite Code
                  </Label>
                  <Input
                    id="code"
                    type="text"
                    placeholder="e.g. TP-482910"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                    className="mt-1 font-mono tracking-wider font-bold text-center uppercase"
                  />
                </div>
              )}
            </div>

            {/* Option B: Explore without Tutor */}
            <div
              onClick={() => setInviteChoice('explore')}
              className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                inviteChoice === 'explore'
                  ? 'border-violet-600 bg-violet-50/40 shadow-sm ring-2 ring-violet-500/10'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="space-y-2">
                <div className="h-10 w-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center">
                  <Compass className="h-5 w-5" />
                </div>
                <h4 className="font-bold text-gray-900 text-sm">Explore TutorPulse</h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Start without a tutor. You can join your tutor anytime later or browse future tutors.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-gray-100 text-[11px] text-gray-400">
                A tutor is not required to use TutorPulse.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Footer */}
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

        {step < 3 ? (
          <Button
            type="button"
            onClick={handleNext}
            className="px-6 h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-xs flex items-center gap-1.5"
          >
            <span>Next</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => handleComplete()}
            loading={isSubmitting}
            className="px-6 h-11 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs shadow-md shadow-violet-500/20 flex items-center gap-1.5"
          >
            <span>{inviteChoice === 'has_code' && inviteCode ? 'Join & Go to Dashboard' : 'Enter Student Dashboard'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  )
}
