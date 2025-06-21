"use client"

import { SessionProvider } from "next-auth/react"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { DataProvider } from "@/lib/data-context"
import { SidebarProvider, useSidebar } from "@/lib/sidebar-context"
import { Toaster } from "sonner"

function AdminLayoutContent({ children }) {
  const { collapsed } = useSidebar()

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <AdminSidebar />
      <div className={`flex flex-col flex-1 transition-all duration-300 ease-in-out ${
        collapsed ? 'md:ml-20' : 'md:ml-64'
      }`}>
        <AdminHeader />
        <main className="flex-1 overflow-y-auto p-6">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }) {
  return (
    <SessionProvider>
      <DataProvider>
        <SidebarProvider>
          <AdminLayoutContent>
            {children}
          </AdminLayoutContent>
          <Toaster />
        </SidebarProvider>
      </DataProvider>
    </SessionProvider>
  )
}
