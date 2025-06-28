import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardStats } from "@/components/admin/dashboard/dashboard-stats"
import { BookingsChart } from "@/components/admin/dashboard/bookings-chart"
import { RecentLeads } from "@/components/admin/dashboard/recent-leads"
import { RecentVendors } from "@/components/admin/dashboard/recent-vendors"
import { PaymentOverview } from "@/components/admin/dashboard/payment-overview"

export function AdminDashboard() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your platform's performance.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-6">
          <DashboardStats />

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4">
              <CardHeader>
                <CardTitle>Bookings Overview</CardTitle>
                <CardDescription>Booking trends over the last 30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <BookingsChart />
              </CardContent>
            </Card>
            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>Payment Overview</CardTitle>
                <CardDescription>Revenue breakdown by service type</CardDescription>
              </CardHeader>
              <CardContent>
                <PaymentOverview />
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Leads</CardTitle>
                <CardDescription>Latest leads across the platform</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentLeads />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Vendors</CardTitle>
                <CardDescription>Latest vendor registrations</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentVendors />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Detailed analytics and insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Detailed analytics will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate and view reports</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center border rounded-md">
                <p className="text-muted-foreground">Reports will be displayed here</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
