'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FileText, Sparkles, Plus } from 'lucide-react'
import { useLoadSampleData } from '@/hooks/queries/use-sample-data'

interface EmptyStateProps {
  onAddLinkClick: () => void
}

/**
 * Empty state component shown when user has no links
 * Offers two options:
 * 1. Load sample data (30 curated links about AI, TypeScript, and algorithms)
 * 2. Add first link manually
 */
export function EmptyState({ onAddLinkClick }: EmptyStateProps) {
  const { mutate: loadSampleData, isPending } = useLoadSampleData()

  const handleLoadSampleData = () => {
    loadSampleData()
  }

  return (
    <div className="flex items-center justify-center min-h-[500px] px-4">
      <Card className="w-full max-w-2xl border-2 border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
          {/* Icon */}
          <div className="mb-6 rounded-full bg-blue-50 p-6">
            <FileText className="h-12 w-12 text-blue-500" />
          </div>

          {/* Heading */}
          <h2 className="mb-3 text-2xl font-bold text-gray-900">
            Welcome to TagLink!
          </h2>

          {/* Description */}
          <p className="mb-8 max-w-md text-gray-600">
            Your link collection is empty. Get started by loading sample data to explore the app,
            or add your first link manually.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
            {/* Load Sample Data Button */}
            <Button
              onClick={handleLoadSampleData}
              disabled={isPending}
              variant="default"
              size="lg"
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {isPending ? 'Loading...' : 'Load Sample Data'}
            </Button>

            {/* Add First Link Button */}
            <Button
              onClick={onAddLinkClick}
              disabled={isPending}
              variant="outline"
              size="lg"
              className="flex-1"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add First Link
            </Button>
          </div>

          {/* Info Text */}
          <p className="mt-6 text-sm text-gray-500">
            Sample data includes 30 curated links about AI, TypeScript, and algorithms
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
