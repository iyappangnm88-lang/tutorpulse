'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, X, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { HomeworkTable } from './homework-table'
import { HomeworkCard } from './homework-card'
import type { HomeworkWithDetails } from '@/types'

const statusTabs = [
  { label: 'All', value: 'All' },
  { label: 'Active', value: 'Active' },
  { label: 'Completed', value: 'Completed' },
  { label: 'Overdue', value: 'Overdue' },
  { label: 'Draft', value: 'Draft' },
]

export function HomeworkListClient({
  initialHomework,
}: {
  initialHomework: HomeworkWithDetails[]
}) {
  const [homeworkList] = useState<HomeworkWithDetails[]>(initialHomework)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')

  const filtered = useMemo(() => {
    return homeworkList.filter((h) => {
      // Status filter
      if (selectedStatus !== 'All' && h.display_status !== selectedStatus) {
        return false
      }

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = h.title.toLowerCase().includes(q)
        const matchBatch = h.batch?.name.toLowerCase().includes(q)
        const matchDesc = h.description?.toLowerCase().includes(q)
        if (!matchTitle && !matchBatch && !matchDesc) {
          return false
        }
      }

      return true
    })
  }, [homeworkList, searchQuery, selectedStatus])

  if (homeworkList.length === 0) {
    return (
      <EmptyState
        icon={<BookOpen className="h-8 w-8 text-indigo-500" />}
        title="No homework assignments yet"
        description="Create tasks and worksheets for your batches to track student completion."
        action={
          <Link href="/dashboard/homework/new">
            <Button size="md" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create Homework</span>
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
            placeholder="Search by homework title or batch..."
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
          icon={<BookOpen className="h-8 w-8 text-gray-400" />}
          title="No matching homework found"
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
              Showing <strong>{filtered.length}</strong> of <strong>{homeworkList.length}</strong> assignments
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <HomeworkTable homeworkList={filtered} />
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {filtered.map((h) => (
              <HomeworkCard key={h.id} homework={h} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
