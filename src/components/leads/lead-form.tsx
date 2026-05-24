'use client'

import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createLeadSchema, type CreateLeadInput } from '@/lib/validations/lead'

// Form values type (includes optional versions of defaulted fields)
type LeadFormValues = z.input<typeof createLeadSchema>
import { useCreateLead } from '@/hooks/use-leads'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { VENUE_TYPES, PROMOTER_SCALES } from '@/types/lead'
import { toast } from '@/hooks/use-toast'

interface LeadFormProps {
  onSuccess?: () => void
  onCancel?: () => void
}

export function LeadForm({ onSuccess, onCancel }: LeadFormProps) {
  const createLead = useCreateLead()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<LeadFormValues, unknown, CreateLeadInput>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      lead_type: 'venue',
      status: 'new',
      country: 'US',
      source: 'manual',
      tags: [],
    },
  })

  const leadType = watch('lead_type')

  const onSubmit: SubmitHandler<CreateLeadInput> = async (data) => {
    try {
      await createLead.mutateAsync(data)
      toast({ title: 'Lead created', description: `${data.name} has been added to your pipeline.` })
      onSuccess?.()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create lead'
      toast({ title: 'Error', description: message, variant: 'destructive' })
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name */}
      <div className="space-y-1">
        <Label htmlFor="name">Name *</Label>
        <Input id="name" placeholder="Venue or promoter name" {...register('name')} />
        {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
      </div>

      {/* Lead Type */}
      <div className="space-y-1">
        <Label htmlFor="lead_type">Type *</Label>
        <Select
          value={leadType}
          onValueChange={(val) => setValue('lead_type', val as 'venue' | 'promoter')}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="venue">Venue</SelectItem>
            <SelectItem value="promoter">Promoter</SelectItem>
          </SelectContent>
        </Select>
        {errors.lead_type && <p className="text-xs text-red-500">{errors.lead_type.message}</p>}
      </div>

      {/* Location */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="city">City</Label>
          <Input id="city" placeholder="City" {...register('city')} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="state_province">State / Province</Label>
          <Input id="state_province" placeholder="State" {...register('state_province')} />
        </div>
      </div>

      <div className="space-y-1">
        <Label htmlFor="country">Country</Label>
        <Input id="country" placeholder="US" {...register('country')} />
        {errors.country && <p className="text-xs text-red-500">{errors.country.message}</p>}
      </div>

      {/* Website */}
      <div className="space-y-1">
        <Label htmlFor="website">Website</Label>
        <Input id="website" type="url" placeholder="https://example.com" {...register('website')} />
        {errors.website && <p className="text-xs text-red-500">{errors.website.message}</p>}
      </div>

      {/* Instagram */}
      <div className="space-y-1">
        <Label htmlFor="instagram">Instagram</Label>
        <Input id="instagram" placeholder="@handle" {...register('instagram')} />
      </div>

      {/* Venue-specific fields */}
      {leadType === 'venue' && (
        <>
          <div className="space-y-1">
            <Label htmlFor="capacity">Capacity</Label>
            <Input
              id="capacity"
              type="number"
              placeholder="500"
              {...register('capacity', { valueAsNumber: true })}
            />
            {errors.capacity && <p className="text-xs text-red-500">{errors.capacity.message}</p>}
          </div>

          <div className="space-y-1">
            <Label htmlFor="venue_type">Venue Type</Label>
            <Select onValueChange={(val) => setValue('venue_type', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Select venue type" />
              </SelectTrigger>
              <SelectContent>
                {VENUE_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {/* Promoter-specific fields */}
      {leadType === 'promoter' && (
        <div className="space-y-1">
          <Label htmlFor="promoter_scale">Scale</Label>
          <Select onValueChange={(val) => setValue('promoter_scale', val)}>
            <SelectTrigger>
              <SelectValue placeholder="Select scale" />
            </SelectTrigger>
            <SelectContent>
              {PROMOTER_SCALES.map((scale) => (
                <SelectItem key={scale} value={scale}>
                  {scale.charAt(0).toUpperCase() + scale.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Notes */}
      <div className="space-y-1">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Any additional notes..." {...register('notes')} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-2">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={createLead.isPending}>
          {createLead.isPending ? 'Creating…' : 'Create Lead'}
        </Button>
      </div>
    </form>
  )
}
