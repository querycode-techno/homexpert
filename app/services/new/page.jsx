"use client"

import { useState } from 'react'
import Link from 'next/link'
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Search, 
  ArrowRight,
} from 'lucide-react'
import servicesData from '@/lib/data/services.json'

export default function ServicesIndexPage() {
  const [searchTerm, setSearchTerm] = useState('')

  const filteredCategories = servicesData.categories.filter(category =>
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.services.some(service => 
      service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      service.subServices.some(sub =>
        sub.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    )
  )

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-r from-primary/10 to-secondary/10 py-12">
          <div className="container px-4 md:px-6">
            <div className="text-center space-y-4">
              <h1 className="text-4xl font-bold tracking-tight">All Services</h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Explore our comprehensive range of professional home services
              </p>

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

        <section className="py-16">
          <div className="container px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCategories.map((category) => (
                <Link key={category.id} href={`/services/new/${category.id}`} className="block">
                  <Card className="group cursor-pointer hover:shadow-lg transition-all duration-200 hover:scale-105">
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



