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

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast({
        title: 'Błąd',
        description: 'Hasła nie są identyczne',
        variant: 'destructive',
      })
      return
    }

    if (password.length < 6) {
      toast({
        title: 'Błąd',
        description: 'Hasło musi mieć minimum 6 znaków',
        variant: 'destructive',
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) {
        toast({
          title: 'Błąd rejestracji',
          description: error.message,
          variant: 'destructive',
        })
        setIsLoading(false)
      } else {
        toast({
          title: 'Sukces!',
          description: 'Konto zostało utworzone. Możesz się teraz zalogować.',
        })

        // Refresh router to update middleware state
        router.refresh()

        // Small delay to ensure cookies are set before navigation
        await new Promise(resolve => setTimeout(resolve, 100))

        // Use window.location for reliable redirect (ensures full page reload)
        window.location.href = '/dashboard'
      }
    } catch {
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
          Utwórz nowe konto i zacznij organizować swoje linki
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
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Potwierdź hasło</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
            {isLoading ? 'Tworzenie konta...' : 'Zarejestruj się'}
          </Button>
          <div className="text-sm text-center text-gray-600">
            Masz już konto?{' '}
            <Link href="/login" className="text-blue-500 hover:underline">
              Zaloguj się
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}