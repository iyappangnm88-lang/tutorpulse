'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  X,
  Search,
  BookOpen,
  HelpCircle,
  Sparkles,
  ChevronRight,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
} from 'lucide-react'
import {
  HELP_TOPICS,
  searchHelp,
  getHelpTopicForRoute,
  type HelpTopic,
} from '@/lib/help-content'
import { cn } from '@/lib/utils'

interface HelpDrawerProps {
  isOpen: boolean
  onClose: () => void
  initialTopicId?: string
}

type TabMode = 'page' | 'getting_started' | 'all_guides' | 'faq'

export function HelpDrawer({ isOpen, onClose, initialTopicId }: HelpDrawerProps) {
  const pathname = usePathname()
  const [activeTab, setActiveTab] = useState<TabMode>('page')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTopicId, setSelectedTopicId] = useState<string>(
    initialTopicId || getHelpTopicForRoute(pathname).id
  )

  // Update selected topic when pathname changes or initialTopicId changes
  useEffect(() => {
    if (initialTopicId) {
      setSelectedTopicId(initialTopicId)
    } else {
      setSelectedTopicId(getHelpTopicForRoute(pathname).id)
    }
  }, [pathname, initialTopicId])

  // Listen for global open-help-drawer event
  useEffect(() => {
    function handleCustomOpen(e: Event) {
      const customEvent = e as CustomEvent<{ topicId?: string }>
      if (customEvent.detail?.topicId) {
        setSelectedTopicId(customEvent.detail.topicId)
        setActiveTab('page')
      }
    }
    window.addEventListener('open-help-drawer', handleCustomOpen)
    return () => window.removeEventListener('open-help-drawer', handleCustomOpen)
  }, [])

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const currentTopic = HELP_TOPICS[selectedTopicId] || HELP_TOPICS.dashboard
  const searchResults = searchQuery.trim() ? searchHelp(searchQuery) : []

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="TutorPulse Help Center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-2xs transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer Container */}
      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
          {/* Header */}
          <div className="border-b border-gray-200/80 px-5 py-4 bg-gray-50/70">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-2xs">
                  <BookOpen className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900">TutorPulse Guidance & Help</h2>
                  <p className="text-[11px] text-gray-500">Everything you need to master your tuition workflow</p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                aria-label="Close help"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mt-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search guides, fields, or FAQs (e.g. batch, fees, schedule)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-200 bg-white pl-9 pr-4 py-2 text-xs text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Navigation Tabs */}
            {!searchQuery && (
              <div className="flex items-center gap-1 mt-3 border-t border-gray-200/60 pt-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setActiveTab('page')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-colors',
                    activeTab === 'page'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  This Page
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('getting_started')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-colors',
                    activeTab === 'getting_started'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  Getting Started
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('all_guides')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-colors',
                    activeTab === 'all_guides'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  All Guides
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('faq')}
                  className={cn(
                    'px-3 py-1.5 rounded-lg transition-colors',
                    activeTab === 'faq'
                      ? 'bg-white text-indigo-600 shadow-2xs font-bold'
                      : 'text-gray-600 hover:text-gray-900'
                  )}
                >
                  FAQs
                </button>
              </div>
            )}
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {/* Search Results Mode */}
            {searchQuery ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Search Results ({searchResults.length})
                </p>
                {searchResults.length === 0 ? (
                  <div className="text-center py-8 text-xs text-gray-500">
                    No matching guides found for &quot;{searchQuery}&quot;. Try searching for &quot;students&quot;, &quot;fees&quot;, or &quot;attendance&quot;.
                  </div>
                ) : (
                  searchResults.map(({ topic, matchReason }) => (
                    <button
                      key={topic.id}
                      type="button"
                      onClick={() => {
                        setSelectedTopicId(topic.id)
                        setSearchQuery('')
                        setActiveTab('page')
                      }}
                      className="w-full text-left p-3 rounded-2xl border border-gray-200/80 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors block group"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-gray-900 group-hover:text-indigo-600">
                          {topic.title}
                        </span>
                        <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-indigo-600" />
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-2">{topic.shortSummary}</p>
                      <span className="text-[10px] font-semibold text-indigo-600 mt-1 block">
                        {matchReason}
                      </span>
                    </button>
                  ))
                )}
              </div>
            ) : activeTab === 'page' ? (
              /* Current Page Guide */
              <div className="space-y-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase">
                      {currentTopic.category}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900 mt-1">{currentTopic.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{currentTopic.shortSummary}</p>
                </div>

                {/* Why it exists */}
                <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs">
                  <div className="flex items-center gap-1.5 font-bold text-indigo-900 uppercase tracking-wider text-[11px] mb-1">
                    <Lightbulb className="h-3.5 w-3.5 text-indigo-600" />
                    Why this feature exists
                  </div>
                  <p className="text-gray-700 leading-relaxed">{currentTopic.whyItExists}</p>
                </div>

                {/* What to do first */}
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-900">What you should do first:</h4>
                  <ul className="space-y-1.5 text-xs text-gray-600">
                    {currentTopic.whatToDoFirst.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Key Concepts */}
                {currentTopic.keyConcepts.length > 0 && (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-bold text-gray-900">Key Concepts Explained:</h4>
                    <div className="space-y-2">
                      {currentTopic.keyConcepts.map((kc, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                          <p className="font-bold text-gray-900 text-[11px]">{kc.term}</p>
                          <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">{kc.explanation}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Common Mistakes */}
                {currentTopic.commonMistakes.length > 0 && (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                      <span>Common Mistakes to Avoid:</span>
                    </h4>
                    <div className="space-y-2">
                      {currentTopic.commonMistakes.map((cm, idx) => (
                        <div key={idx} className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/70 text-[11px]">
                          <p className="font-bold text-amber-900">⚠️ Mistake: {cm.mistake}</p>
                          <p className="text-amber-800 mt-1">
                            <span className="font-semibold text-emerald-800">✅ Recommended Solution: </span>
                            {cm.solution}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Field Guides */}
                {currentTopic.fieldGuides && (
                  <div className="space-y-2 border-t border-gray-100 pt-3">
                    <h4 className="text-xs font-bold text-gray-900">Form Fields in this Section:</h4>
                    <div className="divide-y divide-gray-100 rounded-2xl border border-gray-100 p-2">
                      {Object.entries(currentTopic.fieldGuides).map(([k, fg]) => (
                        <div key={k} className="py-2 px-1 text-xs">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-gray-900 text-[11px]">{fg.label}</span>
                            {fg.required && (
                              <span className="text-[10px] text-red-600 bg-red-50 px-1 rounded">Required</span>
                            )}
                          </div>
                          <p className="text-gray-600 text-[11px] mt-0.5">{fg.description}</p>
                          {fg.example && (
                            <p className="text-[10px] text-gray-400 mt-0.5">Example: {fg.example}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : activeTab === 'getting_started' ? (
              /* Getting Started Tab */
              <div className="space-y-4 text-xs">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Welcome to TutorPulse!</h3>
                  <p className="text-gray-500 text-[11px] mt-0.5">
                    A simple guide for solo tutors and small tuition centers.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <p className="font-bold text-indigo-950 text-xs mb-1">1. Batches are your foundation</p>
                    <p className="text-gray-600 text-[11px]">
                      Everything in TutorPulse starts with a Batch. A batch connects a subject, a cohort of students, and a weekly recurring schedule.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <p className="font-bold text-indigo-950 text-xs mb-1">2. Recurring Schedule vs Class Sessions</p>
                    <p className="text-gray-600 text-[11px]">
                      Your batch schedule defines recurring class days (e.g. Mon, Wed). TutorPulse automatically generates individual sessions on your Calendar so you can take attendance or reschedule holiday dates.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <p className="font-bold text-indigo-950 text-xs mb-1">3. Keep Parents Reassured</p>
                    <p className="text-gray-600 text-[11px]">
                      Add parent emails to give them read-only access to their child’s attendance, homework, and test scores via the Parent Portal.
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100">
                    <p className="font-bold text-indigo-950 text-xs mb-1">4. Accurate Records, No Surprises</p>
                    <p className="text-gray-600 text-[11px]">
                      Log payments as soon as cash or UPI is received so you always know who owes fees at a glance.
                    </p>
                  </div>
                </div>
              </div>
            ) : activeTab === 'all_guides' ? (
              /* All Guides Tab */
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Browse by Feature
                </p>
                {Object.values(HELP_TOPICS).map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => {
                      setSelectedTopicId(topic.id)
                      setActiveTab('page')
                    }}
                    className={cn(
                      'w-full text-left p-3 rounded-2xl border transition-all flex items-center justify-between',
                      selectedTopicId === topic.id
                        ? 'border-indigo-500 bg-indigo-50/60'
                        : 'border-gray-200/80 hover:border-indigo-300 hover:bg-gray-50'
                    )}
                  >
                    <div>
                      <span className="font-bold text-xs text-gray-900 block">{topic.title}</span>
                      <span className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{topic.shortSummary}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            ) : (
              /* FAQ Tab */
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Frequently Asked Questions
                </p>
                {Object.values(HELP_TOPICS).flatMap((t) => t.faq).map((faqItem, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-gray-50 border border-gray-200/80 text-xs">
                    <p className="font-bold text-gray-900">Q: {faqItem.question}</p>
                    <p className="text-gray-600 text-[11px] mt-1 leading-relaxed">A: {faqItem.answer}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer with full help center link */}
          <div className="border-t border-gray-200/80 p-4 bg-gray-50/70 flex items-center justify-between text-xs">
            <Link
              href="/dashboard/help"
              onClick={onClose}
              className="inline-flex items-center gap-1.5 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <span>Open Full Help Center</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </Link>
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl bg-white border border-gray-200 text-gray-700 font-semibold text-xs hover:bg-gray-50 transition-colors shadow-2xs"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
