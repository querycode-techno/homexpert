"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Search, Users, UserCheck, X, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { fetchUsersByRole, createEnhancedNotification } from "@/lib/services/notificationService"
import { getSession } from "next-auth/react"

export function EnhancedNotificationForm({ onSuccess, onCancel }) {
  const [formData, setFormData] = useState({
    title: "",
    message: "",
    messageType: "Info",
    targetType: "specific", // 'broad' or 'specific'
    targetUserRole: "vendor", // for broad targeting
    specificUserIds: [], // for specific targeting
  })

  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [selectedUsers, setSelectedUsers] = useState([])
  const [searchingUsers, setSearchingUsers] = useState(false)
  const [filters, setFilters] = useState({
    subscription: "all",
    status: "active_pending", // Default to active and pending vendors for notifications
    verified: "all",
    city: "all",
    service: "all",
    onboardedBy: "all",
    online: "all"
  })
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)

  // Extract unique values for filter options from users
  const filterOptions = useMemo(() => {
    if (formData.targetUserRole !== 'vendor') return { cities: [], services: [] }
    
    const cities = [...new Set(
      users
        .map(user => user.city)
        .filter(Boolean)
    )].sort()

    const services = [...new Set(
      users
        .flatMap(user => user.services || [])
        .filter(Boolean)
    )].sort()

    return { cities, services }
  }, [users, formData.targetUserRole])

  const userRoleOptions = [
    { value: "vendor", label: "Vendors" },
    { value: "admin", label: "Admins" },
    { value: "helpline", label: "Helpline" },
    { value: "telecaller", label: "Telecaller" },
  ]

  const messageTypeOptions = [
    { value: "Info", label: "Info" },
    { value: "Success", label: "Success" },
    { value: "Warning", label: "Warning" },
    { value: "Alert", label: "Alert" },
  ]

  // Fetch employees for onboarded by filter
  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        setEmployeesLoading(true)
        const res = await fetch('/api/admin/employee?limit=200', { credentials: 'include' })
        const data = await res.json().catch(() => ({}))
        if (res.ok && data?.success) {
          setEmployees(Array.isArray(data.data?.employees) ? data.data.employees : [])
        } else {
          setEmployees([])
        }
      } catch (e) {
        setEmployees([])
      } finally {
        setEmployeesLoading(false)
      }
    }
    fetchEmployees()
  }, [])

  // Search users when target type or search term changes
  useEffect(() => {
    if (formData.targetType === 'specific') {
      searchUsers()
    }
  }, [formData.targetUserRole, searchTerm])

  // Filter users based on search and various filters
  useEffect(() => {
    let filtered = users;
    
    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchTerm) ||
        user.businessName?.toLowerCase().includes(searchLower)
      )
    }
    
    // Apply filters for vendors
    if (formData.targetUserRole === 'vendor') {
      // Subscription filter
      if (filters.subscription !== 'all') {
        filtered = filtered.filter(user => {
          if (filters.subscription === 'active') {
            return user.subscriptionStatus === 'active';
          } else if (filters.subscription === 'pending') {
            return user.subscriptionStatus === 'pending';
          } else if (filters.subscription === 'expired') {
            return user.subscriptionStatus === 'expired';
          } else if (filters.subscription === 'cancelled') {
            return user.subscriptionStatus === 'cancelled';
          } else if (filters.subscription === 'unsubscribed') {
            return !user.subscriptionStatus || user.subscriptionStatus === 'unsubscribed';
          }
          return true;
        });
      }
      
      // Status filter
      if (filters.status !== 'all') {
        filtered = filtered.filter(user => {
          if (filters.status === 'active_pending') {
            return user.status === 'active' || user.status === 'pending';
          }
          return user.status === filters.status;
        });
      }
      
      // Verification filter
      if (filters.verified !== 'all') {
        filtered = filtered.filter(user => {
          if (filters.verified === 'verified') {
            return user.verified === true || user.verified === 'verified';
          } else if (filters.verified === 'unverified') {
            return !user.verified || user.verified === false || user.verified === 'unverified';
          }
          return true;
        });
      }
      
      // City filter
      if (filters.city !== 'all') {
        filtered = filtered.filter(user => {
          return user.city === filters.city;
        });
      }
      
      // Service filter
      if (filters.service !== 'all') {
        filtered = filtered.filter(user => {
          return user.services && user.services.includes(filters.service);
        });
      }
      
      // Onboarded By filter
      if (filters.onboardedBy !== 'all') {
        filtered = filtered.filter(user => {
          if (filters.onboardedBy === 'none') {
            return !user.onboardedBy;
          }
          return user.onboardedBy === filters.onboardedBy;
        });
      }
      
      // Online Status filter
      if (filters.online !== 'all') {
        filtered = filtered.filter(user => {
          if (filters.online === 'online') {
            return user.online === true;
          } else if (filters.online === 'offline') {
            return user.online !== true;
          }
          return true;
        });
      }
    }
    
    setFilteredUsers(filtered)
  }, [users, searchTerm, filters, formData.targetUserRole])

  const searchUsers = async () => {
    if (!formData.targetUserRole) return

    setSearchingUsers(true)
    try {
      const fetchedUsers = await fetchUsersByRole(formData.targetUserRole, "", 5000) // Get all users - increased limit
      setUsers(fetchedUsers)
      setFilteredUsers(fetchedUsers)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to fetch users')
    } finally {
      setSearchingUsers(false)
    }
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Reset selections when target type changes
    if (name === 'targetType') {
      setSelectedUsers([])
      setFormData(prev => ({ ...prev, specificUserIds: [] }))
    }
    
    // Reset filters when user role changes
    if (name === 'targetUserRole') {
      setFilters({
        subscription: "all",
        status: formData.targetUserRole === 'vendor' ? "active_pending" : "all", // Smart default for vendors
        verified: "all",
        city: "all",
        service: "all",
        onboardedBy: "all",
        online: "all"
      })
      setSelectedUsers([])
      setFormData(prev => ({ ...prev, specificUserIds: [] }))
    }
  }

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === "all" ? "all" : value
    }))
  }

  const clearAllFilters = () => {
    setFilters({
      subscription: "all",
      status: formData.targetUserRole === 'vendor' ? "active_pending" : "all", // Smart default for vendors
      verified: "all",
      city: "all",
      service: "all",
      onboardedBy: "all",
      online: "all"
    })
  }

  const handleUserSelection = (userId, isSelected) => {
    setFormData(prev => ({
      ...prev,
      specificUserIds: isSelected 
        ? [...prev.specificUserIds, userId]
        : prev.specificUserIds.filter(id => id !== userId)
    }))
    
    setSelectedUsers(prev => 
      isSelected 
        ? [...prev, userId]
        : prev.filter(id => id !== userId)
    )
  }

  // Handle select all filtered users
  const handleSelectAllFiltered = () => {
    const filteredUserIds = filteredUsers.map(user => user.id)
    const newSelection = [...new Set([...formData.specificUserIds, ...filteredUserIds])]
    setFormData(prev => ({ ...prev, specificUserIds: newSelection }))
    setSelectedUsers(prev => [...new Set([...prev, ...filteredUserIds])])
  }

  const handleSubmit = async () => {
    // Validation
    if (!formData.title || !formData.message) {
      toast.error("Please fill in all required fields.")
      return
    }

    if (formData.targetType === 'broad' && !formData.targetUserRole) {
      toast.error("Please select a target user role.")
      return
    }

    if (formData.targetType === 'specific' && formData.specificUserIds.length === 0) {
      toast.error("Please select at least one user.")
      return
    }

    setLoading(true)
    try {
      const session = await getSession()
      const userId = session?.user?.id

      const result = await createEnhancedNotification({
        title: formData.title,
        message: formData.message,
        messageType: formData.messageType,
        targetType: formData.targetType,
        targetUserRole: formData.targetUserRole,
        specificUserIds: formData.specificUserIds,
        userId: userId,
      })

      toast.success(
        `Notification sent successfully! Target: ${result.targetCount} users, Delivered: ${result.deliveredCount}, Failed: ${result.failedCount}`
      )
      
      if (onSuccess) {
        onSuccess(result)
      }
    } catch (error) {
      console.error('Error creating notification:', error)
      toast.error(error.message || 'Failed to create notification')
    } finally {
      setLoading(false)
    }
  }

  const getSelectedUserCount = () => {
    if (formData.targetType === 'broad') {
      return users.length
    }
    return selectedUsers.length
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Enhanced Notification Form
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Notification Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter notification title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="messageType">Type</Label>
              <Select
                value={formData.messageType}
                onValueChange={(value) => handleSelectChange("messageType", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {messageTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              placeholder="Enter notification message"
              rows={4}
            />
          </div>

          {/* Targeting Options */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Targeting Type</Label>
              <div className="flex gap-4">
                {/* <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="broad"
                    checked={formData.targetType === 'broad'}
                    onChange={(e) => handleSelectChange("targetType", e.target.value)}
                    className="rounded"
                  />
                  <span>Broad (All users of a role)</span>
                </label> */}
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    value="specific"
                    checked={formData.targetType === 'specific'}
                    onChange={(e) => handleSelectChange("targetType", e.target.value)}
                    className="rounded"
                  />
                  <span>Specific (Select individual users)</span>
                </label>
              </div>
            </div>

            {formData.targetType === 'broad' && (
              <div className="space-y-2">
                <Label htmlFor="targetUserRole">Target User Role</Label>
                <Select
                  value={formData.targetUserRole}
                  onValueChange={(value) => handleSelectChange("targetUserRole", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user role" />
                  </SelectTrigger>
                  <SelectContent>
                    {userRoleOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {formData.targetType === 'specific' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>User Role for Search</Label>
                  <Select
                    value={formData.targetUserRole}
                    onValueChange={(value) => handleSelectChange("targetUserRole", value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select user role to search" />
                    </SelectTrigger>
                    <SelectContent>
                      {userRoleOptions.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Search Users</Label>
                  <p className="text-sm text-muted-foreground">
                    Search and select which users to send this notification to
                  </p>
                  
                  {/* Search Box and Filters */}
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users by name, email, or phone..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      {filteredUsers.length > 0 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleSelectAllFiltered}
                          className="px-3"
                        >
                          Select All
                        </Button>
                      )}
                    </div>
                    
                    {/* Advanced Filters for Vendors */}
                    {formData.targetUserRole === 'vendor' && (
                      <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">Advanced Filters</Label>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={clearAllFilters}
                            className="h-auto py-1 px-2 text-xs"
                          >
                            Clear all
                          </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                          {/* Subscription Status Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Subscription Status</Label>
                            <Select
                              value={filters.subscription}
                              onValueChange={(value) => handleFilterChange("subscription", value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="All subscriptions" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All subscriptions</SelectItem>
                                <SelectItem value="active">✓ Active</SelectItem>
                                <SelectItem value="pending">⏳ Pending</SelectItem>
                                <SelectItem value="expired">⚠️ Expired</SelectItem>
                                <SelectItem value="cancelled">❌ Cancelled</SelectItem>
                                <SelectItem value="unsubscribed">❌ Unsubscribed</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Vendor Status Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Status</Label>
                            <Select
                              value={filters.status}
                              onValueChange={(value) => handleFilterChange("status", value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="All statuses" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="active_pending">✓ Active + Pending (Recommended)</SelectItem>
                                <SelectItem value="active">Active only</SelectItem>
                                <SelectItem value="pending">Pending only</SelectItem>
                                <SelectItem value="suspended">Suspended only</SelectItem>
                                <SelectItem value="inactive">Inactive only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* City Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">City</Label>
                            <Select
                              value={filters.city}
                              onValueChange={(value) => handleFilterChange("city", value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="All cities" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All cities</SelectItem>
                                {filterOptions.cities.map((city) => (
                                  <SelectItem key={city} value={city}>
                                    {city}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Service Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Service</Label>
                            <Select
                              value={filters.service}
                              onValueChange={(value) => handleFilterChange("service", value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="All services" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All services</SelectItem>
                                {filterOptions.services.map((service) => (
                                  <SelectItem key={service} value={service}>
                                    {service}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Verification Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Verification</Label>
                            <Select
                              value={filters.verified}
                              onValueChange={(value) => handleFilterChange("verified", value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="All vendors" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All vendors</SelectItem>
                                <SelectItem value="verified">Verified only</SelectItem>
                                <SelectItem value="unverified">Unverified only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Onboarded By Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Onboarded By</Label>
                            <Select
                              value={filters.onboardedBy}
                              onValueChange={(value) => handleFilterChange("onboardedBy", value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="All onboarders" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All onboarders</SelectItem>
                                <SelectItem value="none">None (Self-registered)</SelectItem>
                                {employeesLoading ? (
                                  <SelectItem value="loading" disabled>Loading...</SelectItem>
                                ) : employees.map((emp) => (
                                  <SelectItem key={emp._id} value={emp._id}>
                                    {emp.name} - {emp.email} ({emp.role?.name || 'User'})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        
                        {/* Second row for Online Status */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                          {/* Online Status Filter */}
                          <div className="space-y-2">
                            <Label className="text-xs font-medium">Online Status</Label>
                            <Select
                              value={filters.online}
                              onValueChange={(value) => handleFilterChange("online", value)}
                            >
                              <SelectTrigger className="h-8">
                                <SelectValue placeholder="All vendors" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All vendors</SelectItem>
                                <SelectItem value="online">Online only</SelectItem>
                                <SelectItem value="offline">Offline only</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        {/* Active Filters Display */}
                        {(filters.subscription !== 'all' || filters.status !== 'all' || filters.verified !== 'all' || filters.city !== 'all' || filters.service !== 'all' || filters.onboardedBy !== 'all' || filters.online !== 'all') && (
                          <div className="flex items-center gap-2 flex-wrap pt-2 border-t">
                            <span className="text-xs text-muted-foreground">Active filters:</span>
                            
                            {filters.subscription !== 'all' && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                Subscription: {filters.subscription}
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange("subscription", "all")}
                                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </Badge>
                            )}

                            {filters.status !== 'all' && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                Status: {filters.status === 'active_pending' ? 'Active + Pending' : filters.status}
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange("status", "all")}
                                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </Badge>
                            )}

                            {filters.city !== 'all' && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                City: {filters.city}
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange("city", "all")}
                                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </Badge>
                            )}

                            {filters.service !== 'all' && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                Service: {filters.service}
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange("service", "all")}
                                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </Badge>
                            )}

                            {filters.verified !== 'all' && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                {filters.verified === "verified" ? "Verified" : "Unverified"}
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange("verified", "all")}
                                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </Badge>
                            )}

                            {filters.onboardedBy !== 'all' && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                Onboarded By: {filters.onboardedBy === 'none' ? 'None' : (employees.find(e => e._id === filters.onboardedBy)?.name || filters.onboardedBy)}
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange("onboardedBy", "all")}
                                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </Badge>
                            )}

                            {filters.online !== 'all' && (
                              <Badge variant="secondary" className="gap-1 text-xs">
                                {filters.online === "online" ? "Online" : "Offline"}
                                <button
                                  type="button"
                                  onClick={() => handleFilterChange("online", "all")}
                                  className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                                >
                                  <X className="h-2 w-2" />
                                </button>
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                
                {searchingUsers ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    <span className="ml-2 text-sm text-muted-foreground">Loading users...</span>
                  </div>
                ) : (
                  <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                    {filteredUsers.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        {users.length === 0 ? "No users available" : "No users match your search"}
                      </p>
                    ) : (
                      filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`user-${user.id}`}
                            checked={formData.specificUserIds.includes(user.id)}
                            onChange={(e) => handleUserSelection(user.id, e.target.checked)}
                            className="rounded"
                          />
                          <Label 
                            htmlFor={`user-${user.id}`} 
                            className="text-sm font-normal cursor-pointer flex-1"
                          >
                            <div>
                              <div className="font-medium">
                                {user.businessName || user.name}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {user.businessName ? `${user.name} • ` : ''}{user.email} • {user.phone}
                                {user.status && ` • ${user.status}`}
                                {user.subscriptionDetails && user.subscriptionDetails.planName && 
                                  ` • Plan: ${user.subscriptionDetails.planName}`}
                              </div>
                            </div>
                          </Label>
                          <div className="flex items-center gap-1">
                            <Badge variant="outline" className="text-xs">
                              {user.role}
                            </Badge>
                            {user.hasFcmToken && (
                              <Badge variant="secondary" className="text-xs">
                                FCM
                              </Badge>
                            )}
                            {user.role === 'vendor' && user.subscriptionStatus && (
                              <Badge 
                                variant={
                                  user.subscriptionStatus === 'active' ? 'default' :
                                  user.subscriptionStatus === 'pending' ? 'secondary' :
                                  user.subscriptionStatus === 'expired' ? 'destructive' :
                                  user.subscriptionStatus === 'cancelled' ? 'outline' :
                                  'outline'
                                }
                                className="text-xs"
                              >
                                {user.subscriptionStatus === 'active' ? '✓ Subscribed' :
                                 user.subscriptionStatus === 'pending' ? '⏳ Pending' :
                                 user.subscriptionStatus === 'expired' ? '⚠️ Expired' :
                                 user.subscriptionStatus === 'cancelled' ? '❌ Cancelled' :
                                 '❌ Unsubscribed'}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {/* Search Results Summary */}
                {(searchTerm || (formData.targetUserRole === 'vendor' && (filters.subscription !== 'all' || filters.status !== 'all' || filters.verified !== 'all' || filters.city !== 'all' || filters.service !== 'all' || filters.onboardedBy !== 'all' || filters.online !== 'all'))) && (
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredUsers.length} of {users.length} users
                    {formData.targetUserRole === 'vendor' && (filters.subscription !== 'all' || filters.status !== 'all' || filters.verified !== 'all' || filters.city !== 'all' || filters.service !== 'all' || filters.onboardedBy !== 'all' || filters.online !== 'all') && 
                      ` (with active filters)`}
                  </div>
                )}
                
                {/* Selection Summary */}
                {formData.specificUserIds.length > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Selected: {formData.specificUserIds.length} user(s)
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setFormData(prev => ({ ...prev, specificUserIds: [] }))
                        setSelectedUsers([])
                      }}
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-muted p-4 rounded-md">
            <div className="text-sm font-medium mb-2">Notification Summary</div>
            <div className="space-y-1 text-sm">
              <div><span className="font-medium">Target Type:</span> {formData.targetType === 'broad' ? 'Broad' : 'Specific'}</div>
              {formData.targetType === 'broad' && (
                <div><span className="font-medium">Target Users:</span> {userRoleOptions.find(opt => opt.value === formData.targetUserRole)?.label}</div>
              )}
              {formData.targetType === 'specific' && (
                <div><span className="font-medium">Selected Users:</span> {selectedUsers.length} users</div>
              )}
              <div><span className="font-medium">Message Type:</span> {formData.messageType}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSubmit} disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Send Notification
        </Button>
      </div>
    </div>
  )
} 