'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import {
  Search,
  BookOpen,
  HelpCircle,
  Sparkles,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  ArrowRight,
  Layers,
  Users,
  Calendar,
  ClipboardCheck,
  CreditCard,
  FileText,
  MessageSquare,
  BarChart3,
  Settings,
} from 'lucide-react'
import { HELP_TOPICS, searchHelp, type HelpTopic } from '@/lib/help-content'
import { cn } from '@/lib/utils'

export function HelpCenterView() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null)

  const categories = [
    { id: 'all', label: 'All Topics' },
    { id: 'Getting Started', label: 'Getting Started' },
    { id: 'Core Management', label: 'Students & Batches' },
    { id: 'Daily Operations', label: 'Calendar & Attendance' },
    { id: 'Academic Tracking', label: 'Tests & Homework' },
    { id: 'Tuition Finances', label: 'Fees & Payments' },
    { id: 'Communication', label: 'Parents & Messages' },
    { id: 'Insights', label: 'Analytics' },
    { id: 'Account', label: 'Settings' },
  ]

  const topicsList = Object.values(HELP_TOPICS)

  const filteredTopics = topicsList.filter((topic) => {
    if (selectedCategory !== 'all' && topic.category !== selectedCategory) {
      return false
    }
    return true
  })

  const searchResults = searchQuery.trim() ? searchHelp(searchQuery) : []

  function getTopicIcon(id: string) {
    switch (id) {
      case 'dashboard':
        return Sparkles
      case 'students':
        return Users
      case 'batches':
        return Layers
      case 'calendar':
        return Calendar
      case 'attendance':
        return ClipboardCheck
      case 'tests':
        return FileText
      case 'fees':
        return CreditCard
      case 'homework':
        return BookOpen
      case 'parents':
        return Users
      case 'communication':
        return MessageSquare
      case 'reports':
        return BarChart3
      case 'settings':
        return Settings
      default:
        return HelpCircle
    }
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Hero Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-indigo-950 p-6 sm:p-10 text-white shadow-md relative overflow-hidden">
        <div className="absolute -top-16 -right-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-2xl pointer-events-none" />
        <div className="relative z-10 max-w-2xl">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-2">
            <BookOpen className="h-4 w-4 text-indigo-400" />
            <span>TutorPulse Knowledge Base</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            How can we help you teach and manage today?
          </h1>
          <p className="text-xs sm:text-sm text-indigo-200 mt-2">
            Simple, practical guides specifically tailored for solo tutors and small tuition centers.
          </p>

          {/* Search bar inside hero */}
          <div className="relative mt-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search guides, form fields, concepts, or FAQs (e.g. attendance, batch schedule, fee dues)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border-0 bg-white pl-12 pr-4 py-3.5 text-sm text-gray-900 placeholder-gray-400 shadow-lg focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-500 hover:text-gray-800"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Category Pills */}
      {!searchQuery && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={cn(
                'px-4 py-2 rounded-xl text-xs font-semibold shrink-0 transition-all cursor-pointer',
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-2xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>
      )}

      {/* Search Results Display */}
      {searchQuery ? (
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-gray-900">
            Search Results for &quot;{searchQuery}&quot; ({searchResults.length})
          </h2>
          {searchResults.length === 0 ? (
            <div className="rounded-3xl border border-gray-200 bg-white p-8 text-center text-xs text-gray-500">
              No articles matched your search. Try typing keywords like &quot;attendance&quot;, &quot;batch&quot;, or &quot;parent portal&quot;.
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {searchResults.map(({ topic, matchReason }) => {
                const Icon = getTopicIcon(topic.id)
                return (
                  <div
                    key={topic.id}
                    className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-indigo-300 hover:shadow-xs transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2.5 mb-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                          <Icon className="h-4 w-4" />
                        </div>
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2 py-0.5 rounded">
                          {topic.category}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900">{topic.title}</h3>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed line-clamp-2">
                        {topic.shortSummary}
                      </p>
                      <p className="text-[11px] font-medium text-emerald-700 mt-2 bg-emerald-50 px-2 py-1 rounded inline-block">
                        {matchReason}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setSearchQuery('')
                        setExpandedTopicId(topic.id)
                      }}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      <span>Read full guide</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      ) : (
        /* Categorized Topic Cards */
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {filteredTopics.map((topic) => {
              const Icon = getTopicIcon(topic.id)
              const isExpanded = expandedTopicId === topic.id

              return (
                <div
                  key={topic.id}
                  className={cn(
                    'rounded-2xl border bg-white p-5 transition-all',
                    isExpanded ? 'border-indigo-400 shadow-sm sm:col-span-2' : 'border-gray-200/80 hover:border-indigo-200 hover:shadow-2xs'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 shrink-0 mt-0.5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                            {topic.category}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900">{topic.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{topic.shortSummary}</p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                      className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-50 transition-colors shrink-0"
                      aria-label={isExpanded ? 'Collapse topic' : 'Expand topic'}
                    >
                      {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Expanded Article Body */}
                  {isExpanded && (
                    <div className="mt-5 pt-4 border-t border-gray-100 space-y-5 text-xs animate-in fade-in-0 duration-150">
                      {/* Why it exists */}
                      <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100/80">
                        <p className="font-bold text-indigo-900 uppercase tracking-wider text-[11px] mb-1 flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-indigo-600" />
                          Why this feature exists
                        </p>
                        <p className="text-gray-700 leading-relaxed">{topic.whyItExists}</p>
                      </div>

                      {/* Recommended Workflow */}
                      <div>
                        <h4 className="font-bold text-gray-900 mb-2">Recommended Workflow:</h4>
                        <ol className="grid gap-2 sm:grid-cols-2">
                          {topic.recommendedWorkflow.map((step, idx) => (
                            <li
                              key={idx}
                              className="flex items-start gap-2 text-xs text-gray-700 bg-gray-50/80 border border-gray-100 rounded-xl p-2.5"
                            >
                              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-white text-[10px] font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <span className="leading-tight mt-0.5">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>

                      {/* Key Concepts */}
                      {topic.keyConcepts.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Key Concepts to Know:</h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {topic.keyConcepts.map((kc, idx) => (
                              <div key={idx} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="font-bold text-gray-900 text-[11px]">{kc.term}</p>
                                <p className="text-gray-600 text-[11px] mt-0.5 leading-relaxed">{kc.explanation}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Common Mistakes */}
                      {topic.commonMistakes.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-1.5">
                            <AlertCircle className="h-3.5 w-3.5 text-amber-600" />
                            <span>Common Mistakes to Avoid:</span>
                          </h4>
                          <div className="space-y-2">
                            {topic.commonMistakes.map((cm, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/70">
                                <p className="font-bold text-amber-950">⚠️ Mistake: {cm.mistake}</p>
                                <p className="text-amber-800 mt-1">
                                  <span className="font-semibold text-emerald-800">✅ Recommended Solution: </span>
                                  {cm.solution}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Form Fields */}
                      {topic.fieldGuides && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Form Fields Explained:</h4>
                          <div className="grid gap-2 sm:grid-cols-2">
                            {Object.entries(topic.fieldGuides).map(([k, fg]) => (
                              <div key={k} className="p-2.5 rounded-xl border border-gray-100 bg-white">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-gray-900">{fg.label}</span>
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

                      {/* FAQs */}
                      {topic.faq.length > 0 && (
                        <div>
                          <h4 className="font-bold text-gray-900 mb-2">Frequently Asked Questions:</h4>
                          <div className="space-y-2">
                            {topic.faq.map((faqItem, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                                <p className="font-bold text-gray-900 text-[11px]">Q: {faqItem.question}</p>
                                <p className="text-gray-600 text-[11px] mt-1 leading-relaxed">A: {faqItem.answer}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Related Links */}
                      {topic.relatedLinks && (
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          <span className="text-gray-400 text-[11px]">Jump to page:</span>
                          {topic.relatedLinks.map((link) => (
                            <Link
                              key={link.href}
                              href={link.href}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              <span>{link.label}</span>
                              <ExternalLink className="h-3 w-3" />
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {!isExpanded && (
                    <button
                      type="button"
                      onClick={() => setExpandedTopicId(topic.id)}
                      className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      <span>Explore guide & FAQs</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
