import { createServerComponentClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import DashboardHeader from '@/components/layout/dashboard-header'
import { KeyboardWrapper } from '@/components/keyboard-shortcuts/keyboard-wrapper'
import { ErrorBoundary } from '@/components/ui/error-boundary'

export default async function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerComponentClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <KeyboardWrapper>
      <div className="min-h-screen bg-gray-50">
        <DashboardHeader user={user} />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </div>
    </KeyboardWrapper>
  )
}
