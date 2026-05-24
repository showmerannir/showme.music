export type LeadStatus = 'new' | 'researched' | 'contacted' | 'replied' | 'qualified' | 'closed'
export type LeadType = 'venue' | 'promoter'

export interface Lead {
  id: string
  user_id: string
  name: string
  lead_type: LeadType
  status: LeadStatus
  city?: string
  state_province?: string
  country: string
  website?: string
  domain?: string
  instagram?: string
  facebook?: string
  capacity?: number
  venue_type?: string
  promoter_scale?: string
  ai_summary?: string
  icp_score?: number
  notes?: string
  tags: string[]
  source: string
  enriched_at?: string
  ai_researched_at?: string
  clickup_task_id?: string
  clickup_synced_at?: string
  created_at: string
  updated_at: string
}

export interface Contact {
  id: string
  lead_id: string
  user_id: string
  first_name?: string
  last_name?: string
  full_name?: string
  title?: string
  email?: string
  email_source?: string
  email_confidence?: number
  phone?: string
  phone_source?: string
  linkedin?: string
  is_primary: boolean
  enriched_at?: string
  created_at: string
  updated_at: string
}

export interface EmailDraft {
  id: string
  lead_id: string
  user_id: string
  contact_id?: string
  subject: string
  body: string
  model_used: string
  research_used?: string
  version: number
  is_sent: boolean
  sent_at?: string
  created_at: string
  updated_at: string
}

export type ActivityType =
  | 'status_changed'
  | 'contact_added'
  | 'email_generated'
  | 'email_sent'
  | 'note_added'
  | 'enrichment_run'
  | 'lead_created'
  | 'lead_discovered'
  | 'clickup_synced'

export interface LeadActivity {
  id: string
  lead_id: string
  user_id: string
  activity_type: ActivityType
  metadata: Record<string, unknown>
  created_at: string
}

export interface LeadProfile extends Lead {
  contacts: Contact[]
  email_drafts: EmailDraft[]
  lead_activities: LeadActivity[]
}

export interface IcpProfile {
  id: string
  user_id: string
  name: string
  lead_types: string[]
  min_capacity?: number
  max_capacity?: number
  venue_types: string[]
  promoter_scales: string[]
  genres: string[]
  geographies: string[]
  keywords: string[]
  notes?: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface ClickUpConfig {
  id: string
  user_id: string
  api_token: string
  list_id: string
  status_mapping: Record<LeadStatus, string>
  is_active: boolean
  created_at: string
  updated_at: string
}

export const LEAD_STATUSES: LeadStatus[] = ['new', 'researched', 'contacted', 'replied', 'qualified', 'closed']

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New',
  researched: 'Researched',
  contacted: 'Contacted',
  replied: 'Replied',
  qualified: 'Qualified',
  closed: 'Closed',
}

export const LEAD_STATUS_COLORS: Record<LeadStatus, string> = {
  new: 'bg-slate-100 text-slate-700',
  researched: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  replied: 'bg-purple-100 text-purple-700',
  qualified: 'bg-green-100 text-green-700',
  closed: 'bg-gray-100 text-gray-500',
}

export const VENUE_TYPES = ['Club', 'Bar', 'Concert Hall', 'Theater', 'Festival Ground', 'Outdoor', 'Restaurant', 'Hotel', 'Arena']
export const PROMOTER_SCALES = ['local', 'regional', 'national', 'international']
export const GENRES = ['Electronic', 'Jazz', 'Hip-Hop', 'Indie', 'Rock', 'Pop', 'Country', 'R&B', 'Classical', 'Folk', 'Metal', 'Latin', 'World', 'Blues', 'Reggae', 'Punk']
