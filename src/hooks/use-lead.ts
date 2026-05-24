import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { LeadProfile, EmailDraft } from '@/types/lead'

export function useLead(id: string) {
  return useQuery({
    queryKey: ['lead', id],
    queryFn: async (): Promise<LeadProfile> => {
      const res = await fetch(`/api/leads/${id}`)
      if (!res.ok) throw new Error('Failed to fetch lead')
      return res.json()
    },
    enabled: !!id,
  })
}

export function useEnrichLead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (leadId: string): Promise<{ contacts: unknown[]; summary: string }> => {
      const res = await fetch(`/api/enrich/${leadId}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Enrichment failed' }))
        throw new Error(err.error ?? 'Enrichment failed')
      }
      return res.json()
    },
    onSuccess: (_data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
  })
}

export function useGenerateEmail() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (leadId: string): Promise<EmailDraft> => {
      const res = await fetch(`/api/email-draft/${leadId}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Email generation failed' }))
        throw new Error(err.error ?? 'Email generation failed')
      }
      return res.json()
    },
    onSuccess: (_data, leadId) => {
      queryClient.invalidateQueries({ queryKey: ['lead', leadId] })
    },
  })
}
