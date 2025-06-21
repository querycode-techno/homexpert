"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  Shimmer, 
  SidebarMenuShimmer, 
  UserProfileShimmer, 
  MenuItemShimmer,
  TableShimmer,
  CardShimmer,
  PermissionMatrixShimmer,
  RolesTableShimmer
} from "@/components/ui/shimmer"

export default function ShimmerDemoPage() {
  const [showShimmer, setShowShimmer] = useState(true)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Shimmer Components Demo</h1>
        <p className="text-muted-foreground">
          Preview of all shimmer loading effects used throughout the application.
        </p>
        <Button 
          variant="outline" 
          onClick={() => setShowShimmer(!showShimmer)}
          className="w-fit"
        >
          {showShimmer ? "Hide" : "Show"} Shimmer Effects
        </Button>
      </div>

      <div className="grid gap-6">
        {/* Basic Shimmer */}
        <Card>
          <CardHeader>
            <CardTitle>Basic Shimmer</CardTitle>
            <CardDescription>
              Basic shimmer component with different sizes and shapes
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {showShimmer ? (
              <>
                <Shimmer className="h-4 w-full" />
                <Shimmer className="h-6 w-3/4" />
                <Shimmer className="h-8 w-1/2" />
                <Shimmer className="h-10 w-20" />
                <Shimmer className="h-12 w-12 rounded-full" />
              </>
            ) : (
              <div className="space-y-4">
                <div className="h-4 w-full bg-primary/10 rounded">Sample text line</div>
                <div className="h-6 w-3/4 bg-primary/10 rounded">Larger text content</div>
                <div className="h-8 w-1/2 bg-primary/10 rounded">Medium content</div>
                <div className="h-10 w-20 bg-primary/10 rounded">Button</div>
                <div className="h-12 w-12 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="text-xs">AVT</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Sidebar Menu Shimmer */}
        <Card>
          <CardHeader>
            <CardTitle>Sidebar Menu Shimmer</CardTitle>
            <CardDescription>
              Shimmer effect for navigation menu items
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-64 border rounded-lg p-3">
              {showShimmer ? (
                <SidebarMenuShimmer itemCount={6} collapsed={false} />
              ) : (
                <nav className="space-y-1">
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 bg-primary text-primary-foreground">
                    <span className="h-5 w-5">📊</span>
                    <span>Dashboard</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted">
                    <span className="h-5 w-5">👥</span>
                    <span>Users</span>
                  </div>
                  <div className="flex items-center gap-3 rounded-md px-3 py-2 text-muted-foreground hover:bg-muted">
                    <span className="h-5 w-5">⚙️</span>
                    <span>Settings</span>
                  </div>
                </nav>
              )}
            </div>
          </CardContent>
        </Card>

        {/* User Profile Shimmer */}
        <Card>
          <CardHeader>
            <CardTitle>User Profile Shimmer</CardTitle>
            <CardDescription>
              Shimmer effect for user profile sections
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="max-w-64 border rounded-lg">
              {showShimmer ? (
                <UserProfileShimmer collapsed={false} />
              ) : (
                <div className="border-t p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-bold">JD</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">John Doe</span>
                      <span className="text-xs text-muted-foreground">john@example.com</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="mt-4 w-full justify-start gap-2">
                    <span>🚪</span>
                    <span>Log out</span>
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Table Shimmer */}
        <Card>
          <CardHeader>
            <CardTitle>Table Shimmer</CardTitle>
            <CardDescription>
              Shimmer effect for data tables
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {showShimmer ? (
                <TableShimmer rows={4} columns={5} />
              ) : (
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="p-4 text-left">Name</th>
                      <th className="p-4 text-left">Email</th>
                      <th className="p-4 text-left">Role</th>
                      <th className="p-4 text-left">Status</th>
                      <th className="p-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-4">John Doe</td>
                      <td className="p-4">john@example.com</td>
                      <td className="p-4">Admin</td>
                      <td className="p-4">Active</td>
                      <td className="p-4">Edit</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-4">Jane Smith</td>
                      <td className="p-4">jane@example.com</td>
                      <td className="p-4">User</td>
                      <td className="p-4">Active</td>
                      <td className="p-4">Edit</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card Shimmer */}
        <Card>
          <CardHeader>
            <CardTitle>Card Shimmer</CardTitle>
            <CardDescription>
              Shimmer effect for content cards
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {showShimmer ? (
                <>
                  <CardShimmer />
                  <CardShimmer />
                </>
              ) : (
                <>
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Sample Card Title</h3>
                    <p className="text-muted-foreground mb-4">
                      This is sample content for a card component with some description text.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm">Action</Button>
                      <Button size="sm" variant="outline">Cancel</Button>
                    </div>
                  </div>
                  <div className="p-6 border rounded-lg">
                    <h3 className="text-lg font-semibold mb-2">Another Card</h3>
                    <p className="text-muted-foreground mb-4">
                      Another example of card content with different layout.
                    </p>
                    <div className="flex gap-2">
                      <Button size="sm">Primary</Button>
                      <Button size="sm" variant="outline">Secondary</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Roles Table Shimmer */}
        <Card>
          <CardHeader>
            <CardTitle>Roles Table Shimmer</CardTitle>
            <CardDescription>
              Shimmer effect for the roles management table
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {showShimmer ? (
                <RolesTableShimmer />
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left font-medium p-3">Role</th>
                      <th className="text-left font-medium p-3">Description</th>
                      <th className="text-left font-medium p-3">Users</th>
                      <th className="text-left font-medium p-3">Type</th>
                      <th className="text-right font-medium p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-3">
                        <span className="px-2 py-1 bg-primary text-primary-foreground rounded-full text-xs">Admin</span>
                      </td>
                      <td className="p-3">Full system access</td>
                      <td className="p-3">👥 3</td>
                      <td className="p-3">
                        <span className="px-2 py-1 bg-secondary text-secondary-foreground rounded-full text-xs">System</span>
                      </td>
                      <td className="p-3 text-right">⋮</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Permission Matrix Shimmer */}
        <Card>
          <CardHeader>
            <CardTitle>Permission Matrix Shimmer</CardTitle>
            <CardDescription>
              Shimmer effect for the permission matrix view
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              {showShimmer ? (
                <PermissionMatrixShimmer roleCount={3} />
              ) : (
                <table className="w-full text-sm">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left font-medium p-3">Permission</th>
                      <th className="text-center font-medium p-3">Admin</th>
                      <th className="text-center font-medium p-3">User</th>
                      <th className="text-center font-medium p-3">Vendor</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="bg-muted/30">
                      <td colSpan={4} className="p-3 font-medium">Dashboard</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3 pl-6">View Dashboard</td>
                      <td className="p-3 text-center">✓</td>
                      <td className="p-3 text-center">✓</td>
                      <td className="p-3 text-center">✗</td>
                    </tr>
                  </tbody>
                </table>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 