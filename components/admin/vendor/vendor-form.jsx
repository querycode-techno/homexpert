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
import { SearchableSelect } from '@/components/ui/searchable-select'
import { getStateOptions, getCityOptions } from '@/lib/utils/stateCityUtils'

// Get service options from services.json
const serviceOptions = serviceUtils.getAllServices()

const statusOptions = [
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "suspended", label: "Suspended" },
  { value: "inactive", label: "Inactive" }
]

// Image Preview Component
function ImagePreview({ isOpen, imageUrl, title, onClose }) {
  if (!isOpen) return null

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only close if explicitly set to false, prevent interference with parent dialog
        if (!open) {
          onClose()
        }
      }}
    >
      <DialogContent className="max-w-4xl max-h-[90vh] p-0" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader className="p-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="px-6 pb-6">
          <div className="relative bg-gray-50 rounded-lg overflow-hidden">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto max-h-[70vh] object-contain"
              onError={(e) => {
                e.target.src = '/placeholder.svg'
                e.target.alt = 'Image not found'
              }}
            />
          </div>
          <div className="flex justify-center mt-4">
            <Button onClick={onClose} variant="outline">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

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
  const [formDataLoaded, setFormDataLoaded] = useState(false)
  const [imagePreview, setImagePreview] = useState({ isOpen: false, imageUrl: '', title: '' })
  
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
      setFormDataLoaded(false) // Start loading
      console.log('Populating vendor form with data:', vendor)
      console.log('Documents data:', vendor.documents)
      console.log('Verification data:', vendor.verified)
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
        
        // Documents - handle different data structures
        documents: {
          identity: {
            type: vendor.documents?.identity?.type || "",
            number: vendor.documents?.identity?.number || "",
            docImageUrl: vendor.documents?.identity?.docImageUrl || ""
          },
          business: {
            type: vendor.documents?.business?.type || "",
            number: vendor.documents?.business?.number || "",
            docImageUrl: vendor.documents?.business?.docImageUrl || ""
          }
        },
        
        // Status and verification - handle different data structures
        status: vendor.status || "pending",
        verified: {
          isVerified: vendor.verified?.isVerified === true || vendor.verified?.status === 'verified',
          verificationNotes: vendor.verified?.verificationNotes || vendor.verified?.notes || ""
        },
        
        // Admin-only field
        onboardedBy: vendor.onboardedBy?._id || vendor.onboardedBy || ""
      })
      
      // Debug: Log what form is watching after reset
      setTimeout(() => {
        console.log('Form watching documents after reset:', form.watch("documents"))
        console.log('Form watching verification after reset:', form.watch("verified"))
        setFormDataLoaded(true) // Mark as loaded after form reset completes
      }, 100)
    } else if (!isEdit) {
      setFormDataLoaded(true) // For add mode, no data to load
    }
  }, [isEdit, vendor, form])

  // Reset form data loaded state when dialog opens/closes
  useEffect(() => {
    if (!isOpen) {
      setFormDataLoaded(false)
    }
  }, [isOpen])

  const handleSubmit = (data) => {
    onSubmit(data)
  }

  const openImagePreview = (imageUrl, title) => {
    setImagePreview({ isOpen: true, imageUrl, title })
  }

  const closeImagePreview = () => {
    setImagePreview({ isOpen: false, imageUrl: '', title: '' })
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Show loading skeleton while form data is being populated */}
            {isEdit && !formDataLoaded ? (
              <div className="space-y-6">
                {/* Personal Information Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Business Information Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  <div className="h-32 bg-gray-200 rounded animate-pulse"></div>
                </div>
                
                {/* Address Information Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
                
                {/* Documents Skeleton */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-6 w-40 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-64 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="address.state"
                    rules={{ required: "State is required" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <SearchableSelect
                            options={getStateOptions()}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder="Search and select state..."
                            searchPlaceholder="Type to search states..."
                            emptyMessage="No states found"
                            showSearch={true}
                          />
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
                          <SearchableSelect
                            options={getCityOptions(form.watch('address.state'))}
                            value={field.value}
                            onValueChange={field.onChange}
                            placeholder={
                              !form.watch('address.state') 
                                ? 'Select state first' 
                                : 'Search and select city...'
                            }
                            searchPlaceholder="Type to search cities..."
                            emptyMessage={!form.watch('address.state') ? "Please select a state first" : "No cities found"}
                            disabled={!form.watch('address.state')}
                            showSearch={getCityOptions(form.watch('address.state')).length > 10}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  <h3 className="text-lg font-semibold">Documents</h3>
                </div>
                {isEdit && (
                  <div className="flex gap-2">
                    <Badge 
                      variant={vendor?.documents?.identity?.docImageUrl ? 'default' : 'secondary'}
                      className={vendor?.documents?.identity?.docImageUrl ? 'bg-green-500' : 'bg-gray-500'}
                    >
                      Identity: {vendor?.documents?.identity?.docImageUrl ? 'Uploaded' : 'Missing'}
                    </Badge>
                    <Badge 
                      variant={vendor?.documents?.business?.docImageUrl ? 'default' : 'secondary'}
                      className={vendor?.documents?.business?.docImageUrl ? 'bg-green-500' : 'bg-gray-500'}
                    >
                      Business: {vendor?.documents?.business?.docImageUrl ? 'Uploaded' : 'Missing'}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Document Thumbnails Preview - Show if images exist */}
              {isEdit && (vendor?.documents?.identity?.docImageUrl || vendor?.documents?.business?.docImageUrl) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
                  {vendor?.documents?.identity?.docImageUrl && (
                    <div className="relative">
                      <div 
                        className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openImagePreview(vendor.documents.identity.docImageUrl, 'Identity Document')}
                      >
                        <img
                          src={vendor.documents.identity.docImageUrl}
                          alt="Identity Document"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder.svg'
                            e.target.alt = 'Image not found'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center">Identity Doc</p>
                    </div>
                  )}
                  
                  {vendor?.documents?.business?.docImageUrl && (
                    <div className="relative">
                      <div 
                        className="aspect-square bg-white rounded-lg overflow-hidden border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => openImagePreview(vendor.documents.business.docImageUrl, 'Business Document')}
                      >
                        <img
                          src={vendor.documents.business.docImageUrl}
                          alt="Business Document"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.src = '/placeholder.svg'
                            e.target.alt = 'Image not found'
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-600 mt-1 text-center">Business Doc</p>
                    </div>
                  )}
                </div>
              )}
              
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
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Verification</h3>
                    <Badge 
                      variant={vendor?.verified?.status === 'verified' ? 'default' : 'secondary'}
                      className={vendor?.verified?.status === 'verified' ? 'bg-green-500' : 'bg-orange-500'}
                    >
                      {vendor?.verified?.status || 'pending'}
                    </Badge>
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
            </>
          )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading || (isEdit && !formDataLoaded)}>
                {loading ? "Saving..." : 
                 (isEdit && !formDataLoaded) ? "Loading..." :
                 isEdit ? "Update Vendor" : "Create Vendor"}
              </Button>
            </DialogFooter>

          </form>
        </Form>
      </DialogContent>
    </Dialog>
    
    {/* Image Preview Modal */}
    <ImagePreview
      isOpen={imagePreview.isOpen}
      imageUrl={imagePreview.imageUrl}
      title={imagePreview.title}
      onClose={closeImagePreview}
    />
    </>
  )
} 