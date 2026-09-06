'use client'

import React from 'react'
import { Video, KeyRound, ExternalLink, ShieldCheck, Info, CheckCircle2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/ui/card'
import type { ClassSessionWithBatch } from '@/types'
import type { ClassroomRole } from '@/lib/classroom/types'

interface UnconfiguredGuideProps {
  session: ClassSessionWithBatch
  role: ClassroomRole
}

export function UnconfiguredGuide({ session, role }: UnconfiguredGuideProps) {
  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <Card className="border-amber-200/80 bg-gradient-to-b from-amber-50/40 via-white to-white shadow-lg overflow-hidden">
        <CardHeader className="border-b border-amber-100 p-6 bg-amber-50/50">
          <div className="flex items-start gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-800 border border-amber-200">
              <KeyRound className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                  Setup Required
                </span>
                <span className="text-xs text-gray-500 font-medium">Phase 3 Video Engine</span>
              </div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-1">
                Online classroom is not configured yet
              </h2>
              <p className="text-xs text-gray-600 mt-0.5">
                Add the video provider credentials to enable live WebRTC video classes for {session.batch.name}.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardBody className="p-6 space-y-5">
          {/* Target Session Info */}
          <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-3.5 text-xs text-gray-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="font-bold text-gray-900">{session.batch.name}</span>
              {session.batch.subject && <span className="text-gray-500"> • {session.batch.subject}</span>}
              <p className="text-gray-500 mt-0.5">
                {session.session_date} • {session.start_time} - {session.end_time}
              </p>
            </div>
            <span className="self-start sm:self-auto px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase">
              {session.class_mode} Class
            </span>
          </div>

          {/* Explanation banner */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4 text-xs text-indigo-950 flex items-start gap-3">
            <Info className="h-4 w-4 text-indigo-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-bold text-indigo-900">Why are you seeing this screen?</p>
              <p className="text-indigo-800/90 leading-relaxed">
                TutorPulse uses real, enterprise WebRTC video infrastructure with server-side token minting. Rather than faking a video call or running dummy placeholders, the system safely verifies provider keys before launching meeting rooms.
              </p>
            </div>
          </div>

          {/* Quick Setup Instructions */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>Step-by-Step Setup (Daily.co)</span>
            </h3>

            <div className="space-y-2 text-xs text-gray-600">
              <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 text-[10px]">
                  1
                </span>
                <div>
                  <p className="font-semibold text-gray-800">
                    Get a free API Key from Daily.co
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    Sign up at{' '}
                    <a
                      href="https://dashboard.daily.co/signup"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-600 font-semibold hover:underline inline-flex items-center gap-0.5"
                    >
                      dashboard.daily.co <ExternalLink className="h-3 w-3" />
                    </a>{' '}
                    and copy your API Key from the Developers tab.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 text-[10px]">
                  2
                </span>
                <div>
                  <p className="font-semibold text-gray-800">
                    Set Environment Variable
                  </p>
                  <p className="text-gray-500 mt-0.5">
                    Add the secret key to your <code className="bg-gray-100 px-1 py-0.5 rounded text-indigo-700 font-mono text-[11px]">.env.local</code> file (or Vercel Project Settings for production):
                  </p>
                  <pre className="mt-1.5 p-2 rounded-lg bg-gray-900 text-gray-100 font-mono text-[11px] overflow-x-auto">
                    DAILY_API_KEY=your_daily_api_key_here
                  </pre>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-xl border border-gray-100 bg-white">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700 text-[10px]">
                  3
                </span>
                <div>
                  <p className="font-semibold text-gray-800">Refresh the Classroom</p>
                  <p className="text-gray-500 mt-0.5">
                    Once the variable is saved, reload this page to connect to your live interactive classroom with audio, video, and screen sharing.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
              API credentials are kept strictly server-side
            </span>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="font-semibold text-indigo-600 hover:text-indigo-700"
            >
              Check Again ↻
            </button>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
