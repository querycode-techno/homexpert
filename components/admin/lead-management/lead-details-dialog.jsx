"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Clock, 
  UserCheck,
  Star,
  X,
  Trash2
} from "lucide-react"

export function LeadDetailsDialog({ 
  open, 
  onOpenChange, 
  leadId, 
  onUpdate 
}) {
  const [lead, setLead] = useState(null)
  const [loading, setLoading] = useState(false)
  const [removingVendor, setRemovingVendor] = useState(null)

  useEffect(() => {
    if (open && leadId) {
      fetchLeadDetails()
    }
  }, [open, leadId])

  const fetchLeadDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`)
      const result = await response.json()
      
      if (result.success) {
        setLead(result.data)
      } else {
        toast.error('Failed to fetch lead details')
      }
    } catch (error) {
      console.error('Error fetching lead details:', error)
      toast.error('Failed to fetch lead details')
    } finally {
      setLoading(false)
    }
  }

  const removeVendorFromLead = async (vendorId) => {
    if (!vendorId) return
    
    setRemovingVendor(vendorId)
    try {
      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeVendor',
          data: {
            vendorId: vendorId,
            performedBy: 'admin' // You might want to get the actual admin ID
          }
        })
      })
      
      const result = await response.json()
      if (result.success) {
        // Refresh lead details to get updated data
        await fetchLeadDetails()
        toast.success('Vendor removed successfully')
        onUpdate?.(result.data)
      } else {
        toast.error('Failed to remove vendor')
      }
    } catch (error) {
      console.error('Error removing vendor:', error)
      toast.error('Failed to remove vendor')
    } finally {
      setRemovingVendor(null)
    }
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'secondary'
      case 'available': return 'outline'
      case 'assigned': return 'default'
      case 'taken': return 'default'
      case 'contacted': return 'default'
      case 'completed': return 'default'
      case 'cancelled': return 'destructive'
      default: return 'secondary'
    }
  }

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'default'
      case 'low': return 'secondary'
      default: return 'outline'
    }
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return 'Invalid date'
    }
  }

  if (loading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!lead) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Lead Details</DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant={getStatusBadgeVariant(lead.status)}>
                {lead.status}
              </Badge>
              {lead.priority && (
                <Badge variant={getPriorityBadgeVariant(lead.priority)}>
                  {lead.priority} priority
                </Badge>
              )}
            </div>
          </div>
          <DialogDescription>
            Lead ID: {lead._id} • Created {formatDate(lead.createdAt)}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh]">
          <Tabs defaultValue="details" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="vendors">Vendors</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
            </TabsList>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Name</Label>
                      <p className="mt-1">{lead.customerName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Phone</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-muted-foreground" />
                        <a href={`tel:${lead.customerPhone}`} className="hover:underline">
                          {lead.customerPhone}
                        </a>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Email</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <a href={`mailto:${lead.customerEmail}`} className="hover:underline">
                          {lead.customerEmail}
                        </a>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Location</Label>
                      <div className="flex items-center gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{lead.address}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Service Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Service</Label>
                      <p className="mt-1 font-medium">{lead.service}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Sub-service</Label>
                      <p className="mt-1">{lead.selectedService}</p>
                    </div>
                  </div>
                  {lead.selectedSubService && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Specific Service</Label>
                      <p className="mt-1">{lead.selectedSubService}</p>
                    </div>
                  )}
                  {lead.description && (
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                      <p className="mt-1 text-sm bg-muted/50 p-3 rounded">{lead.description}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="vendors" className="space-y-4">
              {lead.assignedVendors?.length > 0 || lead.availableToVendors?.vendor?.length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">
                      Assigned Vendors ({lead.assignedVendors?.length || lead.availableToVendors?.vendor?.length || 0})
                    </h4>
                    {lead.availableToVendors?.assignedAt && (
                      <Badge variant="outline">
                        Assigned {formatDate(lead.availableToVendors.assignedAt)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Show vendors from assignedVendors (populated by API) */}
                  {lead.assignedVendors?.map((vendor, index) => (
                    <Card key={vendor._id || index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{vendor.businessName || vendor.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {vendor.userData?.email} • {vendor.userData?.phone}
                            </p>
                            {vendor.address?.city && (
                              <p className="text-xs text-muted-foreground">
                                📍 {vendor.address.city}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {vendor.rating && (
                              <div className="flex items-center">
                                <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                <span className="text-sm">{vendor.rating.toFixed(1)}</span>
                              </div>
                            )}
                            <Badge variant="outline" className="text-xs">
                              Active Vendor
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeVendorFromLead(vendor._id)}
                              disabled={removingVendor === vendor._id}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {removingVendor === vendor._id ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {/* Fallback: Show vendor IDs if assignedVendors is not populated */}
                  {!lead.assignedVendors?.length && lead.availableToVendors?.vendor?.map((vendorId, index) => (
                    <Card key={vendorId || index}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">Vendor {vendorId?.slice(-6)}</p>
                            <p className="text-sm text-muted-foreground">Vendor ID: {vendorId}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              Assigned
                            </Badge>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => removeVendorFromLead(vendorId)}
                              disabled={removingVendor === vendorId}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              {removingVendor === vendorId ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-b border-red-600" />
                              ) : (
                                <X className="h-3 w-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <UserCheck className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No vendors assigned yet</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="activity" className="space-y-4">
              {lead.leadProgressHistory?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Progress History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lead.leadProgressHistory.map((progress, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded">
                          <Badge variant={getStatusBadgeVariant(progress.toStatus)}>
                            {progress.toStatus}
                          </Badge>
                          <div className="flex-1">
                            <p className="text-sm">
                              {progress.fromStatus ? `Changed from ${progress.fromStatus} to ${progress.toStatus}` : `Set to ${progress.toStatus}`}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatDate(progress.date)}
                              {progress.performedBy && ` • by ${progress.performedBy}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {lead.notes?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lead.notes.map((note, index) => (
                        <div key={index} className="p-3 bg-muted/50 rounded">
                          <p className="text-sm">{note.note}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(note.date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {lead.followUps?.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Follow-ups</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {lead.followUps.map((followUp, index) => (
                        <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded">
                          <p className="text-sm">{followUp.followUp}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDate(followUp.date)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>


          </Tabs>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
} 