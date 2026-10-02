'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, School, BookOpen, Loader2, CheckCircle2, AlertCircle, Sparkles, Moon, LogOut, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeSelector } from '@/components/theme/theme-selector'
import { createClient } from '@/lib/supabase/client'
import { updateStudentProfileAction } from '@/app/student/actions'

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
  const [interestsStr, setInterestsStr] = useState((initialData.interests || []).join(', '))
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

    const parsedInterests = interestsStr
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)

    const res = await updateStudentProfileAction({
      fullName: fullName.trim(),
      gradeLevel: gradeLevel.trim() || undefined,
      schoolName: schoolName.trim() || undefined,
      interests: parsedInterests,
    })

    setLoading(false)

    if (!res.success) {
      setError(res.error || 'Failed to update profile.')
    } else {
      setSuccess(true)
      router.refresh()
      setTimeout(() => setSuccess(false), 3000)
    }
  }

  return (
    <div className="space-y-6 max-w-2xl animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/student/profile"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors mb-2"
          >
            ← Back to Profile
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-[#F4F7F2]">Student Settings</h1>
          <p className="text-xs text-gray-500 dark:text-[#A8B3A5] mt-0.5">
            Manage your personal details, academic grade, study interests, and app theme
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* Global Theme Selector Section */}
      <div className="rounded-2xl border border-gray-100 dark:border-[#293329] bg-white dark:bg-[#161D16] p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Moon className="h-4 w-4 text-[#55C832] dark:text-[#6BEA45]" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">Appearance & Theme</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
          Customize your Nuzigo interface appearance across Light, Obsidian Electric Green Dark Mode, or match your device system settings.
        </p>
        <ThemeSelector />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5 rounded-2xl border border-gray-100 dark:border-[#293329] bg-white dark:bg-[#161D16] p-6 shadow-2xs">
        <div className="flex items-center gap-2 pb-1 border-b border-gray-100 dark:border-[#293329]">
          <User className="h-4 w-4 text-[#55C832] dark:text-[#6BEA45]" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">Academic Profile</h2>
        </div>

        {/* Account Info (Read-only) */}
        <div>
          <Label className="text-xs font-semibold text-gray-700 dark:text-[#A8B3A5]">Email Address</Label>
          <Input
            value={initialData.email}
            disabled
            className="mt-1 bg-gray-50 dark:bg-[#111711] text-gray-500 dark:text-[#A8B3A5] text-xs font-medium cursor-not-allowed border-gray-200 dark:border-[#293329]"
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Linked to your primary authentication identity.
          </p>
        </div>

        {/* Full Name */}
        <div>
          <Label htmlFor="fullName" className="text-xs font-semibold text-gray-700 dark:text-[#A8B3A5]" required>
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
          <Label htmlFor="gradeLevel" className="text-xs font-semibold text-gray-700 dark:text-[#A8B3A5]">
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
          <Label htmlFor="schoolName" className="text-xs font-semibold text-gray-700 dark:text-[#A8B3A5]">
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

        {/* Academic Interests / Subjects */}
        <div>
          <Label htmlFor="interests" className="text-xs font-semibold text-gray-700 dark:text-[#A8B3A5]">
            Academic Subjects & Interests
          </Label>
          <Input
            id="interests"
            value={interestsStr}
            onChange={(e) => setInterestsStr(e.target.value)}
            className="mt-1 text-xs"
            placeholder="e.g. Mathematics, Physics, Computer Science, Biology"
          />
          <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
            Separate subjects with commas.
          </p>
        </div>

        <div className="pt-2">
          <Button
            type="submit"
            disabled={loading}
            className="text-xs font-semibold"
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

      {/* Account & Session Management */}
      <div className="rounded-2xl border border-red-100 dark:border-red-950/40 bg-white dark:bg-[#161D16] p-6 shadow-2xs space-y-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-bold text-gray-900 dark:text-[#F4F7F2]">Account & Session</h2>
        </div>
        <p className="text-xs text-gray-500 dark:text-[#A8B3A5]">
          Manage your active student session. Signing out will require you to log back in with your email credentials.
        </p>
        <div className="pt-1">
          <Button
            type="button"
            variant="danger"
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              router.push('/login')
              router.refresh()
            }}
            className="text-xs font-semibold inline-flex items-center gap-2"
          >
            <LogOut className="h-3.5 w-3.5" />
            Sign Out of Nuzigo
          </Button>
        </div>
      </div>
    </div>
  )
}
