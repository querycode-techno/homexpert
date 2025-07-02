import Link from "next/link"
import { Button } from "@/components/ui/button"

export function CtaSection() {
  return (
    <section className="py-20" id="contact">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl text-green-500">Are You a Skilled Professional?</h2>
            <p className="max-w-[900px] text-text-secondary md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
            Partner with HomesXpert to take your service business to the next level. Join our trusted network of verified Xperts, showcase your expertise, connect with local homeowners, and access high-quality leads — right where the demand is.
            </p>
          </div>
          <div className="flex flex-col gap-2 min-[400px]:flex-row">
            <Button size="lg" asChild className="bg-blue-500 text-white hover:bg-blue-600">
              <Link href="/vendor/onboard">Become an Xpert Partner Today</Link>
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
