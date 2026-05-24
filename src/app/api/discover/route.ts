import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { discoverLeads } from '@/lib/gemini/discover'
import { discoverSchema } from '@/lib/validations/lead'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const parsed = discoverSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten().fieldErrors }, { status: 400 })
    }

    const { query, count, use_icp } = parsed.data

    // Fetch ICP profile if requested
    let icpProfile = null
    if (use_icp) {
      const { data } = await supabase
        .from('icp_profiles')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      icpProfile = data
    }

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()

        const sendEvent = (data: string) => {
          controller.enqueue(encoder.encode(`data: ${data}\n\n`))
        }

        try {
          const leads = await discoverLeads(query, icpProfile, count)

          for (const lead of leads) {
            sendEvent(JSON.stringify(lead))
            // Small delay between events to feel like streaming
            await new Promise(resolve => setTimeout(resolve, 80))
          }

          sendEvent('[DONE]')
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Discovery failed'
          sendEvent(JSON.stringify({ error: message }))
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
