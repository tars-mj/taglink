'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        toast({
          title: 'Błąd logowania',
          description: error.message === 'Invalid login credentials'
            ? 'Nieprawidłowy email lub hasło'
            : error.message,
          variant: 'destructive',
        })
        setIsLoading(false)
      } else {
        toast({
          title: 'Sukces!',
          description: 'Zostałeś zalogowany',
        })

        // Refresh router to update middleware state
        router.refresh()

        // Small delay to ensure cookies are set before navigation
        await new Promise(resolve => setTimeout(resolve, 100))

        // Use window.location for reliable redirect (ensures full page reload)
        window.location.href = '/dashboard'
      }
    } catch (error) {
      toast({
        title: 'Błąd',
        description: 'Wystąpił nieoczekiwany błąd',
        variant: 'destructive',
      })
      setIsLoading(false)
    }
  }

  return (
    <Card className="backdrop-blur-lg bg-white/90">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">
          <span className="text-gradient font-bold">TagLink</span>
        </CardTitle>
        <CardDescription className="text-center">
          Zaloguj się do swojego konta
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="twoj@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Hasło</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            disabled={isLoading}
          >
            {isLoading ? 'Logowanie...' : 'Zaloguj się'}
          </Button>
          <div className="text-sm text-center text-gray-600">
            Nie masz konta?{' '}
            <Link href="/register" className="text-blue-500 hover:underline">
              Zarejestruj się
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}