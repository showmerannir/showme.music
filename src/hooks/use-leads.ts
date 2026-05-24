import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { Lead } from '@/types/lead'
import type { CreateLeadInput, UpdateLeadInput } from '@/lib/validations/lead'

interface LeadsParams {
  status?: string
  search?: string
  page?: number
  lead_type?: string
}

interface LeadsResponse {
  data: Lead[]
  count: number
}

async function fetchLeads(params: LeadsParams = {}): Promise<LeadsResponse> {
  const searchParams = new URLSearchParams()
  if (params.status) searchParams.set('status', params.status)
  if (params.search) searchParams.set('search', params.search)
  if (params.page) searchParams.set('page', String(params.page))
  if (params.lead_type) searchParams.set('lead_type', params.lead_type)

  const qs = searchParams.toString()
  const res = await fetch(`/api/leads${qs ? `?${qs}` : ''}`)
  if (!res.ok) throw new Error('Failed to fetch leads')
  return res.json()
}

export function useLeads(params: LeadsParams = {}) {
  return useQuery({
    queryKey: ['leads', params],
    queryFn: () => fetchLeads(params),
  })
}

export function useCreateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: CreateLeadInput): Promise<Lead> => {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to create lead' }))
        throw new Error(err.error ?? 'Failed to create lead')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}

export function useUpdateLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateLeadInput }): Promise<Lead> => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update lead' }))
        throw new Error(err.error ?? 'Failed to update lead')
      }
      return res.json()
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
    },
  })
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }): Promise<Lead> => {
      const res = await fetch(`/api/leads/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update status' }))
        throw new Error(err.error ?? 'Failed to update status')
      }
      return res.json()
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
      queryClient.invalidateQueries({ queryKey: ['lead', id] })
    },
  })
}

export function useDeleteLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string): Promise<void> => {
      const res = await fetch(`/api/leads/${id}`, {
        method: 'DELETE',
      })
      if (!res.ok && res.status !== 204) {
        const err = await res.json().catch(() => ({ error: 'Failed to delete lead' }))
        throw new Error(err.error ?? 'Failed to delete lead')
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leads'] })
    },
  })
}
