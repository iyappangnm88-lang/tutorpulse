'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { GoogleSignInButton } from '@/components/auth/google-sign-in-button'
import { useToast } from '@/contexts/toast-context'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{
    name?: string
    email?: string
    password?: string
    general?: string
  }>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const err = params.get('error')
      if (err) {
        if (err === 'auth_callback_error') {
          setErrors({ general: 'Authentication was cancelled or could not be verified. Please try again.' })
        } else {
          setErrors({ general: decodeURIComponent(err) })
        }
      }
    }
  }, [])

  function validate() {
    const e: typeof errors = {}
    if (!name.trim()) e.name = 'Name is required.'
    if (!email.trim()) e.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Please enter a valid email address.'
    if (!password) e.password = 'Password is required.'
    else if (password.length < 8) e.password = 'Password must be at least 8 characters.'
    return e
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const fieldErrors = validate()
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      const supabase = createClient()

      // Step 1: Create auth user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          setErrors({ general: 'An account with this email already exists. Please sign in instead.' })
        } else {
          setErrors({ general: error.message })
        }
        return
      }

      // Step 2: If user is immediately confirmed (email confirmation disabled),
      // create the profile row right away
      if (data.user && data.session) {
        // User is logged in immediately — create profile
        await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: name,
          email: email,
          role: 'tutor',
        })
        toast('success', 'Welcome to TutorPulse!', 'Your account is ready.')
        router.push('/dashboard')
        return
      }

      // Step 3: Email confirmation required — inform user clearly
      toast(
        'success',
        'Account created!',
        'Please check your email and click the confirmation link to activate your account.'
      )
      router.push('/login')
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Create your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign in
          </Link>
        </p>
      </div>

      {errors.general && (
        <div
          role="alert"
          className="mb-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {errors.general}
        </div>
      )}

      {/* Google Sign Up / In */}
      <GoogleSignInButton
        onError={(msg) => setErrors({ general: msg })}
        disabled={loading}
        text="Sign up with Google"
      />

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">
            Or sign up with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <Label htmlFor="name" required>
            Full name
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Your full name"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={errors.name}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="email" required>
            Email address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            disabled={loading}
          />
        </div>

        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Minimum 8 characters"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={errors.password}
              disabled={loading}
              className="pr-10"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Button type="submit" fullWidth loading={loading} className="mt-2">
          {loading ? 'Creating account...' : 'Create account'}
        </Button>

        <p className="text-center text-xs text-gray-500">
          By signing up, you agree to our{' '}
          <span className="font-medium text-gray-700">Terms of Service</span> and{' '}
          <span className="font-medium text-gray-700">Privacy Policy</span>.
        </p>
      </form>
    </>
  )
}
