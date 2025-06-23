"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
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
  AlertCircle,
  ArrowLeft,
  ArrowRight
} from "lucide-react"
import { ServiceSelector } from "@/components/admin/vendor/service-selector"
import DocumentUpload from "@/components/admin/vendor/document-upload"
import { toast } from "sonner"

const steps = [
  {
    id: 1,
    title: "Personal Information",
    description: "Tell us about yourself",
    icon: User
  },
  {
    id: 2,
    title: "Business Details",
    description: "Your business information",
    icon: Building
  },
  {
    id: 3,
    title: "Address & Location",
    description: "Where you operate",
    icon: MapPin
  },
  {
    id: 4,
    title: "Services Offered",
    description: "What services do you provide",
    icon: Briefcase
  },
  {
    id: 5,
    title: "Documents",
    description: "Upload required documents",
    icon: FileText
  },
  {
    id: 6,
    title: "Bank Details",
    description: "Payment information",
    icon: CreditCard
  }
]

export default function VendorOnboardingPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(1)
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

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const validateCurrentStep = () => {
    const values = form.getValues()
    
    switch (currentStep) {
      case 1: // Personal Information
        if (!values.name || !values.email || !values.phone || !values.password) {
          return "Please fill all required fields"
        }
        if (values.password !== values.confirmPassword) {
          return "Passwords do not match"
        }
        if (values.password.length < 6) {
          return "Password must be at least 6 characters"
        }
        return null
      case 2: // Business Details
        if (!values.businessName || !values.services.length) {
          return "Business name and at least one service are required"
        }
        return null
      case 3: // Address
        if (!values.address.street || !values.address.city || 
            !values.address.state || !values.address.pincode) {
          return "Complete address information is required"
        }
        return null
      case 4: // Services (already validated in step 2)
        return null
      case 5: // Documents
        if (!values.documents.aadharCard.number || !values.documents.aadharCard.imageUrl ||
            !values.documents.panCard.number || !values.documents.panCard.imageUrl) {
          return "Aadhar Card and PAN Card are required"
        }
        return null
      case 6: // Bank Details
        if (!values.documents.bankDetails.accountHolderName || 
            !values.documents.bankDetails.accountNumber || 
            !values.documents.bankDetails.ifscCode) {
          return "Complete bank details are required"
        }
        return null
      default:
        return null
    }
  }

  const handleNext = () => {
    const error = validateCurrentStep()
    if (error) {
      toast.error(error)
      return
    }
    nextStep()
  }

  const handleSubmit = async (data) => {
    const error = validateCurrentStep()
    if (error) {
      toast.error(error)
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

  const currentStepData = steps[currentStep - 1]
  const StepIcon = currentStepData.icon
  const progress = (currentStep / steps.length) * 100

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

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium">Step {currentStep} of {steps.length}</span>
                <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Steps Navigation */}
            <div className="flex justify-center mb-8">
              <div className="flex space-x-4 overflow-x-auto pb-2">
                {steps.map((step, index) => {
                  const StepIconComponent = step.icon
                  const isActive = currentStep === step.id
                  const isCompleted = currentStep > step.id
                  
                  return (
                    <div
                      key={step.id}
                      className={`flex flex-col items-center space-y-2 min-w-[120px] ${
                        isActive ? 'text-primary' : isCompleted ? 'text-green-600' : 'text-muted-foreground'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                          isActive
                            ? 'border-primary bg-primary text-white'
                            : isCompleted
                            ? 'border-green-600 bg-green-600 text-white'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {isCompleted ? (
                          <CheckCircle className="w-5 h-5" />
                        ) : (
                          <StepIconComponent className="w-5 h-5" />
                        )}
                      </div>
                      <div className="text-center">
                        <div className="text-xs font-medium">{step.title}</div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Main Form Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <StepIcon className="h-6 w-6 text-primary" />
                  {currentStepData.title}
                </CardTitle>
                <p className="text-muted-foreground">{currentStepData.description}</p>
              </CardHeader>
              
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    
                    {/* Step 1: Personal Information */}
                    {currentStep === 1 && (
                      <div className="space-y-4">
                        <Alert>
                          <AlertCircle className="h-4 w-4" />
                          <AlertDescription>
                            This information will be used to create your vendor account.
                          </AlertDescription>
                        </Alert>

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
                    )}

                    {/* Step 2: Business Details */}
                    {currentStep === 2 && (
                      <div className="space-y-4">
                        <Alert>
                          <Building className="h-4 w-4" />
                          <AlertDescription>
                            Tell us about your business and what services you provide.
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={form.control}
                          name="businessName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Business/Company Name *</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter your business name" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="businessDescription"
                          render={({ field }) => (
                            <FormItem>
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
                    )}

                    {/* Step 3: Address */}
                    {currentStep === 3 && (
                      <div className="space-y-4">
                        <Alert>
                          <MapPin className="h-4 w-4" />
                          <AlertDescription>
                            Where is your business located? This helps customers find you.
                          </AlertDescription>
                        </Alert>

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
                    )}

                    {/* Step 4: Services */}
                    {currentStep === 4 && (
                      <div className="space-y-4">
                        <Alert>
                          <Briefcase className="h-4 w-4" />
                          <AlertDescription>
                            Select the services you provide. You can add more services later.
                          </AlertDescription>
                        </Alert>

                        <FormField
                          control={form.control}
                          name="services"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Services Offered *</FormLabel>
                              <FormControl>
                                <ServiceSelector
                                  selectedServices={field.value}
                                  onServicesChange={field.onChange}
                                  placeholder="Search and select services you provide..."
                                />
                              </FormControl>
                              <FormDescription>
                                Search or browse by category to select the services you offer
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    )}

                    {/* Step 5: Documents */}
                    {currentStep === 5 && (
                      <div className="space-y-6">
                        <Alert>
                          <FileText className="h-4 w-4" />
                          <AlertDescription>
                            Upload required documents for verification. All documents will be reviewed by our team.
                          </AlertDescription>
                        </Alert>

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
                        </div>
                      </div>
                    )}

                    {/* Step 6: Bank Details */}
                    {currentStep === 6 && (
                      <div className="space-y-4">
                        <Alert>
                          <CreditCard className="h-4 w-4" />
                          <AlertDescription>
                            Bank details are required for receiving payments from completed jobs.
                          </AlertDescription>
                        </Alert>

                        <div className="p-4 border rounded-lg space-y-4">
                          <h4 className="font-medium text-lg">Bank Account Information</h4>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField
                              control={form.control}
                              name="documents.bankDetails.accountHolderName"
                              render={({ field }) => (
                                <FormItem className="md:col-span-2">
                                  <FormLabel>Account Holder Name *</FormLabel>
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
                                  <FormLabel>Account Number *</FormLabel>
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
                                  <FormLabel>IFSC Code *</FormLabel>
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
                    )}

                    {/* Navigation Buttons */}
                    <div className="flex justify-between pt-6">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={prevStep}
                        disabled={currentStep === 1}
                        className="flex items-center gap-2"
                      >
                        <ArrowLeft className="h-4 w-4" />
                        Previous
                      </Button>

                      {currentStep < steps.length ? (
                        <Button
                          type="button"
                          onClick={handleNext}
                          className="flex items-center gap-2"
                        >
                          Next
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      ) : (
                        <Button
                          type="submit"
                          disabled={loading}
                          className="flex items-center gap-2"
                        >
                          {loading ? "Submitting..." : "Submit Application"}
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
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