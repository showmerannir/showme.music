'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type LeadStatus } from '@/types/lead'
import { cn } from '@/lib/utils'

interface LeadFiltersProps {
  onFilterChange: (filters: { status?: string; search?: string; lead_type?: string }) => void
}

export function LeadFilters({ onFilterChange }: LeadFiltersProps) {
  const [search, setSearch] = useState('')
  const [activeStatus, setActiveStatus] = useState<string | undefined>(undefined)
  const [activeType, setActiveType] = useState<string | undefined>(undefined)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      onFilterChange({
        search: search || undefined,
        status: activeStatus,
        lead_type: activeType,
      })
    }, 300)
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [search, activeStatus, activeType, onFilterChange])

  const handleStatusClick = (status: string | undefined) => {
    setActiveStatus(prev => (prev === status ? undefined : status))
  }

  const handleTypeClick = (type: string | undefined) => {
    setActiveType(prev => (prev === type ? undefined : type))
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search leads…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-9"
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {/* Status filters */}
        <div className="flex flex-wrap gap-1">
          <button
            onClick={() => handleStatusClick(undefined)}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
              activeStatus === undefined
                ? 'bg-gray-900 text-white border-gray-900'
                : 'text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            )}
          >
            All
          </button>
          {LEAD_STATUSES.map(status => (
            <button
              key={status}
              onClick={() => handleStatusClick(status)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                activeStatus === status
                  ? 'bg-gray-900 text-white border-gray-900'
                  : 'text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {LEAD_STATUS_LABELS[status as LeadStatus]}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-4 w-px bg-gray-200" />

        {/* Type filter */}
        <div className="flex gap-1">
          {[undefined, 'venue', 'promoter'].map(type => (
            <button
              key={type ?? 'all'}
              onClick={() => handleTypeClick(type)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium transition-colors border',
                activeType === type
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              )}
            >
              {type === undefined ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
