'use client'

import React from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'

interface StudentFiltersProps {
  searchQuery: string
  onSearchChange: (q: string) => void
  statusFilter: string
  onStatusChange: (s: string) => void
  onClearFilters: () => void
  hasFilters: boolean
}

export function StudentFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusChange,
  onClearFilters,
  hasFilters,
}: StudentFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by student name, phone, or email..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 pr-8"
        />
        {searchQuery && (
          <button
            onClick={() => onSearchChange('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
            aria-label="Clear search query"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="w-full sm:w-44">
        <Select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter students by status"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
          <option value="archived">Archived Only</option>
        </Select>
      </div>

      {hasFilters && (
        <button
          onClick={onClearFilters}
          className="inline-flex items-center justify-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-800 px-3 py-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 min-h-[44px]"
        >
          <X className="h-3.5 w-3.5" />
          <span>Reset</span>
        </button>
      )}
    </div>
  )
}
