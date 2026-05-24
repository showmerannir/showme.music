import { z } from 'zod'

export const icpProfileSchema = z.object({
  name: z.string().min(1, 'Profile name is required'),
  lead_types: z
    .array(z.enum(['venue', 'promoter']))
    .min(1, 'Select at least one lead type'),
  min_capacity: z.number().int().positive().optional(),
  max_capacity: z.number().int().positive().optional(),
  venue_types: z.array(z.string()).default([]),
  promoter_scales: z
    .array(z.enum(['local', 'regional', 'national', 'international']))
    .default([]),
  genres: z.array(z.string()).default([]),
  geographies: z.array(z.string()).default([]),
  keywords: z.array(z.string()).default([]),
  notes: z.string().optional(),
  is_active: z.boolean().default(true),
})
  .refine(
    (data) => {
      if (
        data.min_capacity !== undefined &&
        data.max_capacity !== undefined
      ) {
        return data.max_capacity >= data.min_capacity
      }
      return true
    },
    {
      message: 'Max capacity must be greater than or equal to min capacity',
      path: ['max_capacity'],
    }
  )

export type IcpProfileInput = z.infer<typeof icpProfileSchema>

export const updateIcpProfileSchema = icpProfileSchema.partial().extend({
  is_active: z.boolean().optional(),
})

export type UpdateIcpProfileInput = z.infer<typeof updateIcpProfileSchema>
