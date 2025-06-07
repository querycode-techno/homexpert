import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export function ServicesSection() {
  const services = [
    {
      title: "Plumbing Services",
      description: "Professional plumbing solutions for repairs, installations, and maintenance.",
      image: "/plumbing-service-call.png",
    },
    {
      title: "Electrical Work",
      description: "Certified electricians for all your electrical needs, from repairs to installations.",
      image: "/electrical-service.png",
    },
    {
      title: "Home Cleaning",
      description: "Thorough cleaning services to keep your home spotless and hygienic.",
      image: "/home-cleaning-service.png",
    },
    {
      title: "Painting & Decoration",
      description: "Transform your space with professional painting and decoration services.",
      image: "/home-painting-service.png",
    },
    {
      title: "Carpentry",
      description: "Custom woodwork, repairs, and installations by skilled carpenters.",
      image: "/placeholder.svg?key=q8iwh",
    },
    {
      title: "Appliance Repair",
      description: "Quick and reliable repairs for all your home appliances.",
      image: "/appliance-repair.png",
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
              Discover our wide range of professional home services designed to meet all your needs.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 mt-12">
          {services.map((service, index) => (
            <div
              key={index}
              className="group overflow-hidden rounded-lg border bg-card shadow-sm transition-all duration-200 hover:shadow-lg"
            >
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={service.image || "/placeholder.svg"}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold">{service.title}</h3>
                <p className="mt-2 text-text-secondary">{service.description}</p>
                <Button variant="link" className="mt-4 p-0 text-primary" asChild>
                  <Link href="#">Learn more</Link>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
