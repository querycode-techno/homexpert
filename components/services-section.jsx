"use client"

import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight, Home, ChefHat, X } from "lucide-react"
import { serviceUtils } from "@/lib/utils"
import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function ServicesSection() {
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [selectedService, setSelectedService] = useState(null)

  // Get primary services from services.json
  const primaryServices = [
    {
      title: "Home & Kitchen Appliances",
      id: "home-kitchen-appliances",
      description: "AC, washing machine, refrigerator, geyser repair & installation services.",
      image: "/image1.png",
      icon: "🏠"
    },
    {
      title: "Cleaning & Maintenance",
      id: "cleaning-pest",
      description: "Deep cleaning, pest control, car wash, and maintenance services.",
      image: "/image5.png",
      icon: "🧽"
    },
    {
      title: "Handyman Services",
      id: "handyman",
      description: "Electrical, plumbing, carpentry, and general repair services.",
      image: "/image4.png",
      icon: "🔧"
    },
    {
      title: "Packers and Movers",
      id: "packers-movers",
      description: "Professional moving, packing, and relocation services.",
      image: "/image2.png",
      icon: "📦"
    },
    {
      title: "Beauty & Salon",
      id: "salon",
      description: "Professional beauty services for men and women at your doorstep.",
      image: "/image3.png",
      icon: "💅"
    },
  ]

  const handleServiceClick = (service) => {
    if (service.id === "home-kitchen-appliances") {
      setSelectedService(service)
      setIsPopupOpen(true)
    } else {
      // Handle other services with existing logic
      window.location.href = `/services/${service.id}`
    }
  }

  const ServicePopup = () => (
    <Dialog open={isPopupOpen} onOpenChange={setIsPopupOpen}>
      <DialogContent className="max-w-2xl p-0 overflow-hidden">
        <DialogHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-6">
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <span className="text-3xl">🏠</span>
            Home & Kitchen Appliances
          </DialogTitle>
          <p className="text-blue-100 mt-2">
            Choose your appliance category to explore our professional services
          </p>
        </DialogHeader>
        
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Home Appliances Card */}
            <Link 
              href="/services/home-appliances"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-blue-500 transition-all duration-300 hover:shadow-xl hover:scale-105"
              onClick={() => setIsPopupOpen(false)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center group-hover:bg-blue-200 transition-colors duration-300">
                  <Home className="w-8 h-8 text-blue-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-blue-700 transition-colors duration-300">
                  Home Appliances
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  AC, Washing Machine, TV, Laptop, CCTV & more
                </p>
                <div className="flex items-center justify-center text-blue-600 font-medium group-hover:text-blue-700 transition-colors duration-300">
                  Explore Services
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </Link>

            {/* Kitchen Appliances Card */}
            <Link 
              href="/services/kitchen-appliances"
              className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-orange-500 transition-all duration-300 hover:shadow-xl hover:scale-105"
              onClick={() => setIsPopupOpen(false)}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative p-6 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-orange-100 rounded-full flex items-center justify-center group-hover:bg-orange-200 transition-colors duration-300">
                  <ChefHat className="w-8 h-8 text-orange-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2 group-hover:text-orange-700 transition-colors duration-300">
                  Kitchen Appliances
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Refrigerator, Geyser, Microwave, Chimney & more
                </p>
                <div className="flex items-center justify-center text-orange-600 font-medium group-hover:text-orange-700 transition-colors duration-300">
                  Explore Services
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-300" />
                </div>
              </div>
            </Link>
          </div>

        </div>
      </DialogContent>
    </Dialog>
  )

  return (
    <section className="py-20" id="services">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            {/* <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-white">Our Services</div> */}
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-blue-500">Our Professional Home Services</h2>
            <p className="max-w-[900px] text-text-secondary md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Discover our primary home services designed to meet your everyday needs.
            </p>
          </div>
        </div>
        
        {/* Primary Services Grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mt-12">
          {primaryServices.map((service, index) => (
            <div 
              key={index}
              onClick={() => handleServiceClick(service)}
              className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer"
            >
              <div className="relative h-80 sm:h-56 lg:h-48 overflow-hidden">
                <Image
                  src={service.image || "/placeholder.svg"}
                  alt={service.title}
                  fill
                  className="object-cover object-center scale-110 transition-transform duration-300 group-hover:scale-125"
                />
                
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold group-hover:text-primary transition-colors">
                  {service.title}
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  {service.description.length > 60 
                    ? `${service.description.substring(0, 60)}...` 
                    : service.description}
                </p>
                <div className="flex items-center mt-3 text-sm font-medium text-blue-500 hover:text-blue-600">
                  View Services
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Explore More Services Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 border">
            <h3 className="text-2xl font-bold mb-4 text-green-500">Need Another Home Service?</h3>
            <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
            HomesXpert offers {serviceUtils.getAllServices().length}+ reliable solutions - from furniture assembly and professional painting to pest control and RO purifier servicing - all under one roof.
            </p>
            <Button asChild size="lg" className="min-w-[200px] bg-blue-500 text-white hover:bg-blue-600">
              <Link href="/services" className="flex items-center gap-2">
              Keep Exploring All Services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Service Selection Popup */}
      <ServicePopup />
    </section>
  )
}
