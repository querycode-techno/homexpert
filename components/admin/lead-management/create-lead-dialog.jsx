"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import servicesData from '@/lib/data/services.json'
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog'
import { 
  CheckCircle,
  Phone,
  Mail,
  MapPin,
  User,
  Calendar,
  Clock,
  Loader2,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectLabel
} from '@/components/ui/select'
import { createNotification } from '@/lib/services/notificationService'
import { getSession } from 'next-auth/react'


export default function CreateLeadDialog({ 
  isOpen, 
  onClose,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    // Customer Details
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    
    // Address (simplified)
    address: '',
    city: '',
    state: '',
    pincode: '',
    
    // Service Details
    categoryId: '',
    serviceId: '',
    subServiceName: '',
    description: '',
    additionalNotes: '',
    
    // Pricing
    price: '',
    getQuote: false,
    
    // Scheduling (optional)
    preferredDate: '',
    preferredTime: ''
  })

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Client-side validation
      const requiredFields = ['customerName', 'customerPhone', 'address', 'categoryId', 'serviceId', 'subServiceName']
      const missingFields = requiredFields.filter(field => !formData[field] || !formData[field].toString().trim())
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields, including service selection')
        setLoading(false)
        return
      }

      // Phone validation
      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(formData.customerPhone.trim())) {
        toast.error('Please enter a valid 10-digit phone number')
        setLoading(false)
        return
      }

      // Email validation (if provided)
      if (formData.customerEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.customerEmail.trim())) {
          toast.error('Please enter a valid email address')
          setLoading(false)
          return
        }
      }

      // Look up service and subservice names from IDs
      const selectedCategory = servicesData.categories.find(cat => cat.id === formData.categoryId);
      const selectedService = selectedCategory?.services.find(s => s.id === formData.serviceId);
      const selectedSubService = selectedService?.subServices.find(ss => ss.name === formData.subServiceName);

      // Get current user session for createdBy field
      const session = await getSession();
      const currentUserId = session?.user?.id;

      // Prepare optimized payload for admin API
      const leadPayload = {
        // Customer Information (matching new schema)
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        
        // Service Information (names, not IDs)
        service: selectedService?.name || '',
        selectedService: selectedService?.name || '',
        selectedSubService: selectedSubService?.name || '',
        
        // Address (simplified for new schema)
        address: `${formData.address.trim()}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.pincode ? ` - ${formData.pincode}` : ''}`.trim(),
        
        // Lead Details
        description: formData.description.trim() || `Service request for ${selectedService?.name}${selectedSubService ? ` - ${selectedSubService.name}` : ''}`,
        additionalNotes: formData.additionalNotes.trim() || undefined,
        
        // Pricing
        price: formData.price || (formData.getQuote ? 'Quote' : undefined),
        getQuote: formData.getQuote,
        
        // Scheduling
        preferredDate: formData.preferredDate || undefined,
        preferredTime: formData.preferredTime || undefined,
        
        // Admin tracking - include createdBy when admin creates lead
        createdBy: currentUserId || undefined
      }

      console.log('Creating lead with payload:', leadPayload);
      console.log('Current user ID:', currentUserId);

      // Submit to ADMIN API endpoint (not public API)
      const response = await fetch('/api/admin/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadPayload),
      })

      // Check if response is HTML (error page) instead of JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error occurred. Please try again.');
      }

      const result = await response.json()
      
      if (result.success) {
        setSubmitted(true)
        toast.success(result.message || 'Lead has been created successfully!')
        
        // Call onSuccess callback to refresh data
        if (onSuccess) {
          onSuccess();
        }
        
        // Optional: Track successful submission
        if (typeof gtag !== 'undefined') {
          gtag('event', 'admin_lead_creation', {
            event_category: 'admin_action',
            event_label: selectedSubService?.name || selectedService?.name || selectedCategory?.name,
            value: formData.price || 0
          });
        }
      } else {
        throw new Error(result.error || 'Failed to create lead')
      }

      // Create notification for vendor
      if (currentUserId) {
        try {
          const address = `${formData.address.trim()}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.pincode ? ` - ${formData.pincode}` : ''}`.trim();

          await createNotification({
            title: "New Lead Created by Admin",
            message: `Admin created a new lead for ${selectedSubService?.name} at ${address}`,
            messageType: "Info",
            target: "vendor",
            userId: currentUserId,
            link: "",
          });
        } catch (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Don't fail the whole operation for notification errors
        }
      }

    } catch (error) {
      console.error('Error submitting lead:', error)
      
      // Better error handling with user-friendly messages
      let errorMessage = 'Failed to create lead. Please try again.'
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Connection issue. Please check your internet and try again.'
      } else if (error.message.includes('duplicate') || error.message.includes('similar')) {
        errorMessage = 'A similar lead was recently created. Please check the lead list.'
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    if (!loading) {
      setSubmitted(false)
      setFormData({
        customerName: '',
        customerPhone: '',
        customerEmail: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        categoryId: '',
        serviceId: '',
        subServiceName: '',
        description: '',
        additionalNotes: '',
        price: '',
        getQuote: false,
        preferredDate: '',
        preferredTime: ''
      })
      onClose()
    }
  }

  // This is show after the admin submit customers leads
  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md bg-transparent shadow-none border-none">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Lead Booked for Customer!</DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl text-green-500 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <p className="text-green-800">
                The lead has been successfully booked for the customer.
              </p>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Customer Name:</strong> {formData.customerName}</p>
                <p><strong>Contact:</strong> {formData.customerPhone}</p>
                {formData.price && formData.price !== 'Quote' && (
                  <p><strong>Price:</strong> ₹{formData.price}</p>
                )}
              </div>
            </div>

            <Button onClick={handleClose} className="w-full">
              Book Another Lead
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto ">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-600 font-bold text-xl">
            <User className="h-5 w-5" />
            Book Service for a Customer
          </DialogTitle>
          <DialogDescription>
            Please provide your details so our team can contact you
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-6">
          
          {/*Service Selection Form  */}
           <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Choose a Services</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Category Select */}
                <div>
                  <Label>Category</Label>
                  <Select
                    value={formData.categoryId || ''}
                    onValueChange={val => {
                      setFormData(prev => ({
                        ...prev,
                        categoryId: val,
                        serviceId: '',
                        subServiceName: '',
                        price: '',
                        getQuote: false,
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {servicesData.categories.map(cat => (
                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Service Select */}
                <div>
                  <Label>Service</Label>
                  <Select
                    value={formData.serviceId || ''}
                    onValueChange={val => {
                      setFormData(prev => ({
                        ...prev,
                        serviceId: val,
                        subServiceName: '',
                        price: '',
                        getQuote: false,
                      }))
                    }}
                    disabled={!formData.categoryId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {(servicesData.categories.find(cat => cat.id === formData.categoryId)?.services || []).map(service => (
                        <SelectItem key={service.id} value={service.id}>{service.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Subservice Select */}
                <div>
                  <Label>Subservice</Label>
                  <Select
                    value={formData.subServiceName || ''}
                    onValueChange={val => {
                      // Find price for this subservice
                      const subService = (servicesData.categories.find(cat => cat.id === formData.categoryId)?.services.find(s => s.id === formData.serviceId)?.subServices || []).find(ss => ss.name === val)
                      setFormData(prev => ({
                        ...prev,
                        subServiceName: val,
                        price: subService?.price || '',
                        getQuote: subService?.price === 'Quote',
                      }))
                    }}
                    disabled={!formData.serviceId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select subservice" />
                    </SelectTrigger>
                    <SelectContent>
                      {(servicesData.categories.find(cat => cat.id === formData.categoryId)?.services.find(s => s.id === formData.serviceId)?.subServices || []).map(subService => (
                        <SelectItem key={subService.name} value={subService.name}>{subService.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Price Display */}
                {formData.subServiceName && (
                  <div>
                    <Label>Price</Label>
                    <div className="text-lg font-semibold">
                      {formData.price === 'Quote' || formData.getQuote
                        ? 'Get Quote'
                        : formData.price
                          ? `₹${formData.price}`
                          : '—'}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Lead Form (Simplified) */}
          <div className="lg:col-span-2 mb-10">
            <div className="flex flex-col items-center justify-center text-center">
              <h2 className="text-lg font-bold flex items-center gap-2">
                Add Customer Details
              </h2>
              <div className="w-full  mt-2 mb-5" />
            </div>
            {/* Show selected service summary */}
            {formData.categoryId && formData.serviceId && formData.subServiceName && (
              <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
                <div className="font-medium text-blue-700">Selected Service:</div>
                <div className="text-blue-900">
                  {servicesData.categories.find(cat => cat.id === formData.categoryId)?.name}
                  {' / '}
                  {servicesData.categories.find(cat => cat.id === formData.categoryId)?.services.find(s => s.id === formData.serviceId)?.name}
                  {' / '}
                  {formData.subServiceName}
                  {formData.price && (
                    <span className="ml-2 text-green-700">{formData.price === 'Quote' || formData.getQuote ? 'Get Quote' : `₹${formData.price}`}</span>
                  )}
                </div>
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="customerName">Full Name *</Label>
                    <Input
                      id="customerName"
                      name="customerName"
                      value={formData.customerName}
                      onChange={handleInputChange}
                      placeholder="Enter your full name"
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
                      placeholder="10-digit mobile number"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="customerEmail">Email Address (Optional)</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                  />
                </div>
              </div>

              {/* Address Information (Simplified) */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Service Address
                </h3>
                
                <div>
                  <Label htmlFor="address">Complete Address *</Label>
                  <Textarea
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="House/Flat number, Street, Area, Landmark"
                    rows={2}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleInputChange}
                      placeholder="Your city"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleInputChange}
                      placeholder="Your state"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="pincode">Pincode</Label>
                    <Input
                      id="pincode"
                      name="pincode"
                      value={formData.pincode}
                      onChange={handleInputChange}
                      placeholder="6-digit pincode"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Additional Information
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date (Optional)</Label>
                    <Input
                      id="preferredDate"
                      name="preferredDate"
                      type="date"
                      value={formData.preferredDate}
                      onChange={handleInputChange}
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="preferredTime">Preferred Time (Optional)</Label>
                    <select
                      id="preferredTime"
                      name="preferredTime"
                      value={formData.preferredTime}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Any time</option>
                      <option value="9-12">Morning (9 AM - 12 PM)</option>
                      <option value="12-16">Afternoon (12 PM - 4 PM)</option>
                      <option value="16-20">Evening (4 PM - 8 PM)</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="additionalNotes">Special Instructions (Optional)</Label>
                  <Textarea
                    id="additionalNotes"
                    name="additionalNotes"
                    value={formData.additionalNotes}
                    onChange={handleInputChange}
                    placeholder="Any specific requirements or instructions..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex gap-2 pt-4">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleClose}
                  disabled={loading}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1" 
                  disabled={loading || !formData.categoryId || !formData.serviceId || !formData.subServiceName || !formData.customerName.trim() || !formData.customerPhone.trim() || !formData.address.trim()}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Request'
                  )}
                </Button>
              </div>
              
             
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 