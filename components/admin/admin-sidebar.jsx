"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  BarChart3,
  Users,
  CreditCard,
  Bell,
  Briefcase,
  Settings,
  Calendar,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen)
  }

  const menuItems = [
    {
      title: "Dashboard",
      icon: <BarChart3 className="h-5 w-5" />,
      href: "/admin",
    },
    {
      title: "Employee Management",
      icon: <Users className="h-5 w-5" />,
      href: "/admin/employees",
    },
    {
      title: "Payment Overview",
      icon: <CreditCard className="h-5 w-5" />,
      href: "/admin/payments",
    },
    {
      title: "Subscription Management",
      icon: <Calendar className="h-5 w-5" />,
      href: "/admin/subscriptions",
    },
    {
      title: "Notifications & Support",
      icon: <Bell className="h-5 w-5" />,
      href: "/admin/notifications",
    },
    {
      title: "Lead Management",
      icon: <Briefcase className="h-5 w-5" />,
      href: "/admin/leads",
    },
    {
      title: "Roles & Permissions",
      icon: <Settings className="h-5 w-5" />,
      href: "/admin/roles",
    },
    {
      title: "Booking & Lead Assignment",
      icon: <Calendar className="h-5 w-5" />,
      href: "/admin/bookings",
    },
  ]

  return (
    <>
      {/* Mobile sidebar toggle */}
      <Button variant="ghost" size="icon" className="fixed top-4 left-4 z-50 md:hidden" onClick={toggleMobileSidebar}>
        {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </Button>

      {/* Sidebar overlay for mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r bg-card transition-all duration-300 ease-in-out md:relative md:z-0",
          collapsed ? "md:w-20" : "md:w-64",
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        )}
      >
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between border-b px-4">
          <Link href="/admin" className="flex items-center gap-2">
            <Image src="/logo.png" alt="HomeXpert Logo" width={32} height={32} className="h-8 w-auto" />
            {!collapsed && (
              <span className="text-lg font-bold">
                <span className="text-primary">Homes</span>
                <span className="text-secondary">Xpert</span>
              </span>
            )}
          </Link>
          <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggleSidebar}>
            <ChevronDown className={cn("h-5 w-5 transition-transform", collapsed ? "rotate-90" : "rotate-0")} />
          </Button>
        </div>

        {/* Sidebar content */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {menuItems.map((item, index) => {
              const isActive = pathname === item.href
              return (
                <Link
                  key={index}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.icon}
                  {!collapsed && <span>{item.title}</span>}
                </Link>
              )
            })}
          </nav>
        </ScrollArea>

        {/* Sidebar footer */}
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold">A</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="text-sm font-medium">Admin User</span>
                <span className="text-xs text-muted-foreground">admin@homexpert.com</span>
              </div>
            )}
          </div>
          <Button variant="ghost" size="sm" className="mt-4 w-full justify-start gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Log out</span>}
          </Button>
        </div>
      </aside>
    </>
  )
}
