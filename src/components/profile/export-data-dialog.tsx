'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Loader2, Download } from 'lucide-react'
import { exportUserData } from '@/app/actions/profile'
import { useToast } from '@/hooks/use-toast'

export function ExportDataDialog() {
  const [open, setOpen] = useState(false)
  const [format, setFormat] = useState<'json' | 'csv' | 'markdown'>('json')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleExport = () => {
    startTransition(async () => {
      const result = await exportUserData(format)

      if (result.success && result.data) {
        // Create a blob and download
        const blob = new Blob([result.data.content], { type: result.data.mimeType })
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.data.filename
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)

        toast({
          title: 'Export Successful',
          description: `Your data has been exported as ${format.toUpperCase()}`,
        })
        setOpen(false)
      } else {
        toast({
          title: 'Export Failed',
          description: result.error || 'Failed to export data',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Export Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Your Data</DialogTitle>
          <DialogDescription>
            Download all your links and tags in your preferred format
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <RadioGroup value={format} onValueChange={(value: string) => setFormat(value as 'json' | 'csv' | 'markdown')}>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="json" id="json" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="json" className="font-medium cursor-pointer">
                  JSON
                </Label>
                <p className="text-sm text-muted-foreground">
                  Structured data format, ideal for importing to other applications
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="csv" id="csv" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="csv" className="font-medium cursor-pointer">
                  CSV
                </Label>
                <p className="text-sm text-muted-foreground">
                  Spreadsheet format, compatible with Excel and Google Sheets
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3 space-y-0">
              <RadioGroupItem value="markdown" id="markdown" />
              <div className="space-y-1 leading-none">
                <Label htmlFor="markdown" className="font-medium cursor-pointer">
                  Markdown
                </Label>
                <p className="text-sm text-muted-foreground">
                  Human-readable format with formatting, great for documentation
                </p>
              </div>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
