'use client'

import { useCallback, useState } from 'react'
import { Plus, LayoutList, Kanban } from 'lucide-react'
import { useQueryState } from 'nuqs'
import { useLeads, useUpdateLeadStatus } from '@/hooks/use-leads'
import { LeadTable } from '@/components/leads/lead-table'
import { LeadKanban } from '@/components/leads/lead-kanban'
import { LeadFilters } from '@/components/leads/lead-filters'
import { LeadForm } from '@/components/leads/lead-form'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { toast } from '@/hooks/use-toast'
import type { LeadStatus } from '@/types/lead'
import { cn } from '@/lib/utils'

interface Filters {
  status?: string
  search?: string
  lead_type?: string
}

export default function LeadsPage() {
  const [view, setView] = useQueryState('view', { defaultValue: 'list' })
  const [isAddOpen, setIsAddOpen] = useState(false)
  const [filters, setFilters] = useState<Filters>({})

  const { data, isLoading } = useLeads(filters)
  const updateStatus = useUpdateLeadStatus()

  const leads = data?.data ?? []
  const count = data?.count ?? 0

  const handleFilterChange = useCallback((newFilters: Filters) => {
    setFilters(newFilters)
  }, [])

  const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
    try {
      await updateStatus.mutateAsync({ id: leadId, status: newStatus })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update status'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Page header */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-white">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Leads</h1>
          {!isLoading && (
            <p className="text-sm text-gray-500 mt-0.5">
              {count} {count === 1 ? 'lead' : 'leads'}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <div className="flex rounded-md border border-gray-200 overflow-hidden">
            <button
              onClick={() => setView('list')}
              className={cn(
                'px-3 py-1.5 flex items-center gap-1.5 text-sm transition-colors',
                view === 'list'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <LayoutList className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView('kanban')}
              className={cn(
                'px-3 py-1.5 flex items-center gap-1.5 text-sm transition-colors border-l border-gray-200',
                view === 'kanban'
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-500 hover:bg-gray-50'
              )}
            >
              <Kanban className="h-4 w-4" />
              Kanban
            </button>
          </div>

          <Button onClick={() => setIsAddOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Add Lead
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 border-b bg-white">
        <LeadFilters onFilterChange={handleFilterChange} />
      </div>

      {/* Content */}
      <div className={cn('flex-1 overflow-auto p-6', view === 'kanban' && 'overflow-x-auto')}>
        {view === 'kanban' ? (
          <LeadKanban leads={leads} onStatusChange={handleStatusChange} />
        ) : (
          <LeadTable leads={leads} isLoading={isLoading} />
        )}
      </div>

      {/* Add Lead Sheet */}
      <Sheet open={isAddOpen} onOpenChange={setIsAddOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Add Lead</SheetTitle>
            <SheetDescription>Add a new venue or promoter to your pipeline.</SheetDescription>
          </SheetHeader>
          <LeadForm
            onSuccess={() => setIsAddOpen(false)}
            onCancel={() => setIsAddOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}
