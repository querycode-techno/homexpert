"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Star, ChevronLeft, ChevronRight, Quote } from "lucide-react"
import Image from "next/image"

export function TestimonialsSection() {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  const testimonials = [
    {
      name: "Rahul Sharma",
      role: "Homeowner",
      content:
        "HomeXpert connected me with a fantastic plumber who fixed my leaking pipes in no time. The service was prompt and professional.",
      rating: 5,
      image: "/customers/customer-1.svg",
      location: "Mumbai"
    },
    {
      name: "Priya Patel",
      role: "Apartment Resident",
      content:
        "I've used HomeXpert for electrical work and painting. Both times, the professionals were skilled and courteous. Highly recommend!",
      rating: 5,
      image: "/customers/customer-2.svg",
      location: "Delhi"
    },
    {
      name: "Amit Kumar",
      role: "Villa Owner",
      content:
        "The home cleaning service I booked through HomeXpert exceeded my expectations. My house has never looked better!",
      rating: 4,
      image: "/customers/customer-3.svg",
      location: "Bangalore"
    },
    {
      name: "Sneha Reddy",
      role: "Property Manager",
      content:
        "Professional service with transparent pricing. The electrical repairs were completed efficiently and safely.",
      rating: 5,
      image: "/customers/customer-4.svg",
      location: "Hyderabad"
    },
    {
      name: "Vikram Singh",
      role: "Homeowner",
      content:
        "Excellent carpentry work! The team was punctual, skilled, and cleaned up after themselves. Will definitely use again.",
      rating: 5,
      image: "/customers/customer-5.svg",
      location: "Chennai"
    }
  ]

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying, testimonials.length])

  const goToSlide = (index) => {
    setCurrentSlide(index)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000) // Resume auto-play after 10 seconds
  }

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
    setTimeout(() => setIsAutoPlaying(true), 10000)
  }

  return (
    <section className="py-20 bg-gradient-to-br from-background via-muted/30 to-background relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />
      
      <div className="container px-4 md:px-6 relative">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-gradient-to-r from-primary to-secondary px-4 py-2 text-sm text-white font-medium">
              Testimonials
            </div>
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl gradient-text">
              What Our Customers Say
            </h2>
            <p className="max-w-[900px] text-text-secondary md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Don't just take our word for it. Here's what our satisfied customers have to say about our services.
            </p>
          </div>
        </div>

        {/* Desktop Slider */}
        <div className="hidden md:block">
          <div className="max-w-6xl mx-auto relative">
            <div className="overflow-hidden rounded-2xl">
              <div 
                className="flex transition-transform duration-500 ease-in-out"
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-sm">
                      <CardContent className="p-8 md:p-12">
                        <div className="grid md:grid-cols-2 gap-8 items-center">
                          <div className="order-2 md:order-1">
                            <Quote className="h-8 w-8 text-primary mb-4" />
                            <div className="flex space-x-1 mb-4">
                              {Array(testimonial.rating)
                                .fill(0)
                                .map((_, i) => (
                                  <Star key={i} className="h-5 w-5 fill-secondary text-secondary" />
                                ))}
                              {Array(5 - testimonial.rating)
                                .fill(0)
                                .map((_, i) => (
                                  <Star key={i} className="h-5 w-5 text-muted-foreground" />
                                ))}
                            </div>
                            <p className="text-lg text-text-secondary mb-6 italic leading-relaxed">
                              "{testimonial.content}"
                            </p>
                            <div className="flex items-center gap-4">
                              <div className="relative">
                                <Image
                                  src={testimonial.image}
                                  alt={testimonial.name}
                                  width={60}
                                  height={60}
                                  className="rounded-full object-cover ring-4 ring-primary/20"
                                />
                              </div>
                              <div>
                                <p className="font-semibold text-lg">{testimonial.name}</p>
                                <p className="text-sm text-text-secondary">{testimonial.role}</p>
                                <p className="text-xs text-primary font-medium">{testimonial.location}</p>
                              </div>
                            </div>
                          </div>
                          <div className="order-1 md:order-2 flex justify-center">
                            <div className="relative">
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-2xl scale-110" />
                              <Image
                                src={testimonial.image}
                                alt={testimonial.name}
                                width={280}
                                height={280}
                                className="relative rounded-full object-cover shadow-2xl"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Controls */}
            <div className="flex items-center justify-center mt-8 gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={goToPrevious}
                className="rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <div className="flex gap-2">
                {testimonials.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => goToSlide(index)}
                    className={`w-3 h-3 rounded-full transition-all ${
                      index === currentSlide ? 'bg-primary scale-125' : 'bg-muted-foreground/30'
                    }`}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={goToNext}
                className="rounded-full shadow-lg hover:shadow-xl transition-all"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Mobile Grid */}
        <div className="md:hidden">
          <div className="grid gap-6">
            {testimonials.slice(0, 3).map((testimonial, index) => (
              <Card key={index} className="border-none shadow-lg bg-white/80 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    <Image
                      src={testimonial.image}
                      alt={testimonial.name}
                      width={50}
                      height={50}
                      className="rounded-full object-cover ring-2 ring-primary/20"
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-text-secondary">{testimonial.role}</p>
                      <p className="text-xs text-primary font-medium">{testimonial.location}</p>
                    </div>
                  </div>
                  <div className="flex space-x-1 mb-3">
                    {Array(testimonial.rating)
                      .fill(0)
                      .map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-secondary text-secondary" />
                      ))}
                    {Array(5 - testimonial.rating)
                      .fill(0)
                      .map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-muted-foreground" />
                      ))}
                  </div>
                  <p className="text-text-secondary italic">"{testimonial.content}"</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
