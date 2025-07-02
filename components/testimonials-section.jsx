"use client";

import { useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";
import Image from "next/image";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const testimonials = [
  {
    name: "Rahul Sharma",
    role: "Homeowner",
    content:
      "HomeXpert connected me with a fantastic plumber who fixed my leaking pipes in no time. The service was prompt and professional.",
    rating: 5,
    image: "/chat-image1.png",
    location: "Mumbai",
  },
  {
    name: "Priya Patel",
    role: "Apartment Resident",
    content:
      "I've used HomeXpert for electrical work and painting. Both times, the professionals were skilled and courteous. Highly recommend!",
    rating: 5,
    image: "/chat-image1.png",
    location: "Delhi",
  },
  {
    name: "Amit Kumar",
    role: "Villa Owner",
    content:
      "The home cleaning service I booked through HomeXpert exceeded my expectations. My house has never looked better!",
    rating: 4,
    image: "/chat-image1.png",
    location: "Bangalore",
  },
  {
    name: "Sneha Reddy",
    role: "Property Manager",
    content:
      "Professional service with transparent pricing. The electrical repairs were completed efficiently and safely.",
    rating: 5,
    image: "/chat-image1.png",
    location: "Hyderabad",
  },
  {
    name: "Vikram Singh",
    role: "Homeowner",
    content:
      "Excellent carpentry work! The team was punctual, skilled, and cleaned up after themselves. Will definitely use again.",
    rating: 5,
    image: "/chat-image1.png",
    location: "Chennai",
  },
];

export function TestimonialsSection() {
  const carouselRef = useRef(null);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      // Find the next button and click it
      const nextBtn = carouselRef.current?.querySelector(
        "[data-carousel-next]"
      );
      if (nextBtn) nextBtn.click();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20 bg-white relative">
      <div className="container px-4 md:px-6 relative">
        <div className="flex flex-col items-center justify-center space-y-4 text-center mb-16">
          <div className="space-y-2">
            {/* <div className="inline-block rounded-lg px-4 py-2 text-sm text-yellow-500 font-bold text-xl">
              Testimonials
            </div> */}
            <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl text-blue-500">
              What Our Customers Say
            </h2>
            <p className="max-w-[900px] text-text-secondary md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Don't just take our word for it. Here's what our satisfied
              customers have to say about our services.
            </p>
          </div>
        </div>

        <div className="max-w-6xl mx-auto relative bg-white px-4" ref={carouselRef}>
          <Carousel
            opts={{
              align: "start",
              loop: true,
              slidesPerView: 1,
              dragFree: false,
            }}
            className="w-full bg-white z-10"
          >
            <CarouselContent>
              {testimonials.map((testimonial, index) => (
                <CarouselItem
                  key={index}
                  className="px-4 md:basis-1/2 lg:basis-1/3 py-4"
                >
                  <Card className="border shadow-lg h-full flex flex-col justify-between hover:scale-105 transition-transform duration-300 ">
                    <CardContent className="p-8 md:p-10 flex flex-col h-full">
                      <div className="flex-1 flex flex-col">
                        <div className="flex items-center mb-4">
                          <Quote className="h-8 w-8 text-primary mr-2" />
                          <span className="text-lg font-semibold text-primary">
                            Verified Customer
                          </span>
                        </div>
                        <div className="flex space-x-1 mb-4">
                          {Array(testimonial.rating)
                            .fill(0)
                            .map((_, i) => (
                              <Star
                                key={i}
                                className="h-5 w-5 fill-yellow-400 text-yellow-400"
                              />
                            ))}
                          {Array(5 - testimonial.rating)
                            .fill(0)
                            .map((_, i) => (
                              <Star key={i} className="h-5 w-5 text-gray-300" />
                            ))}
                        </div>
                        <p className="text-lg text-gray-700 mb-6 italic leading-relaxed">
                          "{testimonial.content}"
                        </p>
                      </div>
                      <div className="flex items-center gap-4 mt-6">
                        <div className="relative">
                          <Image
                            src={testimonial.image}
                            alt={testimonial.name}
                            width={60}
                            height={60}
                            className="rounded-full object-cover ring-1 ring-primary/30 shadow-lg"
                          />
                        </div>
                        <div>
                          <p className="font-semibold text-lg text-gray-900">
                            {testimonial.name}
                          </p>
                          <p className="text-sm text-gray-500">
                            {testimonial.role}
                          </p>
                          <p className="text-xs text-primary font-medium">
                            {testimonial.location}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious data-carousel-prev />
            <CarouselNext data-carousel-next />
          </Carousel>
        </div>
      </div>
    </section>
  );
}
