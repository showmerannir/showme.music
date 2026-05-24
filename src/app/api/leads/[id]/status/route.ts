import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { updateStatusSchema } from '@/lib/validations/lead'

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
    const parsed = updateStatusSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { status } = parsed.data

    // Get existing lead for status comparison
    const { data: existing, error: fetchError } = await supabase
      .from('leads')
      .select('status, clickup_task_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const fromStatus = existing.status

    const { data, error } = await supabase
      .from('leads')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) throw error

    // Insert activity
    if (fromStatus !== status) {
      await supabase.from('lead_activities').insert({
        lead_id: id,
        user_id: user.id,
        activity_type: 'status_changed',
        metadata: { from_status: fromStatus, to_status: status },
      })
    }

    // Sync status to ClickUp if task exists
    if (existing.clickup_task_id) {
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
          const clickupStatus = clickupConfig.status_mapping?.[status]
          if (clickupStatus) {
            await client.updateTask(existing.clickup_task_id, { status: clickupStatus })
          }
        }
      } catch {
        // ClickUp sync failure is non-fatal
      }
    }

    return NextResponse.json(data)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
