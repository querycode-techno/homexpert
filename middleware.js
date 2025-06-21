import { NextResponse } from "next/server"
import { getToken } from "next-auth/jwt"
import { ADMINISTRATIVE_ROLES, hasAdminAccess } from "@/lib/constants"

// Define route patterns for HomeXpert structure
const publicRoutes = [
  '/',
  '/auth/admin-login',
  '/auth/logout',
  '/setup/admin',
  '/unauthorized'
]

const authRoutes = [
  '/auth/admin-login'
]

// Admin routes from your app/admin directory structure
const adminRoutes = [
  '/admin',
  '/admin/dashboard',
  '/admin/employees',
  '/admin/vendors',
  '/admin/bookings',
  '/admin/leads',
  '/admin/subscriptions',
  '/admin/payments',
  '/admin/notifications',
  '/admin/roles',
  '/admin/settings'
]

// Performance optimized path checking
const isPublicRoute = (pathname) => {
  return publicRoutes.some(route => {
    if (route === pathname) return true
    if (route.endsWith('*')) {
      return pathname.startsWith(route.slice(0, -1))
    }
    // Allow public API routes
    if (pathname.startsWith('/api/public/')) return true
    return false
  })
}

const isAuthRoute = (pathname) => {
  return authRoutes.includes(pathname)
}

const isAdminRoute = (pathname) => {
  return adminRoutes.some(route => pathname.startsWith(route))
}

export async function middleware(request) {
  const { nextUrl } = request
  const pathname = nextUrl.pathname

  console.log(`🔍 MIDDLEWARE - Path: ${pathname}`)

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/api/public/') ||
    pathname.startsWith('/api/setup/') ||
    pathname.startsWith('/api/health') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    console.log(`⏭️ SKIPPING - Static/API: ${pathname}`)
    return NextResponse.next()
  }

  // Get token using NextAuth JWT
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development"
  })

  // Extract role name from token (role can be object or string)
  const userRole = typeof token?.role === 'object' ? token.role.name : token?.role
  console.log(`🔐 AUTH - Token: ${!!token}, Role: ${userRole}`)

  // Handle admin routes - ALLOW ADMINISTRATIVE ROLES
  if (isAdminRoute(pathname)) {
    console.log(`🛡️ ADMIN ROUTE: ${pathname}`)
    
    if (!token) {
      console.log(`❌ NO TOKEN - Redirecting to admin login`)
      const redirectUrl = new URL('/auth/admin-login', request.url)
      redirectUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(redirectUrl)
    }

    // Check admin access - allow multiple administrative roles
    if (!hasAdminAccess(userRole)) {
      console.log(`❌ ACCESS DENIED - Role: ${userRole}, Allowed: ${ADMINISTRATIVE_ROLES.join(', ')}`)
      return NextResponse.redirect(new URL('/unauthorized', request.url))
    }

    console.log(`✅ ADMIN ACCESS GRANTED - Role: ${userRole}`)
    return NextResponse.next()
  }

  // Handle auth routes - redirect if already authenticated
  if (isAuthRoute(pathname)) {
    console.log(`🔑 AUTH ROUTE: ${pathname}`)
    if (token) {
      // Redirect based on user role
      const userRole = typeof token.role === 'object' ? token.role.name : token.role
      if (hasAdminAccess(userRole)) {
        return NextResponse.redirect(new URL('/admin', request.url))
      } else {
        return NextResponse.redirect(new URL('/', request.url))
      }
    }
    return NextResponse.next()
  }

  // Handle public routes
  if (isPublicRoute(pathname)) {
    console.log(`🌍 PUBLIC ROUTE: ${pathname}`)
    return NextResponse.next()
  }

  // Default handling for root route
  if (pathname === '/') {
    console.log(`🏠 ROOT ROUTE: ${pathname}`)
    if (token) {
      const userRole = typeof token.role === 'object' ? token.role.name : token.role
      if (hasAdminAccess(userRole)) {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
    }
    return NextResponse.next()
  }

  console.log(`⚠️ UNHANDLED ROUTE: ${pathname}`)
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
} 