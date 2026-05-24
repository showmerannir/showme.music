import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { ClickUpClient } from '@/lib/clickup/client'

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: clickupConfig, error: configError } = await supabase
      .from('clickup_configs')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (configError || !clickupConfig) {
      return NextResponse.json({ success: false, error: 'ClickUp not configured' })
    }

    const client = new ClickUpClient(clickupConfig.api_token)

    try {
      const list = await client.getList(clickupConfig.list_id)
      return NextResponse.json({ success: true, listName: list.name })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Connection failed'
      return NextResponse.json({ success: false, error: message })
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
