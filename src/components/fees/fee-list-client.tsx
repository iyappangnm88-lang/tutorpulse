'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, X, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { FeeTable } from './fee-table'
import { FeeCard } from './fee-card'
import type { FeeWithDetails } from '@/types'

const statusTabs: Array<{ label: string; value: string }> = [
  { label: 'All', value: 'All' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Partially Paid', value: 'Partially Paid' },
  { label: 'Overdue', value: 'Overdue' },
  { label: 'Paid', value: 'Paid' },
]

export function FeeListClient({ initialFees }: { initialFees: FeeWithDetails[] }) {
  const [fees] = useState<FeeWithDetails[]>(initialFees)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('All')

  const filteredFees = useMemo(() => {
    return fees.filter((f) => {
      // 1. Status Filter
      if (selectedStatus !== 'All' && f.status !== selectedStatus) {
        return false
      }

      // 2. Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchTitle = f.title.toLowerCase().includes(q)
        const matchStudent = f.student?.full_name.toLowerCase().includes(q)
        const matchClass = f.student?.class_name?.toLowerCase().includes(q)
        if (!matchTitle && !matchStudent && !matchClass) {
          return false
        }
      }

      return true
    })
  }, [fees, searchQuery, selectedStatus])

  if (fees.length === 0) {
    return (
      <EmptyState
        icon={<CreditCard className="h-8 w-8 text-indigo-500" />}
        title="No fee charges recorded yet"
        description="Create recurring or one-off fee schedules for your enrolled students."
        action={
          <Link href="/dashboard/fees/new">
            <Button size="md" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create First Fee</span>
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
            placeholder="Search by student or fee title..."
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

      {filteredFees.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="h-8 w-8 text-gray-400" />}
          title="No matching fees found"
          description="Try changing your search terms or filter selection."
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
              Showing <strong>{filteredFees.length}</strong> of <strong>{fees.length}</strong> fees
            </span>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block">
            <FeeTable fees={filteredFees} />
          </div>

          {/* Mobile Cards */}
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {filteredFees.map((f) => (
              <FeeCard key={f.id} fee={f} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
