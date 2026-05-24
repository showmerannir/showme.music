'use client'

import { use, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Globe,
  AtSign,
  Copy,
  RefreshCw,
  Wand2,
  Building2,
  Users,
  MapPin,
  Zap,
  Calendar,
  Mail,
  Phone,
  MessageSquare,
  PlusCircle,
  Loader2,
} from 'lucide-react'
import { useLead, useEnrichLead, useGenerateEmail } from '@/hooks/use-lead'
import { useUpdateLead } from '@/hooks/use-leads'
import { LeadStatusBadge } from '@/components/leads/lead-status-badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from '@/hooks/use-toast'
import { formatDate, formatRelativeTime } from '@/lib/utils'
import type { LeadActivity, EmailDraft } from '@/types/lead'
import { cn } from '@/lib/utils'

function ActivityIcon({ type }: { type: LeadActivity['activity_type'] }) {
  const icons: Record<LeadActivity['activity_type'], React.ReactNode> = {
    lead_created: <PlusCircle className="h-4 w-4 text-violet-500" />,
    lead_discovered: <Zap className="h-4 w-4 text-yellow-500" />,
    status_changed: <RefreshCw className="h-4 w-4 text-blue-500" />,
    email_generated: <Mail className="h-4 w-4 text-green-500" />,
    email_sent: <Mail className="h-4 w-4 text-green-700" />,
    enrichment_run: <Wand2 className="h-4 w-4 text-purple-500" />,
    contact_added: <Users className="h-4 w-4 text-gray-500" />,
    note_added: <MessageSquare className="h-4 w-4 text-gray-500" />,
    clickup_synced: <RefreshCw className="h-4 w-4 text-orange-500" />,
  }
  return <>{icons[type] ?? <Calendar className="h-4 w-4 text-gray-400" />}</>
}

function ActivityLabel({ activity }: { activity: LeadActivity }) {
  const labels: Record<LeadActivity['activity_type'], string> = {
    lead_created: 'Lead created',
    lead_discovered: 'Lead discovered via AI',
    status_changed: `Status changed to ${(activity.metadata?.to_status as string) ?? ''}`,
    email_generated: 'Email draft generated',
    email_sent: 'Email sent',
    enrichment_run: 'Enrichment run',
    contact_added: 'Contact added',
    note_added: 'Note added',
    clickup_synced: 'Synced to ClickUp',
  }
  return <span>{labels[activity.activity_type] ?? activity.activity_type}</span>
}

