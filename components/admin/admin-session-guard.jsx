"use client"

import { useEffect } from 'react'
import { useSession, getSession, signOut } from 'next-auth/react'
import { usePathname } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function redirectToLogin(pathname) {
  const url = new URL('/auth/admin-login', window.location.origin)
  url.searchParams.set('callbackUrl', pathname || '/admin')
  window.location.href = url.pathname + url.search
}

function isSessionValid(session) {
  const user = session?.user
  return user && (user.id || user.userId) && user.role
}

/**
 * Guards admin layout: redirects to login when unauthenticated or when
 * session is invalid (e.g. user was deleted from DB but JWT still in cookie).
 * Refetches session on route change so client-side nav after account deletion
 * also redirects instead of showing blank / "admin access required".
 */
export function AdminSessionGuard({ children }) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  // On load and on every admin route change, validate session. Refetch from server
  // so we catch invalid session (e.g. deleted user) even when client cache was stale.
  useEffect(() => {
    if (status === 'loading') return

    if (status === 'unauthenticated') {
      redirectToLogin(pathname)
      return
    }

    const check = async () => {
      // Refetch fresh session from server (session callback runs, returns invalid if user deleted)
      const freshSession = await getSession()
      if (!freshSession) {
        redirectToLogin(pathname)
        return
      }
      if (!isSessionValid(freshSession)) {
        await signOut({ redirect: false })
        redirectToLogin(pathname)
      }
    }

    check()
  }, [pathname, status])

  // When any admin API returns 401, redirect to login (covers stale session on client-side nav)
  useEffect(() => {
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const res = await originalFetch(...args)
      const url = typeof args[0] === 'string' ? args[0] : args[0]?.url
      if (url?.includes('/api/admin/') && res.status === 401) {
        await signOut({ redirect: false })
        redirectToLogin(typeof window !== 'undefined' ? window.location.pathname : '/admin')
      }
      return res
    }
    return () => { window.fetch = originalFetch }
  }, [])

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
