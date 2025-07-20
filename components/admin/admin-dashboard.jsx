"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DashboardStats } from "@/components/admin/dashboard/dashboard-stats"
import { LeadsChart } from "@/components/admin/dashboard/leads-chart"
import { RecentLeads } from "@/components/admin/dashboard/recent-leads"
import { RecentVendors } from "@/components/admin/dashboard/recent-vendors"
import { PaymentOverview } from "@/components/admin/dashboard/payment-overview"
import { usePermissions } from "@/hooks/usePermissions"
import { useState, useEffect } from "react"
import { Users, Briefcase, TrendingUp, Calendar, Building, Phone, Mail, MapPin } from "lucide-react"

export function AdminDashboard() {
  const { userRole, isAdmin } = usePermissions()
  const [userStats, setUserStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/dashboard/user-stats')
        const data = await response.json()
        
        if (data.success) {
          setUserStats(data.data)
        } else {
          console.error('Failed to fetch user stats:', data.error)
        }
      } catch (error) {
        console.error('Error fetching user stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
  }, [])

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Show loading state
  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  // Admin Dashboard - Full Dashboard
  if (isAdmin || userRole?.toLowerCase() === 'admin') {
    return (
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
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
                  <CardTitle>Leads Overview</CardTitle>
                  <CardDescription>Booking trends over the last 30 days</CardDescription>
                </CardHeader>
                <CardContent>
                  <LeadsChart />
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

  // Non-Admin Dashboard - User-specific stats
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">My Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your contributions to the platform.
        </p>
      </div>

      {/* User Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Onboarded Vendors</p>
                <p className="text-2xl font-bold">{userStats?.stats?.totalOnboardedVendors || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Briefcase className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Created Leads</p>
                <p className="text-2xl font-bold">{userStats?.stats?.totalCreatedLeads || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Your Role</p>
                <p className="text-lg font-semibold capitalize">{userRole || 'User'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Active Since</p>
                <p className="text-lg font-semibold">Today</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Recent Vendors You Onboarded
            </CardTitle>
            <CardDescription>Latest vendors you've added to the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {userStats?.stats?.recentVendors?.length > 0 ? (
              <div className="space-y-4">
                {userStats.stats.recentVendors.map((vendor) => (
                  <div key={vendor.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Building className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{vendor.businessName}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          vendor.status === 'active' ? 'bg-green-100 text-green-800' :
                          vendor.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {vendor.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {vendor.email}
                        </span>
                        {vendor.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {vendor.city}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Services: {vendor.services.join(', ') || 'Not specified'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Added {formatDate(vendor.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No vendors onboarded yet</p>
                <p className="text-sm text-muted-foreground">Start onboarding vendors to see them here</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Recent Leads You Created
            </CardTitle>
            <CardDescription>Latest leads you've added to the system</CardDescription>
          </CardHeader>
          <CardContent>
            {userStats?.stats?.recentLeads?.length > 0 ? (
              <div className="space-y-4">
                {userStats.stats.recentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-start space-x-3 p-3 rounded-lg border">
                    <Briefcase className="h-5 w-5 text-green-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium truncate">{lead.customerName}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          lead.status === 'completed' ? 'bg-green-100 text-green-800' :
                          lead.status === 'taken' ? 'bg-blue-100 text-blue-800' :
                          lead.status === 'available' ? 'bg-yellow-100 text-yellow-800' :
                          lead.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {lead.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Service: {lead.service}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Location: {lead.address}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created {formatDate(lead.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No leads created yet</p>
                <p className="text-sm text-muted-foreground">Start creating leads to see them here</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
