import { getGeminiModel } from './client'
import type { IcpProfile } from '@/types/lead'

export interface DiscoveredLead {
  name: string
  lead_type: 'venue' | 'promoter'
  city: string
  state_province?: string
  country: string
  website?: string
  instagram?: string
  capacity?: number
  venue_type?: string
  description: string
  icp_score: number
}

function buildIcpContext(icpProfile: IcpProfile): string {
  const parts: string[] = []

  if (icpProfile.lead_types.length > 0) {
    parts.push(`Lead types: ${icpProfile.lead_types.join(', ')}`)
  }
  if (icpProfile.venue_types.length > 0) {
    parts.push(`Preferred venue types: ${icpProfile.venue_types.join(', ')}`)
  }
  if (icpProfile.promoter_scales.length > 0) {
    parts.push(`Promoter scales: ${icpProfile.promoter_scales.join(', ')}`)
  }
  if (icpProfile.genres.length > 0) {
    parts.push(`Target genres: ${icpProfile.genres.join(', ')}`)
  }
  if (icpProfile.geographies.length > 0) {
    parts.push(`Target geographies: ${icpProfile.geographies.join(', ')}`)
  }
  if (icpProfile.min_capacity !== undefined || icpProfile.max_capacity !== undefined) {
    const min = icpProfile.min_capacity ?? 0
    const max = icpProfile.max_capacity ?? '∞'
    parts.push(`Venue capacity range: ${min}–${max}`)
  }
  if (icpProfile.keywords.length > 0) {
    parts.push(`Keywords: ${icpProfile.keywords.join(', ')}`)
  }
  if (icpProfile.notes) {
    parts.push(`Additional notes: ${icpProfile.notes}`)
  }

  return parts.join('\n')
}

function extractJsonBlock(text: string): string {
  // Try to extract from ```json ... ``` block first
  const jsonBlockMatch = text.match(/```json\s*([\s\S]*?)```/)
  if (jsonBlockMatch) {
    return jsonBlockMatch[1].trim()
  }

  // Fall back to bare ``` ... ``` block
  const codeBlockMatch = text.match(/```\s*([\s\S]*?)```/)
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim()
  }

  // Last resort: try the full text as JSON
  return text.trim()
}

export async function discoverLeads(
  query: string,
  icpProfile: IcpProfile | null,
  count: number = 5
): Promise<DiscoveredLead[]> {
  const model = getGeminiModel()

  const icpSection = icpProfile
    ? `
## Ideal Customer Profile (ICP)
${buildIcpContext(icpProfile)}

Use the ICP above to score and filter your results. Prioritize leads that closely match the ICP.
`
    : ''

  const prompt = `You are a music industry research assistant helping a B2B SaaS company called showMe.music find potential clients.

showMe.music connects venues and promoters with emerging artists through smart matching. We are looking for venues and promoters that would benefit from discovering new talent.
${icpSection}
## Search Request
Find ${count} real venues and/or promoters that match the following query:

"${query}"

## Instructions
- Use your knowledge to identify real, existing venues and promoters.
- Provide accurate details — real website URLs, real Instagram handles if known.
- Each result should be a distinct business.
- Assign an ICP score from 0–100 based on how well the lead matches the ideal customer profile (if no ICP is provided, score based on general suitability for a music discovery platform).
- For venues, always include capacity (approximate is fine) and venue_type.
- For promoters, omit capacity and venue_type.
- Descriptions should be 2–3 sentences, specific and factual.

## Output Format
Respond ONLY with a JSON code block containing an array. Do not include any text before or after the code block.

\`\`\`json
[
  {
    "name": "Venue or Promoter Name",
    "lead_type": "venue" | "promoter",
    "city": "City Name",
    "state_province": "State or Province (optional)",
    "country": "Country Code (e.g. US, UK, DE)",
    "website": "https://example.com (optional)",
    "instagram": "@handle (optional)",
    "capacity": 500,
    "venue_type": "Club",
    "description": "2–3 sentence factual description.",
    "icp_score": 85
  }
]
\`\`\`
`

  const result = await model.generateContent(prompt)
  const response = await result.response
  const text = response.text()

  const jsonText = extractJsonBlock(text)
  const parsed = JSON.parse(jsonText)

  if (!Array.isArray(parsed)) {
    throw new Error('Gemini response was not an array')
  }

  return parsed.map((item: Record<string, unknown>): DiscoveredLead => ({
    name: String(item.name ?? ''),
    lead_type: (item.lead_type === 'promoter' ? 'promoter' : 'venue') as 'venue' | 'promoter',
    city: String(item.city ?? ''),
    state_province: item.state_province ? String(item.state_province) : undefined,
    country: String(item.country ?? 'US'),
    website: item.website ? String(item.website) : undefined,
    instagram: item.instagram ? String(item.instagram) : undefined,
    capacity: typeof item.capacity === 'number' ? item.capacity : undefined,
    venue_type: item.venue_type ? String(item.venue_type) : undefined,
    description: String(item.description ?? ''),
    icp_score: typeof item.icp_score === 'number' ? Math.min(100, Math.max(0, item.icp_score)) : 50,
  }))
}
