"use client"

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export const useLogout = () => {
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const router = useRouter()

  const logout = async () => {
    if (isLoggingOut) return // Prevent multiple logout attempts
    
    setIsLoggingOut(true)
    
    try {
      // Call our custom logout API first for cleanup
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      // Use NextAuth signOut
      await signOut({
        redirect: false, // We'll handle redirect manually
        callbackUrl: '/auth/logout'
      })
      
      // Clear any additional local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        sessionStorage.clear()
      }
      
      // Redirect to logout confirmation page
      router.push('/auth/logout')
      
    } catch (error) {
      console.error('Logout error:', error)
      // Even if there's an error, try to clear session and redirect
      try {
        await signOut({
          redirect: false,
          callbackUrl: '/auth/admin-login'
        })
        router.push('/auth/admin-login')
      } catch (fallbackError) {
        console.error('Fallback logout error:', fallbackError)
        // Force redirect as last resort
        window.location.href = '/auth/admin-login'
      }
    } finally {
      setIsLoggingOut(false)
    }
  }

  return { logout, isLoggingOut }
} 