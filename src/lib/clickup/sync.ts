import { ClickUpClient } from './client'
import type { Lead, Contact, LeadStatus } from '@/types/lead'

export interface SyncConfig {
  apiToken: string
  listId: string
  statusMapping: Record<string, string>
}

function buildLeadDescription(lead: Lead, contacts: Contact[]): string {
  const lines: string[] = []

  lines.push(`## Lead Details`)
  lines.push(`**Type:** ${lead.lead_type === 'venue' ? 'Venue' : 'Promoter'}`)

  const location = [lead.city, lead.state_province, lead.country]
    .filter(Boolean)
    .join(', ')
  if (location) lines.push(`**Location:** ${location}`)

  if (lead.website) lines.push(`**Website:** ${lead.website}`)
  if (lead.instagram) lines.push(`**Instagram:** ${lead.instagram}`)
  if (lead.facebook) lines.push(`**Facebook:** ${lead.facebook}`)
  if (lead.capacity) lines.push(`**Capacity:** ${lead.capacity}`)
  if (lead.venue_type) lines.push(`**Venue Type:** ${lead.venue_type}`)
  if (lead.promoter_scale) lines.push(`**Promoter Scale:** ${lead.promoter_scale}`)

  if (lead.icp_score !== undefined && lead.icp_score !== null) {
    lines.push(`**ICP Score:** ${lead.icp_score}/100`)
  }

  if (lead.tags && lead.tags.length > 0) {
    lines.push(`**Tags:** ${lead.tags.join(', ')}`)
  }

  if (lead.ai_summary) {
    lines.push(``)
    lines.push(`## AI Summary`)
    lines.push(lead.ai_summary)
  }

  if (lead.notes) {
    lines.push(``)
    lines.push(`## Notes`)
    lines.push(lead.notes)
  }

  if (contacts.length > 0) {
    lines.push(``)
    lines.push(`## Contacts`)
    for (const contact of contacts) {
      const name =
        contact.full_name ??
        [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
        'Unknown'
      lines.push(`### ${name}${contact.is_primary ? ' (Primary)' : ''}`)
      if (contact.title) lines.push(`- Title: ${contact.title}`)
      if (contact.email) lines.push(`- Email: ${contact.email}`)
      if (contact.phone) lines.push(`- Phone: ${contact.phone}`)
      if (contact.linkedin) lines.push(`- LinkedIn: ${contact.linkedin}`)
    }
  }

  lines.push(``)
  lines.push(`---`)
  lines.push(`*Source: ${lead.source} | CRM Lead ID: ${lead.id}*`)
  lines.push(`*Created: ${new Date(lead.created_at).toLocaleDateString()}*`)

  return lines.join('\n')
}

function buildContactComment(contacts: Contact[]): string {
  const lines: string[] = ['📋 **Contact Information Update**', '']

  for (const contact of contacts) {
    const name =
      contact.full_name ??
      [contact.first_name, contact.last_name].filter(Boolean).join(' ') ||
      'Unknown'

    lines.push(`**${name}**${contact.is_primary ? ' ⭐ Primary' : ''}`)
    if (contact.title) lines.push(`  Title: ${contact.title}`)
    if (contact.email) {
      const confidence =
        contact.email_confidence !== undefined && contact.email_confidence !== null
          ? ` (${contact.email_confidence}% confidence)`
          : ''
      lines.push(`  Email: ${contact.email}${confidence}`)
    }
    if (contact.phone) lines.push(`  Phone: ${contact.phone}`)
    if (contact.linkedin) lines.push(`  LinkedIn: ${contact.linkedin}`)
    lines.push('')
  }

  return lines.join('\n')
}

export async function syncLeadToClickUp(
  lead: Lead,
  contacts: Contact[],
  config: SyncConfig
): Promise<string> {
  const client = new ClickUpClient(config.apiToken)

  // Map our CRM status to the ClickUp status using the provided mapping
  const clickupStatus = config.statusMapping[lead.status] ?? undefined

  const description = buildLeadDescription(lead, contacts)

  if (lead.clickup_task_id) {
    // Task already exists — update it
    await client.updateTask(lead.clickup_task_id, {
      name: lead.name,
      description,
      ...(clickupStatus ? { status: clickupStatus } : {}),
    })

    // Add a comment with the latest contact info if there are contacts
    if (contacts.length > 0) {
      const commentText = buildContactComment(contacts)
      await client.addComment(lead.clickup_task_id, commentText)
    }

    return lead.clickup_task_id
  } else {
    // Create a new task
    const task = await client.createTask(config.listId, {
      name: lead.name,
      description,
      ...(clickupStatus ? { status: clickupStatus } : {}),
      tags: lead.tags && lead.tags.length > 0 ? lead.tags : undefined,
    })

    return task.id
  }
}

export async function getReverseMappedStatus(
  clickupStatus: string,
  statusMapping: Record<string, string>
): Promise<LeadStatus | null> {
  const normalizedClickup = clickupStatus.toLowerCase().trim()

  for (const [crmStatus, mappedClickupStatus] of Object.entries(statusMapping)) {
    if (mappedClickupStatus.toLowerCase().trim() === normalizedClickup) {
      return crmStatus as LeadStatus
    }
  }

  return null
}
