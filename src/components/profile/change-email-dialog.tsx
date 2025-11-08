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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'
import { changeEmail } from '@/app/actions/profile'
import { useToast } from '@/hooks/use-toast'

interface ChangeEmailDialogProps {
  currentEmail: string
}

export function ChangeEmailDialog({ currentEmail }: ChangeEmailDialogProps) {
  const [open, setOpen] = useState(false)
  const [newEmail, setNewEmail] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    if (newEmail === currentEmail) {
      toast({
        title: 'Error',
        description: 'New email is the same as current email',
        variant: 'destructive',
      })
      return
    }

    const formData = new FormData()
    formData.append('newEmail', newEmail)

    startTransition(async () => {
      const result = await changeEmail(formData)

      if (result.success) {
        toast({
          title: 'Confirmation Email Sent',
          description: result.message || 'Please check your new email to confirm the change',
        })
        setNewEmail('')
        setOpen(false)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to change email',
          variant: 'destructive',
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Change Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Email Address</DialogTitle>
            <DialogDescription>
              Enter a new email address. You'll receive a confirmation email to verify the change.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="current-email">Current Email</Label>
              <Input
                id="current-email"
                type="email"
                value={currentEmail}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="new-email">New Email *</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="your.new.email@example.com"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
                disabled={isPending}
              />
            </div>
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
            <Button type="submit" disabled={isPending || !newEmail || newEmail === currentEmail}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Send Confirmation
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
