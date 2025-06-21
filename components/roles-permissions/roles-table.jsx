"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Plus, Edit, Trash2, MoreHorizontal, Loader2, Users } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions"
import { PERMISSIONS } from "@/lib/permissions"
import { AddEditRoleDialog } from "./add-edit-role-dialog"
import { refreshUserPermissions } from "@/lib/refreshPermissions"
import { RolesTableShimmer } from "@/components/ui/shimmer"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export function RolesTable() {
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingRole, setEditingRole] = useState(null)
  const [deletingRole, setDeletingRole] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { can } = usePermissions()

  // Fetch roles from API
  const fetchRoles = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Fetching roles...')
      const response = await fetch('/api/roles?includePermissions=false')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch roles: ${response.status} ${response.statusText}`)
      }
      
      const text = await response.text()
      console.log('📋 Raw response:', text ? 'Got response' : 'Empty response')
      
      if (!text) {
        throw new Error('Empty response from server')
      }
      
      const data = JSON.parse(text)
      console.log('✅ Parsed data:', data)
      setRoles(data.roles || [])
    } catch (error) {
      console.error('Error fetching roles:', error)
      toast.error("Failed to fetch roles. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  // Handle role creation/update
  const handleRoleSuccess = async () => {
    fetchRoles()
    setIsAddDialogOpen(false)
    setEditingRole(null)
    
    // Refresh permissions cache for all users since roles might have changed
    try {
      await refreshUserPermissions()
      toast.success(`${editingRole ? "Role updated" : "Role created"} successfully and user permissions refreshed.`)
    } catch (error) {
      console.error('Error refreshing permissions:', error)
              toast.success(`${editingRole ? "Role updated" : "Role created"} successfully. Note: Users may need to refresh to see permission changes.`)
    }
  }

  // Handle role deletion
  const handleDeleteRole = async () => {
    if (!deletingRole) return
    
    try {
      setIsDeleting(true)
      const response = await fetch(`/api/roles/${deletingRole._id}`, {
        method: 'DELETE'
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete role')
      }
      
      toast.success("Role deleted successfully")
      
      fetchRoles()
      
      // Refresh permissions cache for all users since a role was deleted
      try {
        await refreshUserPermissions()
      } catch (error) {
        console.error('Error refreshing permissions after delete:', error)
      }
    } catch (error) {
      console.error('Error deleting role:', error)
      toast.error(error.message)
    } finally {
      setIsDeleting(false)
      setDeletingRole(null)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Manage roles for system users.</CardDescription>
          </div>
          <Button size="sm" className="h-8 gap-1" disabled>
            <Plus className="h-4 w-4" />
            <span>Add Role</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border overflow-hidden">
              <RolesTableShimmer />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>User Roles</CardTitle>
            <CardDescription>Manage roles for system users.</CardDescription>
          </div>
          <Button 
            size="sm" 
            className="h-8 gap-1"
            onClick={() => {
              console.log('🔍 Add Role button clicked!')
              setIsAddDialogOpen(true)
            }}
          >
            <Plus className="h-4 w-4" />
            <span>Add Role</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium p-3">Role</th>
                      <th className="text-left font-medium p-3">Description</th>
                      <th className="text-left font-medium p-3">Users</th>
                      <th className="text-left font-medium p-3">Type</th>
                      <th className="text-right font-medium p-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roles.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-8 text-center text-muted-foreground">
                          No roles found. Create your first role to get started.
                        </td>
                      </tr>
                    ) : (
                      roles.map((role) => (
                        <tr key={role._id} className="border-b">
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Badge variant={role.isSystemRole ? "default" : "outline"}>
                                {role.name}
                              </Badge>
                            </div>
                          </td>
                          <td className="p-3 max-w-xs">
                            <span className="truncate">{role.description || 'No description'}</span>
                          </td>
                          <td className="p-3">
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span>{role.userCount || 0}</span>
                            </div>
                          </td>
                          <td className="p-3">
                            <Badge variant={role.isSystemRole ? "secondary" : "outline"} className="text-xs">
                              {role.isSystemRole ? 'System' : 'Custom'}
                            </Badge>
                          </td>
                          <td className="p-3 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem 
                                  className="flex items-center gap-2 cursor-pointer"
                                  onClick={() => {
                                    console.log('🔍 Edit button clicked for role:', role.name)
                                    console.log('🔍 Setting editingRole to:', role)
                                    setEditingRole(role)
                                  }}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                {!role.isSystemRole && (
                                  <DropdownMenuItem 
                                    className="flex items-center gap-2 text-red-500 cursor-pointer"
                                    onClick={() => {
                                      console.log('🔍 Delete button clicked for role:', role.name)
                                      setDeletingRole(role)
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                    <span>Delete</span>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add/Edit Role Dialog */}
      <AddEditRoleDialog
        open={isAddDialogOpen || !!editingRole}
        onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false)
            setEditingRole(null)
          }
        }}
        role={editingRole}
        onSuccess={handleRoleSuccess}
      />


      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingRole} onOpenChange={() => setDeletingRole(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Role</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the role "{deletingRole?.name}"? 
              This action cannot be undone.
              {deletingRole?.userCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This role is assigned to {deletingRole.userCount} user(s).
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteRole}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Role'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 