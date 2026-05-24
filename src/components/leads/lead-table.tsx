'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown, Building2, Users } from 'lucide-react'
import type { Lead } from '@/types/lead'
import { LeadStatusBadge } from './lead-status-badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface LeadTableProps {
  leads: Lead[]
  isLoading?: boolean
}

function IcpScorePill({ score }: { score?: number }) {
  if (score == null) return <span className="text-gray-400 text-xs">—</span>

  const color =
    score >= 75
      ? 'bg-green-100 text-green-700'
      : score >= 50
      ? 'bg-yellow-100 text-yellow-700'
      : 'bg-red-100 text-red-600'

  return (
    <span className={cn('inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold', color)}>
      {score}
    </span>
  )
}

export function LeadTable({ leads, isLoading }: LeadTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const columns = useMemo<ColumnDef<Lead>[]>(
    () => [
      {
        accessorKey: 'name',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-gray-900 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Name
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 text-gray-300" />
            )}
          </button>
        ),
        cell: ({ row }) => (
          <Link
            href={`/leads/${row.original.id}`}
            className="font-medium text-gray-900 hover:text-violet-600 transition-colors"
          >
            {row.original.name}
          </Link>
        ),
      },
      {
        accessorKey: 'lead_type',
        header: 'Type',
        cell: ({ row }) => (
          <div className="flex items-center gap-1.5">
            {row.original.lead_type === 'venue' ? (
              <Building2 className="h-3.5 w-3.5 text-gray-400" />
            ) : (
              <Users className="h-3.5 w-3.5 text-gray-400" />
            )}
            <Badge variant="secondary" className="capitalize">
              {row.original.lead_type}
            </Badge>
          </div>
        ),
      },
      {
        id: 'location',
        header: 'Location',
        cell: ({ row }) => {
          const { city, country } = row.original
          const location = [city, country].filter(Boolean).join(', ')
          return <span className="text-gray-600">{location || '—'}</span>
        },
      },
      {
        accessorKey: 'status',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-gray-900 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Status
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 text-gray-300" />
            )}
          </button>
        ),
        cell: ({ row }) => <LeadStatusBadge status={row.original.status} />,
      },
      {
        accessorKey: 'icp_score',
        header: ({ column }) => (
          <button
            className="flex items-center gap-1 hover:text-gray-900 font-medium"
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            ICP Score
            {column.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : column.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 text-gray-300" />
            )}
          </button>
        ),
        cell: ({ row }) => <IcpScorePill score={row.original.icp_score} />,
      },
      {
        accessorKey: 'updated_at',
        header: 'Updated',
        cell: ({ row }) => (
          <span className="text-gray-500 text-xs">{formatRelativeTime(row.original.updated_at)}</span>
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: leads,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  if (isLoading) {
    return (
      <div className="rounded-lg border bg-white overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              {['Name', 'Type', 'Location', 'Status', 'ICP Score', 'Updated'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <td key={j} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="rounded-lg border bg-white p-12 text-center">
        <Building2 className="h-8 w-8 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-500 font-medium">No leads found</p>
        <p className="text-gray-400 text-sm mt-1">Add your first lead to get started.</p>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-white overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-gray-100">
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-50 transition-colors">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-3 text-sm">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
