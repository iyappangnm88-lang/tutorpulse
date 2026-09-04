'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { Plus, Search, X, HeartHandshake, UserX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { ParentTable } from './parent-table'
import { ParentCard } from './parent-card'
import type { ParentWithStudents } from '@/types'

export function ParentListClient({ initialParents }: { initialParents: ParentWithStudents[] }) {
  const [parents] = useState<ParentWithStudents[]>(initialParents)
  const [searchQuery, setSearchQuery] = useState('')

  const filteredParents = useMemo(() => {
    if (!searchQuery.trim()) return parents
    const q = searchQuery.toLowerCase().trim()
    return parents.filter((p) => {
      const matchName = p.full_name.toLowerCase().includes(q)
      const matchPhone = p.phone?.toLowerCase().includes(q)
      const matchAltPhone = p.alternate_phone?.toLowerCase().includes(q)
      const matchEmail = p.email?.toLowerCase().includes(q)
      const matchStudent = p.primary_student_names.some((s) => s.toLowerCase().includes(q))
      return matchName || matchPhone || matchAltPhone || matchEmail || matchStudent
    })
  }, [parents, searchQuery])

  if (parents.length === 0) {
    return (
      <EmptyState
        icon={<HeartHandshake className="h-8 w-8 text-indigo-500" />}
        title="No parent contacts yet"
        description="Add parents and legal guardians to link them with enrolled students for communication and reports."
        action={
          <Link href="/dashboard/parents/new">
            <Button size="md" className="gap-2">
              <Plus className="h-4 w-4" />
              <span>Add First Parent</span>
            </Button>
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative flex-1 max-w-lg">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search parents by name, phone, email, or student..."
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

      {filteredParents.length === 0 ? (
        <EmptyState
          icon={<UserX className="h-8 w-8 text-gray-400" />}
          title="No matching parents found"
          description="Try checking for typos or searching by phone number."
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
            >
              Clear Search
            </Button>
          }
        />
      ) : (
        <>
          <div className="flex items-center justify-between text-xs text-gray-500 px-1">
            <span>
              Showing <strong>{filteredParents.length}</strong> of <strong>{parents.length}</strong> parents
            </span>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block">
            <ParentTable parents={filteredParents} />
          </div>

          {/* Mobile Cards View */}
          <div className="grid gap-3 sm:grid-cols-2 md:hidden">
            {filteredParents.map((p) => (
              <ParentCard key={p.id} parent={p} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
