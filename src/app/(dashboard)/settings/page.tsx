'use client'

import { useEffect, useState } from 'react'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useIcp, useUpdateIcp } from '@/hooks/use-icp'
import { icpProfileSchema, type IcpProfileInput } from '@/lib/validations/icp'
import { VENUE_TYPES, PROMOTER_SCALES, GENRES, LEAD_STATUSES, LEAD_STATUS_LABELS } from '@/types/lead'
import { toast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

type IcpFormValues = z.input<typeof icpProfileSchema>

// ─── ICP Profile Form ────────────────────────────────────────────────────────

function IcpProfileForm() {
  const { data: icp, isLoading } = useIcp()
  const updateIcp = useUpdateIcp()

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<IcpFormValues, unknown, IcpProfileInput>({
    resolver: zodResolver(icpProfileSchema),
    defaultValues: {
      name: '',
      lead_types: ['venue', 'promoter'],
      venue_types: [],
      promoter_scales: [],
      genres: [],
      geographies: [],
      keywords: [],
      is_active: true,
    },
  })

  const [geographies, setGeographies] = useState<string[]>([])
  const [newGeo, setNewGeo] = useState('')
  const [keywords, setKeywords] = useState<string[]>([])
  const [newKeyword, setNewKeyword] = useState('')

  const leadTypes = watch('lead_types') ?? []
  const venueTypes = watch('venue_types') ?? []
  const promoterScales = watch('promoter_scales') ?? []
  const selectedGenres = watch('genres') ?? []

  useEffect(() => {
    if (!icp) return
    setValue('name', icp.name)
    setValue('lead_types', icp.lead_types as ('venue' | 'promoter')[])
    setValue('venue_types', icp.venue_types)
    setValue('promoter_scales', icp.promoter_scales as ('local' | 'regional' | 'national' | 'international')[])
    setValue('genres', icp.genres)
    setValue('geographies', icp.geographies)
    setValue('keywords', icp.keywords)
    setValue('notes', icp.notes)
    setValue('min_capacity', icp.min_capacity)
    setValue('max_capacity', icp.max_capacity)
    setGeographies(icp.geographies)
    setKeywords(icp.keywords)
  }, [icp, setValue])

  const toggleLeadType = (type: 'venue' | 'promoter') => {
    const next = leadTypes.includes(type)
      ? leadTypes.filter(t => t !== type)
      : [...leadTypes, type]
    setValue('lead_types', next as ('venue' | 'promoter')[])
  }

  const toggleVenueType = (type: string) => {
    const next = venueTypes.includes(type) ? venueTypes.filter(t => t !== type) : [...venueTypes, type]
    setValue('venue_types', next)
  }

  const togglePromoterScale = (scale: string) => {
    const next = promoterScales.includes(scale as 'local' | 'regional' | 'national' | 'international')
      ? promoterScales.filter(s => s !== scale)
      : [...promoterScales, scale as 'local' | 'regional' | 'national' | 'international']
    setValue('promoter_scales', next)
  }

  const toggleGenre = (genre: string) => {
    const next = selectedGenres.includes(genre) ? selectedGenres.filter(g => g !== genre) : [...selectedGenres, genre]
    setValue('genres', next)
  }

  const addGeo = () => {
    if (!newGeo.trim()) return
    const next = [...geographies, newGeo.trim()]
    setGeographies(next)
    setValue('geographies', next)
    setNewGeo('')
  }

  const removeGeo = (i: number) => {
    const next = geographies.filter((_, idx) => idx !== i)
    setGeographies(next)
    setValue('geographies', next)
  }

  const addKeyword = () => {
    if (!newKeyword.trim()) return
    const next = [...keywords, newKeyword.trim()]
    setKeywords(next)
    setValue('keywords', next)
    setNewKeyword('')
  }

  const removeKeyword = (i: number) => {
    const next = keywords.filter((_, idx) => idx !== i)
    setKeywords(next)
    setValue('keywords', next)
  }

  const onSubmit: SubmitHandler<IcpProfileInput> = async (data) => {
    try {
      await updateIcp.mutateAsync(data)
      toast({ title: 'ICP profile saved' })
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save profile'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-gray-400" /></div>
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Profile name */}
      <div className="space-y-1">
        <Label>Profile Name</Label>
        <Input placeholder="My ICP" {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Lead types */}
      <div className="space-y-2">
        <Label>Lead Types</Label>
        <div className="flex gap-2">
          {(['venue', 'promoter'] as const).map(type => (
            <button
              key={type}
              type="button"
              onClick={() => toggleLeadType(type)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium border transition-colors capitalize',
                leadTypes.includes(type)
                  ? 'bg-violet-600 text-white border-violet-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-gray-400'
              )}
            >
              {type}
            </button>
          ))}
        </div>
        {errors.lead_types && <p className="text-xs text-red-500">{errors.lead_types.message}</p>}
      </div>

      {/* Venue-specific */}
      {leadTypes.includes('venue') && (
        <>
          <div className="space-y-2">
            <Label>Capacity Range</Label>
            <div className="flex items-center gap-3">
              <Input type="number" placeholder="Min" className="w-32" {...register('min_capacity', { valueAsNumber: true })} />
              <span className="text-gray-400">–</span>
              <Input type="number" placeholder="Max" className="w-32" {...register('max_capacity', { valueAsNumber: true })} />
            </div>
            {errors.max_capacity && <p className="text-xs text-red-500">{errors.max_capacity.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Venue Types</Label>
            <div className="flex flex-wrap gap-2">
              {VENUE_TYPES.map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => toggleVenueType(type)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    venueTypes.includes(type)
                      ? 'bg-violet-100 text-violet-700 border-violet-200'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Promoter-specific */}
      {leadTypes.includes('promoter') && (
        <div className="space-y-2">
          <Label>Promoter Scales</Label>
          <div className="flex flex-wrap gap-2">
            {PROMOTER_SCALES.map(scale => (
              <button
                key={scale}
                type="button"
                onClick={() => togglePromoterScale(scale)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize',
                  promoterScales.includes(scale as 'local' | 'regional' | 'national' | 'international')
                    ? 'bg-violet-100 text-violet-700 border-violet-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                )}
              >
                {scale}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Genres */}
      <div className="space-y-2">
        <Label>Genres</Label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map(genre => (
            <button
              key={genre}
              type="button"
              onClick={() => toggleGenre(genre)}
              className={cn(
                'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                selectedGenres.includes(genre)
                  ? 'bg-violet-100 text-violet-700 border-violet-200'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              )}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Geographies */}
      <div className="space-y-2">
        <Label>Target Geographies</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {geographies.map((geo, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
              {geo}
              <button type="button" onClick={() => removeGeo(i)} className="text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add city or region…"
            value={newGeo}
            onChange={e => setNewGeo(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addGeo())}
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={addGeo}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Keywords */}
      <div className="space-y-2">
        <Label>Keywords</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {keywords.map((kw, i) => (
            <span key={i} className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2.5 py-1 rounded-full">
              {kw}
              <button type="button" onClick={() => removeKeyword(i)} className="text-gray-400 hover:text-gray-600">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add keyword…"
            value={newKeyword}
            onChange={e => setNewKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addKeyword())}
            className="max-w-xs"
          />
          <Button type="button" variant="outline" size="sm" onClick={addKeyword}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notes for AI */}
      <div className="space-y-1">
        <Label>Additional Notes for AI</Label>
        <Textarea
          placeholder="Describe your ideal customer in more detail…"
          className="min-h-[100px]"
          {...register('notes')}
        />
      </div>

      <Button type="submit" disabled={updateIcp.isPending}>
        {updateIcp.isPending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving…</> : 'Save ICP Profile'}
      </Button>
    </form>
  )
}

// ─── ClickUp Integration Form ────────────────────────────────────────────────

const DEFAULT_STATUS_MAPPING: Record<string, string> = {
  new: 'Open',
  researched: 'In Research',
  contacted: 'Contacted',
  replied: 'Replied',
  qualified: 'Qualified',
  closed: 'Closed',
}

interface ClickUpConfig {
  api_token: string
  list_id: string
  status_mapping: Record<string, string>
}

function ClickUpForm() {
  const [config, setConfig] = useState<ClickUpConfig>({
    api_token: '',
    list_id: '',
    status_mapping: { ...DEFAULT_STATUS_MAPPING },
  })
  const [isTesting, setIsTesting] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  const handleTest = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const res = await fetch('/api/clickup/test')
      const data = await res.json()
      if (data.success) {
        setTestResult({ success: true, message: `Connected to list: "${data.listName}"` })
      } else {
        setTestResult({ success: false, message: data.error ?? 'Connection failed' })
      }
    } catch {
      setTestResult({ success: false, message: 'Connection failed' })
    } finally {
      setIsTesting(false)
    }
  }

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      const res = await fetch('/api/clickup/sync', { method: 'POST' })
      const data = await res.json()
      toast({ title: `Synced ${data.synced} leads to ClickUp` })
    } catch {
      toast({ title: 'Sync failed', variant: 'destructive' })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSave = async () => {
    try {
      const res = await fetch('/api/icp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clickup_config: config }),
      })
      if (!res.ok) throw new Error('Save failed')
      toast({ title: 'ClickUp settings saved' })
    } catch {
      toast({ title: 'Failed to save settings', variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <div className="space-y-1">
          <Label>API Token</Label>
          <Input
            type="password"
            placeholder="pk_…"
            value={config.api_token}
            onChange={e => setConfig(prev => ({ ...prev, api_token: e.target.value }))}
          />
        </div>

        <div className="space-y-1">
          <Label>List ID</Label>
          <Input
            placeholder="123456789"
            value={config.list_id}
            onChange={e => setConfig(prev => ({ ...prev, list_id: e.target.value }))}
          />
          <p className="text-xs text-gray-400">Find this in your ClickUp list URL.</p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" onClick={handleTest} disabled={isTesting}>
            {isTesting ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Testing…</> : 'Test Connection'}
          </Button>
          {testResult && (
            <div className={cn('flex items-center gap-1.5 text-sm', testResult.success ? 'text-green-600' : 'text-red-500')}>
              {testResult.success ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
              {testResult.message}
            </div>
          )}
        </div>
      </div>

      {/* Status mapping */}
      <div className="space-y-3">
        <Label>Status Mapping</Label>
        <p className="text-xs text-gray-400">Map CRM statuses to ClickUp status names.</p>
        <div className="bg-gray-50 rounded-lg border divide-y">
          {LEAD_STATUSES.map(status => (
            <div key={status} className="flex items-center gap-4 px-4 py-3">
              <span className="text-sm text-gray-600 w-28">{LEAD_STATUS_LABELS[status]}</span>
              <span className="text-gray-300">→</span>
              <Input
                value={config.status_mapping[status] ?? ''}
                onChange={e =>
                  setConfig(prev => ({
                    ...prev,
                    status_mapping: { ...prev.status_mapping, [status]: e.target.value },
                  }))
                }
                placeholder={DEFAULT_STATUS_MAPPING[status]}
                className="max-w-[200px] h-8 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2">
        <Button onClick={handleSave}>Save Settings</Button>
        <Button variant="outline" onClick={handleSync} disabled={isSyncing}>
          {isSyncing ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" />Syncing…</> : 'Sync All Leads'}
        </Button>
      </div>
    </div>
  )
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b bg-white">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>

      <div className="flex-1 overflow-auto p-6">
        <Tabs defaultValue="icp">
          <TabsList>
            <TabsTrigger value="icp">ICP Profile</TabsTrigger>
            <TabsTrigger value="clickup">ClickUp Integration</TabsTrigger>
          </TabsList>
          <TabsContent value="icp">
            <IcpProfileForm />
          </TabsContent>
          <TabsContent value="clickup">
            <ClickUpForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
