"use client"

import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { RefreshCw, Search, Database, Loader2, Check, X } from "lucide-react"
import { toast } from "sonner"
import { usePermissions, PermissionGuard } from "@/hooks/usePermissions"
import { PERMISSIONS } from "@/lib/permissions"
import { PermissionMatrixShimmer, Shimmer } from "@/components/ui/shimmer"
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

export function PermissionsTable() {
  const [permissions, setPermissions] = useState({})
  const [roles, setRoles] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [showSeedDialog, setShowSeedDialog] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  const { isAdmin } = usePermissions()

  // Fetch permissions and roles from API
  const fetchData = async () => {
    try {
      setIsLoading(true)
      console.log('🔍 Fetching permissions data...')
      
      // Fetch permissions grouped by module
      const permissionsResponse = await fetch('/api/permissions?groupBy=module')
      if (!permissionsResponse.ok) {
        throw new Error(`Failed to fetch permissions: ${permissionsResponse.status} ${permissionsResponse.statusText}`)
      }
      
      const permissionsText = await permissionsResponse.text()
      console.log('📋 Permissions response:', permissionsText ? 'Got response' : 'Empty response')
      
      if (!permissionsText) {
        throw new Error('Empty permissions response from server')
      }
      
      const permissionsData = JSON.parse(permissionsText)
      console.log('✅ Parsed permissions:', permissionsData)
      setPermissions(permissionsData.permissions || {})

      // Fetch roles with permissions
      const rolesResponse = await fetch('/api/roles?includePermissions=true')
      if (!rolesResponse.ok) {
        throw new Error(`Failed to fetch roles: ${rolesResponse.status} ${rolesResponse.statusText}`)
      }
      
      const rolesText = await rolesResponse.text()
      console.log('📋 Roles response:', rolesText ? 'Got response' : 'Empty response')
      
      if (!rolesText) {
        throw new Error('Empty roles response from server')
      }
      
      const rolesData = JSON.parse(rolesText)
      console.log('✅ Parsed roles:', rolesData)
      setRoles(rolesData.roles || [])

    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error("Failed to fetch data. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle seeding permissions
  const handleSeedPermissions = async () => {
    try {
      setIsSeeding(true)
      
      const response = await fetch('/api/permissions/seed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to seed permissions')
      }
      
      const result = await response.json()
      
      toast.success(`Seeded ${result.permissions?.inserted || 0} permissions and ${result.roles?.inserted || 0} roles successfully.`)
      
      // Refresh data
      fetchData()
      
    } catch (error) {
      console.error('Error seeding permissions:', error)
      toast.error(error.message)
    } finally {
      setIsSeeding(false)
      setShowSeedDialog(false)
    }
  }

  // Check if a role has a specific permission
  const roleHasPermission = (role, permissionId) => {
    return role.permissions?.some(p => p._id === permissionId) || false
  }

  // Filter permissions based on search term
  const getFilteredPermissions = () => {
    if (!searchTerm) return permissions
    
    const filtered = {}
    Object.entries(permissions).forEach(([module, perms]) => {
      const filteredPerms = perms.filter(permission => 
        permission.resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
        permission.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
        module.toLowerCase().includes(searchTerm.toLowerCase())
      )
      if (filteredPerms.length > 0) {
        filtered[module] = filteredPerms
      }
    })
    return filtered
  }

  const filteredPermissions = getFilteredPermissions()
  const totalPermissions = Object.values(permissions).flat().length

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>
              View and manage permissions for each role. Loading...
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" disabled>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <Button size="sm" disabled>
              <Database className="h-4 w-4 mr-2" />
              Seed Permissions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search shimmer */}
            <div className="relative max-w-md">
              <Shimmer className="h-10 w-full" />
            </div>

            {/* Permissions Matrix shimmer */}
            <div className="rounded-md border overflow-hidden">
              <PermissionMatrixShimmer roleCount={4} />
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
            <CardTitle>Permission Matrix</CardTitle>
            <CardDescription>
              View and manage permissions for each role. Total: {totalPermissions} permissions
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchData}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <PermissionGuard permission={PERMISSIONS.SYSTEM.PERMISSION_MANAGEMENT} fallback={null}>
              <Button 
                size="sm" 
                onClick={() => setShowSeedDialog(true)}
                disabled={isSeeding}
              >
                <Database className="h-4 w-4 mr-2" />
                Seed Permissions
              </Button>
            </PermissionGuard>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search permissions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Permissions Matrix */}
            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium p-3 min-w-[300px]">Permission</th>
                      {roles.map((role) => (
                        <th key={role._id} className="text-center font-medium p-3 min-w-[120px]">
                          <div className="flex flex-col items-center gap-1">
                            <Badge variant={role.isSystemRole ? "default" : "outline"} className="text-xs">
                              {role.name}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {role.userCount || 0} users
                            </span>
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(filteredPermissions).length === 0 ? (
                      <tr>
                        <td colSpan={roles.length + 1} className="p-8 text-center text-muted-foreground">
                          {searchTerm ? 'No permissions found matching your search.' : 'No permissions available. Use the "Seed Permissions" button to add default permissions.'}
                        </td>
                      </tr>
                    ) : (
                      Object.entries(filteredPermissions).map(([module, modulePermissions]) => (
                        <React.Fragment key={module}>
                          {/* Module Header */}
                          <tr className="bg-muted/30">
                            <td colSpan={roles.length + 1} className="p-3 font-medium">
                              <div className="flex items-center gap-2">
                                <span>{module.charAt(0).toUpperCase() + module.slice(1)}</span>
                                <Badge variant="outline" className="text-xs">
                                  {modulePermissions.length} permissions
                                </Badge>
                              </div>
                            </td>
                          </tr>
                          {/* Module Permissions */}
                          {modulePermissions.map((permission) => (
                            <tr key={permission._id} className="border-b hover:bg-muted/20">
                              <td className="p-3 pl-6">
                                <div className="flex flex-col">
                                  <span className="font-medium">{permission.resource}</span>
                                  <span className="text-xs text-muted-foreground capitalize">
                                    {permission.action}
                                  </span>
                                </div>
                              </td>
                              {roles.map((role) => (
                                <td key={role._id} className="p-3 text-center">
                                  {roleHasPermission(role, permission._id) ? (
                                    <Check className="h-5 w-5 mx-auto text-green-500" />
                                  ) : (
                                    <X className="h-5 w-5 mx-auto text-red-500" />
                                  )}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Seed Permissions Dialog */}
      <AlertDialog open={showSeedDialog} onOpenChange={setShowSeedDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Seed Default Permissions</AlertDialogTitle>
            <AlertDialogDescription>
              This will add default permissions and roles to your system. 
              If permissions or roles already exist, they will be skipped.
              <br /><br />
              <strong>This action will:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Create permissions for Dashboard, Employees, Vendors, Bookings, etc.</li>
                <li>Create default roles: Admin, Helpline, Telecaller, Vendor</li>
                <li>Assign appropriate permissions to each role</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSeeding}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleSeedPermissions}
              disabled={isSeeding}
            >
              {isSeeding ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Seeding...
                </>
              ) : (
                'Seed Permissions'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 