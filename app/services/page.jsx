"use client"

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { 
  Search, 
  ArrowLeft, 
  ArrowRight,
  Phone,
  MapPin,
  Star
} from 'lucide-react'
import servicesData from '@/lib/data/services.json'
import LeadFormPopup from '@/components/lead-form-popup'
import Link from 'next/link'

function ServicesPageContent() {
  const searchParams = useSearchParams()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedService, setSelectedService] = useState(null)
  const [leadFormOpen, setLeadFormOpen] = useState(false)
  const [selectedBookingService, setSelectedBookingService] = useState({
    service: '',
    subService: '',
    price: ''
  })

  // Handle URL parameters for category selection
  useEffect(() => {
    const categoryParam = searchParams.get('category')
    const categoriesParam = searchParams.get('categories')
    
    if (categoryParam) {
      // Single category
      const category = servicesData.categories.find(cat => cat.id === categoryParam)
      if (category) {
        setSelectedCategory(category)
      }
    } else if (categoriesParam) {
      // Multiple categories - create a virtual category that combines them
      const categoryIds = categoriesParam.split(',')
      const categories = servicesData.categories.filter(cat => categoryIds.includes(cat.id))
      
      if (categories.length > 0) {
        // Create a combined category
        const combinedCategory = {
          id: 'combined',
          name: categories.length > 1 ? categories.map(cat => cat.name).join(' & ') : categories[0].name,
          icon: categories[0].icon,
          services: categories.flatMap(cat => cat.services)
        }
        setSelectedCategory(combinedCategory)
      }
    }
  }, [searchParams])

  // Filter categories based on search
  const filteredCategories = servicesData.categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.services.some(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.subServices.some(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  )

  const formatPrice = (price) => {
    if (typeof price === 'number') {
      return `₹${price.toLocaleString()}`
    }
    return price
  }

  const handleBookService = (service, subService, price) => {
    setSelectedBookingService({
      service: service,
      subService: subService,
      price: price
    })
    setLeadFormOpen(true)
  }

  // Category view (main page)
  if (!selectedCategory) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {/* Hero Section */}
          <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
            <div className="container px-4 md:px-6">
              <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight">All Services</h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  Explore our comprehensive range of professional home services
                </p>
                
                {/* Search Bar */}
                <div className="max-w-md mx-auto mt-8">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search services..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Categories Grid */}
          <section className="py-16">
            <div className="container px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCategories.map((category) => (
                  <Card 
                    key={category.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105"
                    onClick={() => setSelectedCategory(category)}
                  >
                    <CardHeader className="text-center">
                      <div className="text-4xl mb-4">{category.icon}</div>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {category.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Badge variant="secondary" className="w-fit">
                          {category.services.length} services
                        </Badge>
                        
                        {/* Preview of first few services */}
                        <div className="space-y-2">
                          {category.services.slice(0, 3).map((service, index) => (
                            <div key={index} className="text-sm text-muted-foreground">
                              • {service.name}
                            </div>
                          ))}
                          {category.services.length > 3 && (
                            <div className="text-sm text-muted-foreground font-medium">
                              + {category.services.length - 3} more services
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center text-primary text-sm font-medium pt-2">
                          View Services
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
        
        {/* Lead Form Popup */}
        <LeadFormPopup
          isOpen={leadFormOpen}
          onClose={() => setLeadFormOpen(false)}
          service={selectedBookingService.service}
          subService={selectedBookingService.subService}
          price={selectedBookingService.price}
        />
      </div>
    )
  }

  // Services view (category selected)
  if (selectedCategory && !selectedService) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">
          {/* Breadcrumb */}
          <section className="bg-gray-50 py-6">
            <div className="container px-4 md:px-6">
              <div className="flex items-center space-x-2 text-sm">
                <button 
                  onClick={() => setSelectedCategory(null)}
                  className="flex items-center text-primary hover:underline"
                >
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  All Services
                </button>
                <span className="text-muted-foreground">/</span>
                <span className="font-medium">{selectedCategory.name}</span>
              </div>
            </div>
          </section>

          {/* Category Header */}
          <section className="py-12">
            <div className="container px-4 md:px-6">
              <div className="text-center space-y-4">
                <div className="text-5xl">{selectedCategory.icon}</div>
                <h1 className="text-4xl font-bold">{selectedCategory.name}</h1>
                <p className="text-xl text-muted-foreground">
                  Choose from our range of {selectedCategory.name.toLowerCase()} services
                </p>
              </div>
            </div>
          </section>

          {/* Services Grid */}
          <section className="pb-16">
            <div className="container px-4 md:px-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCategory.services.map((service) => (
                  <Card 
                    key={service.id}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200"
                    onClick={() => setSelectedService(service)}
                  >
                    <CardHeader>
                      <CardTitle className="group-hover:text-primary transition-colors">
                        {service.name}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        {service.description}
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <Badge variant="outline">
                          {service.subServices.length} sub-services
                        </Badge>
                        
                        {/* Price range */}
                        {service.subServices.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Starting from: </span>
                            <span className="text-primary font-bold">
                              {formatPrice(Math.min(...service.subServices
                                .filter(sub => typeof sub.price === 'number')
                                .map(sub => sub.price)))}
                            </span>
                          </div>
                        )}
                        
                        <div className="flex items-center text-primary text-sm font-medium">
                          View Details
                          <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        </main>
        <Footer />
        
        {/* Lead Form Popup */}
        <LeadFormPopup
          isOpen={leadFormOpen}
          onClose={() => setLeadFormOpen(false)}
          service={selectedBookingService.service}
          subService={selectedBookingService.subService}
          price={selectedBookingService.price}
        />
      </div>
    )
  }

  // Sub-services view (service selected)
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Breadcrumb */}
        <section className="bg-gray-50 py-6">
          <div className="container px-4 md:px-6">
            <div className="flex items-center space-x-2 text-sm">
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-primary hover:underline"
              >
                All Services
              </button>
              <span className="text-muted-foreground">/</span>
              <button 
                onClick={() => setSelectedService(null)}
                className="text-primary hover:underline"
              >
                {selectedCategory.name}
              </button>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{selectedService.name}</span>
            </div>
          </div>
        </section>

        {/* Service Header */}
        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <h1 className="text-4xl font-bold">{selectedService.name}</h1>
              <p className="text-xl text-muted-foreground">
                {selectedService.description}
              </p>
            </div>
          </div>
        </section>

        {/* Sub-services Grid */}
        <section className="pb-16">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-8 text-center">Choose Your Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedService.subServices.map((subService, index) => (
                  <Card 
                    key={index}
                    className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary"
                  >
                    <CardContent className="p-6">
                      <div className="space-y-3">
                        <div className="flex justify-between items-start">
                          <h3 className="font-medium text-sm leading-tight flex-1">
                            {subService.name}
                          </h3>
                          <div className="flex items-center">
                          <span className="text-xs text-muted-foreground">
                              Starting from:
                            </span>
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {formatPrice(subService.price)}
                            </Badge>
                            
                          </div>
                        </div>
                        
                        {subService.note && (
                          <p className="text-xs text-muted-foreground">
                            {subService.note}
                          </p>
                        )}
                        
                        <Button 
                          className="w-full mt-3 group-hover:bg-primary group-hover:text-white"
                          variant="outline"
                          onClick={() => handleBookService(
                            selectedService.name, 
                            subService.name, 
                            typeof subService.price === 'number' ? subService.price.toString() : subService.price
                          )}
                        >
                          Book Now
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      
      {/* Lead Form Popup */}
      <LeadFormPopup
        isOpen={leadFormOpen}
        onClose={() => setLeadFormOpen(false)}
        service={selectedBookingService.service}
        subService={selectedBookingService.subService}
        price={selectedBookingService.price}
      />
    </div>
  )
}

// Loading component for Suspense fallback
function ServicesPageLoading() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4">
              <div className="h-8 bg-gray-200 rounded-md w-48 mx-auto animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-md w-96 mx-auto animate-pulse"></div>
            </div>
          </div>
        </section>
        <section className="py-16">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default function ServicesPage() {
  return (
    <Suspense fallback={<ServicesPageLoading />}>
      <ServicesPageContent />
    </Suspense>
  )
} 