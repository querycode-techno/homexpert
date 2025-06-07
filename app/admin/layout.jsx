import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { AdminHeader } from "@/components/admin/admin-header"
import { DataProvider } from "@/lib/data-context"

export const metadata = {
  title: "HomeXpert Admin Dashboard",
  description: "Admin dashboard for HomeXpert platform",
}

export default function AdminLayout({ children }) {
  return (
    <DataProvider>
      <div className="flex min-h-screen bg-background">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <AdminHeader />
          <main className="flex-1 p-6">{children}</main>
        </div>
      </div>
    </DataProvider>
  )
}
