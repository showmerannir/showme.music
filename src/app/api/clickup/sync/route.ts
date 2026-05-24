import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ClickUpClient } from '@/lib/clickup/client'

export async function POST(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch ClickUp config
    const { data: clickupConfig, error: configError } = await supabase
      .from('clickup_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (configError || !clickupConfig) {
      return NextResponse.json({ error: 'ClickUp not configured' }, { status: 400 })
    }

    const client = new ClickUpClient(clickupConfig.api_token)

    // Fetch leads that need syncing
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('*')
      .eq('user_id', user.id)
      .or('clickup_synced_at.is.null,clickup_task_id.is.null')

    if (leadsError) throw leadsError

    let synced = 0

    for (const lead of leads ?? []) {
      try {
        const location = [lead.city, lead.state_province, lead.country].filter(Boolean).join(', ')
        const description = [
          `Type: ${lead.lead_type}`,
          location && `Location: ${location}`,
          lead.website && `Website: ${lead.website}`,
          lead.capacity && `Capacity: ${lead.capacity}`,
          lead.notes && `\nNotes: ${lead.notes}`,
        ].filter(Boolean).join('\n')

        const clickupStatus = clickupConfig.status_mapping?.[lead.status]

        let taskId = lead.clickup_task_id

        if (taskId) {
          // Update existing task
          await client.updateTask(taskId, {
            name: lead.name,
            description,
            status: clickupStatus ?? undefined,
          })
        } else {
          // Create new task
          const task = await client.createTask(clickupConfig.list_id, {
            name: lead.name,
            description,
            status: clickupStatus ?? undefined,
            tags: lead.tags?.length ? lead.tags : undefined,
          })
          taskId = task.id
        }

        await supabase
          .from('leads')
          .update({
            clickup_task_id: taskId,
            clickup_synced_at: new Date().toISOString(),
          })
          .eq('id', lead.id)

        await supabase.from('lead_activities').insert({
          lead_id: lead.id,
          user_id: user.id,
          activity_type: 'clickup_synced',
          metadata: { task_id: taskId },
        })

        synced++
      } catch {
        // Continue with other leads if one fails
      }
    }

    return NextResponse.json({ synced })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
