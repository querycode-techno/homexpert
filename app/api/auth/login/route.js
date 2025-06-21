import { NextResponse } from 'next/server'
import { auth } from '@/auth.js'

export async function POST(request) {
  try {
    // Note: For API routes in NextAuth v4, credential validation 
    // should be handled by the credentials provider itself
    // This endpoint can be used for status checks or custom logic
    
    return NextResponse.json(
      { error: 'Please use NextAuth signin endpoint' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Login error:', error)
    
    if (error.message === 'Invalid credentials') {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint for checking auth status
export async function GET() {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json(
        { authenticated: false },
        { status: 401 }
      )
    }

    return NextResponse.json(
      {
        authenticated: true,
        user: {
          id: session.user.id,
          userId: session.user.userId,
          name: session.user.name,
          email: session.user.email,
          role: session.user.role,
          image: session.user.image
        }
      },
      { status: 200 }
    )

  } catch (error) {
    console.error('Auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 