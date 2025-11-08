'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Settings as SettingsIcon, RotateCcw } from 'lucide-react'
import { PreferencesForm } from '@/components/settings/preferences-form'
import { useUserPreferences, useResetPreferences } from '@/hooks/queries/use-user'

export default function SettingsPage() {
  const { data: preferences, isLoading: loading, refetch } = useUserPreferences()
  const resetMutation = useResetPreferences()

  const handleReset = () => {
    resetMutation.mutate(undefined, {
      onSuccess: () => {
        refetch()
      },
    })
  }

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-main text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Settings</h1>
          </div>
          <div className="min-h-[1.5rem]">
            <p className="text-white/90">
              Customize your TagLink experience
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">

      {loading ? (
        <Skeleton className="h-96" />
      ) : (
        <>

      {/* Preferences Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="h-5 w-5" />
                User Preferences
              </CardTitle>
              <CardDescription>
                Configure how TagLink displays and processes your links
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset to Defaults
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {preferences && (
            <PreferencesForm
              preferences={preferences}
              onSuccess={refetch}
            />
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-sm">About Preferences</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>
            <strong>Default View:</strong> Choose between grid (cards) or list layout for your links.
          </p>
          <p>
            <strong>Links Per Page:</strong> Control how many links are displayed per page (12, 24, or 48).
          </p>
          <p>
            <strong>Default Sort:</strong> Set your preferred sorting method for links.
          </p>
          <p>
            <strong>AI Processing:</strong> Enable or disable automatic AI-generated descriptions and tag suggestions for new links.
          </p>
        </CardContent>
      </Card>
        </>
      )}
        </div>
      </div>
    </>
  )
}
