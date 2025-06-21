"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, AlertCircle, CheckCircle, Shield, User, Mail, Phone, Lock } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function AdminSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [checkingSetup, setCheckingSetup] = useState(true)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [setupComplete, setSetupComplete] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  })
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const router = useRouter()

  useEffect(() => {
    checkSetupStatus()
  }, [])

  const checkSetupStatus = async () => {
    try {
      const response = await fetch('/api/setup/check')
      const data = await response.json()
      
      if (data.error) {
        setError('Failed to check setup status')
      } else {
        setNeedsSetup(data.needsSetup)
        if (!data.needsSetup) {
          setSetupComplete(true)
        }
      }
    } catch (error) {
      console.error('Setup check error:', error)
      setError('Failed to check setup status')
    } finally {
      setCheckingSetup(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const validateForm = () => {
    const { name, email, phone, password, confirmPassword } = formData
    
    if (!name || !email || !phone || !password || !confirmPassword) {
      return "All fields are required"
    }
    
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/
    if (!emailRegex.test(email)) {
      return "Invalid email format"
    }
    
    const phoneRegex = /^[+]?[1-9][\d\s\-\(\)]{7,15}$/
    if (!phoneRegex.test(phone)) {
      return "Invalid phone number format"
    }
    
    if (password.length < 8) {
      return "Password must be at least 8 characters long"
    }
    
    if (password !== confirmPassword) {
      return "Passwords do not match"
    }
    
    return null
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")
    setSuccess("")

    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/setup/admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(data.message)
        setSetupComplete(true)
        // Redirect to login after 3 seconds
        setTimeout(() => {
          router.push('/auth/admin-login')
        }, 3000)
      } else {
        setError(data.error || 'Failed to create admin user')
      }
    } catch (error) {
      console.error('Setup error:', error)
      setError('An error occurred during setup. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (checkingSetup) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="flex flex-col items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-muted-foreground">Checking setup status...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (setupComplete && !needsSetup) {
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
            <p className="mt-2 text-muted-foreground">Setup Complete</p>
          </div>
          
          <Card>
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Setup Already Complete</CardTitle>
              <CardDescription>
                Admin user already exists. You can proceed to login.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">{success}</AlertDescription>
                </Alert>
              )}
              
              <Button 
                onClick={() => router.push('/auth/admin-login')} 
                className="w-full"
              >
                Go to Admin Login
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="h-14 w-14 bg-primary rounded-lg flex items-center justify-center mb-4">
            <Shield className="text-white h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold">
            <span className="text-primary">Home</span>
            <span className="text-secondary">Xpert</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Initial Admin Setup</p>
        </div>
        
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Create Admin Account</CardTitle>
            <CardDescription className="text-center">
              Set up the first admin user for your HomeXpert platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="mb-4 border-green-200 bg-green-50">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  {success} Redirecting to login...
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading || setupComplete}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="admin@homexpert.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading || setupComplete}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading || setupComplete}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading || setupComplete}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10"
                    required
                    disabled={isLoading || setupComplete}
                  />
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading || setupComplete}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Admin Account...
                  </>
                ) : (
                  "Create Admin Account"
                )}
              </Button>
            </form>
            
            <div className="mt-6 text-center text-sm text-muted-foreground">
              <p>This will create the first admin user for HomeXpert</p>
              <p className="text-xs mt-1">Make sure to remember your credentials</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 