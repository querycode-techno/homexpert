"use client"

import { useState, useEffect } from "react"
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

  const userRoleOptions = [
    { value: "vendor", label: "Vendors" },
    { value: "customer", label: "Customers" },
    { value: "admin", label: "Admins" },
    { value: "support_team", label: "Support Team" },
    { value: "helpline", label: "Helpline" },
    { value: "telecaller", label: "Telecaller" },
  ]

  const messageTypeOptions = [
    { value: "Info", label: "Info" },
    { value: "Success", label: "Success" },
    { value: "Warning", label: "Warning" },
    { value: "Alert", label: "Alert" },
  ]

  // Search users when target type or search term changes
  useEffect(() => {
    if (formData.targetType === 'specific') {
      searchUsers()
    }
  }, [formData.targetUserRole, searchTerm])

  // Filter users based on search
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsers(users)
    } else {
      const searchLower = searchTerm.toLowerCase()
      const filtered = users.filter(user => 
        user.name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.phone?.includes(searchTerm)
      )
      setFilteredUsers(filtered)
    }
  }, [users, searchTerm])

  const searchUsers = async () => {
    if (!formData.targetUserRole) return

    setSearchingUsers(true)
    try {
      const fetchedUsers = await fetchUsersByRole(formData.targetUserRole, "", 1000) // Get all users
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
                  
                  {/* Search Box */}
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
                              </div>
                            </div>
                          </Label>
                          <Badge variant="outline" className="text-xs">
                            {user.role}
                          </Badge>
                          {user.hasFcmToken && (
                            <Badge variant="secondary" className="text-xs">
                              FCM
                            </Badge>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                )}
                
                {/* Search Results Summary */}
                {searchTerm && (
                  <div className="text-sm text-muted-foreground">
                    Showing {filteredUsers.length} of {users.length} users
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