import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Linkedin, Youtube } from "lucide-react"
import { serviceUtils } from "@/lib/utils"

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logo.png" alt="HomeXpert Logo" width={40} height={40} className="h-10 w-auto" />
              <span className="text-xl font-bold">
                <span className="text-primary">Homes</span>
                <span className="text-secondary">Xpert</span>
              </span>
            </Link>
            <p className="text-sm text-text-secondary">
              Connecting you with trusted home service professionals for all your needs.
            </p>
            <div className="flex space-x-4">
              <Link href="#" className="text-text-secondary hover:text-primary">
                <Facebook className="h-5 w-5" />
                <span className="sr-only">Facebook</span>
              </Link>
              <Link href="#" className="text-text-secondary hover:text-primary">
                <Instagram className="h-5 w-5" />
                <span className="sr-only">Instagram</span>
              </Link>
              <Link href="#" className="text-text-secondary hover:text-primary">
                <Linkedin className="h-5 w-5" />
                <span className="sr-only">LinkedIn</span>
              </Link>
              <Link href="#" className="text-text-secondary hover:text-primary">
                <Youtube className="h-5 w-5" />
                <span className="sr-only">YouTube</span>
              </Link>
            </div>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Services</h3>
            <ul className="space-y-2">
              {serviceUtils.getAllServices().slice(0, 5).map((service) => (
                <li key={service}>
                  <Link href="/services" className="text-sm text-text-secondary hover:text-primary">
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Press
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="text-sm text-text-secondary hover:text-primary">
                  Disclaimer
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-text-secondary">
            © {new Date().getFullYear()} HomeXpert. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
