"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2 } from "lucide-react"

export function VendorLoginForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [phoneNumber, setPhoneNumber] = useState("")
  const [otp, setOtp] = useState("")
  const [otpSent, setOtpSent] = useState(false)

  const handleSendOtp = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate OTP sending
    setTimeout(() => {
      setIsLoading(false)
      setOtpSent(true)
    }, 1500)
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    // Simulate OTP verification
    setTimeout(() => {
      setIsLoading(false)
      // Redirect would happen here in a real app
      alert("Login successful!")
    }, 1500)
  }

  return (
    <Card className="border-none shadow-lg">
      <CardContent className="p-6">
        <Tabs defaultValue="phone" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="phone">Phone Login</TabsTrigger>
            <TabsTrigger value="email">Email Login</TabsTrigger>
          </TabsList>
          <TabsContent value="phone">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="Enter your phone number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending OTP
                    </>
                  ) : (
                    "Send OTP"
                  )}
                </Button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter the OTP sent to your phone"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying
                    </>
                  ) : (
                    "Verify & Login"
                  )}
                </Button>
                <Button type="button" variant="link" className="w-full" onClick={() => setOtpSent(false)}>
                  Change Phone Number
                </Button>
              </form>
            )}
          </TabsContent>
          <TabsContent value="email">
            <form className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="Enter your email" required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Button variant="link" className="h-auto p-0 text-sm">
                    Forgot password?
                  </Button>
                </div>
                <Input id="password" type="password" placeholder="Enter your password" required />
              </div>
              <Button type="submit" className="w-full">
                Login
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
