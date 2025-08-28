"use client"

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import servicesData from '@/lib/data/services.json'

export default function ServicePage() {
  const params = useParams()
  const categoryId = Array.isArray(params?.category) ? params.category[0] : params?.category
  const serviceId = Array.isArray(params?.service) ? params.service[0] : params?.service

  const category = servicesData.categories.find(cat => cat.id === categoryId)
  if (!category) return notFound()

  const service = category.services.find(s => s.id === serviceId)
  if (!service) return notFound()

  const formatPrice = (price) => {
    if (typeof price === 'number') return `₹${price.toLocaleString()}`
    return price
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
              <span className="font-medium">{service.name}</span>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="max-w-4xl mx-auto text-center space-y-4">
              <h1 className="text-4xl font-bold">{service.name}</h1>
              <p className="text-xl text-muted-foreground">
                {service.description}
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container px-4 md:px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-2xl font-bold mb-8 text-center">Choose Your Service</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {service.subServices.map((subService, index) => (
                  <Link key={index} href={`/services/${category.id}/${service.id}/${subService.id}`} className="block">
                    <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary">
                      <CardContent className="p-6">
                        <div className="space-y-3">
                          <div className="flex justify-between items-start">
                            <h3 className="font-medium text-sm leading-tight flex-1">
                              {subService.name}
                            </h3>
                            <div className="flex items-center">
                              <span className="text-xs text-muted-foreground">Starting from:</span>
                              <Badge variant="secondary" className="ml-2 text-xs">
                                {formatPrice(subService.price)}
                              </Badge>
                            </div>
                          </div>
                          {/* {subService.note && (
                            <p className="text-xs text-muted-foreground">{subService.note}</p>
                          )} */}
                          <Button className="w-full mt-3 group-hover:bg-primary group-hover:text-white" variant="outline">
                            {categoryId === "contractor-services" ? "Request Quote" : "Book Now"}
                            <ArrowRight className="h-4 w-4 ml-2" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}



