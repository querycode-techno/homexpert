"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
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
import { userCreateLeadsNotificationFromUserSide } from '@/lib/services/notificationService'
import { SearchableStateCityInput } from '@/components/ui/searchable-state-city-input'

export default function LeadFormPopup({ 
  isOpen, 
  onClose, 
  service = '', 
  subService = '', 
  price = '' 
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
    service: service,
    selectedService: `${service}${subService ? ` - ${subService}` : ''}`,
    selectedSubService: subService,
    description: '',
    additionalNotes: '',
    
    // Pricing
    price: price !== 'Quote' ? price : undefined,
    getQuote: price === 'Quote',
    
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
      const requiredFields = ['customerName', 'customerPhone', 'address']
      const missingFields = requiredFields.filter(field => !formData[field].trim())
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields')
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

      // Prepare optimized payload for new API
      const leadPayload = {
        // Customer Information (matching new schema)
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        
        // Service Information
        service: formData.service || service,
        selectedService: formData.selectedService || `${service}${subService ? ` - ${subService}` : ''}`,
        selectedSubService: formData.selectedSubService || subService || undefined,
        
        // Address (simplified for new schema)
        address: `${formData.address.trim()}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.pincode ? ` - ${formData.pincode}` : ''}`.trim(),
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        
        // Lead Details
        description: formData.description.trim() || `Service request for ${service}${subService ? ` - ${subService}` : ''}`,
        additionalNotes: formData.additionalNotes.trim() || undefined,
        
        // Pricing
        price: formData.price || (price && price !== 'Quote' ? parseFloat(price) : undefined),
        getQuote: formData.getQuote || price === 'Quote',
        
        // Scheduling
        preferredDate: formData.preferredDate || undefined,
        preferredTime: formData.preferredTime || undefined
      }

      // Submit to optimized API
      const response = await fetch('/api/leads', {
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
        toast.success(result.message || 'Your service request has been submitted successfully!')
        
        // Optional: Track successful submission
        if (typeof gtag !== 'undefined') {
          gtag('event', 'lead_submission', {
            event_category: 'engagement',
            event_label: service,
            value: formData.price || 0
          });
        }
      } else {
        throw new Error(result.error || 'Failed to submit your request')
      }

      const address = `${formData.address.trim()}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.pincode ? ` - ${formData.pincode}` : ''}`.trim();
      const userId = "";

      const res = await userCreateLeadsNotificationFromUserSide({
        title:"New Booking is comming",
        message: `Booking for ${formData.selectedSubService} and address : ${address}`,
      })

      console.log(res);


    } catch (error) {
      console.error('Error submitting lead:', error)
      
      // Better error handling with user-friendly messages
      let errorMessage = 'Failed to submit your request. Please try again.'
      
      if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Connection issue. Please check your internet and try again.'
      } else if (error.message.includes('duplicate') || error.message.includes('similar')) {
        errorMessage = 'A similar request was recently submitted. Our team will contact you shortly.'
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
        service: service,
        selectedService: `${service}${subService ? ` - ${subService}` : ''}`,
        selectedSubService: subService,
        description: '',
        additionalNotes: '',
        price: price !== 'Quote' ? price : undefined,
        getQuote: price === 'Quote',
        preferredDate: '',
        preferredTime: ''
      })
      onClose()
    }
  }

  // Success content (improved)
  if (submitted) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-center text-green-600">Request Submitted!</DialogTitle>
          </DialogHeader>
          
          <div className="text-center space-y-4 py-4">
            <div className="text-6xl text-green-500 mb-4">
              <CheckCircle className="h-16 w-16 mx-auto" />
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 space-y-3">
              <p className="text-green-800">
                Thank you for choosing our services! Your request has been successfully submitted.
              </p>
              
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Service:</strong> {service}{subService ? ` - ${subService}` : ''}</p>
                <p><strong>Contact:</strong> {formData.customerPhone}</p>
                {price && price !== 'Quote' && (
                  <p><strong>Price:</strong> ₹{price}</p>
                )}
              </div>
            </div>
            
            <div className="text-sm text-gray-600 space-y-3">
              <p className="font-medium">What happens next?</p>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="font-medium">We'll Call</p>
                  <p>Within 30 min</p>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-blue-100 rounded-full p-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="font-medium">Schedule</p>
                  <p>Convenient time</p>
                </div>
                
                <div className="flex flex-col items-center space-y-1">
                  <div className="bg-blue-100 rounded-full p-2">
                    <CheckCircle className="h-4 w-4 text-blue-600" />
                  </div>
                  <p className="font-medium">Service</p>
                  <p>Professional</p>
                </div>
              </div>
            </div>
            
            <Button onClick={handleClose} className="w-full">
              Book Another Service
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Book Your Service
          </DialogTitle>
          <DialogDescription>
            Please provide your details so our team can contact you
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Service Summary */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Service Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Selected Service</Label>
                  <p className="text-sm text-muted-foreground mt-1">{service}</p>
                </div>
                
                {subService && (
                  <div>
                    <Label className="text-sm font-medium">Sub Service</Label>
                    <p className="text-sm text-muted-foreground mt-1">{subService}</p>
                  </div>
                )}
                
                {price && (
                  <div>
                    <Label className="text-sm font-medium">Price</Label>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-lg">
                        {price === 'Quote' ? 'Get Quote' : `₹${price}`}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t space-y-2">
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Professional Service
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Verified Technicians
                  </div>
                  <div className="flex items-center text-sm text-green-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    30-Day Warranty
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lead Form (Simplified) */}
          <div className="lg:col-span-2">
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
                  <div className="md:col-span-2">
                    <SearchableStateCityInput
                      selectedState={formData.state}
                      selectedCity={formData.city}
                      onStateChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        state: value
                      }))}
                      onCityChange={(value) => setFormData(prev => ({ 
                        ...prev, 
                        city: value 
                      }))}
                      showLabels={true}
                      stateLabel="State"
                      cityLabel="City"
                      statePlaceholder="Search and select state..."
                      cityPlaceholder="Search and select city..."
                      layout="horizontal"
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
                  disabled={loading}
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
              
              <p className="text-xs text-muted-foreground text-center">
                By submitting, you agree to our terms of service and privacy policy
              </p>
            </form>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 