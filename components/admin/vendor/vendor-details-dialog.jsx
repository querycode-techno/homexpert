"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Phone, 
  Mail, 
  MapPin, 
  User, 
  Clock, 
  CheckCircle,
  XCircle,
  Star,
  Building,
  Calendar,
  FileText,
  Eye,
  Download,
  AlertCircle,
  Briefcase
} from "lucide-react"

export function VendorDetailsDialog({ 
  open, 
  onOpenChange, 
  vendor 
}) {
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'V'
  }

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'active': return 'default'
      case 'pending': return 'secondary'
      case 'suspended': return 'destructive'
      case 'inactive': return 'outline'
      default: return 'secondary'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'pending': return <Clock className="h-4 w-4 text-yellow-500" />
      case 'suspended': return <XCircle className="h-4 w-4 text-red-500" />
      case 'inactive': return <AlertCircle className="h-4 w-4 text-gray-500" />
      default: return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleString()
    } catch {
      return 'Not available'
    }
  }

  const getDocumentStatusIcon = (hasDoc) => {
    return hasDoc ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    )
  }

  const getDocumentLabel = (type) => {
    const labels = {
      driving_license: 'Driving License',
      aadhar_card: 'Aadhar Card',
      voter_card: 'Voter Card',
      gst: 'GST Certificate',
      msme: 'MSME Certificate',
      other: 'Other Business Document'
    }
    return labels[type] || type
  }

  if (!vendor) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={vendor.userData?.profileImage} />
              <AvatarFallback>
                {getInitials(vendor.userData?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{vendor.userData?.name}</h2>
              <p className="text-sm text-muted-foreground">{vendor.businessName}</p>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="business">Business</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[70vh] mt-4">
            <TabsContent value="overview" className="space-y-6">
              {/* Personal Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Personal Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Email</p>
                        <p className="text-sm text-muted-foreground">{vendor.userData?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Phone</p>
                        <p className="text-sm text-muted-foreground">{vendor.userData?.phone}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status & Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Status & Performance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(vendor.status)}
                      <div>
                        <p className="text-sm font-medium">Status</p>
                        <Badge variant={getStatusBadgeVariant(vendor.status)}>
                          {vendor.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <div>
                        <p className="text-sm font-medium">Rating</p>
                        <p className="text-sm">{vendor.rating || 0}/5</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Briefcase className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Total Jobs</p>
                        <p className="text-sm">{vendor.totalJobs || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {vendor.verified?.isVerified ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <div>
                      <p className="text-sm font-medium">Verification Status</p>
                      <p className="text-sm text-muted-foreground">
                        {vendor.verified?.isVerified ? 'Verified' : 'Not Verified'}
                      </p>
                    </div>
                  </div>

                  {vendor.verified?.verificationNotes && (
                    <div>
                      <p className="text-sm font-medium mb-1">Verification Notes</p>
                      <p className="text-sm text-muted-foreground">{vendor.verified.verificationNotes}</p>
                    </div>
                  )}

                  {/* Onboarded By Information */}
                  <div className="border-t pt-4">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium">Onboarded By</p>
                        <p className="text-sm text-muted-foreground">
                          {vendor.onboardedBy ? (
                            // If onboarded by someone, show their name
                            vendor.onboardedByUser?.name || 'Admin User'
                          ) : (
                            // If self-registered
                            'Self-registered'
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="business" className="space-y-6">
              {/* Business Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    Business Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-1">Business Name</p>
                    <p className="text-sm text-muted-foreground">{vendor.businessName}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-1">Services Offered</p>
                    <div className="flex flex-wrap gap-2">
                      {vendor.services?.map((service, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Address Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Address Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Street Address</p>
                      <p className="text-sm text-muted-foreground">{vendor.address?.street}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Area</p>
                      <p className="text-sm text-muted-foreground">{vendor.address?.area || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">City</p>
                      <p className="text-sm text-muted-foreground">{vendor.address?.city}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">State</p>
                      <p className="text-sm text-muted-foreground">{vendor.address?.state}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Pincode</p>
                      <p className="text-sm text-muted-foreground">{vendor.address?.pincode}</p>
                    </div>
                  </div>

                  {vendor.address?.serviceAreas?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium mb-1">Service Areas</p>
                      <div className="flex flex-wrap gap-2">
                        {vendor.address.serviceAreas.map((area, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {area.city} {area.areas?.length > 0 && `(${area.areas.join(', ')})`}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="documents" className="space-y-6">
              {/* Document Status */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Document Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Identity Document */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDocumentStatusIcon(vendor.documents?.identity?.docImageUrl)}
                      <div>
                        <p className="text-sm font-medium">Identity Document</p>
                        <p className="text-sm text-muted-foreground">
                          {vendor.documents?.identity?.type ? 
                            getDocumentLabel(vendor.documents.identity.type) : 
                            'Not uploaded'
                          }
                        </p>
                        {vendor.documents?.identity?.number && (
                          <p className="text-xs text-muted-foreground">
                            Number: {vendor.documents.identity.number}
                          </p>
                        )}
                      </div>
                    </div>
                    {vendor.documents?.identity?.docImageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(vendor.documents.identity.docImageUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    )}
                  </div>

                  {/* Business Document */}
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getDocumentStatusIcon(vendor.documents?.business?.docImageUrl)}
                      <div>
                        <p className="text-sm font-medium">Business Document</p>
                        <p className="text-sm text-muted-foreground">
                          {vendor.documents?.business?.type ? 
                            getDocumentLabel(vendor.documents.business.type) : 
                            'Not uploaded'
                          }
                        </p>
                        {vendor.documents?.business?.number && (
                          <p className="text-xs text-muted-foreground">
                            Number: {vendor.documents.business.number}
                          </p>
                        )}
                      </div>
                    </div>
                    {vendor.documents?.business?.docImageUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(vendor.documents.business.docImageUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history" className="space-y-6">
              {/* Activity History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Activity History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {vendor.history?.length > 0 ? (
                    <div className="space-y-3">
                      {vendor.history.map((entry, index) => (
                        <div key={index} className="flex items-start gap-3 pb-3 border-b last:border-b-0">
                          <div className="flex-shrink-0 mt-1">
                            <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium capitalize">
                              {entry.action.replace('_', ' ')}
                            </p>
                            {entry.notes && (
                              <p className="text-sm text-muted-foreground">{entry.notes}</p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              {formatDate(entry.date)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No activity history available</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium mb-1">Created At</p>
                      <p className="text-sm text-muted-foreground">{formatDate(vendor.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium mb-1">Last Updated</p>
                      <p className="text-sm text-muted-foreground">{formatDate(vendor.updatedAt)}</p>
                    </div>
                    {vendor.verified?.verifiedAt && (
                      <div>
                        <p className="text-sm font-medium mb-1">Verified At</p>
                        <p className="text-sm text-muted-foreground">{formatDate(vendor.verified.verifiedAt)}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 