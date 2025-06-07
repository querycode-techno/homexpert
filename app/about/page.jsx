import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { FeaturesSection } from "@/components/features-section"
import { TestimonialsSection } from "@/components/testimonials-section"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export const metadata = {
  title: "About Us - HomeXpert",
  description: "Learn more about HomeXpert and our mission to connect you with trusted home service professionals",
}

export default function AboutPage() {
  const stats = [
    { number: "1,000+", label: "Happy Customers" },
    { number: "500+", label: "Verified Vendors" },
    { number: "50+", label: "Service Categories" },
    { number: "99%", label: "Satisfaction Rate" },
  ]

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
              <div className="flex flex-col justify-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">
                  About <span className="text-primary">HomeXpert</span>
                </h1>
                <p className="max-w-[600px] text-text-secondary md:text-xl">
                  We're dedicated to connecting homeowners with trusted, professional service providers. 
                  Our platform ensures quality, reliability, and peace of mind for all your home service needs.
                </p>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button size="lg" asChild>
                    <Link href="/services">View Services</Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/contact">Contact Us</Link>
                  </Button>
                </div>
              </div>
              <div className="mx-auto lg:mx-0 relative">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-3xl opacity-50" />
                <Image
                  src="/home-service-professionals.png"
                  width={550}
                  height={550}
                  alt="About HomeXpert"
                  className="mx-auto aspect-square rounded-lg object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-2 items-center">
              <div className="space-y-6">
                <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl">Our Mission</h2>
                <p className="text-text-secondary md:text-lg">
                  At HomeXpert, we believe that finding reliable home service professionals shouldn't be complicated. 
                  Our mission is to create a trusted marketplace where homeowners can easily connect with skilled 
                  professionals who deliver exceptional service.
                </p>
                <p className="text-text-secondary md:text-lg">
                  We carefully vet every vendor on our platform, ensuring they meet our high standards for quality, 
                  professionalism, and customer service. This gives you peace of mind knowing that your home is in 
                  capable hands.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div key={index} className="text-center p-6 rounded-lg border bg-card">
                    <div className="text-3xl font-bold text-primary">{stat.number}</div>
                    <div className="text-text-secondary mt-2">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <FeaturesSection />

        {/* Testimonials Section */}
        <TestimonialsSection />
      </main>
      <Footer />
    </div>
  )
} 