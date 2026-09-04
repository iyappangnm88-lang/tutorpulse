'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, X, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { TestTable } from './test-table'
import { TestCard } from './test-card'
import type { TestWithDetails } from '@/types'

const statusTabs = [
  { label: 'All', value: 'All' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Upcoming', value: 'Upcoming' },
  { label: 'Awaiting Marks', value: 'Awaiting Marks' },
  { label: 'Draft', value: 'Draft' },
]

export function TestListClient({
  initialTests,
}: {
  initialTests: TestWithDetails[]
}) {
  const [tests] = useState<TestWithDetails[]>(initialTests)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')

  const filtered = useMemo(() => {
    return tests.filter((t) => {
      // Status filter
      if (selectedStatus !== 'All' && t.display_status !== selectedStatus) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = t.title.toLowerCase().includes(q)
        const matchBatch = t.batch?.name.toLowerCase().includes(q)
        const matchDesc = t.description?.toLowerCase().includes(q)
        if (!matchTitle && !matchBatch && !matchDesc) {
          return false
        }
      }

      return true
    })
  }, [tests, searchQuery, selectedStatus])

  if (tests.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="h-8 w-8 text-indigo-500" />}
        title="No tests created yet"
        description="Schedule tests for your batches and enter marks to track student performance."
        action={
          <Link href="/dashboard/tests/new">
            <Button size="md" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Test</span>
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by test title or batch..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Status Pill Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setSelectedStatus(tab.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors min-h-[36px] ${
                selectedStatus === tab.value
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FileText className="h-8 w-8 text-gray-400" />}
          title="No matching tests found"
          description="Try changing your search keywords or filter tab."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedStatus('All')
              }}
            >
              Reset Filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Showing <strong>{filtered.length}</strong> of <strong>{tests.length}</strong> tests
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <TestTable tests={filtered} />
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {filtered.map((t) => (
              <TestCard key={t.id} test={t} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
