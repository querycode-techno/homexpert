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
    <section className="hero-pattern py-10 md:py-12 lg:py-10">
      <div className="container px-4 md:px-6">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center min-h-[calc(100vh-8rem)]">
          <div className="flex flex-col justify-center space-y-6">
            <div className="space-y-4">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl text-blue-800">
                Your Home Services <span className="text-green-500">Expert</span>
              </h1>
              <p className="max-w-[600px] text-text-secondary text-lg md:text-xl leading-relaxed">
                Connect with trusted professionals for all your home service needs. Quality service, guaranteed
                satisfaction.
              </p>
            </div>

           
            
            <div className="flex items-center gap-6 pt-2">

              {/* <div className="flex -space-x-2">
                {customerImages.map((customer, i) => (
                  <div key={i} className="relative">
                    <Image
                      src={customer.src}
                      alt={customer.alt}
                      width={44}
                      height={44}
                      className="inline-block rounded-full object-cover ring-2 ring-background shadow-lg hover:scale-110 transition-transform duration-200"
                    />
                  </div>
                ))}
                <div className="inline-flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-r from-primary to-secondary text-white text-sm font-bold ring-2 ring-background shadow-lg">
                  +
                </div>
              </div> */}
              <div className="flex flex-col">
                <p className="text-lg font-medium text-text-secondary">
                  Trusted by <span className="font-semibold text-text">10,000+</span> customers
                </p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className="w-6 h-6 text-yellow-400 fill-current"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-md font-medium text-text-secondary ml-1">4.9/5</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 min-[400px]:flex-row">
              <Button size="lg" asChild className=" px-6 py-3 text-base font-semibold text-white bg-blue-500 hover:bg-blue-600">
                <Link href="/contact">Contact Us</Link>
              </Button>
              <Button size="lg" variant="outline" className="text-black hover:text-white hover:bg-secondary/90 px-6 py-3 text-base font-semibold" asChild>
                <Link href="#services">Explore Services</Link>
              </Button>
            </div>


          </div>
          <div className="mx-auto lg:mx-0 relative flex items-center justify-center">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-2xl blur-3xl opacity-50" />
            <Image
              src="/home-service-professionals.png"
              width={500}
              height={500}
              alt="HomeXpert Services"
              className="relative rounded-2xl object-cover shadow-2xl max-w-full h-auto"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  )
}
