import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createLeadSchema } from '@/lib/validations/lead'
import { extractDomain } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = request.nextUrl
    const status = searchParams.get('status')
    const lead_type = searchParams.get('lead_type')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') ?? '1', 10)
    const limit = parseInt(searchParams.get('limit') ?? '50', 10)
    const offset = (page - 1) * limit

    let query = supabase
      .from('leads')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status)
    if (lead_type) query = query.eq('lead_type', lead_type)
    if (search) {
      query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,country.ilike.%${search}%`)
    }

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({ data: data ?? [], count: count ?? 0 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = createLeadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const leadData = parsed.data
    if (leadData.website) {
      leadData.domain = extractDomain(leadData.website) ?? undefined
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert({ ...leadData, user_id: user.id })
      .select()
      .single()

    if (error) throw error

    // Insert lead_created activity
    await supabase.from('lead_activities').insert({
      lead_id: lead.id,
      user_id: user.id,
      activity_type: 'lead_created',
      metadata: { source: lead.source },
    })

    // Sync to ClickUp if configured
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
        const location = [lead.city, lead.state_province, lead.country].filter(Boolean).join(', ')
        const task = await client.createTask(clickupConfig.list_id, {
          name: lead.name,
          description: [
            `Type: ${lead.lead_type}`,
            location && `Location: ${location}`,
            lead.website && `Website: ${lead.website}`,
          ].filter(Boolean).join('\n'),
          status: clickupConfig.status_mapping?.[lead.status] ?? undefined,
          tags: lead.tags?.length ? lead.tags : undefined,
        })

        await supabase
          .from('leads')
          .update({ clickup_task_id: task.id, clickup_synced_at: new Date().toISOString() })
          .eq('id', lead.id)

        await supabase.from('lead_activities').insert({
          lead_id: lead.id,
          user_id: user.id,
          activity_type: 'clickup_synced',
          metadata: { task_id: task.id },
        })
      }
    } catch {
      // ClickUp sync failure is non-fatal
    }

    return NextResponse.json(lead, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
