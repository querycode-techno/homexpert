"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Loader2, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs"
import { toast } from "sonner"

export function AddEditRoleDialog({ open, onOpenChange, role, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: []
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availablePermissions, setAvailablePermissions] = useState({})
  const [isLoadingPermissions, setIsLoadingPermissions] = useState(false)
  const [permissionSearch, setPermissionSearch] = useState('')


  const isEditing = !!role

  // Debug logging
  console.log('🔍 Dialog component - open:', open, 'role:', role)

  // Fetch available permissions when dialog opens
  useEffect(() => {
    if (open && Object.keys(availablePermissions).length === 0) {
      fetchPermissions()
    }
  }, [open])

  // Reset form when dialog opens/closes or role changes
  useEffect(() => {
    if (open) {
      if (isEditing && role) {
        setFormData({
          name: role.name || '',
          description: role.description || '',
          permissions: role.permissions?.map(p => p._id || p) || []
        })
      } else {
        setFormData({
          name: '',
          description: '',
          permissions: []
        })
      }
    }
  }, [open, role, isEditing])

  // Fetch available permissions
  const fetchPermissions = async () => {
    try {
      setIsLoadingPermissions(true)
      const response = await fetch('/api/permissions?groupBy=module')
      if (response.ok) {
        const data = await response.json()
        setAvailablePermissions(data.permissions || {})
      } else {
        throw new Error('Failed to fetch permissions')
      }
    } catch (error) {
      console.error('Error fetching permissions:', error)
      toast.warning("Could not load permissions. You can still create the role and assign permissions later.")
    } finally {
      setIsLoadingPermissions(false)
    }
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Role name is required")
      return
    }

    try {
      setIsSubmitting(true)
      
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        permissions: formData.permissions
      }

      const url = isEditing ? `/api/roles/${role._id}` : '/api/roles'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        let errorMessage = 'Failed to save role'
        try {
          const errorText = await response.text()
          if (errorText) {
            const error = JSON.parse(errorText)
            errorMessage = error.error || errorMessage
          }
        } catch (parseError) {
          console.warn('Could not parse error response:', parseError)
          errorMessage = `HTTP ${response.status}: ${response.statusText}`
        }
        throw new Error(errorMessage)
      }
      
      toast.success(isEditing ? "Role updated successfully" : "Role created successfully")
      
      onSuccess()
    } catch (error) {
      console.error('Error saving role:', error)
      toast.error(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle permission toggle
  const handlePermissionToggle = (permissionId, checked) => {
    setFormData(prev => ({
      ...prev,
      permissions: checked 
        ? [...prev.permissions, permissionId]
        : prev.permissions.filter(id => id !== permissionId)
    }))
  }

  // Handle module toggle (select/deselect all permissions in a module)
  const handleModuleToggle = (modulePermissions, checked) => {
    const modulePermissionIds = modulePermissions.map(p => p._id)
    setFormData(prev => ({
      ...prev,
      permissions: checked
        ? [...new Set([...prev.permissions, ...modulePermissionIds])]
        : prev.permissions.filter(id => !modulePermissionIds.includes(id))
    }))
  }

  // Check if all permissions in a module are selected
  const isModuleFullySelected = (modulePermissions) => {
    const modulePermissionIds = modulePermissions.map(p => p._id)
    return modulePermissionIds.every(id => formData.permissions.includes(id))
  }

  // Check if some permissions in a module are selected
  const isModulePartiallySelected = (modulePermissions) => {
    const modulePermissionIds = modulePermissions.map(p => p._id)
    return modulePermissionIds.some(id => formData.permissions.includes(id)) && 
           !isModuleFullySelected(modulePermissions)
  }

  // Filter permissions based on search
  const getFilteredPermissions = () => {
    if (!permissionSearch) return availablePermissions
    
    const filtered = {}
    Object.entries(availablePermissions).forEach(([module, permissions]) => {
      const filteredPerms = permissions.filter(permission => 
        permission.resource.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        permission.action.toLowerCase().includes(permissionSearch.toLowerCase()) ||
        module.toLowerCase().includes(permissionSearch.toLowerCase())
      )
      if (filteredPerms.length > 0) {
        filtered[module] = filteredPerms
      }
    })
    return filtered
  }

  const filteredPermissions = getFilteredPermissions()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Edit Role: ${role?.name}` : 'Create New Role'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update the role details and permissions.' 
              : 'Create a new role and assign permissions.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="basic">Basic Information</TabsTrigger>
              <TabsTrigger value="permissions">
                Permissions 
                {formData.permissions.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {formData.permissions.length}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  name="roleName"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter role name"
                  disabled={isSubmitting}
                  required
                  autoComplete="organization-title"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="role-description">Description</Label>
                <Input
                  id="role-description"
                  name="roleDescription"
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter role description"
                  disabled={isSubmitting}
                  autoComplete="off"
                />
              </div>
            </TabsContent>

            <TabsContent value="permissions" className="space-y-4">
              {isLoadingPermissions ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  <span>Loading permissions...</span>
                </div>
              ) : Object.keys(availablePermissions).length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No permissions available.</p>
                  <p className="text-sm">You can create the role and assign permissions later.</p>
                </div>
              ) : (
                <>
                  {/* Permission search */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search permissions..."
                      value={permissionSearch}
                      onChange={(e) => setPermissionSearch(e.target.value)}
                      className="pl-8"
                    />
                  </div>

                  {/* Permission summary */}
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-sm text-muted-foreground">
                      Selected: {formData.permissions.length} permissions
                    </span>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setFormData(prev => ({ ...prev, permissions: [] }))}
                        disabled={formData.permissions.length === 0}
                      >
                        Clear All
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const allPermissionIds = Object.values(filteredPermissions)
                            .flat()
                            .map(p => p._id)
                          setFormData(prev => ({ 
                            ...prev, 
                            permissions: [...new Set([...prev.permissions, ...allPermissionIds])]
                          }))
                        }}
                      >
                        Select All
                      </Button>
                    </div>
                  </div>

                  {/* Permissions list */}
                  <ScrollArea className="h-80 w-full border rounded-md">
                    <div className="p-4 space-y-4">
                      {Object.keys(filteredPermissions).length === 0 ? (
                        <p className="text-center text-muted-foreground py-4">
                          No permissions found matching your search.
                        </p>
                      ) : (
                        Object.entries(filteredPermissions).map(([module, modulePermissions]) => (
                          <div key={module} className="space-y-2">
                            {/* Module header */}
                            <div className="flex items-center space-x-2 p-2 bg-muted/30 rounded">
                              <Checkbox
                                id={`module-${module}`}
                                checked={isModuleFullySelected(modulePermissions)}
                                ref={(el) => {
                                  if (el) el.indeterminate = isModulePartiallySelected(modulePermissions)
                                }}
                                onCheckedChange={(checked) => handleModuleToggle(modulePermissions, checked)}
                              />
                              <Label 
                                htmlFor={`module-${module}`} 
                                className="font-medium capitalize cursor-pointer flex-1"
                              >
                                {module}
                              </Label>
                              <Badge variant="outline" className="text-xs">
                                {modulePermissions.length} permissions
                              </Badge>
                            </div>

                            {/* Module permissions */}
                            <div className="ml-6 space-y-1">
                              {modulePermissions.map((permission) => (
                                <div key={permission._id} className="flex items-center space-x-2 p-1">
                                  <Checkbox
                                    id={`permission-${permission._id}`}
                                    checked={formData.permissions.includes(permission._id)}
                                    onCheckedChange={(checked) => handlePermissionToggle(permission._id, checked)}
                                  />
                                  <Label 
                                    htmlFor={`permission-${permission._id}`} 
                                    className="cursor-pointer flex-1"
                                  >
                                    <span className="font-medium">{permission.resource}</span>
                                    <span className="text-muted-foreground ml-1 text-sm">
                                      ({permission.action})
                                    </span>
                                  </Label>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </>
              )}
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  {isEditing ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                isEditing ? 'Update Role' : 'Create Role'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 