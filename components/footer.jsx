import Link from "next/link"
import Image from "next/image"
import { Facebook, Instagram, Linkedin, Youtube, Phone, MessageCircle } from "lucide-react"
import { serviceUtils } from "@/lib/utils"

export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container px-4 md:px-6 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <Image src="/hx-logo.png" alt="HomeXpert Logo" width={40} height={40} className="h-10 w-auto" />
              <span className="text-xl font-bold">
              </span>
            </Link>
            <p className="text-sm text-text-secondary">
              Connecting you with trusted home service professionals for all your needs.
            </p>
            
            {/* Social Media Icons */}
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
                <Link href="/about" className="text-sm text-text-secondary hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-text-secondary hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-n-conditions" className="text-sm text-text-secondary hover:text-primary">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-sm text-text-secondary hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund-policy" className="text-sm text-text-secondary hover:text-primary">
                  Refund Policy & Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/delete-account" className="text-sm text-text-secondary hover:text-primary">
                  Delete Account
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-text-secondary">
            © {new Date().getFullYear()} HomesXpert. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Floating Action Buttons */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
        {/* WhatsApp Button */}
        <Link 
          href="https://wa.me/919369049369?text=Hi%20HomeXpert,%20I%20need%20help%20with%20home%20services" 
          target="_blank"
          rel="noopener noreferrer"
          className="group bg-green-500 hover:bg-green-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Chat on WhatsApp"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </Link>
        
        {/* Call Button */}
        <Link 
          href="tel:+91-9369049369"  //9369-04-9369
          className="group bg-blue-500 hover:bg-blue-600 text-white w-14 h-14 rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
          title="Call Now"
        >
          <Phone className="h-6 w-6 group-hover:scale-110 transition-transform" />
        </Link>
      </div>
    </footer>
  )
}
