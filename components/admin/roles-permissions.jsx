"use client"

import React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, MoreHorizontal, Check, X } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"

export function RolesPermissions() {
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false)

  const roles = [
    {
      id: 1,
      name: "Admin",
      description: "Full access to all features",
      users: 1,
    },
    {
      id: 2,
      name: "Helpline",
      description: "Create bookings and provide support",
      users: 3,
    },
    {
      id: 3,
      name: "Telecaller",
      description: "Manage vendors and subscriptions",
      users: 2,
    },
  ]

  const permissions = [
    {
      category: "Dashboard",
      items: [{ name: "View Dashboard", admin: true, helpline: true, telecaller: true }],
    },
    {
      category: "Employee Management",
      items: [
        { name: "View Employees", admin: true, helpline: false, telecaller: false },
        { name: "Create Employee", admin: true, helpline: false, telecaller: false },
        { name: "Edit Employee", admin: true, helpline: false, telecaller: false },
        { name: "Delete Employee", admin: true, helpline: false, telecaller: false },
      ],
    },
    {
      category: "Booking Management",
      items: [
        { name: "View Bookings", admin: true, helpline: true, telecaller: true },
        { name: "Create Booking", admin: true, helpline: true, telecaller: false },
        { name: "Edit Booking", admin: true, helpline: true, telecaller: false },
        { name: "Delete Booking", admin: true, helpline: false, telecaller: false },
        { name: "Assign Booking", admin: true, helpline: false, telecaller: true },
      ],
    },
    {
      category: "Vendor Management",
      items: [
        { name: "View Vendors", admin: true, helpline: true, telecaller: true },
        { name: "Create Vendor", admin: true, helpline: false, telecaller: true },
        { name: "Edit Vendor", admin: true, helpline: false, telecaller: true },
        { name: "Delete Vendor", admin: true, helpline: false, telecaller: false },
        { name: "Activate/Deactivate Vendor", admin: true, helpline: false, telecaller: true },
      ],
    },
    {
      category: "Lead Management",
      items: [
        { name: "View Leads", admin: true, helpline: true, telecaller: true },
        { name: "Create Lead", admin: true, helpline: true, telecaller: true },
        { name: "Edit Lead", admin: true, helpline: true, telecaller: true },
        { name: "Delete Lead", admin: true, helpline: false, telecaller: false },
        { name: "Assign Lead", admin: true, helpline: false, telecaller: true },
      ],
    },
    {
      category: "Subscription Management",
      items: [
        { name: "View Subscriptions", admin: true, helpline: false, telecaller: true },
        { name: "Create Subscription", admin: true, helpline: false, telecaller: false },
        { name: "Edit Subscription", admin: true, helpline: false, telecaller: false },
        { name: "Delete Subscription", admin: true, helpline: false, telecaller: false },
        { name: "Manage Vendor Subscriptions", admin: true, helpline: false, telecaller: true },
      ],
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">Manage user roles and their permissions.</p>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>User Roles</CardTitle>
                <CardDescription>Manage roles for system users.</CardDescription>
              </div>
              <Dialog open={isAddRoleOpen} onOpenChange={setIsAddRoleOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 gap-1">
                    <Plus className="h-4 w-4" />
                    <span>Add Role</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Role</DialogTitle>
                    <DialogDescription>Create a new role with specific permissions.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Role Name</Label>
                      <Input id="name" placeholder="Enter role name" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" placeholder="Enter role description" />
                    </div>
                    <div className="space-y-2">
                      <Label>Permissions</Label>
                      <div className="space-y-2 max-h-[300px] overflow-y-auto border rounded-md p-4">
                        {permissions.map((category, index) => (
                          <div key={index} className="space-y-2">
                            <h4 className="font-medium">{category.category}</h4>
                            <div className="ml-4 space-y-1">
                              {category.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center space-x-2">
                                  <Checkbox id={`permission-${index}-${itemIndex}`} />
                                  <Label htmlFor={`permission-${index}-${itemIndex}`} className="text-sm">
                                    {item.name}
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddRoleOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={() => setIsAddRoleOpen(false)}>Create Role</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left font-medium p-2">ID</th>
                          <th className="text-left font-medium p-2">Role</th>
                          <th className="text-left font-medium p-2">Description</th>
                          <th className="text-left font-medium p-2">Users</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {roles.map((role) => (
                          <tr key={role.id} className="border-b">
                            <td className="p-2">{role.id}</td>
                            <td className="p-2">
                              <Badge variant="outline">{role.name}</Badge>
                            </td>
                            <td className="p-2">{role.description}</td>
                            <td className="p-2">{role.users}</td>
                            <td className="p-2 text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem className="flex items-center gap-2">
                                    <Edit className="h-4 w-4" />
                                    <span>Edit</span>
                                  </DropdownMenuItem>
                                  {role.name !== "Admin" && (
                                    <DropdownMenuItem className="flex items-center gap-2 text-red-500">
                                      <Trash2 className="h-4 w-4" />
                                      <span>Delete</span>
                                    </DropdownMenuItem>
                                  )}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permission Matrix</CardTitle>
              <CardDescription>View and manage permissions for each role.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left font-medium p-2">Permission</th>
                        <th className="text-center font-medium p-2">Admin</th>
                        <th className="text-center font-medium p-2">Helpline</th>
                        <th className="text-center font-medium p-2">Telecaller</th>
                      </tr>
                    </thead>
                    <tbody>
                      {permissions.map((category, categoryIndex) => (
                        <React.Fragment key={categoryIndex}>
                          <tr className="bg-muted/30">
                            <td colSpan={4} className="p-2 font-medium">
                              {category.category}
                            </td>
                          </tr>
                          {category.items.map((item, itemIndex) => (
                            <tr key={`${categoryIndex}-${itemIndex}`} className="border-b">
                              <td className="p-2 pl-4">{item.name}</td>
                              <td className="p-2 text-center">
                                {item.admin ? (
                                  <Check className="h-4 w-4 mx-auto text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 mx-auto text-red-500" />
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {item.helpline ? (
                                  <Check className="h-4 w-4 mx-auto text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 mx-auto text-red-500" />
                                )}
                              </td>
                              <td className="p-2 text-center">
                                {item.telecaller ? (
                                  <Check className="h-4 w-4 mx-auto text-green-500" />
                                ) : (
                                  <X className="h-4 w-4 mx-auto text-red-500" />
                                )}
                              </td>
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
