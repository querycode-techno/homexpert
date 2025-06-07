import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  const customerImages = [
    { src: "/customers/customer-1.svg", alt: "Rahul Sharma" },
    { src: "/customers/customer-2.svg", alt: "Priya Patel" },
    { src: "/customers/customer-3.svg", alt: "Amit Kumar" },
    { src: "/customers/customer-4.svg", alt: "Sneha Reddy" }
  ]

  return (
    <section className="hero-pattern py-20 md:py-32">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-2 lg:gap-12 items-center">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Your Home Services <span className="gradient-text">Expert</span>
              </h1>
              <p className="max-w-[600px] text-text-secondary md:text-xl">
                Connect with trusted professionals for all your home service needs. Quality service, guaranteed
                satisfaction.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Button size="lg" asChild className=" text-white hover:bg-primary/90 px-4 py-2">
                <Link href="/register/vendor">Become a Vendor</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-black hover:text-white hover:bg-secondary/90 px-4 py-2" asChild>
                <Link href="#services">Explore Services</Link>
              </Button>
            </div>
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {customerImages.map((customer, i) => (
                  <div key={i} className="relative">
                    <Image
                      src={customer.src}
                      alt={customer.alt}
                      width={40}
                      height={40}
                      className="inline-block rounded-full object-cover ring-2 ring-background shadow-lg hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                ))}
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold ring-2 ring-background shadow-lg">
                  +
                </div>
              </div>
              <div className="flex flex-col">
                <p className="text-sm text-text-secondary">
                  Trusted by <span className="font-medium text-text">1,000+</span> customers
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-4 h-4 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs text-text-secondary ml-1">4.9/5</span>
                </div>
              </div>
            </div>
          </div>
          <div className="mx-auto lg:mx-0 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-3xl opacity-50" />
            <Image
              src="/home-service-professionals.png"
              width={550}
              height={550}
              alt="HomeXpert Services"
              className="mx-auto aspect-square rounded-lg object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
