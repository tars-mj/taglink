'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Switch } from '@/components/ui/switch'
import { Loader2, Grid3x3, List, Save } from 'lucide-react'
import { updateUserPreferences } from '@/app/actions/preferences'
import { useToast } from '@/hooks/use-toast'
import type { UserPreferences, DefaultView, LinksPerPage, DefaultSort } from '@/types'

interface PreferencesFormProps {
  preferences: UserPreferences
  onSuccess?: () => void
}

export function PreferencesForm({ preferences, onSuccess }: PreferencesFormProps) {
  const [defaultView, setDefaultView] = useState<DefaultView>(preferences.default_view)
  const [linksPerPage, setLinksPerPage] = useState<LinksPerPage>(preferences.links_per_page)
  const [defaultSort, setDefaultSort] = useState<DefaultSort>(preferences.default_sort)
  const [aiEnabled, setAiEnabled] = useState(preferences.ai_processing_enabled)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const hasChanges =
    defaultView !== preferences.default_view ||
    linksPerPage !== preferences.links_per_page ||
    defaultSort !== preferences.default_sort ||
    aiEnabled !== preferences.ai_processing_enabled

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData()
    formData.append('default_view', defaultView)
    formData.append('links_per_page', linksPerPage.toString())
    formData.append('default_sort', defaultSort)
    formData.append('ai_processing_enabled', aiEnabled.toString())

    startTransition(async () => {
      const result = await updateUserPreferences(formData)

      if (result.success) {
        toast({
          title: 'Preferences Updated',
          description: 'Your settings have been saved successfully',
        })
        onSuccess?.()
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to update preferences',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Default View */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Default View</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Choose how you want to display your links
          </p>
        </div>
        <RadioGroup
          value={defaultView}
          onValueChange={(value: string) => setDefaultView(value as DefaultView)}
          className="grid grid-cols-2 gap-4"
        >
          <div>
            <RadioGroupItem value="grid" id="grid" className="peer sr-only" />
            <Label
              htmlFor="grid"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <Grid3x3 className="mb-3 h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">Grid</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Card layout with previews
                </div>
              </div>
            </Label>
          </div>
          <div>
            <RadioGroupItem value="list" id="list" className="peer sr-only" />
            <Label
              htmlFor="list"
              className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
            >
              <List className="mb-3 h-6 w-6" />
              <div className="text-center">
                <div className="font-semibold">List</div>
                <div className="text-xs text-muted-foreground mt-1">
                  Compact list layout
                </div>
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Links Per Page */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Links Per Page</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Number of links to display on each page
          </p>
        </div>
        <RadioGroup
          value={linksPerPage.toString()}
          onValueChange={(value: string) => setLinksPerPage(Number(value) as LinksPerPage)}
          className="grid grid-cols-3 gap-4"
        >
          {[12, 24, 48].map((count) => (
            <div key={count}>
              <RadioGroupItem
                value={count.toString()}
                id={`links-${count}`}
                className="peer sr-only"
              />
              <Label
                htmlFor={`links-${count}`}
                className="flex flex-col items-center justify-center rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer"
              >
                <div className="font-semibold text-lg">{count}</div>
                <div className="text-xs text-muted-foreground mt-1">links</div>
              </Label>
            </div>
          ))}
        </RadioGroup>
      </div>

      {/* Default Sort */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">Default Sort Order</Label>
          <p className="text-sm text-muted-foreground mt-1">
            How links should be sorted by default
          </p>
        </div>
        <RadioGroup
          value={defaultSort}
          onValueChange={(value: string) => setDefaultSort(value as DefaultSort)}
          className="space-y-2"
        >
          <div className="flex items-center space-x-3 rounded-md border p-3">
            <RadioGroupItem value="rating-desc" id="rating-desc" />
            <Label htmlFor="rating-desc" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Highest Rating First</div>
              <div className="text-sm text-muted-foreground">
                Show your best-rated links at the top
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-3">
            <RadioGroupItem value="date-desc" id="date-desc" />
            <Label htmlFor="date-desc" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Newest First</div>
              <div className="text-sm text-muted-foreground">
                Show recently added links first
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-3">
            <RadioGroupItem value="date-asc" id="date-asc" />
            <Label htmlFor="date-asc" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Oldest First</div>
              <div className="text-sm text-muted-foreground">
                Show your earliest links first
              </div>
            </Label>
          </div>
          <div className="flex items-center space-x-3 rounded-md border p-3">
            <RadioGroupItem value="relevance" id="relevance" />
            <Label htmlFor="relevance" className="flex-1 cursor-pointer font-normal">
              <div className="font-medium">Relevance</div>
              <div className="text-sm text-muted-foreground">
                Sort by search relevance (when searching)
              </div>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* AI Processing Toggle */}
      <div className="space-y-4">
        <div>
          <Label className="text-base font-semibold">AI Processing</Label>
          <p className="text-sm text-muted-foreground mt-1">
            Automatically generate descriptions and suggest tags using AI
          </p>
        </div>
        <div className="flex items-center justify-between rounded-md border p-4">
          <div className="space-y-0.5">
            <div className="font-medium">Enable AI Processing</div>
            <div className="text-sm text-muted-foreground">
              AI will analyze new links and generate descriptions and tag suggestions
            </div>
          </div>
          <Switch
            checked={aiEnabled}
            onCheckedChange={setAiEnabled}
          />
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button type="submit" disabled={isPending || !hasChanges}>
          {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          <Save className="h-4 w-4 mr-2" />
          Save Preferences
        </Button>
      </div>
    </form>
  )
}
