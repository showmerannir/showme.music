import { z } from 'zod'

const leadTypeEnum = z.enum(['venue', 'promoter'])
const leadStatusEnum = z.enum(['new', 'researched', 'contacted', 'replied', 'qualified', 'closed'])

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  lead_type: leadTypeEnum,
  status: leadStatusEnum.default('new'),
  city: z.string().optional(),
  state_province: z.string().optional(),
  country: z.string().min(1, 'Country is required').default('US'),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  domain: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  venue_type: z.string().optional(),
  promoter_scale: z.string().optional(),
  ai_summary: z.string().optional(),
  icp_score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  source: z.string().min(1, 'Source is required').default('manual'),
})

export type CreateLeadInput = z.infer<typeof createLeadSchema>

export const updateLeadSchema = z.object({
  name: z.string().min(1).optional(),
  lead_type: leadTypeEnum.optional(),
  status: leadStatusEnum.optional(),
  city: z.string().optional(),
  state_province: z.string().optional(),
  country: z.string().min(1).optional(),
  website: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  domain: z.string().optional(),
  instagram: z.string().optional(),
  facebook: z.string().optional(),
  capacity: z.number().int().positive().optional(),
  venue_type: z.string().optional(),
  promoter_scale: z.string().optional(),
  ai_summary: z.string().optional(),
  icp_score: z.number().min(0).max(100).optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  source: z.string().optional(),
})

export type UpdateLeadInput = z.infer<typeof updateLeadSchema>

export const updateStatusSchema = z.object({
  status: leadStatusEnum,
})

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>

export const discoverSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  lead_type: leadTypeEnum.optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  count: z.number().int().min(1).max(20).default(5),
  use_icp: z.boolean().default(true),
})

export type DiscoverInput = z.infer<typeof discoverSchema>

export const emailDraftSchema = z.object({
  lead_id: z.string().uuid('Invalid lead ID'),
  contact_id: z.string().uuid('Invalid contact ID').optional(),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  model_used: z.string().default('gemini-1.5-flash'),
  research_used: z.string().optional(),
  version: z.number().int().min(1).default(1),
  is_sent: z.boolean().default(false),
})

export type EmailDraftInput = z.infer<typeof emailDraftSchema>
