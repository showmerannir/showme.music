import { Badge } from '@/components/ui/badge'
import { LEAD_STATUS_COLORS, LEAD_STATUS_LABELS, type LeadStatus } from '@/types/lead'
import { cn } from '@/lib/utils'

interface LeadStatusBadgeProps {
  status: LeadStatus
  className?: string
}

export function LeadStatusBadge({ status, className }: LeadStatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold',
        LEAD_STATUS_COLORS[status],
        className
      )}
    >
      {LEAD_STATUS_LABELS[status]}
    </span>
  )
}
