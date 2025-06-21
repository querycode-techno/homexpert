"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, ArrowRight } from "lucide-react"

export default function LogoutPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto-redirect to login after 3 seconds
    const timer = setTimeout(() => {
      router.push('/auth/admin-login')
    }, 3000)

    return () => clearTimeout(timer)
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <CheckCircle className="text-green-600 h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Home</span>
            <span className="text-secondary">Xpert</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Admin Portal</p>
        </div>
        
        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Logged Out Successfully</CardTitle>
            <CardDescription>
              You have been securely logged out of the admin portal
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center text-sm text-muted-foreground">
              <p>Your session has been terminated and all data cleared.</p>
              <p className="mt-2">Redirecting to login page in 3 seconds...</p>
            </div>
            
            <Button 
              onClick={() => router.push('/auth/admin-login')} 
              className="w-full"
            >
              <ArrowRight className="mr-2 h-4 w-4" />
              Go to Login Page
            </Button>
            
            <div className="text-center">
              <Button 
                variant="link" 
                onClick={() => router.push('/')}
                className="text-sm text-muted-foreground"
              >
                Return to Homepage
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 