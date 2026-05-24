import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateLeadSchema } from '@/lib/validations/lead'
import { extractDomain } from '@/lib/utils'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const [leadResult, contactsResult, draftsResult, activitiesResult] = await Promise.all([
      supabase.from('leads').select('*').eq('id', id).eq('user_id', user.id).single(),
      supabase.from('contacts').select('*').eq('lead_id', id).eq('user_id', user.id).order('is_primary', { ascending: false }).order('created_at', { ascending: true }),
      supabase.from('email_drafts').select('*').eq('lead_id', id).eq('user_id', user.id).order('version', { ascending: false }),
      supabase.from('lead_activities').select('*').eq('lead_id', id).eq('user_id', user.id).order('created_at', { ascending: false }).limit(20),
    ])

    if (leadResult.error) {
      if (leadResult.error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      throw leadResult.error
    }

    return NextResponse.json({
      ...leadResult.data,
      contacts: contactsResult.data ?? [],
      email_drafts: draftsResult.data ?? [],
      lead_activities: activitiesResult.data ?? [],
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = updateLeadSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const updateData = parsed.data
    if (updateData.website) {
      updateData.domain = extractDomain(updateData.website) ?? undefined
    }

    // Check if status is changing
    if (updateData.status) {
      const { data: existing } = await supabase
        .from('leads')
        .select('status')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (existing && existing.status !== updateData.status) {
        await supabase.from('lead_activities').insert({
          lead_id: id,
          user_id: user.id,
          activity_type: 'status_changed',
          metadata: { from_status: existing.status, to_status: updateData.status },
        })
      }
    }

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      throw error
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('leads')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error

    return new NextResponse(null, { status: 204 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
