'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { User, Calendar, Link as LinkIcon, Tag, FileDown, AlertTriangle } from 'lucide-react'
import { ChangePasswordDialog } from '@/components/profile/change-password-dialog'
import { ChangeEmailDialog } from '@/components/profile/change-email-dialog'
import { ExportDataDialog } from '@/components/profile/export-data-dialog'
import { DeleteAccountDialog } from '@/components/profile/delete-account-dialog'
import { useUserStats } from '@/hooks/queries/use-user'

export default function ProfilePage() {
  const { data: stats, isLoading: loading } = useUserStats()

  return (
    <>
      {/* Header */}
      <div className="bg-gradient-main text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <User className="h-8 w-8" />
            <h1 className="text-3xl font-bold">Profile</h1>
          </div>
          <div className="min-h-[1.5rem]">
            <p className="text-white/90">
              Manage your account settings and preferences
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="space-y-8">

      {loading ? (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
            <Skeleton className="h-32" />
          </div>
          <Skeleton className="h-96" />
        </>
      ) : (
        <>

      {/* Statistics Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Links</CardTitle>
            <LinkIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.linkCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Saved links in your collection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tags</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.tagCount || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Tags for organizing links
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Member Since</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.createdAt ? new Date(stats.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : '-'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Account registration date
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your email address and account security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Email */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-medium">Email Address</p>
              <p className="text-sm text-muted-foreground mt-1">{stats?.email}</p>
            </div>
            <ChangeEmailDialog currentEmail={stats?.email || ''} />
          </div>

          {/* Password */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-medium">Password</p>
              <p className="text-sm text-muted-foreground mt-1">••••••••</p>
            </div>
            <ChangePasswordDialog />
          </div>

          {/* Registration Date */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Registration Date</p>
              <p className="text-sm text-muted-foreground mt-1">
                {stats?.createdAt ? new Date(stats.createdAt).toLocaleString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : '-'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            Data Management
          </CardTitle>
          <CardDescription>
            Export your data or delete your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Export Data */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div>
              <p className="font-medium">Export Your Data</p>
              <p className="text-sm text-muted-foreground mt-1">
                Download all your links and tags in JSON, CSV, or Markdown format
              </p>
            </div>
            <ExportDataDialog />
          </div>

          {/* Delete Account */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Delete Account
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Permanently delete your account and all associated data
              </p>
            </div>
            <DeleteAccountDialog />
          </div>
        </CardContent>
      </Card>
        </>
      )}
        </div>
      </div>
    </>
  )
}
