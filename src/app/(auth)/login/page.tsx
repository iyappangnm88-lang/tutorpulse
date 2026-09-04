'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
    </>
  )
}
