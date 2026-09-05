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

export default function LoginPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})

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
    if (!email.trim()) e.email = 'Email is required.'
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = 'Please enter a valid email address.'
    if (!password) e.password = 'Password is required.'
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
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error || !data.user) {
        if (error?.message.toLowerCase().includes('invalid')) {
          setErrors({ general: 'Invalid email or password. Please try again.' })
        } else {
          setErrors({ general: error?.message || 'Failed to sign in.' })
        }
        return
      }

      // Check role to direct to /parent or /dashboard
      let { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .maybeSingle()

      // If profile doesn't exist yet (email confirmed but profile not created), create it now
      if (!profile) {
        const insertRes = await supabase.from('profiles').insert({
          id: data.user.id,
          full_name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Tutor',
          email: data.user.email || '',
          role: 'tutor',
        }).select('role').maybeSingle()
        profile = insertRes.data
      }

      toast('success', 'Welcome back!', 'Redirecting...')
      if (profile?.role === 'parent') {
        router.push('/parent')
      } else {
        router.push('/dashboard')
      }
      router.refresh()
    } catch {
      setErrors({ general: 'Something went wrong. Please try again.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Sign in to your account</h1>
        <p className="mt-1 text-sm text-gray-500">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
            Sign up free
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

      {/* Google Sign In */}
      <GoogleSignInButton
        onError={(msg) => setErrors({ general: msg })}
        disabled={loading}
        text="Continue with Google"
      />

      {/* Divider */}
      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-400 font-medium tracking-wider">
            Or continue with email
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="password" required className="mb-0">
              Password
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              autoComplete="current-password"
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
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      {/* Helpful Guidance for Users */}
      <div className="mt-6 rounded-2xl bg-gray-50 border border-gray-100 p-3.5 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-700">Tutors & Parents use the same sign-in</p>
        <p className="mt-1 text-[11px] text-gray-500 leading-normal">
          Tutors are automatically directed to their Teaching Dashboard. Parents using their registered email are directed straight to their child&apos;s Parent Portal.
        </p>
      </div>
    </>
  )
}
