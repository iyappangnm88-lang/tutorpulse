'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, X, Layers, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/contexts/toast-context'
import { BatchCard } from './batch-card'
import { archiveBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import { cn } from '@/lib/utils'
import type { BatchWithCount } from '@/types'

export function BatchListClient({ initialBatches }: { initialBatches: BatchWithCount[] }) {
  const { toast } = useToast()
  const [batches, setBatches] = useState<BatchWithCount[]>(initialBatches)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [batchToArchive, setBatchToArchive] = useState<BatchWithCount | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

  const activeCount = useMemo(() => batches.filter((b) => b.status === 'active').length, [batches])
  const archivedCount = useMemo(() => batches.filter((b) => b.status === 'archived').length, [batches])

  const filteredBatches = useMemo(() => {
    return batches.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) {
        return false
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim()
        const matchName = b.name.toLowerCase().includes(q)
        const matchSub = b.subject?.toLowerCase().includes(q)
        const matchClass = b.class_name?.toLowerCase().includes(q)
        return matchName || matchSub || matchClass
      }
      return true
    })
  }, [batches, searchQuery, statusFilter])

  const hasFilters = searchQuery.trim().length > 0 || statusFilter !== 'all'

  async function handleConfirmArchive() {
    if (!batchToArchive) return
    setIsArchiving(true)
    try {
      const res = await archiveBatchAction(batchToArchive.id)
      if (!res.success) {
        toast('error', 'Failed to archive', res.error || 'Please try again.')
        return
      }

      setBatches((prev) =>
        prev.map((b) => (b.id === batchToArchive.id ? { ...b, status: 'archived' } : b))
      )
      toast('success', 'Batch Archived', `${batchToArchive.name} has been archived.`)
      setBatchToArchive(null)
    } catch {
      toast('error', 'Error', 'Something went wrong while archiving.')
    } finally {
      setIsArchiving(false)
    }
  }

  if (batches.length === 0) {
    return (
      <EmptyState
        icon={<Layers className="h-8 w-8 text-[#55C832]" />}
        title="No batches created yet"
        description="Organize your students into batches by grade or subject for attendance and class schedules."
        action={
          <Link href="/dashboard/batches/new">
            <Button size="md" className="gap-2 min-h-[44px] rounded-xl font-bold">
              <Plus className="h-4 w-4" />
              <span>Create First Batch</span>
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search Bar */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-[#A8B3A5]" />
          <Input
            placeholder="Search batches by name, subject, or class..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-9 min-h-[46px] rounded-xl border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#A8B3A5]/60 focus:border-[#55C832] dark:focus:border-[#55C832]"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-[#A8B3A5] dark:hover:text-white p-1 cursor-pointer"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-gray-100/80 dark:bg-[#161D16] border border-gray-200/80 dark:border-[#293329] rounded-xl overflow-x-auto no-scrollbar shrink-0">
          {[
            { id: 'all', label: 'All Batches', count: batches.length },
            { id: 'active', label: 'Active', count: activeCount },
            { id: 'archived', label: 'Archived', count: archivedCount },
          ].map((tab) => {
            const isSelected = statusFilter === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap min-h-[38px] cursor-pointer',
                  isSelected
                    ? 'bg-white dark:bg-[#55C832] text-gray-900 dark:text-[#0B0F0C] shadow-xs font-black'
                    : 'text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white'
                )}
              >
                <span>{tab.label}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold',
                    isSelected
                      ? 'bg-gray-100 dark:bg-black/20 text-gray-900 dark:text-[#0B0F0C]'
                      : 'bg-gray-200/80 dark:bg-[#1C261C] text-gray-600 dark:text-[#A8B3A5]'
                  )}
                >
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Reset Filter Button */}
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
            }}
            className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gray-600 dark:text-[#A8B3A5] hover:text-gray-900 dark:hover:text-white px-3.5 py-2 rounded-xl border border-gray-200 dark:border-[#293329] bg-white dark:bg-[#161D16] hover:bg-gray-50 dark:hover:bg-[#1C261C] min-h-[46px] cursor-pointer transition-colors shrink-0"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {filteredBatches.length === 0 ? (
        <EmptyState
          icon={<UserX className="h-8 w-8 text-gray-400 dark:text-[#A8B3A5]" />}
          title="No matching batches found"
          description="Try adjusting your search query or changing the filter."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setStatusFilter('all')
              }}
              className="min-h-[40px] rounded-xl font-bold"
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <>
          {/* Dynamic Batch Count Indicator */}
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-[#A8B3A5] px-1 font-medium">
            <span>
              Showing <strong className="text-gray-900 dark:text-white font-bold">{filteredBatches.length}</strong> of{' '}
              <strong className="text-gray-900 dark:text-white font-bold">{batches.length}</strong> batches
            </span>
          </div>

          {/* Responsive Compact Horizontal Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
            {filteredBatches.map((b) => (
              <BatchCard
                key={b.id}
                batch={b}
                onArchive={(ba) => setBatchToArchive(ba)}
              />
            ))}
          </div>
        </>
      )}

      {/* Archive Modal */}
      <Dialog
        isOpen={!!batchToArchive}
        onClose={() => setBatchToArchive(null)}
        title="Archive Batch?"
        description={`Are you sure you want to archive ${batchToArchive?.name}? Students and previous attendance history will remain safe.`}
        confirmLabel="Archive Batch"
        confirmVariant="danger"
        isLoading={isArchiving}
        onConfirm={handleConfirmArchive}
      />
    </div>
  )
}
