"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  Calendar,
  Headphones,
  User,
  Menu,
  X,
  Bell,
  Settings,
  LogOut,
  BarChart3
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

export default function VendorLayout({ children }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navigationItems = [
    {
      title: "Dashboard",
      href: "/vendor",
      icon: <Home className="h-5 w-5" />,
    },
    {
      title: "Leads",
      href: "/vendor/leads",
      icon: <BarChart3 className="h-5 w-5" />,
    },
    {
      title: "Bookings",
      href: "/vendor/bookings",
      icon: <Calendar className="h-5 w-5" />,
    },
    {
      title: "Support",
      href: "/vendor/support",
      icon: <Headphones className="h-5 w-5" />,
      badge: "3", // Example notification count
    },
    {
      title: "Profile",
      href: "/vendor/profile",
      icon: <User className="h-5 w-5" />,
    },
    {
      title: "Settings",
      href: "/vendor/settings",
      icon: <Settings className="h-5 w-5" />,
    },
  ]

  const VendorNav = ({ mobile = false }) => (
    <nav className={cn("space-y-2", mobile && "px-4")}>
      {navigationItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
            onClick={() => mobile && setMobileMenuOpen(false)}
          >
            {item.icon}
            <span>{item.title}</span>
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Link>
        )
      })}
    </nav>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 lg:border-r">
        {/* Logo */}
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/vendor" className="flex items-center gap-2">
            <Image
              src="/hx-logo.png"
              alt="HomeXpert"
              width={32}
              height={32}
              className="h-8 w-auto"
            />
            <span className="font-semibold">Vendor Portal</span>
          </Link>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 p-4">
          <VendorNav />
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Mobile Header */}
        <header className="flex h-16 items-center justify-between border-b px-4 lg:hidden">
          <Link href="/vendor" className="flex items-center gap-2">
            <Image
              src="/hx-logo.png"
              alt="HomeXpert"
              width={24}
              height={24}
              className="h-6 w-auto"
            />
            <span className="font-semibold">Vendor</span>
          </Link>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon">
              <Bell className="h-5 w-5" />
            </Button>
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80">
                <div className="flex items-center gap-2 pb-4">
                  <Image
                    src="/hx-logo.png"
                    alt="HomeXpert"
                    width={24}
                    height={24}
                    className="h-6 w-auto"
                  />
                  <span className="font-semibold">Vendor Portal</span>
                </div>
                <Separator className="mb-4" />
                <VendorNav mobile />
                <Separator className="my-4" />
                <div className="px-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start gap-2 text-muted-foreground hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="flex border-t bg-background lg:hidden">
          {navigationItems.slice(0, 4).map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-1 flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <div className="relative">
                  {item.icon}
                  {item.badge && (
                    <Badge
                      variant="destructive"
                      className="absolute -right-2 -top-2 h-5 w-5 rounded-full p-0 text-[10px]"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span>{item.title}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
