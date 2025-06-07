import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { ServicesSection } from "@/components/services-section"
import { CtaSection } from "@/components/cta-section"

export const metadata = {
  title: "Services - HomeXpert",
  description: "Discover our wide range of professional home services",
}

export default function ServicesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="py-20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <h1 className="text-4xl font-bold tracking-tighter sm:text-6xl">
                Our <span className="text-primary">Services</span>
              </h1>
              <p className="max-w-[600px] text-text-secondary md:text-xl">
                Professional home services designed to meet all your needs with quality and reliability.
              </p>
            </div>
          </div>
        </div>
        <ServicesSection />
        <CtaSection />
      </main>
      <Footer />
    </div>
  )
} 