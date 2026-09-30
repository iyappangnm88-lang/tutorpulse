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
  Store,
  DollarSign,
  Eye,
  MapPin,
  Check,
  Shield,
  Palette,
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

const TEMPLATE_OPTIONS = [
  { id: 'modern', name: 'Modern Tech', desc: 'High-contrast metrics & energetic green', accent: 'bg-[#55C832]' },
  { id: 'elegant', name: 'Elegant Editorial', desc: 'Timeless serif typography & warm stone', accent: 'bg-amber-600' },
  { id: 'academic', name: 'Academic Dossier', desc: 'Structured deep navy registry style', accent: 'bg-slate-800' },
  { id: 'minimal', name: 'Scandinavian Minimal', desc: 'Monochromatic, clean whitespace', accent: 'bg-gray-400' },
  { id: 'creative', name: 'Creative Passion', desc: 'Warm terracotta & playful sticker badge', accent: 'bg-rose-500' },
]

export function TutorOnboardingWizard({ initialName = '' }: { initialName?: string }) {
  const router = useRouter()
  const { toast } = useToast()

  // Wizard Step (1 to 5)
  // Step 1: Core Tutor Profile
  // Step 2: Marketplace Choice
  // Step 3: Marketplace Details & Pricing
  // Step 4: Marketplace Preview
  // Step 5: Ready to Teach
  const [step, setStep] = useState<number>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Step 1 State: Profile Foundation
  const [displayName, setDisplayName] = useState(initialName)
  const [bio, setBio] = useState('')
  const [experienceYears, setExperienceYears] = useState<number>(1)
  const [teachingMode, setTeachingMode] = useState<'online' | 'offline' | 'both'>('both')
  const [primarySubjects, setPrimarySubjects] = useState<string[]>(['Mathematics'])
  const [customSubject, setCustomSubject] = useState('')
  const [targetClasses, setTargetClasses] = useState<string[]>(['Class 9-10'])
  const [teachingLanguages, setTeachingLanguages] = useState<string[]>(['English'])

  // Step 2/3/4 State: Marketplace & Pricing
  const [isPublicMarketplace, setIsPublicMarketplace] = useState<boolean>(false)
  const [headline, setHeadline] = useState('')
  const [teachingApproach, setTeachingApproach] = useState('')
  const [locationRegion, setLocationRegion] = useState('')
  const [profileTemplate, setProfileTemplate] = useState<string>('modern')
  const [pricingRate, setPricingRate] = useState<string>('1500')
  const [pricingUnit, setPricingUnit] = useState<string>('per_month')
  const [pricingCurrency, setPricingCurrency] = useState<string>('INR')
  const [pricingDescription, setPricingDescription] = useState('')

  // Helper toggles
  const toggleSubject = (sub: string) => {
    if (primarySubjects.includes(sub)) {
      if (primarySubjects.length > 1) {
        setPrimarySubjects(primarySubjects.filter((s) => s !== sub))
      }
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
      if (teachingLanguages.length > 1) {
        setTeachingLanguages(teachingLanguages.filter((l) => l !== lang))
      }
    } else {
      setTeachingLanguages([...teachingLanguages, lang])
    }
  }

  // Navigation handlers
  const handleStep1Next = () => {
    setError(null)
    if (!displayName.trim()) {
      setError('Please enter your full name or teaching display name.')
      return
    }
    if (primarySubjects.length === 0) {
      setError('Please select or add at least one subject you teach.')
      return
    }
    // Auto-generate default headline if blank
    if (!headline.trim()) {
      setHeadline(`${primarySubjects.slice(0, 2).join(' & ')} Educator with ${experienceYears}+ Years Experience`)
    }
    setStep(2)
  }

  const handleStartMarketplaceSetup = () => {
    setError(null)
    setStep(3)
  }

  const handleSkipMarketplaceFromChoice = () => {
    setError(null)
    setIsPublicMarketplace(false)
    setStep(5)
  }

  const handleStep3Next = () => {
    setError(null)
    if (!headline.trim()) {
      setError('Please provide a short headline for your marketplace card.')
      return
    }
    setStep(4)
  }

  const handlePublishFromPreview = () => {
    setIsPublicMarketplace(true)
    setStep(5)
  }

  const handleSkipFromPreview = () => {
    setIsPublicMarketplace(false)
    setStep(5)
  }

  const handleFinalLaunch = async () => {
    setError(null)
    setIsSubmitting(true)

    try {
      const parsedRate = pricingRate ? parseFloat(pricingRate) : null
      const res = await completeTutorOnboardingAction({
        displayName: displayName.trim(),
        bio: bio.trim(),
        primarySubjects,
        targetClasses,
        teachingLanguages,
        teachingMode,
        experienceYears,
        isPublicMarketplace,
        headline: headline.trim() || undefined,
        teachingApproach: teachingApproach.trim() || undefined,
        locationRegion: locationRegion.trim() || undefined,
        profileTemplate,
        pricingRate: parsedRate && !isNaN(parsedRate) ? parsedRate : null,
        pricingUnit,
        pricingCurrency,
        pricingDescription: pricingDescription.trim() || undefined,
      })

      if (!res.success) {
        setError(res.error || 'Failed to complete setup. Please try again.')
        return
      }

      toast(
        'success',
        isPublicMarketplace ? 'Marketplace Profile Live!' : 'Tutor Workspace Ready!',
        isPublicMarketplace
          ? 'Your profile is now discoverable by students across Nuzigo.'
          : 'Welcome to your Nuzigo workspace. You can publish to marketplace anytime in Settings.'
      )
      router.push('/dashboard')
      router.refresh()
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Currency symbol helper
  const currencySymbol = pricingCurrency === 'INR' ? '₹' : pricingCurrency === 'USD' ? '$' : pricingCurrency === 'EUR' ? '€' : pricingCurrency === 'GBP' ? '£' : pricingCurrency

  return (
    <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl p-6 sm:p-10 space-y-8 animate-fade-in max-w-2xl mx-auto">
      {/* 5-Step Visual Progress Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
          <span>Step {step} of 5</span>
          <span className="text-[#318A25] font-bold">
            {step === 1 && '1. Teaching Profile'}
            {step === 2 && '2. Marketplace'}
            {step === 3 && '3. Details & Fees'}
            {step === 4 && '4. Profile Preview'}
            {step === 5 && '5. Ready to Teach'}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full bg-[#55C832] transition-all duration-300 rounded-full"
            style={{ width: `${(step / 5) * 100}%` }}
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

      {/* ========================================================================= */}
      {/* STEP 1: Main Nuzigo Tutor Profile                                         */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-[#FAFBEF] text-[#318A25] flex items-center justify-center text-xl mb-2 mx-auto sm:mx-0 shadow-xs border border-[#55C832]/20">
              🧑‍🏫
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#172B4D]">
              Create your Nuzigo tutor profile
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              This information powers your teaching batches, attendance sheets, and student classrooms.
            </p>
          </div>

          <div className="space-y-4 pt-1">
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
                      className={`px-2.5 py-2 rounded-xl text-xs font-semibold border capitalize transition-all cursor-pointer ${
                        teachingMode === mode
                          ? 'border-[#55C832] bg-[#FAFBEF] text-[#318A25] font-bold shadow-2xs'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>
            </div>

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
                          ? 'bg-[#55C832] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {sub}
                    </button>
                  )
                })}
              </div>

              {/* Custom Subject */}
              <div className="flex gap-2 mt-3">
                <Input
                  placeholder="Add other subject (e.g. Sanskrit, Coding, SAT)"
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
                  className="shrink-0 text-xs"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
            </div>

            {/* Target Classes */}
            <div>
              <Label>Target Classes / Grade Levels</Label>
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
                          ? 'bg-[#55C832] text-white shadow-xs'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      {grade}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Teaching Bio */}
            <div>
              <Label htmlFor="bio">Teaching Bio / Pedagogical Philosophy (Optional)</Label>
              <textarea
                id="bio"
                rows={2}
                placeholder="e.g. 5+ years mentoring CBSE students with conceptual clarity, weekly quizzes, and interactive doubt clearing."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full mt-1.5 rounded-xl border border-slate-200 p-3 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-[#55C832] focus:outline-none focus:ring-1 focus:ring-[#55C832]"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end">
            <Button
              type="button"
              onClick={handleStep1Next}
              className="bg-[#55C832] hover:bg-[#318A25] text-white font-bold px-6 h-11 rounded-xl text-xs flex items-center gap-2 shadow-xs"
            >
              <span>Continue: Marketplace Setup</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: Marketplace Choice (with clear "Skip for now")                   */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="space-y-6">
          <div className="text-center sm:text-left space-y-2">
            <div className="h-12 w-12 rounded-2xl bg-[#55C832]/15 text-[#318A25] flex items-center justify-center text-xl mb-2 mx-auto sm:mx-0 shadow-xs border border-[#55C832]/30">
              <Store className="h-6 w-6 text-[#318A25]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#172B4D]">
              Want students to discover you?
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Create your public Nuzigo marketplace profile so curious students and parents searching for your subjects and region can find your offerings and request to enroll.
            </p>
          </div>

          {/* Benefits Box */}
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50/60 p-5 space-y-3">
            <h3 className="text-xs font-bold text-emerald-900 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-600" />
              What your public profile includes
            </h3>
            <ul className="space-y-2 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Dedicated public profile link (e.g. <code>nuzigo.com/tutors/{displayName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'your-name'}</code>)</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Transparent fee and batch schedule display so students know what to expect</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Direct student join requests sent to your approval inbox</span>
              </li>
            </ul>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500">
            💡 <strong>Prefer teaching your existing students privately?</strong> You can skip marketplace publishing now and continue directly to your private workspace. You can always publish later from Settings.
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(1)}
              className="w-full sm:w-auto rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipMarketplaceFromChoice}
                className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Skip for now
              </Button>

              <Button
                type="button"
                onClick={handleStartMarketplaceSetup}
                className="w-full sm:w-auto bg-[#55C832] hover:bg-[#318A25] text-white font-bold px-5 h-11 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Create Marketplace Profile</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: Marketplace Details & Fee Setup                                  */}
      {/* ========================================================================= */}
      {step === 3 && (
        <div className="space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-[#FAFBEF] text-[#318A25] flex items-center justify-center text-xl mb-2 mx-auto sm:mx-0 shadow-xs border border-[#55C832]/20">
              🎯
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#172B4D]">
              Marketplace Details & Teaching Fees
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Add details that help prospective students understand your teaching focus and fee structure.
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="headline" required>
                Public Headline
              </Label>
              <Input
                id="headline"
                placeholder="e.g. Senior CBSE & ICSE Mathematics Mentor | 8+ Yrs Experience"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                className="mt-1.5"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                A concise summary displayed on marketplace search cards.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="region">City / Region (for local discoverability)</Label>
                <Input
                  id="region"
                  placeholder="e.g. Indiranagar, Bengaluru or Online"
                  value={locationRegion}
                  onChange={(e) => setLocationRegion(e.target.value)}
                  className="mt-1.5"
                />
              </div>

              <div>
                <Label>Teaching Languages</Label>
                <div className="flex flex-wrap gap-1.5 mt-1.5">
                  {COMMON_LANGUAGES.slice(0, 4).map((lang) => {
                    const isSelected = teachingLanguages.includes(lang)
                    return (
                      <button
                        key={lang}
                        type="button"
                        onClick={() => toggleLanguage(lang)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                          isSelected
                            ? 'bg-[#55C832] text-white border-[#55C832]'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        {lang}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Template Choice */}
            <div>
              <Label className="flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-[#318A25]" />
                Profile Template Style
              </Label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2">
                {TEMPLATE_OPTIONS.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setProfileTemplate(tmpl.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      profileTemplate === tmpl.id
                        ? 'border-[#55C832] bg-[#FAFBEF] ring-1 ring-[#55C832]/30 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900">{tmpl.name}</span>
                      <span className={`h-2.5 w-2.5 rounded-full ${tmpl.accent}`} />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1 line-clamp-1">{tmpl.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Section: Teaching Fees */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/70 space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#55C832] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                  ₹
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[#172B4D]">Set Your Teaching Fees</h3>
                  <p className="text-[11px] text-slate-500">
                    Provides upfront pricing transparency for parents and students before they connect.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <Label htmlFor="currency">Currency</Label>
                  <select
                    id="currency"
                    value={pricingCurrency}
                    onChange={(e) => setPricingCurrency(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-[#55C832] focus:outline-none"
                  >
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                    <option value="EUR">EUR (€)</option>
                    <option value="GBP">GBP (£)</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="rate">Fee Amount</Label>
                  <Input
                    id="rate"
                    type="number"
                    min={0}
                    step={50}
                    placeholder="e.g. 1500"
                    value={pricingRate}
                    onChange={(e) => setPricingRate(e.target.value)}
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label htmlFor="unit">Billing Unit</Label>
                  <select
                    id="unit"
                    value={pricingUnit}
                    onChange={(e) => setPricingUnit(e.target.value)}
                    className="w-full mt-1.5 rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-900 focus:border-[#55C832] focus:outline-none"
                  >
                    <option value="per_month">Per Month</option>
                    <option value="per_class">Per Class</option>
                    <option value="per_hour">Per Hour</option>
                  </select>
                </div>
              </div>

              <div>
                <Label htmlFor="pricingDesc">Pricing Note (Optional)</Label>
                <Input
                  id="pricingDesc"
                  placeholder="e.g. 8 sessions/month, study materials, and weekly assessments included"
                  value={pricingDescription}
                  onChange={(e) => setPricingDescription(e.target.value)}
                  className="mt-1.5 text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="w-full sm:w-auto rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipMarketplaceFromChoice}
                className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Skip for now
              </Button>

              <Button
                type="button"
                onClick={handleStep3Next}
                className="w-full sm:w-auto bg-[#55C832] hover:bg-[#318A25] text-white font-bold px-6 h-11 rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs"
              >
                <span>Preview Marketplace Profile</span>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: Live Marketplace Profile Preview                                 */}
      {/* ========================================================================= */}
      {step === 4 && (
        <div className="space-y-6">
          <div className="space-y-1.5 text-center sm:text-left">
            <div className="h-12 w-12 rounded-2xl bg-[#FAFBEF] text-[#318A25] flex items-center justify-center text-xl mb-2 mx-auto sm:mx-0 shadow-xs border border-[#55C832]/20">
              <Eye className="h-6 w-6 text-[#318A25]" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#172B4D]">
              This is how students will see you
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Review your public tutor card before publishing it to the student discovery directory.
            </p>
          </div>

          {/* Interactive Simulated Marketplace Card */}
          <div className="rounded-3xl border-2 border-slate-200/90 bg-white p-6 shadow-md hover:border-[#55C832]/40 transition-all space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-[#172B4D] to-[#318A25] text-white flex items-center justify-center font-bold text-xl shadow-xs shrink-0">
                  {displayName.slice(0, 2).toUpperCase() || 'TP'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-base font-black text-[#172B4D]">{displayName}</h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#55C832]/15 text-[#318A25] border border-[#55C832]/30">
                      <Shield className="h-3 w-3" />
                      Verified Tutor
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-600 mt-0.5">
                    {headline}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>{experienceYears}+ years experience</span>
                    {locationRegion && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-slate-400" />
                          {locationRegion}
                        </span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Fee Pill */}
              {pricingRate && (
                <div className="text-right shrink-0 bg-[#FAFBEF] border border-[#55C832]/30 px-3 py-1.5 rounded-xl">
                  <div className="text-sm font-black text-[#318A25]">
                    {currencySymbol}{pricingRate}
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 lowercase">
                    / {pricingUnit.replace('per_', '')}
                  </div>
                </div>
              )}
            </div>

            {/* Subjects & Mode */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {primarySubjects.map((s) => (
                <span
                  key={s}
                  className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700"
                >
                  {s}
                </span>
              ))}
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-50 text-purple-700 capitalize border border-purple-100">
                {teachingMode} Classroom
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-100 capitalize">
                Style: {profileTemplate}
              </span>
            </div>

            {/* Bio snippet */}
            {bio && (
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100 line-clamp-2">
                &ldquo;{bio}&rdquo;
              </p>
            )}

            {/* Simulated CTA button */}
            <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs text-slate-400">
              <span>Preview of student action:</span>
              <span className="px-3.5 py-1.5 rounded-xl bg-[#55C832] text-white font-bold text-xs shadow-xs pointer-events-none opacity-90">
                Request to Join
              </span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(3)}
              className="w-full sm:w-auto rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Edit Details
            </Button>

            <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
              <Button
                type="button"
                variant="ghost"
                onClick={handleSkipFromPreview}
                className="w-full sm:w-auto text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl"
              >
                Skip for now (Save as Private)
              </Button>

              <Button
                type="button"
                onClick={handlePublishFromPreview}
                className="w-full sm:w-auto bg-[#55C832] hover:bg-[#318A25] text-white font-bold px-6 h-11 rounded-xl text-xs flex items-center justify-center gap-2 shadow-md shadow-[#55C832]/20"
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Publish to Marketplace</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 5: Ready to Teach Launch                                             */}
      {/* ========================================================================= */}
      {step === 5 && (
        <div className="space-y-6">
          <div className="space-y-2 text-center sm:text-left">
            <div className="h-14 w-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl mb-3 mx-auto sm:mx-0 shadow-xs border border-emerald-200">
              🚀
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#172B4D]">
              You&apos;re ready to teach on Nuzigo!
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              {isPublicMarketplace
                ? 'Your public marketplace profile is ready to go live and your complete teaching workspace is configured.'
                : 'Your private teaching workspace is ready. Your profile remains private until you decide to publish.'}
            </p>
          </div>

          {/* Configuration Summary Card */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3 text-xs sm:text-sm">
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Tutor Name</span>
              <span className="font-bold text-[#172B4D]">{displayName}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Teaching Mode</span>
              <span className="font-semibold text-[#318A25] capitalize">{teachingMode}</span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Primary Subjects</span>
              <span className="font-medium text-slate-800 text-right max-w-[60%] truncate">
                {primarySubjects.join(', ')}
              </span>
            </div>
            <div className="flex justify-between border-b border-slate-200/60 pb-2">
              <span className="text-slate-500 font-medium">Marketplace Status</span>
              <span
                className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                  isPublicMarketplace
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {isPublicMarketplace ? 'Public & Discoverable' : 'Private Workspace'}
              </span>
            </div>
            {isPublicMarketplace && pricingRate && (
              <div className="flex justify-between">
                <span className="text-slate-500 font-medium">Display Fee</span>
                <span className="font-bold text-[#318A25]">
                  {currencySymbol}{pricingRate} / {pricingUnit.replace('per_', '')}
                </span>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-[#FAFBEF] border border-[#55C832]/30 text-xs text-[#318A25] flex items-start gap-2.5">
            <CheckCircle2 className="h-4 w-4 text-[#318A25] shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Your online classroom, offline batch registers, homework engine, and attendance system are now provisioned.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(isPublicMarketplace ? 4 : 2)}
              disabled={isSubmitting}
              className="rounded-xl text-xs font-semibold"
            >
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back
            </Button>

            <Button
              type="button"
              onClick={handleFinalLaunch}
              loading={isSubmitting}
              className="bg-[#55C832] hover:bg-[#318A25] text-white font-black px-6 h-12 rounded-xl text-xs shadow-md shadow-[#55C832]/25 flex items-center gap-2"
            >
              <span>Enter Tutor Dashboard</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
