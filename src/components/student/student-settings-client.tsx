'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { User, School, BookOpen, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateStudentProfileAction } from '@/app/onboarding/actions'

interface StudentSettingsClientProps {
  initialData: {
    fullName: string
    email: string
    gradeLevel: string | null
    schoolName: string | null
    interests: string[]
  }
}

export function StudentSettingsClient({ initialData }: StudentSettingsClientProps) {
  const router = useRouter()
  const [fullName, setFullName] = useState(initialData.fullName)
  const [gradeLevel, setGradeLevel] = useState(initialData.gradeLevel || '')
  const [schoolName, setSchoolName] = useState(initialData.schoolName || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fullName.trim()) {
      setError('Full name is required.')
      return
    }

    setLoading(true)
    setError(null)
    setSuccess(false)

    const res = await updateStudentProfileAction({
      fullName: fullName.trim(),
      gradeLevel: gradeLevel.trim() || undefined,
      schoolName: schoolName.trim() || undefined,
      interests: initialData.interests,
    })

    setLoading(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Student Profile & Settings</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          Manage your personal details and academic grade preferences
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-xs text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-100 bg-white p-6 shadow-2xs">
        {/* Account Info (Read-only) */}
        <div>
          <Label className="text-xs font-semibold text-gray-700">Email Address</Label>
          <Input
            value={initialData.email}
            disabled
            className="mt-1 bg-gray-50 text-gray-500 text-xs"
          />
          <p className="text-[11px] text-gray-400 mt-1">
            Linked to your authentication identity.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <Label htmlFor="fullName" className="text-xs font-semibold text-gray-700" required>
            Full Name
          </Label>
          <Input
            id="fullName"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className="mt-1 text-xs"
            placeholder="e.g. Alex Johnson"
          />
        </div>

        {/* Grade / Class */}
        <div>
          <Label htmlFor="gradeLevel" className="text-xs font-semibold text-gray-700">
            Class / Grade Level
          </Label>
          <Input
            id="gradeLevel"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. Grade 10, Class 12, Year 8"
          />
        </div>

        {/* School Name */}
        <div>
          <Label htmlFor="schoolName" className="text-xs font-semibold text-gray-700">
            School or College (Optional)
          </Label>
          <Input
            id="schoolName"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. St. Xavier High School"
          />
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="text-xs bg-indigo-600 hover:bg-indigo-700 font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                Saving Changes...
              </>
            ) : (
              'Save Profile'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
