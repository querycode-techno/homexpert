"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState("admin@homexpert.com")
  const [password, setPassword] = useState("admin123")
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // For demo purposes, we'll accept any credentials
    // In a real app, you would validate against a database
    setTimeout(() => {
      setIsLoading(false)
      // Use router.push to navigate to the admin dashboard
      router.push("/admin")
    }, 1000)
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Image src="/logo.png" alt="HomeXpert Logo" width={60} height={60} className="h-14 w-auto" />
          <h1 className="mt-4 text-3xl font-bold">
            <span className="text-primary">Homes</span>
            <span className="text-secondary">Xpert</span>
            <span className="ml-2">Admin</span>
          </h1>
          <p className="mt-2 text-muted-foreground">Log in to access the admin dashboard</p>
        </div>
        <Card>
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center">Admin Login</CardTitle>
            <CardDescription className="text-center">
              Enter your credentials to continue
              <br />
              <span className="text-xs text-primary">(Demo credentials are pre-filled for you)</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@homexpert.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" className="h-auto p-0 text-sm">
                    Forgot password?
                  </Button>
                </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Logging in
                  </>
                ) : (
                  "Login to Dashboard"
                )}
              </Button>
            </form>
            <div className="mt-4 text-center text-sm">
              <p>
                Having trouble logging in?{" "}
                <Button variant="link" className="h-auto p-0" onClick={() => router.push("/admin")}>
                  Go directly to dashboard
                </Button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
