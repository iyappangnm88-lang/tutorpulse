'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, X, Layers, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { EmptyState } from '@/components/ui/empty-state'
import { Dialog } from '@/components/ui/dialog'
import { useToast } from '@/contexts/toast-context'
import { BatchCard } from './batch-card'
import { BatchTable } from './batch-table'
import { archiveBatchAction } from '@/app/(dashboard)/dashboard/batches/actions'
import type { BatchWithCount } from '@/types'

export function BatchListClient({ initialBatches }: { initialBatches: BatchWithCount[] }) {
  const { toast } = useToast()
  const [batches, setBatches] = useState<BatchWithCount[]>(initialBatches)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const [batchToArchive, setBatchToArchive] = useState<BatchWithCount | null>(null)
  const [isArchiving, setIsArchiving] = useState(false)

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
        icon={<Layers className="h-8 w-8 text-indigo-500" />}
        title="No batches created yet"
        description="Organize your students into batches by grade or subject for attendance and class schedules."
        action={
          <Link href="/dashboard/batches/new">
            <Button size="md" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Create First Batch</span>
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search & Filter bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search batches by name, subject, or class..."
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

        <div className="w-full sm:w-44">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter batches by status"
          >
            <option value="all">All Batches</option>
            <option value="active">Active Only</option>
            <option value="archived">Archived Only</option>
          </Select>
        </div>

        {hasFilters && (
          <button
            onClick={() => {
              setSearchQuery('')
              setStatusFilter('all')
            }}
            className="inline-flex items-center justify-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 min-h-[44px]"
          >
            <X className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {filteredBatches.length === 0 ? (
        <EmptyState
          icon={<UserX className="h-8 w-8 text-gray-400" />}
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
            >
              Clear Filters
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Showing <strong>{filteredBatches.length}</strong> of <strong>{batches.length}</strong> batches
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <BatchTable
              batches={filteredBatches}
              onArchive={(b) => setBatchToArchive(b)}
            />
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
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
