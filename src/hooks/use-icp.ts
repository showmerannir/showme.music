import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IcpProfile } from '@/types/lead'
import type { IcpProfileInput } from '@/lib/validations/icp'

export function useIcp() {
  return useQuery({
    queryKey: ['icp'],
    queryFn: async (): Promise<IcpProfile | null> => {
      const res = await fetch('/api/icp')
      if (res.status === 404) return null
      if (!res.ok) throw new Error('Failed to fetch ICP profile')
      return res.json()
    },
  })
}

export function useUpdateIcp() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (data: IcpProfileInput): Promise<IcpProfile> => {
      const res = await fetch('/api/icp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to update ICP profile' }))
        throw new Error(err.error ?? 'Failed to update ICP profile')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['icp'] })
    },
  })
}
