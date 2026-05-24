'use client'

import { useState } from 'react'
import { Sparkles, Plus, Loader2, Building2, Users, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'
import type { DiscoveredLead } from '@/lib/gemini/discover'

interface DiscoveredLeadWithState extends DiscoveredLead {
  added?: boolean
  adding?: boolean
}

export default function DiscoverPage() {
  const [query, setQuery] = useState('')
  const [isSearching, setIsSearching] = useState(false)
  const [results, setResults] = useState<DiscoveredLeadWithState[]>([])

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    setResults([])

    try {
      const res = await fetch('/api/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), count: 8, use_icp: true }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Search failed' }))
        throw new Error(err.error ?? 'Search failed')
      }

      if (!res.body) throw new Error('No response body')

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed.startsWith('data:')) continue
          const data = trimmed.slice(5).trim()
          if (data === '[DONE]') break
          if (!data) continue

          try {
            const lead = JSON.parse(data) as DiscoveredLead
            setResults(prev => [...prev, lead])
          } catch {
            // ignore parse errors
          }
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Search failed'
      toast({ title: 'Search failed', description: message, variant: 'destructive' })
    } finally {
      setIsSearching(false)
    }
  }

  const handleAddToPipeline = async (index: number) => {
    const lead = results[index]
    if (!lead) return

    setResults(prev =>
      prev.map((r, i) => (i === index ? { ...r, adding: true } : r))
    )

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: lead.name,
          lead_type: lead.lead_type,
          city: lead.city,
          state_province: lead.state_province,
          country: lead.country,
          website: lead.website,
          instagram: lead.instagram,
          capacity: lead.capacity,
          venue_type: lead.venue_type,
          icp_score: lead.icp_score,
          ai_summary: lead.description,
          source: 'discover',
          status: 'new',
          tags: [],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Failed to add lead' }))
        throw new Error(err.error ?? 'Failed to add lead')
      }

      setResults(prev =>
        prev.map((r, i) => (i === index ? { ...r, adding: false, added: true } : r))
      )
      toast({ title: 'Lead added', description: `${lead.name} added to your pipeline.` })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add lead'
      toast({ title: 'Error', description: message, variant: 'destructive' })
      setResults(prev =>
        prev.map((r, i) => (i === index ? { ...r, adding: false } : r))
      )
    }
  }

  function IcpBadge({ score }: { score: number }) {
    const color =
      score >= 75 ? 'bg-green-100 text-green-700' : score >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'
    return (
      <span className={cn('text-xs font-semibold px-2 py-0.5 rounded-full', color)}>
        ICP {score}
      </span>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-violet-600" />
          <h1 className="text-xl font-semibold text-gray-900">Discover Leads</h1>
        </div>
        <p className="text-sm text-gray-500">
          Use AI to discover venues and promoters that match your ideal customer profile.
        </p>
      </div>

      {/* Search area */}
      <div className="px-6 py-4 border-b bg-white">
        <div className="max-w-2xl">
          <Textarea
            placeholder="Describe what you're looking for… e.g. 'Electronic music clubs in Berlin with capacity 300-1000' or 'Independent concert promoters in the UK'"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSearch()
            }}
            className="min-h-[100px] mb-3"
          />
          <Button
            onClick={handleSearch}
            disabled={isSearching || !query.trim()}
            className="gap-2"
          >
            {isSearching ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Searching…</>
            ) : (
              <><Sparkles className="h-4 w-4" />Search</>
            )}
          </Button>
          <p className="text-xs text-gray-400 mt-2">Tip: Press Cmd+Enter to search.</p>
        </div>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-auto p-6">
        {results.length === 0 && !isSearching && (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Sparkles className="h-10 w-10 text-gray-200 mb-4" />
            <p className="text-gray-500 font-medium">Start by describing what you're looking for</p>
            <p className="text-gray-400 text-sm mt-1">AI will discover real venues and promoters matching your query.</p>
          </div>
        )}

        {isSearching && results.length === 0 && (
          <div className="flex items-center justify-center h-32">
            <div className="flex items-center gap-2 text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Discovering leads…</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {results.map((lead, index) => (
            <div
              key={`${lead.name}-${index}`}
              className="bg-white rounded-lg border p-4 shadow-sm animate-in fade-in duration-300"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <h3 className="font-semibold text-gray-900 leading-tight">{lead.name}</h3>
                <IcpBadge score={lead.icp_score} />
              </div>

              <div className="flex items-center gap-2 flex-wrap mb-3">
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {lead.lead_type === 'venue' ? (
                    <Building2 className="h-3.5 w-3.5" />
                  ) : (
                    <Users className="h-3.5 w-3.5" />
                  )}
                  <span className="capitalize">{lead.lead_type}</span>
                </div>
                {lead.venue_type && (
                  <Badge variant="secondary" className="text-xs">{lead.venue_type}</Badge>
                )}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  <MapPin className="h-3.5 w-3.5" />
                  {[lead.city, lead.country].filter(Boolean).join(', ')}
                </div>
                {lead.capacity && (
                  <span className="text-xs text-gray-400">Cap. {lead.capacity.toLocaleString()}</span>
                )}
              </div>

              <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-3">{lead.description}</p>

              <div className="flex gap-2">
                {lead.website && (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-violet-600 hover:underline"
                  >
                    Website ↗
                  </a>
                )}
                <div className="flex-1" />
                <Button
                  size="sm"
                  onClick={() => handleAddToPipeline(index)}
                  disabled={lead.adding || lead.added}
                  variant={lead.added ? 'secondary' : 'default'}
                >
                  {lead.adding ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : lead.added ? (
                    'Added ✓'
                  ) : (
                    <><Plus className="h-4 w-4 mr-1" />Add to Pipeline</>
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>

        {isSearching && results.length > 0 && (
          <div className="flex items-center justify-center mt-4 text-gray-400 text-sm gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading more…
          </div>
        )}
      </div>
    </div>
  )
}
