import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { serviceUtils } from "@/lib/utils"

export function ServicesSection() {
  // Get primary services from services.json
  const primaryServices = [
    {
      title: "Home & Kitchen Appliances",
      description: "AC, washing machine, refrigerator, geyser repair & installation services.",
      image: "/appliance-repair.png",
      icon: "🏠",
      categories: ["home-appliances", "kitchen-appliances"]
    },
    {
      title: "Cleaning & Maintenance",
      description: "Deep cleaning, pest control, car wash, and maintenance services.",
      image: "/home-cleaning-service.png",
      icon: "🧽",
      categories: ["cleaning-pest"]
    },
    {
      title: "Handyman Services",
      description: "Electrical, plumbing, carpentry, and general repair services.",
      image: "/electrical-service.png",
      icon: "🔧",
      categories: ["handyman"]
    },
    {
      title: "Packers and Movers",
      description: "Professional moving, packing, and relocation services.",
      image: "/service-provider-tools.png",
      icon: "📦",
      categories: [] // Not in current services.json, can be added later
    },
    {
      title: "Beauty & Salon",
      description: "Professional beauty services for men and women at your doorstep.",
      image: "/home-service-professionals.png",
      icon: "💅",
      categories: ["salon-women", "salon-men"]
    },
  ]

  return (
    <section className="py-20" id="services">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-primary px-3 py-1 text-sm text-white">Our Services</div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Professional Home Services</h2>
            <p className="max-w-[900px] text-text-secondary md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Discover our primary home services designed to meet your everyday needs.
            </p>
          </div>
        </div>
        
        {/* Primary Services Grid */}
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 mt-12">
          {primaryServices.map((service, index) => {
            // Generate appropriate link based on categories
            let href = "/services"
            if (service.categories.length === 1) {
              // Single category
              href = `/services?category=${service.categories[0]}`
            } else if (service.categories.length > 1) {
              // Multiple categories
              href = `/services?categories=${service.categories.join(',')}`
            }
            
            return (
              <Link 
                key={index}
                href={href}
                className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer"
              >
              <div className="relative h-40 overflow-hidden">
                <Image
                  src={service.image || "/placeholder.svg"}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute top-4 left-4 text-2xl bg-white/90 backdrop-blur-sm rounded-full w-12 h-12 flex items-center justify-center">
                  {service.icon}
                </div>
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
                <div className="flex items-center mt-3 text-primary text-sm font-medium">
                  View Services
                  <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
            )
          })}
        </div>

        {/* Explore More Services Section */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-2xl p-8 border">
            <h3 className="text-2xl font-bold mb-4">Need Something Else?</h3>
            <p className="text-text-secondary mb-6 max-w-2xl mx-auto">
              We offer {serviceUtils.getAllServices().length}+ specialized services including {serviceUtils.getCategories().map(cat => cat.name.toLowerCase()).slice(0, 3).join(', ')}, 
              and much more.
            </p>
            <Button asChild size="lg" className="min-w-[200px]">
              <Link href="/services" className="flex items-center gap-2">
                Explore All Services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
