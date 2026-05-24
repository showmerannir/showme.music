import { getGeminiModel } from './client'
import type { Lead, Contact } from '@/types/lead'

export interface EmailDraftResult {
  subject: string
  body: string
  research_notes: string
}

function extractJsonBlock(text: string): string {
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim()
  }

  const codeBlockMatch = text.match(/```\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  return text.trim()
}

function buildLeadContext(lead: Lead): string {
  const parts: string[] = [`Name: ${lead.name}`]

  parts.push(`Type: ${lead.lead_type === 'venue' ? 'Venue' : 'Promoter'}`)

  const location = [lead.city, lead.state_province, lead.country]
    .filter(Boolean)
    .join(', ')
  if (location) parts.push(`Location: ${location}`)

  if (lead.website) parts.push(`Website: ${lead.website}`)
  if (lead.instagram) parts.push(`Instagram: ${lead.instagram}`)
  if (lead.capacity) parts.push(`Capacity: ${lead.capacity} people`)
  if (lead.venue_type) parts.push(`Venue type: ${lead.venue_type}`)
  if (lead.promoter_scale) parts.push(`Promoter scale: ${lead.promoter_scale}`)
  if (lead.ai_summary) parts.push(`\nBackground:\n${lead.ai_summary}`)

  return parts.join('\n')
}

function buildContactContext(contacts: Contact[]): string {
  const primary = contacts.find((c) => c.is_primary) ?? contacts[0]
  if (!primary) return 'No contact information available.'

  const joinedName = [primary.first_name, primary.last_name].filter(Boolean).join(' ')
  const name = primary.full_name ?? (joinedName || 'there')

  const parts = [`Primary contact: ${name}`]
  if (primary.title) parts.push(`Title: ${primary.title}`)
  if (primary.email) parts.push(`Email: ${primary.email}`)

  return parts.join('\n')
}

export async function generateEmailDraft(
  lead: Lead,
  contacts: Contact[],
  companyDescription: string = ''
): Promise<EmailDraftResult> {
  const model = getGeminiModel()

  const leadContext = buildLeadContext(lead)
  const contactContext = buildContactContext(contacts)

  const senderDescription =
    companyDescription ||
    'showMe.music — a platform that helps venues and promoters discover and book emerging artists through AI-powered smart matching, saving hours of manual scouting and connecting you with pre-vetted talent that fits your programming.'

  const prompt = `You are an expert B2B sales copywriter specialising in the music industry.

## About the Sender
${senderDescription}

## About the Lead
${leadContext}

## Contact Information
${contactContext}

## Your Task
Write a highly personalised cold outreach email from showMe.music to this ${lead.lead_type}.

### Constraints
1. Maximum 3 short paragraphs in the body. Total body word count must be under 150 words.
2. Do NOT use generic openers like "I hope this email finds you well" or "My name is...".
3. The opening sentence must reference something specific about this ${lead.lead_type} (location, type, size, vibe, etc.).
4. Clearly explain what showMe.music does and how it benefits THIS specific ${lead.lead_type}.
5. End with a single, low-friction call to action (e.g., a quick 15-minute call, a free demo link).
6. Subject line: concise, specific, under 10 words. No clickbait.
7. Tone: professional but conversational. Not salesy.

### Output Format
Respond ONLY with a JSON code block. No text before or after.

\`\`\`json
{
  "subject": "Email subject line here",
  "body": "Full email body here (plain text, use \\n for line breaks)",
  "research_notes": "1–2 sentences explaining what specific details you used to personalise this email"
}
\`\`\`
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  const jsonText = extractJsonBlock(text)
  const parsed = JSON.parse(jsonText)

  if (!parsed.subject || !parsed.body) {
    throw new Error('Gemini response missing required fields: subject, body')
  }

  return {
    subject: String(parsed.subject),
    body: String(parsed.body),
    research_notes: String(parsed.research_notes ?? ''),
  }
}
