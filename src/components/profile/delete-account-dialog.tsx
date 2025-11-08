'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
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
import { Loader2, AlertTriangle } from 'lucide-react'
import { deleteUserAccount } from '@/app/actions/profile'
import { useToast } from '@/hooks/use-toast'

export function DeleteAccountDialog() {
  const [open, setOpen] = useState(false)
  const [confirmation, setConfirmation] = useState('')
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()
  const router = useRouter()

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUserAccount(confirmation)

      if (result.success) {
        toast({
          title: 'Account Deleted',
          description: 'Your account and all data have been permanently deleted',
        })
        // Redirect to home page after short delay
        setTimeout(() => {
          router.push('/')
        }, 1500)
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to delete account',
          variant: 'destructive',
        })
      }
    })
  }

  const isConfirmationValid = confirmation === 'DELETE MY ACCOUNT'

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="sm">
          Delete Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription>
            This action cannot be undone. This will permanently delete your account and remove all your data from our servers.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {/* Warning Box */}
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 space-y-2">
            <p className="font-medium text-destructive">What will be deleted:</p>
            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
              <li>All your saved links</li>
              <li>All your tags</li>
              <li>Your user preferences</li>
              <li>Your account information</li>
            </ul>
          </div>

          {/* Confirmation Input */}
          <div className="grid gap-2">
            <Label htmlFor="confirmation">
              Type <span className="font-mono font-bold">DELETE MY ACCOUNT</span> to confirm:
            </Label>
            <Input
              id="confirmation"
              type="text"
              placeholder="DELETE MY ACCOUNT"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              disabled={isPending}
              className="font-mono"
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
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isPending || !isConfirmationValid}
          >
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Delete My Account
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
