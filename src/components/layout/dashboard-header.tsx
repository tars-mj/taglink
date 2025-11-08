'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { LogOut, Tag, LayoutDashboard, User as UserIcon, Settings as SettingsIcon, Menu, Plus } from 'lucide-react'
import type { User } from '@supabase/supabase-js'
import { AddLinkDialog } from '@/components/links/add-link-dialog'
import { ShortcutsHelpDialog } from '@/components/keyboard-shortcuts/shortcuts-help-dialog'

interface DashboardHeaderProps {
  user: User
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { toast } = useToast()
  const supabase = createClient()

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [addLinkDialogOpen, setAddLinkDialogOpen] = useState(false)

  // Listen for keyboard shortcut to open add link dialog
  useEffect(() => {
    const handleKeyboardOpen = () => {
      setAddLinkDialogOpen(true)
    }
    const handleKeyboardClose = () => {
      setAddLinkDialogOpen(false)
    }

    window.addEventListener('keyboard-add-link', handleKeyboardOpen)
    window.addEventListener('keyboard-close-dialog', handleKeyboardClose)

    return () => {
      window.removeEventListener('keyboard-add-link', handleKeyboardOpen)
      window.removeEventListener('keyboard-close-dialog', handleKeyboardClose)
    }
  }, [])

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) {
      toast({
        title: 'Błąd',
        description: 'Nie udało się wylogować',
        variant: 'destructive',
      })
    } else {
      router.push('/')
    }
  }

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="container mx-auto px-4">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <h1 className="text-2xl font-bold text-gradient">TagLink</h1>

            {/* Desktop Navigation */}
            <nav className="flex items-center gap-2">
              <Button
                asChild
                variant={pathname === '/dashboard' ? 'default' : 'ghost'}
                size="sm"
                className={pathname === '/dashboard' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <Link href="/dashboard">
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  Dashboard
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === '/tags' ? 'default' : 'ghost'}
                size="sm"
                className={pathname === '/tags' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <Link href="/tags">
                  <Tag className="h-4 w-4 mr-2" />
                  Tags
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === '/profile' ? 'default' : 'ghost'}
                size="sm"
                className={pathname === '/profile' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <Link href="/profile">
                  <UserIcon className="h-4 w-4 mr-2" />
                  Profile
                </Link>
              </Button>
              <Button
                asChild
                variant={pathname === '/settings' ? 'default' : 'ghost'}
                size="sm"
                className={pathname === '/settings' ? 'bg-blue-500 hover:bg-blue-600' : ''}
              >
                <Link href="/settings">
                  <SettingsIcon className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setAddLinkDialogOpen(true)}
              className="bg-gradient-main text-white hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
              aria-label="Add Link"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Link
            </Button>
            <ShortcutsHelpDialog />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              aria-label="Wyloguj"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Header */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-bold text-gradient">TagLink</h1>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setAddLinkDialogOpen(true)}
                className="bg-gradient-main text-white hover:opacity-90 hover:scale-105 transition-all duration-200 shadow-md hover:shadow-lg"
                aria-label="Add Link"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Link
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="pb-4 border-t border-gray-200">
              {/* Mobile Navigation */}
              <nav className="flex flex-col space-y-1">
                <Button
                  asChild
                  variant={pathname === '/dashboard' ? 'default' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start ${pathname === '/dashboard' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                >
                  <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                    <LayoutDashboard className="h-4 w-4 mr-2" />
                    Dashboard
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={pathname === '/tags' ? 'default' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start ${pathname === '/tags' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                >
                  <Link href="/tags" onClick={() => setMobileMenuOpen(false)}>
                    <Tag className="h-4 w-4 mr-2" />
                    Tags
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={pathname === '/profile' ? 'default' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start ${pathname === '/profile' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                >
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}>
                    <UserIcon className="h-4 w-4 mr-2" />
                    Profile
                  </Link>
                </Button>
                <Button
                  asChild
                  variant={pathname === '/settings' ? 'default' : 'ghost'}
                  size="sm"
                  className={`w-full justify-start ${pathname === '/settings' ? 'bg-blue-500 hover:bg-blue-600' : ''}`}
                >
                  <Link href="/settings" onClick={() => setMobileMenuOpen(false)}>
                    <SettingsIcon className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </Button>
              </nav>

              {/* Mobile Actions */}
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <ShortcutsHelpDialog />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Wyloguj
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Single Dialog instance - outside responsive containers */}
      <AddLinkDialog open={addLinkDialogOpen} onOpenChange={setAddLinkDialogOpen} />
    </header>
  )
}