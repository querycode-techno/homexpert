"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import {
  User,
  Building,
  MapPin,
  Briefcase,
  FileText,
  CreditCard,
  CheckCircle,
  Lock
} from "lucide-react"
import { ServiceSelector } from "@/components/admin/vendor/service-selector"
import DocumentUpload from "@/components/admin/vendor/document-upload"
import { toast } from "sonner"

export default function VendorOnboardingPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [submitSuccess, setSubmitSuccess] = useState(false)

  const form = useForm({
    defaultValues: {
      // Personal Information
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      
      // Business Information
      businessName: "",
      services: [],
      businessDescription: "",
      
      // Address
      address: {
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: ""
      },
      
      // Documents
      documents: {
        aadharCard: { number: "", imageUrl: "", verified: false },
        panCard: { number: "", imageUrl: "", verified: false },
        businessLicense: { number: "", imageUrl: "", verified: false },
        bankDetails: { 
          accountNumber: "", 
          ifscCode: "", 
          accountHolderName: "", 
          verified: false 
        }
      }
    }
  })

  const handleSubmit = async (data) => {
    // Validate required fields
    if (!data.name || !data.email || !data.phone || !data.password) {
      toast.error("Please fill all required personal information fields")
      return
    }

    if (data.password !== data.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }

    if (data.password.length < 6) {
      toast.error("Password must be at least 6 characters")
      return
    }

    if (!data.businessName || !data.services.length) {
      toast.error("Business name and at least one service are required")
      return
    }

    if (!data.address.street || !data.address.city || !data.address.state || !data.address.pincode) {
      toast.error("Complete address information is required")
      return
    }

    if (!data.documents.aadharCard.number || !data.documents.aadharCard.imageUrl ||
        !data.documents.panCard.number || !data.documents.panCard.imageUrl) {
      toast.error("Aadhar Card and PAN Card are required")
      return
    }

    if (!data.documents.bankDetails.accountHolderName || 
        !data.documents.bankDetails.accountNumber || 
        !data.documents.bankDetails.ifscCode) {
      toast.error("Complete bank details are required")
      return
    }

    try {
      setLoading(true)
      
      // Remove confirmPassword from submission data
      const { confirmPassword, ...submissionData } = data
      
      const response = await fetch('/api/vendors/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submissionData),
      })

      const result = await response.json()

      if (result.success) {
        setSubmitSuccess(true)
        toast.success("Application submitted successfully!")
      } else {
        throw new Error(result.error || 'Failed to submit application')
      }
    } catch (error) {
      console.error('Error submitting vendor application:', error)
      toast.error(error.message || 'Failed to submit application. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (submitSuccess) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center py-12">
          <div className="container px-4 md:px-6">
            <Card className="max-w-2xl mx-auto">
              <CardContent className="p-8">
                <div className="flex flex-col items-center text-center space-y-6">
                  <div className="h-20 w-20 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="h-10 w-10 text-green-600" />
                  </div>
                  <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Application Submitted!</h1>
                    <p className="text-muted-foreground text-lg">
                      Thank you for your interest in becoming a vendor with us.
                    </p>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>What's next?</strong><br />
                      • We'll review your application within 24-48 hours<br />
                      • You'll receive an email confirmation shortly<br />
                      • Our team will contact you if we need additional information<br />
                      • Once approved, you'll get access to your vendor dashboard
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <Button onClick={() => router.push('/')} variant="outline">
                      Back to Home
                    </Button>
                    <Button onClick={() => router.push('/login/vendor')}>
                      Vendor Login
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1 py-12">
        <div className="container px-4 md:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">Become a Vendor</h1>
              <p className="text-muted-foreground">
                Join our platform and grow your business with trusted customers
              </p>
            </div>

            {/* Main Form Card */}
            <Card>
              <CardHeader>
                <CardTitle>Vendor Application Form</CardTitle>
                <p className="text-muted-foreground">
                  Please fill out all the required information to submit your vendor application.
                </p>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    
                    {/* Personal Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Personal Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Full Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your full name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email Address *</FormLabel>
                              <FormControl>
                                <Input type="email" placeholder="Enter your email" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="phone"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Phone Number *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your phone number" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div /> {/* Empty div for spacing */}

                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Password *</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Create a password" {...field} />
                              </FormControl>
                              <FormDescription>
                                Minimum 6 characters
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Confirm Password *</FormLabel>
                              <FormControl>
                                <Input type="password" placeholder="Confirm your password" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Business Information */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Business Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Business Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your business name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="md:col-span-2">
                          <FormLabel>Services *</FormLabel>
                          <ServiceSelector
                            selectedServices={form.watch("services")}
                            onServicesChange={(services) => form.setValue("services", services)}
                            placeholder="Search and select services you provide..."
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="businessDescription"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Business Description</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Briefly describe your business and experience..."
                                  rows={3}
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Optional: Tell customers about your experience and specialties
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Address */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Address Information</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="address.street"
                          render={({ field }) => (
                            <FormItem className="md:col-span-2">
                              <FormLabel>Street Address *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter street address" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.area"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Area/Locality</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter area or locality" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter city" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter state" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="address.pincode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Pincode *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter pincode" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <Separator />

                    {/* Documents */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Documents</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Aadhar Card */}
                        <DocumentUpload
                          document={form.watch("documents.aadharCard")}
                          documentType="aadharCard"
                          title="Aadhar Card"
                          required={true}
                          numberField="number"
                          numberFieldName="Aadhar Number"
                          onDocumentChange={(updatedDoc) => {
                            form.setValue("documents.aadharCard", updatedDoc)
                          }}
                          onNumberChange={(value) => {
                            form.setValue("documents.aadharCard.number", value)
                          }}
                          disabled={false}
                        />

                        {/* PAN Card */}
                        <DocumentUpload
                          document={form.watch("documents.panCard")}
                          documentType="panCard"
                          title="PAN Card"
                          required={true}
                          numberField="number"
                          numberFieldName="PAN Number"
                          onDocumentChange={(updatedDoc) => {
                            form.setValue("documents.panCard", updatedDoc)
                          }}
                          onNumberChange={(value) => {
                            form.setValue("documents.panCard.number", value)
                          }}
                          disabled={false}
                        />

                        {/* Business License */}
                        <DocumentUpload
                          document={form.watch("documents.businessLicense")}
                          documentType="businessLicense"
                          title="Business License"
                          required={false}
                          numberField="number"
                          numberFieldName="License Number"
                          onDocumentChange={(updatedDoc) => {
                            form.setValue("documents.businessLicense", updatedDoc)
                          }}
                          onNumberChange={(value) => {
                            form.setValue("documents.businessLicense.number", value)
                          }}
                          disabled={false}
                        />

                        {/* Bank Details */}
                        <div className="space-y-4">
                          <div className="p-4 border rounded-lg">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <CreditCard className="h-4 w-4" />
                              Bank Details
                              <span className="text-red-500">*</span>
                            </h4>
                            
                            <div className="space-y-3">
                              <FormField
                                control={form.control}
                                name="documents.bankDetails.accountHolderName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Account Holder Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter account holder name" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="documents.bankDetails.accountNumber"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Account Number</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter account number" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name="documents.bankDetails.ifscCode"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>IFSC Code</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Enter IFSC code" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-6">
                      <Button
                        type="submit"
                        disabled={loading}
                        size="lg"
                        className="px-8"
                      >
                        {loading ? "Submitting..." : "Submit Application"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  )
} 