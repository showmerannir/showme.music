import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateEmailDraft } from '@/lib/gemini/email-generator'

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

    // Fetch contacts for personalization
    const { data: contacts } = await supabase
      .from('contacts')
      .select('*')
      .eq('lead_id', leadId)
      .eq('user_id', user.id)
      .order('is_primary', { ascending: false })

    // Fetch ICP profile for additional context
    const { data: icpProfile } = await supabase
      .from('icp_profiles')
      .select('notes')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Generate draft
    const draft = await generateEmailDraft(
      lead,
      contacts ?? [],
      icpProfile?.notes ?? ''
    )

    // Get current max version
    const { data: existingDrafts } = await supabase
      .from('email_drafts')
      .select('version')
      .eq('lead_id', leadId)
      .eq('user_id', user.id)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = (existingDrafts?.[0]?.version ?? 0) + 1

    // Insert new draft
    const { data: newDraft, error: insertError } = await supabase
      .from('email_drafts')
      .insert({
        lead_id: leadId,
        user_id: user.id,
        subject: draft.subject,
        body: draft.body,
        model_used: 'gemini-1.5-flash',
        research_used: draft.research_notes,
        version: nextVersion,
        is_sent: false,
      })
      .select()
      .single()

    if (insertError) throw insertError

    // Insert email_generated activity
    await supabase.from('lead_activities').insert({
      lead_id: leadId,
      user_id: user.id,
      activity_type: 'email_generated',
      metadata: { version: nextVersion, model: 'gemini-1.5-flash' },
    })

    return NextResponse.json(newDraft, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
