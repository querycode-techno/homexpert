"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Plus,
  X,
  Upload,
  FileText,
  CreditCard,
  MapPin,
  Building,
  User,
  Phone,
  Mail,
  Lock
} from "lucide-react"
import DocumentUpload from "./document-upload"
import { serviceUtils } from "@/lib/utils"

// Get service options from services.json
const serviceOptions = serviceUtils.getAllServices()

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" }
]

export function VendorForm({
  isOpen,
  onClose,
  onSubmit,
  vendor = null,
  title,
  description,
  loading = false
}) {
  const isEdit = !!vendor
  
  const form = useForm({
    defaultValues: {
      // User data
      name: "",
      email: "",
      phone: "",
      password: "",
      profileImage: "",
      
      // Vendor data
      businessName: "",
      services: [],
      
      // Address
      address: {
        street: "",
        area: "",
        city: "",
        state: "",
        pincode: "",
        serviceAreas: []
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
      },
      
      // Status and verification
      status: "pending",
      verified: {
        isVerified: false,
        verificationNotes: ""
      }
    }
  })

  const { fields: serviceFields, append: appendService, remove: removeService } = useFieldArray({
    control: form.control,
    name: "services"
  })

  const { fields: serviceAreaFields, append: appendServiceArea, remove: removeServiceArea } = useFieldArray({
    control: form.control,
    name: "address.serviceAreas"
  })

  // Populate form when editing
  useEffect(() => {
    if (isEdit && vendor) {
      form.reset({
        // User data
        name: vendor.userData?.name || "",
        email: vendor.userData?.email || "",
        phone: vendor.userData?.phone || "",
        password: "", // Don't populate password
        profileImage: vendor.userData?.profileImage || "",
        
        // Vendor data
        businessName: vendor.businessName || "",
        services: vendor.services || [],
        
        // Address
        address: {
          street: vendor.address?.street || "",
          area: vendor.address?.area || "",
          city: vendor.address?.city || "",
          state: vendor.address?.state || "",
          pincode: vendor.address?.pincode || "",
          serviceAreas: vendor.address?.serviceAreas || []
        },
        
        // Documents
        documents: {
          aadharCard: vendor.documents?.aadharCard || { number: "", imageUrl: "", verified: false },
          panCard: vendor.documents?.panCard || { number: "", imageUrl: "", verified: false },
          businessLicense: vendor.documents?.businessLicense || { number: "", imageUrl: "", verified: false },
          bankDetails: vendor.documents?.bankDetails || { 
            accountNumber: "", 
            ifscCode: "", 
            accountHolderName: "", 
            verified: false 
          }
        },
        
        // Status and verification
        status: vendor.status || "pending",
        verified: {
          isVerified: vendor.verified?.isVerified || false,
          verificationNotes: vendor.verified?.verificationNotes || ""
        }
      })
    }
  }, [isEdit, vendor, form])

  const handleSubmit = (data) => {
    onSubmit(data)
  }

  const addService = (service) => {
    const currentServices = form.getValues("services")
    if (!currentServices.includes(service)) {
      form.setValue("services", [...currentServices, service])
    }
  }

  const removeServiceItem = (index) => {
    const currentServices = form.getValues("services")
    form.setValue("services", currentServices.filter((_, i) => i !== index))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

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
                  rules={{ required: "Name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter full name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{ 
                    required: "Email is required",
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: "Invalid email format"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Enter email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  rules={{ required: "Phone is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {!isEdit && (
                  <FormField
                    control={form.control}
                    name="password"
                    rules={{ 
                      required: "Password is required",
                      minLength: {
                        value: 6,
                        message: "Password must be at least 6 characters"
                      }
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password</FormLabel>
                        <FormControl>
                          <Input type="password" placeholder="Enter password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                  rules={{ required: "Business name is required" }}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Business Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter business name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="md:col-span-2">
                  <FormLabel>Services</FormLabel>
                  <div className="space-y-2">
                    <Select onValueChange={addService}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select services to add" />
                      </SelectTrigger>
                      <SelectContent>
                        {serviceOptions.map((service) => (
                          <SelectItem key={service} value={service}>
                            {service}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    
                    <div className="flex flex-wrap gap-2">
                      {form.watch("services").map((service, index) => (
                        <Badge key={index} variant="secondary" className="gap-1">
                          {service}
                          <button
                            type="button"
                            onClick={() => removeServiceItem(index)}
                            className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {isEdit && (
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {statusOptions.map((status) => (
                              <SelectItem key={status.value} value={status.value}>
                                {status.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                  rules={{ required: "Street address is required" }}
                  render={({ field }) => (
                    <FormItem className="md:col-span-2">
                      <FormLabel>Street Address</FormLabel>
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
                        <Input placeholder="Enter area" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address.city"
                  rules={{ required: "City is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
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
                  rules={{ required: "State is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
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
                  rules={{ required: "Pincode is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
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
                        rules={{ required: "Account holder name is required" }}
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
                        rules={{ required: "Account number is required" }}
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
                        rules={{ required: "IFSC code is required" }}
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

            {isEdit && (
              <>
                <Separator />

                {/* Verification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Verification</h3>
                  
                  {/* Document Verification */}
                  <div className="space-y-3">
                    <FormLabel className="text-base">Document Verification</FormLabel>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 border rounded-lg">
                      <FormField
                        control={form.control}
                        name="documents.aadharCard.verified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-sm">Aadhar Card</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="documents.panCard.verified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-sm">PAN Card</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="documents.businessLicense.verified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-sm">Business License</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="documents.bankDetails.verified"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between">
                            <FormLabel className="text-sm">Bank Details</FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="verified.isVerified"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">Overall Verified Status</FormLabel>
                          <FormDescription>
                            Mark this vendor as fully verified (auto-activates vendor)
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="verified.verificationNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verification Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add verification notes..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : isEdit ? "Update Vendor" : "Create Vendor"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
} 