"use client"

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { useState, useCallback } from 'react'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { 
  User,
  MapPin,
  Clock,
  CheckCircle,
  Phone,
  Calendar,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { userCreateLeadsNotificationFromUserSide } from '@/lib/services/notificationService'
import { SearchableStateCityInput } from '@/components/ui/searchable-state-city-input'
import servicesData from '@/lib/data/services.json'

export default function SubServicePage() {
  const params = useParams()
  const categoryId = Array.isArray(params?.category) ? params.category[0] : params?.category
  const serviceId = Array.isArray(params?.service) ? params.service[0] : params?.service
  const subServiceId = Array.isArray(params?.["sub-service"]) ? params["sub-service"][0] : params?.["sub-service"]

  const category = servicesData.categories.find(cat => cat.id === categoryId)
  if (!category) return notFound()

  const service = category.services.find(s => s.id === serviceId)
  if (!service) return notFound()

  const subService = service.subServices.find(s => s.id === subServiceId)
  if (!subService) return notFound()

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    additionalNotes: '',
    preferredDate: '',
    preferredTime: ''
  })

  const formatPrice = (price) => {
    if (typeof price === 'number') return `₹${price.toLocaleString()}`
    return price
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleStateChange = useCallback((value) => {
    setFormData(prev => ({ 
      ...prev, 
      state: value
    }))
  }, [])
  
  const handleCityChange = useCallback((value) => {
    setFormData(prev => ({ 
      ...prev, 
      city: value 
    }))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const requiredFields = ['customerName', 'customerPhone', 'address']
      const missingFields = requiredFields.filter(field => !formData[field].trim())
      
      if (missingFields.length > 0) {
        toast.error('Please fill in all required fields')
        setLoading(false)
        return
      }

      const phoneRegex = /^[6-9]\d{9}$/
      if (!phoneRegex.test(formData.customerPhone.trim())) {
        toast.error('Please enter a valid 10-digit phone number')
        setLoading(false)
        return
      }

      if (formData.customerEmail.trim()) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.customerEmail.trim())) {
          toast.error('Please enter a valid email address')
          setLoading(false)
          return
        }
      }

      const leadPayload = {
        customerName: formData.customerName.trim(),
        customerPhone: formData.customerPhone.trim(),
        customerEmail: formData.customerEmail.trim() || undefined,
        service: service.name,
        selectedService: `${service.name} - ${subService.name}`,
        selectedSubService: subService.name,
        address: `${formData.address.trim()}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.pincode ? ` - ${formData.pincode}` : ''}`.trim(),
        city: formData.city.trim() || undefined,
        state: formData.state.trim() || undefined,
        description: formData.description.trim() || `Service request for ${service.name} - ${subService.name}`,
        additionalNotes: formData.additionalNotes.trim() || undefined,
        price: typeof subService.price === 'number' ? subService.price : undefined,
        getQuote: subService.price === 'Quote',
        preferredDate: formData.preferredDate || undefined,
        preferredTime: formData.preferredTime || undefined
      }

      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(leadPayload),
      })

      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Server error occurred. Please try again.');
      }

      const result = await response.json()
      
      if (result.success) {
        setSubmitted(true)
        toast.success(result.message || 'Your service request has been submitted successfully!')
        
        if (typeof gtag !== 'undefined') {
          gtag('event', 'lead_submission', {
            event_category: 'engagement',
            event_label: service.name,
            value: subService.price || 0
          });
        }
      } else {
        throw new Error(result.error || 'Failed to submit your request')
      }

      const address = `${formData.address.trim()}${formData.city ? `, ${formData.city}` : ''}${formData.state ? `, ${formData.state}` : ''}${formData.pincode ? ` - ${formData.pincode}` : ''}`.trim();

      const res = await userCreateLeadsNotificationFromUserSide({
        title:"New Booking is comming",
        message: `Booking for ${subService.name} and address : ${address}`,
      })

    } catch (error) {
      console.error('Error submitting lead:', error)
      
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

  if (submitted) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          <section className="bg-gray-50 py-6">
            <div className="container px-4 md:px-6">
              <div className="flex items-center space-x-2 text-sm">
                <Link href="/services" className="text-primary hover:underline">
                  All Services
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link href={`/services/${category.id}`} className="text-primary hover:underline">
                  {category.name}
                </Link>
                <span className="text-muted-foreground">/</span>
                <Link href={`/services/${category.id}/${service.id}`} className="text-primary hover:underline">
                  {service.name}
                </Link>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium">{subService.name}</span>
              </div>
            </div>
          </section>

          <section className="py-12">
            <div className="container px-4 md:px-6">
              <div className="max-w-2xl mx-auto text-center space-y-6">
                <div className="text-6xl text-green-500">
                  <CheckCircle className="h-16 w-16 mx-auto" />
                </div>
                
                <div>
                  <h1 className="text-3xl font-bold text-green-600">Request Submitted!</h1>
                  <p className="text-lg text-muted-foreground mt-2">
                    Thank you for choosing our services!
                  </p>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 space-y-4">
                  <div className="text-green-800 space-y-2">
                    <p><strong>Service:</strong> {service.name} - {subService.name}</p>
                    <p><strong>Contact:</strong> {formData.customerPhone}</p>
                    {subService.price && subService.price !== 'Quote' && (
                      <p><strong>Price:</strong> ₹{subService.price}</p>
                    )}
                  </div>
                </div>
                
                <div className="text-sm text-gray-600 space-y-4">
                  <p className="font-medium">What happens next?</p>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-blue-100 rounded-full p-3">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="font-medium">We'll Call</p>
                      <p>Within 30 min</p>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-blue-100 rounded-full p-3">
                        <Calendar className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="font-medium">Schedule</p>
                      <p>Convenient time</p>
                    </div>
                    
                    <div className="flex flex-col items-center space-y-2">
                      <div className="bg-blue-100 rounded-full p-3">
                        <CheckCircle className="h-5 w-5 text-blue-600" />
                      </div>
                      <p className="font-medium">Service</p>
                      <p>Professional</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => setSubmitted(false)}
                  className="w-full max-w-xs"
                >
                  Book Another Service
                </Button>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gray-50 py-6">
          <div className="container px-4 md:px-6">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/services" className="text-primary hover:underline">
                All Services
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href={`/services/${category.id}`} className="text-primary hover:underline">
                {category.name}
              </Link>
              <span className="text-muted-foreground">/</span>
              <Link href={`/services/${category.id}/${service.id}`} className="text-primary hover:underline">
                {service.name}
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{subService.name}</span>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Service Summary */}
                <div className="lg:col-span-1">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Service Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Label className="text-sm font-medium">Selected Service</Label>
                        <p className="text-sm text-muted-foreground mt-1">{service.name}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Sub Service</Label>
                        <p className="text-sm text-muted-foreground mt-1">{subService.name}</p>
                      </div>
                      
                      <div>
                        <Label className="text-sm font-medium">Price Starting From</Label>
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-lg">
                            {subService.price === 'Quote' ? 'Get Quote' : `₹${subService.price}`}
                          </Badge>
                        </div>
                      </div>
                      
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

                {/* Lead Form */}
                 <div className="lg:col-span-2">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Book Your Service
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Please provide your details so our team can contact you
                      </p>
                    </CardHeader>
                    <CardContent>
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

                        {/* Address Information */}
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
                                onStateChange={handleStateChange}
                                onCityChange={handleCityChange}
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
                        <div className="pt-4">
                          <Button 
                            type="submit" 
                            className="w-full" 
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
                          
                          <p className="text-xs text-muted-foreground text-center mt-3">
                            By submitting, you agree to our terms of service and privacy policy
                          </p>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </div> 

               
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