export default function LeadProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { data: lead, isLoading, error } = useLead(id)
  const updateLead = useUpdateLead()
  const enrichLead = useEnrichLead()
  const generateEmail = useGenerateEmail()
  const [notes, setNotes] = useState<string | undefined>(undefined)
  const [selectedDraftIndex, setSelectedDraftIndex] = useState(0)

  const currentNotes = notes !== undefined ? notes : lead?.notes ?? ''

  const handleNoteBlur = async () => {
    if (notes === undefined || notes === lead?.notes) return
    try {
      await updateLead.mutateAsync({ id, data: { notes } })
      toast({ title: 'Notes saved' })
    } catch {
      toast({ title: 'Failed to save notes', variant: 'destructive' })
    }
  }

  const handleEnrich = async () => {
    try {
      const result = await enrichLead.mutateAsync(id)
      toast({ title: 'Enrichment complete', description: `Found ${(result.contacts as unknown[]).length} contacts.` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Enrichment failed'
      toast({ title: 'Enrichment failed', description: message, variant: 'destructive' })
    }
  }

  const handleGenerateEmail = async () => {
    try {
      await generateEmail.mutateAsync(id)
      setSelectedDraftIndex(0)
      toast({ title: 'Email draft generated' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Generation failed'
      toast({ title: 'Failed to generate email', description: message, variant: 'destructive' })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({ title: 'Copied to clipboard' })
    })
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  if (error || !lead) {
    return (
      <div className="p-6">
        <p className="text-red-500">Failed to load lead. <Link href="/leads" className="text-violet-600 hover:underline">Go back</Link></p>
      </div>
    )
  }

  const sortedDrafts = [...(lead.email_drafts ?? [])].sort((a, b) => b.version - a.version)
  const currentDraft: EmailDraft | undefined = sortedDrafts[selectedDraftIndex]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-4 px-6 py-4 border-b bg-white">
        <Link href="/leads" className="text-gray-400 hover:text-gray-600 transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-semibold text-gray-900 truncate">{lead.name}</h1>
            <LeadStatusBadge status={lead.status} />
            {lead.lead_type === 'venue' ? (
              <Badge variant="secondary"><Building2 className="h-3 w-3 mr-1" />Venue</Badge>
            ) : (
              <Badge variant="secondary"><Users className="h-3 w-3 mr-1" />Promoter</Badge>
            )}
          </div>
          {lead.city && (
            <p className="text-sm text-gray-500 mt-0.5 flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {[lead.city, lead.state_province, lead.country].filter(Boolean).join(', ')}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex-1 overflow-auto">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <div className="px-6 bg-white border-b">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="contacts">
                Contacts {lead.contacts?.length > 0 && `(${lead.contacts.length})`}
              </TabsTrigger>
              <TabsTrigger value="email">Email Draft</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 overflow-auto p-6">
            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Details card */}
                <div className="bg-white rounded-lg border p-6 space-y-4">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Details</h2>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Type</span>
                      <span className="font-medium capitalize">{lead.lead_type}</span>
                    </div>
                    {lead.website && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Website</span>
                        <a href={lead.website} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline flex items-center gap-1">
                          <Globe className="h-3 w-3" />
                          {lead.domain ?? lead.website}
                        </a>
                      </div>
                    )}
                    {lead.instagram && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Instagram</span>
                        <a href={`https://instagram.com/${lead.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline flex items-center gap-1">
                          <AtSign className="h-3 w-3" />
                          {lead.instagram}
                        </a>
                      </div>
                    )}
                    {lead.capacity && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Capacity</span>
                        <span className="font-medium">{lead.capacity.toLocaleString()}</span>
                      </div>
                    )}
                    {lead.venue_type && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Venue Type</span>
                        <span className="font-medium">{lead.venue_type}</span>
                      </div>
                    )}
                    {lead.promoter_scale && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Scale</span>
                        <span className="font-medium capitalize">{lead.promoter_scale}</span>
                      </div>
                    )}
                    {lead.icp_score != null && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">ICP Score</span>
                        <span className={cn('font-semibold', lead.icp_score >= 75 ? 'text-green-600' : lead.icp_score >= 50 ? 'text-yellow-600' : 'text-red-500')}>
                          {lead.icp_score}/100
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Source</span>
                      <span className="font-medium capitalize">{lead.source}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Added</span>
                      <span className="text-gray-600">{formatDate(lead.created_at)}</span>
                    </div>
                  </div>
                </div>

                {/* AI Summary */}
                {lead.ai_summary && (
                  <div className="bg-white rounded-lg border p-6">
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">AI Summary</h2>
                    <p className="text-sm text-gray-600 leading-relaxed">{lead.ai_summary}</p>
                  </div>
                )}

                {/* Notes */}
                <div className="bg-white rounded-lg border p-6 md:col-span-2">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Notes</h2>
                  <Textarea
                    placeholder="Add notes about this lead…"
                    value={currentNotes}
                    onChange={e => setNotes(e.target.value)}
                    onBlur={handleNoteBlur}
                    className="min-h-[120px]"
                  />
                  <p className="text-xs text-gray-400 mt-1">Auto-saves when you click away.</p>
                </div>
              </div>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-gray-700">
                  {lead.contacts?.length ?? 0} contacts
                </h2>
                <Button
                  onClick={handleEnrich}
                  disabled={enrichLead.isPending}
                  variant="outline"
                  size="sm"
                >
                  {enrichLead.isPending ? (
                    <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Enriching…</>
                  ) : (
                    <><Wand2 className="h-4 w-4 mr-1" />Run Enrichment</>
                  )}
                </Button>
              </div>

              {(!lead.contacts || lead.contacts.length === 0) ? (
                <div className="bg-white rounded-lg border p-8 text-center">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No contacts yet</p>
                  <p className="text-gray-400 text-sm mt-1">Run enrichment to find contacts for this lead.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {lead.contacts.map(contact => (
                    <div key={contact.id} className="bg-white rounded-lg border p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-gray-900">
                              {contact.full_name ?? [contact.first_name, contact.last_name].filter(Boolean).join(' ') ?? 'Unknown'}
                            </p>
                            {contact.is_primary && (
                              <Badge variant="default" className="text-xs">Primary</Badge>
                            )}
                            {contact.email_source && (
                              <Badge variant="secondary" className="text-xs capitalize">{contact.email_source}</Badge>
                            )}
                          </div>
                          {contact.title && (
                            <p className="text-sm text-gray-500 mt-0.5">{contact.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-4 mt-3">
                        {contact.email && (
                          <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-sm text-violet-600 hover:underline">
                            <Mail className="h-3.5 w-3.5" />
                            {contact.email}
                          </a>
                        )}
                        {contact.phone && (
                          <a href={`tel:${contact.phone}`} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-violet-600">
                            <Phone className="h-3.5 w-3.5" />
                            {contact.phone}
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Email Draft Tab */}
            <TabsContent value="email">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <h2 className="text-sm font-semibold text-gray-700">Email Draft</h2>
                  {sortedDrafts.length > 1 && (
                    <select
                      value={selectedDraftIndex}
                      onChange={e => setSelectedDraftIndex(Number(e.target.value))}
                      className="text-xs border border-gray-300 rounded px-2 py-1 text-gray-600"
                    >
                      {sortedDrafts.map((draft, i) => (
                        <option key={draft.id} value={i}>
                          Version {draft.version} — {formatDate(draft.created_at)}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
                <div className="flex gap-2">
                  {currentDraft && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(`Subject: ${currentDraft.subject}\n\n${currentDraft.body}`)}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                  )}
                  <Button
                    onClick={handleGenerateEmail}
                    disabled={generateEmail.isPending}
                    size="sm"
                  >
                    {generateEmail.isPending ? (
                      <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Generating…</>
                    ) : (
                      <><RefreshCw className="h-4 w-4 mr-1" />{currentDraft ? 'Regenerate' : 'Generate Draft'}</>
                    )}
                  </Button>
                </div>
              </div>

              {currentDraft ? (
                <div className="bg-white rounded-lg border p-6 space-y-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Subject</p>
                    <p className="text-sm font-medium text-gray-900">{currentDraft.subject}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide font-semibold mb-1">Body</p>
                    <Textarea
                      value={currentDraft.body}
                      readOnly
                      className="min-h-[300px] text-sm text-gray-800 bg-gray-50 cursor-default"
                    />
                  </div>
                  <p className="text-xs text-gray-400">
                    Generated {formatDate(currentDraft.created_at)} using {currentDraft.model_used}
                  </p>
                </div>
              ) : (
                <div className="bg-white rounded-lg border p-8 text-center">
                  <Mail className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No email draft yet</p>
                  <p className="text-gray-400 text-sm mt-1">Generate a personalized outreach email using AI.</p>
                </div>
              )}
            </TabsContent>

            {/* Activity Tab */}
            <TabsContent value="activity">
              <div className="bg-white rounded-lg border divide-y">
                {(!lead.lead_activities || lead.lead_activities.length === 0) ? (
                  <div className="p-8 text-center">
                    <Calendar className="h-8 w-8 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No activity yet</p>
                  </div>
                ) : (
                  [...lead.lead_activities]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(activity => (
                      <div key={activity.id} className="flex items-start gap-3 p-4">
                        <div className="flex-shrink-0 mt-0.5">
                          <ActivityIcon type={activity.activity_type} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-900">
                            <ActivityLabel activity={activity} />
                          </p>
                          {Object.keys(activity.metadata ?? {}).length > 0 && (
                            <p className="text-xs text-gray-400 mt-0.5">
                              {JSON.stringify(activity.metadata)}
                            </p>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 flex-shrink-0">
                          {formatRelativeTime(activity.created_at)}
                        </p>
                      </div>
                    ))
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
