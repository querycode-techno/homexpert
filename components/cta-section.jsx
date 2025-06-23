import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-20" id="contact">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl">Ready to Get Started?</h2>
            <p className="max-w-[900px] text-text-secondary md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Join our platform today and connect with trusted home service professionals or become a vendor to grow
              your business.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button size="lg" asChild>
              <Link href="/vendor/onboard">Become a Vendor</Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/login/vendor">Vendor Login</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
