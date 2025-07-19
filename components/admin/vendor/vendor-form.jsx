"use client"

import { useState, useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { usePermissions } from "@/hooks/usePermissions"
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
import { ServiceSelector } from "./service-selector"
import { serviceUtils } from "@/lib/utils"

// Get service options from services.json
const serviceOptions = serviceUtils.getAllServices()

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" }
]

// Indian States List
const INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
  'Andaman and Nicobar Islands',
  'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu',
  'Delhi',
  'Jammu and Kashmir',
  'Ladakh',
  'Lakshadweep',
  'Puducherry'
];

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
  const { isAdmin } = usePermissions()
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  
  // Debug admin permission
  useEffect(() => {
    console.log('VendorForm - isAdmin:', isAdmin, 'isOpen:', isOpen)
  }, [isAdmin, isOpen])
  
  // Fetch users for onboardedBy dropdown (admin only)
  const fetchUsers = async () => {
    if (!isAdmin) return
    
    try {
      setUsersLoading(true)
      // Fetch all administrative users (excluding vendors)
      const response = await fetch('/api/admin/employee?limit=200')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data?.employees || [])
        console.log('Successfully loaded users:', data.data?.employees?.length || 0)
      } else {
        console.error('Failed to fetch users:', data.error)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setUsersLoading(false)
    }
  }
  
  // Fetch users when form opens
  useEffect(() => {
    if (isOpen && isAdmin) {
      console.log('Fetching users for onboardedBy dropdown...')
      fetchUsers()
    }
  }, [isOpen, isAdmin])
  
  // Debug log when users change
  useEffect(() => {
    console.log('Users loaded:', users.length, users)
  }, [users])

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
        identity: {
          type: "",
          number: "",
          docImageUrl: ""
        },
        business: {
          type: "",
          number: "",
          docImageUrl: ""
        }
      },
      
      // Status and verification
      status: "pending",
      verified: {
        isVerified: false,
        verificationNotes: ""
      },
      
      // Admin-only field
      onboardedBy: ""
    }
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
          identity: vendor.documents?.identity || { type: "", number: "", docImageUrl: "" },
          business: vendor.documents?.business || { type: "", number: "", docImageUrl: "" }
        },
        
        // Status and verification
        status: vendor.status || "pending",
        verified: {
          isVerified: vendor.verified?.isVerified || false,
          verificationNotes: vendor.verified?.verificationNotes || ""
        },
        
        // Admin-only field
        onboardedBy: vendor.onboardedBy?._id || vendor.onboardedBy || ""
      })
    }
  }, [isEdit, vendor, form])

  const handleSubmit = (data) => {
    onSubmit(data)
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
                  <ServiceSelector
                    selectedServices={form.watch("services")}
                    onServicesChange={(services) => form.setValue("services", services)}
                    placeholder="Search or select services..."
                  />
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
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a state" />
                          </SelectTrigger>
                          <SelectContent>
                            {INDIAN_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
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
                {/* Identity Documents */}
                <DocumentUpload
                  document={form.watch("documents.identity")}
                  documentType="identity"
                  title="Identity Documents"
                  required={true}
                  numberField="number"
                  numberFieldName="Document Number"
                  onDocumentChange={(updatedDoc) => {
                    form.setValue("documents.identity", updatedDoc)
                  }}
                  onNumberChange={(value) => {
                    form.setValue("documents.identity.number", value)
                  }}
                  disabled={false}
                />

                {/* Business Documents */}
                <DocumentUpload
                  document={form.watch("documents.business")}
                  documentType="business"
                  title="Business Documents"
                  required={true}
                  numberField="number"
                  numberFieldName="Document Number"
                  onDocumentChange={(updatedDoc) => {
                    form.setValue("documents.business", updatedDoc)
                  }}
                  onNumberChange={(value) => {
                    form.setValue("documents.business.number", value)
                  }}
                  disabled={false}
                />
              </div>
            </div>

            {isEdit && (
              <>
                <Separator />

                {/* Verification */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Verification</h3>
                  
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
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Admin Only - Onboarded By */}
                {isAdmin && (
                  <>
                    <Separator />
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        <h3 className="text-lg font-semibold">Management</h3>
                      </div>
                      
                      <FormField
                        control={form.control}
                        name="onboardedBy"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Onboarded By</FormLabel>
                            <FormDescription>
                              Select the user who onboarded this vendor. Leave blank for self-registered vendors.
                            </FormDescription>
                            <Select 
                              onValueChange={(value) => {
                                // Convert "none" back to empty string for the form
                                const newValue = value === "none" ? "" : value
                                field.onChange(newValue)
                              }} 
                              value={field.value ? field.value : "none"}
                              disabled={usersLoading}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={usersLoading ? "Loading users..." : "Select user (optional)"} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">None (Self-registered)</SelectItem>
                                {usersLoading ? (
                                  <SelectItem value="loading" disabled>Loading users...</SelectItem>
                                ) : users.length > 0 ? (
                                  users.map((user) => (
                                    <SelectItem key={user._id} value={user._id}>
                                      {user.name} - {user.email} ({user.role?.name || 'Unknown Role'})
                                    </SelectItem>
                                  ))
                                ) : (
                                  <SelectItem value="no-users" disabled>No users available</SelectItem>
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </>
                )}
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