'use client'

import { DragDropContext, Droppable, Draggable, type DropResult } from '@hello-pangea/dnd'
import { Building2, Users } from 'lucide-react'
import type { Lead, LeadStatus } from '@/types/lead'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, LEAD_STATUS_COLORS } from '@/types/lead'
import { LeadStatusBadge } from './lead-status-badge'
import { cn } from '@/lib/utils'
import Link from 'next/link'

interface LeadKanbanProps {
  leads: Lead[]
  onStatusChange: (leadId: string, newStatus: LeadStatus) => void
}

function IcpScore({ score }: { score?: number }) {
  if (score == null) return null
  const color =
    score >= 75 ? 'text-green-700 bg-green-100' : score >= 50 ? 'text-yellow-700 bg-yellow-100' : 'text-red-600 bg-red-100'
  return (
    <span className={cn('text-xs font-semibold px-1.5 py-0.5 rounded-full', color)}>{score}</span>
  )
}

export function LeadKanban({ leads, onStatusChange }: LeadKanbanProps) {
  const leadsByStatus: Record<LeadStatus, Lead[]> = {} as Record<LeadStatus, Lead[]>
  LEAD_STATUSES.forEach(status => {
    leadsByStatus[status] = leads.filter(l => l.status === status)
  })

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStatus = destination.droppableId as LeadStatus
    onStatusChange(draggableId, newStatus)
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4 h-full">
        {LEAD_STATUSES.map(status => (
          <div key={status} className="flex-shrink-0 w-64 flex flex-col">
            {/* Column header */}
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm font-semibold text-gray-700">{LEAD_STATUS_LABELS[status]}</h3>
              <span className="text-xs font-medium text-gray-400 bg-gray-100 rounded-full px-2 py-0.5">
                {leadsByStatus[status].length}
              </span>
            </div>

            {/* Droppable column */}
            <Droppable droppableId={status}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    'flex-1 rounded-lg p-2 min-h-[200px] transition-colors',
                    snapshot.isDraggingOver ? 'bg-violet-50' : 'bg-gray-100'
                  )}
                >
                  {leadsByStatus[status].map((lead, index) => (
                    <Draggable key={lead.id} draggableId={lead.id} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={cn(
                            'bg-white rounded-lg p-3 mb-2 border border-gray-200 shadow-sm cursor-grab active:cursor-grabbing transition-shadow',
                            snapshot.isDragging && 'shadow-lg border-violet-300'
                          )}
                        >
                          <Link
                            href={`/leads/${lead.id}`}
                            className="block"
                            onClick={e => snapshot.isDragging && e.preventDefault()}
                          >
                            <div className="flex items-start justify-between gap-2 mb-2">
                              <p className="text-sm font-medium text-gray-900 leading-tight line-clamp-2">
                                {lead.name}
                              </p>
                              <IcpScore score={lead.icp_score} />
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                              {lead.lead_type === 'venue' ? (
                                <Building2 className="h-3 w-3 flex-shrink-0" />
                              ) : (
                                <Users className="h-3 w-3 flex-shrink-0" />
                              )}
                              <span className="capitalize">{lead.lead_type}</span>
                              {lead.city && (
                                <>
                                  <span className="text-gray-300">·</span>
                                  <span>{lead.city}</span>
                                </>
                              )}
                            </div>
                          </Link>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {leadsByStatus[status].length === 0 && (
                    <div className="flex items-center justify-center h-20 text-xs text-gray-400">
                      Drop here
                    </div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  )
}
