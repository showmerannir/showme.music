import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createHmac } from 'crypto'
import type { LeadStatus } from '@/types/lead'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const signature = request.headers.get('x-signature')
    const secret = process.env.CLICKUP_WEBHOOK_SECRET

    // Verify HMAC-SHA256 signature
    if (secret && signature) {
      const expected = createHmac('sha256', secret).update(body).digest('hex')
      if (expected !== signature) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
      }
    }

    const payload = JSON.parse(body)
    const { event, task_id, history_items } = payload

    if (event !== 'taskStatusUpdated' || !task_id) {
      return NextResponse.json({ ok: true })
    }

    const supabase = await createClient()

    // Find the lead by clickup_task_id
    const { data: lead } = await supabase
      .from('leads')
      .select('id, user_id, status')
      .eq('clickup_task_id', task_id)
      .single()

    if (!lead) {
      return NextResponse.json({ ok: true })
    }

    // Extract new status from history items
    const newClickupStatus = history_items?.[0]?.after?.status as string | undefined
    if (!newClickupStatus) {
      return NextResponse.json({ ok: true })
    }

    // Get clickup config for this user to find reverse mapping
    const { data: clickupConfig } = await supabase
      .from('clickup_configs')
      .select('status_mapping')
      .eq('user_id', lead.user_id)
      .eq('is_active', true)
      .single()

    if (!clickupConfig?.status_mapping) {
      return NextResponse.json({ ok: true })
    }

    // Reverse map: ClickUp status → CRM status
    const reverseMapping: Record<string, LeadStatus> = {}
    for (const [crmStatus, clickupStatus] of Object.entries(clickupConfig.status_mapping)) {
      reverseMapping[(clickupStatus as string).toLowerCase()] = crmStatus as LeadStatus
    }

    const crmStatus = reverseMapping[newClickupStatus.toLowerCase()]
    if (!crmStatus || crmStatus === lead.status) {
      return NextResponse.json({ ok: true })
    }

    // Update lead status
    await supabase
      .from('leads')
      .update({ status: crmStatus, updated_at: new Date().toISOString() })
      .eq('id', lead.id)

    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      user_id: lead.user_id,
      activity_type: 'status_changed',
      metadata: { from_status: lead.status, to_status: crmStatus, source: 'clickup_webhook' },
    })

    return NextResponse.json({ ok: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
