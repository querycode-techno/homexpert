"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { Loader2 } from 'lucide-react'

/**
 * Guards admin layout: redirects to login when unauthenticated or when
 * session is invalid (e.g. user was deleted from DB but JWT still in cookie).
 * Prevents blank pages and ensures deleted users are sent to login.
 */
export function AdminSessionGuard({ children }) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (status === 'loading') return

    // No session at all
    if (status === 'unauthenticated') {
      const url = new URL('/auth/admin-login', window.location.origin)
      url.searchParams.set('callbackUrl', pathname || '/admin')
      router.replace(url.pathname + url.search)
      return
    }

    // Session exists but invalid (e.g. user deleted - session callback returned user: {})
    const user = session?.user
    const hasValidUser = user && (user.id || user.userId) && user.role
    if (status === 'authenticated' && !hasValidUser) {
      signOut({ redirect: false }).then(() => {
        const url = new URL('/auth/admin-login', window.location.origin)
        url.searchParams.set('callbackUrl', pathname || '/admin')
        window.location.href = url.pathname + url.search
      })
    }
  }, [status, session, router, pathname])

  // Show loading while checking auth to avoid blank flash
  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Invalid session - show loading while signOut + redirect runs
  const user = session?.user
  const hasValidUser = user && (user.id || user.userId) && user.role
  if (status === 'authenticated' && !hasValidUser) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Unauthenticated - redirect is in progress
  if (status === 'unauthenticated') {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return children
}
