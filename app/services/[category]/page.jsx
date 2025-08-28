"use client"

import Link from 'next/link'
import { notFound, useParams } from 'next/navigation'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import servicesData from '@/lib/data/services.json'

export default function CategoryPage() {
  const params = useParams()
  const categoryId = Array.isArray(params?.category) ? params.category[0] : params?.category

  const category = servicesData.categories.find(cat => cat.id === categoryId)
  if (!category) return notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gray-50 py-6">
          <div className="container px-4 md:px-6">
            <div className="flex items-center space-x-2 text-sm">
              <Link href="/services" className="flex items-center text-primary hover:underline">
                <ArrowLeft className="h-4 w-4 mr-1" />
                All Services
              </Link>
              <span className="text-muted-foreground">/</span>
              <span className="font-medium">{category.name}</span>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4">
              <div className="text-5xl">{category.icon}</div>
              <h1 className="text-4xl font-bold">{category.name}</h1>
              <p className="text-xl text-muted-foreground">
                Choose from our range of {category.name.toLowerCase()} services
              </p>
            </div>
          </div>
        </section>

        <section className="pb-16">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {category.services.map((service) => (
                <Link key={service.id} href={`/services/${category.id}/${service.id}`} className="block">
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200">
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
                        {service.subServices.length > 0 && (
                          <div className="text-sm">
                            <span className="font-medium">Starting from: </span>
                            <span className="text-primary font-bold">
                              {(() => {
                                const nums = service.subServices.filter(s => typeof s.price === 'number').map(s => s.price)
                                return nums.length ? `₹${Math.min(...nums).toLocaleString()}` : 'Quote'
                              })()}
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
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}



