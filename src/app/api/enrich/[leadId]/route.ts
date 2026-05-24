import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { scrapeContactInfo } from '@/lib/scraper/contact-scraper'

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch lead
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .eq('user_id', user.id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Scrape contact info
    const scraped = await scrapeContactInfo(lead.website ?? '')

    const upsertedContacts: unknown[] = []

    // Upsert emails as contacts
    for (let i = 0; i < scraped.emails.length; i++) {
      const email = scraped.emails[i]
      const { data: contact, error: upsertError } = await supabase
        .from('contacts')
        .upsert(
          {
            lead_id: leadId,
            user_id: user.id,
            email,
            email_source: scraped.contactPageUrl ? 'website' : 'website',
            email_confidence: 80,
            is_primary: i === 0,
            enriched_at: new Date().toISOString(),
          },
          { onConflict: 'lead_id,email', ignoreDuplicates: false }
        )
        .select()
        .single()

      if (!upsertError && contact) {
        upsertedContacts.push(contact)
      }
    }

    // If we have phones but no contact yet with phone, update first contact
    if (scraped.phones.length > 0 && upsertedContacts.length > 0) {
      const firstContact = upsertedContacts[0] as { id: string }
      await supabase
        .from('contacts')
        .update({ phone: scraped.phones[0], phone_source: 'website' })
        .eq('id', firstContact.id)
    }

    // Update lead.enriched_at
    await supabase
      .from('leads')
      .update({ enriched_at: new Date().toISOString() })
      .eq('id', leadId)

    // Insert enrichment_run activity
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      user_id: user.id,
      activity_type: 'enrichment_run',
      metadata: {
        emails_found: scraped.emails.length,
        phones_found: scraped.phones.length,
        contact_page: scraped.contactPageUrl,
      },
    })

    // If ClickUp task exists, add a comment
    if (lead.clickup_task_id && scraped.emails.length > 0) {
      try {
        const { data: clickupConfig } = await supabase
          .from('clickup_configs')
          .select('*')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (clickupConfig) {
          const { ClickUpClient } = await import('@/lib/clickup/client')
          const client = new ClickUpClient(clickupConfig.api_token)
          const contactInfo = [
            `Enrichment complete — ${scraped.emails.length} emails found:`,
            ...scraped.emails.map(e => `• ${e}`),
            scraped.phones.length > 0 ? `\nPhones: ${scraped.phones.join(', ')}` : '',
          ].join('\n')
          await client.addComment(lead.clickup_task_id, contactInfo)
        }
      } catch {
        // ClickUp comment failure is non-fatal
      }
    }

    const summary = [
      `Found ${scraped.emails.length} email(s)`,
      scraped.phones.length > 0 ? `and ${scraped.phones.length} phone number(s)` : '',
    ].filter(Boolean).join(' ')

    return NextResponse.json({ contacts: upsertedContacts, summary })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
