import { VendorLoginForm } from "@/components/vendor-login-form"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import Image from "next/image"

export default function VendorLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Welcome Back, <span className="text-primary">Vendor</span>
                </h1>
                <p className="max-w-[600px] text-text-secondary md:text-xl">
                  Log in to your vendor account to manage your services, bookings, and profile.
                </p>
              </div>
              <VendorLoginForm />
              <div className="text-center text-sm text-text-secondary">
                Don&apos;t have an account?{" "}
                <Link href="/register/vendor" className="text-primary font-medium hover:underline">
                  Register as a vendor
                </Link>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative h-[500px] w-[500px]">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-3xl opacity-50" />
                <Image
                  src="/service-provider-tools.png"
                  width={500}
                  height={500}
                  alt="Vendor Login"
                  className="relative rounded-lg object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
