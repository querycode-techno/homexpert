"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  ArrowLeft,
  User,
  AlertTriangle,
  FileText,
  Tag,
  Building,
  Mail,
  Phone,
  MapPin,
  Loader2,
  Plus,
  X
} from "lucide-react"

const PRIORITY_OPTIONS = [
  { value: "low", label: "Low", color: "bg-blue-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "urgent", label: "Urgent", color: "bg-red-500" }
]

const CATEGORY_OPTIONS = [
  { value: "technical_issue", label: "Technical Issue" },
  { value: "billing_support", label: "Billing Support" },
  { value: "account_access", label: "Account Access" },
  { value: "lead_management", label: "Lead Management" },
  { value: "subscription_issue", label: "Subscription Issue" },
  { value: "payment_issue", label: "Payment Issue" },
  { value: "profile_verification", label: "Profile Verification" },
  { value: "feature_request", label: "Feature Request" },
  { value: "general_inquiry", label: "General Inquiry" },
  { value: "urgent_support", label: "Urgent Support" }
]

export default function AdminNewSupportTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [loadingVendors, setLoadingVendors] = useState(true)
  const [loadingAssignees, setLoadingAssignees] = useState(true)
  const [vendors, setVendors] = useState([])
  const [assigneeUsers, setAssigneeUsers] = useState([])
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [tags, setTags] = useState([])
  const [newTag, setNewTag] = useState("")
  
  const [formData, setFormData] = useState({
    vendorId: "",
    subject: "",
    description: "",
    priority: "medium",
    category: "",
    tags: [],
    relatedLeadId: "",
    relatedSubscriptionId: "",
    assignedTo: "unassigned",
    internalNotes: ""
  })

  // Load vendors and assignees
  useEffect(() => {
    loadVendors()
    loadAssigneeUsers()
  }, [])

  const loadVendors = async () => {
    try {
      setLoadingVendors(true)
      const response = await fetch(`/api/admin/vendors?limit=1000&status=active`)
      const data = await response.json()
      
      console.log("Vendor API Response:", data) // Debug log
      
      if (data.success) {
        // Correct path: data.data.vendors (not data.vendors)
        setVendors(data.data?.vendors || [])
      } else {
        console.error("API Error:", data.error)
        setVendors([])
        toast.error(data.error || "Failed to load vendors")
      }
    } catch (error) {
      console.error("Error loading vendors:", error)
      setVendors([])
      toast.error("Failed to load vendors")
    } finally {
      setLoadingVendors(false)
    }
  }

  const loadAssigneeUsers = async () => {
    try {
      setLoadingAssignees(true)
      const response = await fetch(`/api/admin/users/by-role?roles=telecaller,helpline`)
      const data = await response.json()
      
      console.log("Assignee Users API Response:", data) // Debug log
      
      if (data.success) {
        setAssigneeUsers(data.users || [])
      } else {
        console.error("Assignee API Error:", data.error)
        setAssigneeUsers([])
        toast.error(data.error || "Failed to load assignable users")
      }
    } catch (error) {
      console.error("Error loading assignee users:", error)
      setAssigneeUsers([])
      toast.error("Failed to load assignable users")
    } finally {
      setLoadingAssignees(false)
    }
  }

  const selectVendor = (vendorId) => {
    const vendor = vendors.find(v => v._id === vendorId)
    setSelectedVendor(vendor)
    setFormData(prev => ({ ...prev, vendorId: vendorId }))
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      const updatedTags = [...tags, newTag.trim()]
      setTags(updatedTags)
      setFormData(prev => ({ ...prev, tags: updatedTags }))
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove) => {
    const updatedTags = tags.filter(tag => tag !== tagToRemove)
    setTags(updatedTags)
    setFormData(prev => ({ ...prev, tags: updatedTags }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.vendorId) {
      toast.error("Please select a vendor")
      return
    }

    if (!formData.subject.trim()) {
      toast.error("Please enter a subject")
      return
    }

    if (!formData.description.trim()) {
      toast.error("Please enter a description")
      return
    }

    if (!formData.category) {
      toast.error("Please select a category")
      return
    }

    // Validate category against allowed values
    const validCategories = CATEGORY_OPTIONS.map(cat => cat.value);
    if (!validCategories.includes(formData.category)) {
      toast.error(`Invalid category selected: ${formData.category}`)
      console.error('Invalid category:', formData.category, 'Valid options:', validCategories);
      return
    }

          try {
        setLoading(true)
        
        const requestPayload = {
          title: formData.subject, // API expects 'title' but form has 'subject'
          description: formData.description,
          category: formData.category,
          priority: formData.priority,
          vendorId: formData.vendorId,
          assignedTo: formData.assignedTo === "unassigned" ? "" : formData.assignedTo,
          tags: formData.tags,
          relatedLead: formData.relatedLeadId || undefined,
          relatedSubscription: formData.relatedSubscriptionId || undefined
        };
        
        console.log('Sending request payload:', JSON.stringify(requestPayload, null, 2)); // Debug log
        
        const response = await fetch("/api/admin/support", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        })

              const data = await response.json()
        console.log('Create ticket API response:', JSON.stringify(data, null, 2)); // Debug log

        if (data.success) {
          toast.success("Support ticket created successfully")
          
          // Handle different possible response structures
          const ticketId = data.data?.ticket?._id || data.ticket?._id;
          console.log('Extracted ticket ID:', ticketId); // Debug log
          
          if (ticketId) {
            router.push(`/admin/support/${ticketId}`)
          } else {
            console.error('No ticket ID found in response:', data);
            // Fallback to support list page
            router.push('/admin/support')
          }
        } else {
          toast.error(data.message || "Failed to create support ticket")
        }
    } catch (error) {
      console.error("Error creating support ticket:", error)
      toast.error("Failed to create support ticket")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Support Ticket</h1>
          <p className="text-muted-foreground">
            Create a new support ticket on behalf of a vendor
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Vendor Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Select Vendor
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-select">Select Vendor *</Label>
              <Select
                value={formData.vendorId}
                onValueChange={selectVendor}
                disabled={loadingVendors}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingVendors ? "Loading vendors..." : "Choose a vendor"} />
                </SelectTrigger>
                <SelectContent>
                  {vendors.length === 0 ? (
                    <SelectItem value="no-vendors" disabled>
                      No active vendors found
                    </SelectItem>
                  ) : (
                    vendors.map((vendor) => (
                      <SelectItem key={vendor._id} value={vendor._id}>
                        <div className="flex flex-col">
                          <div className="font-medium">{vendor.businessName || 'Unnamed Business'}</div>
                          <div className="text-sm text-muted-foreground">
                            {vendor.userData?.email || 'No email'} • {vendor.userData?.phoneNumber || vendor.userData?.phone || 'No phone'}
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedVendor && (
              <div className="flex items-center gap-3 p-4 border rounded-md bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{selectedVendor.businessName}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {selectedVendor.userData?.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {selectedVendor.userData?.phoneNumber}
                    </span>
                    {selectedVendor.businessAddress?.city && (
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {selectedVendor.businessAddress.city}
                      </span>
                    )}
                  </div>
                </div>
                <Badge variant="outline">{selectedVendor.status}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ticket Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Ticket Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="Brief description of the issue"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                placeholder="Detailed description of the issue..."
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITY_OPTIONS.map((priority) => (
                      <SelectItem key={priority.value} value={priority.value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${priority.color}`} />
                          {priority.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignedTo">Assign To</Label>
                <Select
                  value={formData.assignedTo}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, assignedTo: value }))}
                  disabled={loadingAssignees}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingAssignees ? "Loading assignees..." : "Select assignee (optional)"} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No assignment</SelectItem>
                    {assigneeUsers.length === 0 ? (
                      <SelectItem value="no-users" disabled>
                        No telecaller/helpline users found
                      </SelectItem>
                    ) : (
                      assigneeUsers.map((user) => (
                        <SelectItem key={user._id} value={user._id}>
                          <div className="flex flex-col">
                            <div className="font-medium">{user.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {user.role.name} • {user.email}
                              {user.employeeId && ` • ${user.employeeId}`}
                            </div>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tags */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input
                placeholder="Add a tag..."
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
              />
              <Button type="button" variant="outline" onClick={addTag}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <Badge key={tag} variant="secondary" className="gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Optional Fields */}
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="relatedLeadId">Related Lead ID</Label>
                <Input
                  id="relatedLeadId"
                  placeholder="e.g., 507f1f77bcf86cd799439011"
                  value={formData.relatedLeadId}
                  onChange={(e) => setFormData(prev => ({ ...prev, relatedLeadId: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="relatedSubscriptionId">Related Subscription ID</Label>
                <Input
                  id="relatedSubscriptionId"
                  placeholder="e.g., 507f1f77bcf86cd799439012"
                  value={formData.relatedSubscriptionId}
                  onChange={(e) => setFormData(prev => ({ ...prev, relatedSubscriptionId: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="internalNotes">Internal Notes</Label>
              <Textarea
                id="internalNotes"
                placeholder="Internal notes for admin/support team (not visible to vendor)..."
                rows={3}
                value={formData.internalNotes}
                onChange={(e) => setFormData(prev => ({ ...prev, internalNotes: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Ticket...
              </>
            ) : (
              "Create Ticket"
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 