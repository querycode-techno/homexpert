"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog'
import { 
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'
import { Loader2, User } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import servicesData from '@/lib/data/services.json'

const LEAD_STATUSES = [
  'pending', 'available', 'taken', 'contacted', 'completed', 'cancelled'
]

export function EditLeadDialog({ 
  open, 
  onOpenChange, 
  leadId,
  onSuccess
}) {
  const { isAdmin } = usePermissions()
  const [loading, setLoading] = useState(false)
  const [fetchingLead, setFetchingLead] = useState(false)
  const [users, setUsers] = useState([])
  const [usersLoading, setUsersLoading] = useState(false)
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    categoryId: '',
    serviceId: '',
    selectedService: '',
    selectedSubService: '',
    description: '',
    status: 'pending',
    createdBy: ''
  })

  // Get available options based on current selection
  const categories = servicesData.categories || []
  const selectedCategory = categories.find(cat => cat.id === formData.categoryId)
  const availableServices = selectedCategory?.services || []
  const selectedService = availableServices.find(service => service.id === formData.serviceId)
  const availableSubServices = selectedService?.subServices || []

  // Fetch employees list for admin users
  const fetchUsers = async () => {
    if (!isAdmin) return
    
    setUsersLoading(true)
    try {
      const response = await fetch('/api/admin/employee?limit=200')
      const data = await response.json()
      
      if (data.success) {
        setUsers(data.data?.employees || [])
      } else {
        console.error('Failed to fetch users:', data.error)
        toast.error('Failed to load employees')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load employees')
    } finally {
      setUsersLoading(false)
    }
  }

  // Fetch lead data when dialog opens
  useEffect(() => {
    if (open && leadId) {
      fetchLeadData()
      if (isAdmin) {
        fetchUsers()
      }
    }
  }, [open, leadId, isAdmin])

  const fetchLeadData = async () => {
    setFetchingLead(true)
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`)
      const result = await response.json()
      
      if (result.success) {
        const lead = result.data
        
        // Find matching category and service based on the lead's service name
        let matchedCategoryId = ''
        let matchedServiceId = ''
        
        if (lead.selectedService) {
          // Try exact match first
          for (const category of categories) {
            const service = category.services.find(s => s.name === lead.selectedService)
            if (service) {
              matchedCategoryId = category.id
              matchedServiceId = service.id
              break
            }
          }
          
          // If no exact match, try partial match (case insensitive)
          if (!matchedCategoryId) {
            for (const category of categories) {
              const service = category.services.find(s => 
                s.name.toLowerCase().includes(lead.selectedService.toLowerCase()) ||
                lead.selectedService.toLowerCase().includes(s.name.toLowerCase())
              )
              if (service) {
                matchedCategoryId = category.id
                matchedServiceId = service.id
                break
              }
            }
          }
        }

        console.log('Lead data:', lead)
        console.log('Matched category:', matchedCategoryId)
        console.log('Matched service:', matchedServiceId)

        setFormData({
          customerName: lead.customerName || '',
          customerPhone: lead.customerPhone || '',
          customerEmail: lead.customerEmail || '',
          address: lead.address || '',
          categoryId: matchedCategoryId,
          serviceId: matchedServiceId,
          selectedService: lead.selectedService || '',
          selectedSubService: lead.selectedSubService || '',
          description: lead.description || '',
          status: lead.status || 'pending',
          createdBy: lead.createdBy || ''
        })
      } else {
        toast.error('Failed to fetch lead data')
      }
    } catch (error) {
      console.error('Error fetching lead:', error)
      toast.error('Failed to fetch lead data')
    } finally {
      setFetchingLead(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSelectChange = (name, value) => {
    if (name === 'categoryId') {
      // Reset service and sub-service when category changes
      setFormData(prev => ({
        ...prev,
        categoryId: value,
        serviceId: '',
        selectedService: '',
        selectedSubService: ''
      }))
    } else if (name === 'serviceId') {
      // Update service name and reset sub-service when service changes
      const category = categories.find(cat => cat.id === formData.categoryId)
      const service = category?.services.find(s => s.id === value)
      setFormData(prev => ({
        ...prev,
        serviceId: value,
        selectedService: service?.name || '',
        selectedSubService: ''
      }))
    } else if (name === 'selectedSubService') {
      setFormData(prev => ({
        ...prev,
        selectedSubService: value
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Prepare data for submission (only include necessary fields)
      const submitData = {
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        customerEmail: formData.customerEmail,
        address: formData.address,
        selectedService: formData.selectedService,
        selectedSubService: formData.selectedSubService,
        description: formData.description,
        status: formData.status,
        createdBy: formData.createdBy
      }

      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateBasicInfo',
          data: submitData
        })
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Lead updated successfully')
        onSuccess?.(result.data)
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to update lead')
      }
    } catch (error) {
      console.error('Error updating lead:', error)
      toast.error('Failed to update lead')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  if (fetchingLead) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[500px]">
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading lead data...</span>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the lead information below.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Customer Information</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="customerName">Customer Name *</Label>
                <Input
                  id="customerName"
                  name="customerName"
                  value={formData.customerName}
                  onChange={handleInputChange}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="customerPhone">Phone Number *</Label>
                <Input
                  id="customerPhone"
                  name="customerPhone"
                  type="tel"
                  value={formData.customerPhone}
                  onChange={handleInputChange}
                  placeholder="Phone number"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="customerEmail">Email Address</Label>
              <Input
                id="customerEmail"
                name="customerEmail"
                type="email"
                value={formData.customerEmail}
                onChange={handleInputChange}
                placeholder="Email address (optional)"
              />
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                placeholder="Full address"
                rows={2}
              />
            </div>
          </div>

          {/* Service Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium">Service Information</h3>
            
            {/* Category Selection */}
            <div>
              <Label htmlFor="categoryId">Service Category</Label>
              <Select 
                value={formData.categoryId} 
                onValueChange={(value) => handleSelectChange('categoryId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select service category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon} {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Show current service if category not matched */}
              {formData.selectedService && !formData.categoryId && (
                <div className="text-xs text-muted-foreground mt-1 p-2 bg-yellow-50 rounded border">
                  ⚠️ Current service "{formData.selectedService}" - Please select matching category
                </div>
              )}
            </div>

            {/* Service Selection */}
            <div>
              <Label htmlFor="serviceId">Service</Label>
              <Select 
                value={formData.serviceId} 
                onValueChange={(value) => handleSelectChange('serviceId', value)}
                disabled={!formData.categoryId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.categoryId ? "Select service" : "Select category first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableServices.map((service) => (
                    <SelectItem key={service.id} value={service.id}>
                      {service.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {/* Show current service if not matched */}
              {formData.selectedService && !formData.serviceId && (
                <div className="text-xs text-muted-foreground mt-1">
                  Current: {formData.selectedService}
                </div>
              )}
            </div>

            {/* Sub Service Selection */}
            <div>
              <Label htmlFor="selectedSubService">Sub Service</Label>
              <Select 
                value={formData.selectedSubService} 
                onValueChange={(value) => handleSelectChange('selectedSubService', value)}
                disabled={!formData.serviceId}
              >
                <SelectTrigger>
                  <SelectValue placeholder={formData.serviceId ? "Select sub service" : "Select service first"} />
                </SelectTrigger>
                <SelectContent>
                  {availableSubServices.map((subService, index) => (
                    <SelectItem key={index} value={subService.name}>
                      {subService.name} {subService.price && `- ₹${subService.price}`}
                    </SelectItem>
                  ))}
                  {/* Add current sub-service if not in list */}
                  {formData.selectedSubService && 
                   !availableSubServices.some(sub => sub.name === formData.selectedSubService) && (
                    <SelectItem value={formData.selectedSubService}>
                      {formData.selectedSubService} (Current)
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {/* Show current sub-service if service not matched */}
              {formData.selectedSubService && !formData.serviceId && (
                <div className="text-xs text-muted-foreground mt-1">
                  Current: {formData.selectedSubService}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Service description or requirements"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => handleSelectChange('status', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

          </div>

          {/* Management Section - Admin Only */}
          {isAdmin && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  <h3 className="text-sm font-medium">Management</h3>
                </div>
                
                <div>
                  <Label htmlFor="createdBy">Created By</Label>
                  <p className="text-xs text-muted-foreground mb-2">
                    Assign ownership of this lead to an employee. Leave blank for customer-created leads.
                  </p>
                  <Select 
                    value={formData.createdBy ? formData.createdBy : "none"} 
                    onValueChange={(value) => {
                      const newValue = value === "none" ? "" : value
                      handleSelectChange('createdBy', newValue)
                    }}
                    disabled={usersLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={usersLoading ? "Loading employees..." : "Select employee (optional)"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None (Customer-created)</SelectItem>
                      {usersLoading ? (
                        <SelectItem value="loading" disabled>Loading employees...</SelectItem>
                      ) : users.length > 0 ? (
                        users.map((user) => (
                          <SelectItem key={user._id} value={user._id}>
                            {user.name} - {user.email} ({user.role?.name || 'Unknown Role'})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="no-users" disabled>No employees available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}
        </form>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Updating...
              </>
            ) : (
              'Update Lead'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 