import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center py-12">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">
                  Admin <span className="text-primary">Dashboard</span> Login
                </h1>
                <p className="max-w-[600px] text-text-secondary md:text-xl">
                  Log in to access the admin dashboard and manage the HomeXpert platform.
                </p>
              </div>
              <div className="space-y-4">
                <Button size="lg" asChild className="w-full md:w-auto">
                  <Link href="/admin/login">Go to Admin Login</Link>
                </Button>
                <p className="text-sm text-muted-foreground">
                  Use the dedicated admin login page for better security and features.
                </p>
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center">
              <div className="relative h-[500px] w-[500px]">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-lg blur-3xl opacity-50" />
                <Image
                  src="/placeholder.svg?key=90mkj"
                  width={500}
                  height={500}
                  alt="Admin Login"
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
