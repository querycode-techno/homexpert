"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Star, Users, Search, UserPlus } from "lucide-react"

export function AssignmentDialog({ 
  open, 
  onOpenChange, 
  selectedLeads = [], 
  onAssign 
}) {
  const [selectedVendors, setSelectedVendors] = useState([])
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Fetch vendors when dialog opens
  useEffect(() => {
    if (open && selectedLeads.length > 0) {
      fetchVendors()
    }
  }, [open, selectedLeads])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedVendors([])
      setSearchTerm('')
    }
  }, [open])

  const fetchVendors = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/leads/assign?leadIds=${selectedLeads.join(',')}`)
      const result = await response.json()
      
      if (result.success) {
        setVendors(result.data.suggestedVendors || [])
      } else {
        toast.error('Failed to fetch vendors')
        setVendors([])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to fetch vendors')
      setVendors([])
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = async (assignToAll = false) => {
    const vendorsToAssign = assignToAll ? filteredVendors.map(v => v._id) : selectedVendors
    
    if (vendorsToAssign.length === 0) {
      toast.error('Please select at least one vendor or use "Assign to All"')
      return
    }

    const assignmentData = {
      leadIds: selectedLeads,
      assignmentType: 'manual',
      vendorIds: vendorsToAssign,
      assignedBy: 'admin',
      assignmentMode: assignToAll ? 'all' : 'selected'
    }

    try {
      await onAssign('assign', assignmentData)
      toast.success(`Successfully assigned ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} to ${vendorsToAssign.length} vendor${vendorsToAssign.length > 1 ? 's' : ''}`)
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to assign leads. Please try again.')
    }
  }

  const handleVendorToggle = (vendorId) => {
    setSelectedVendors(prev => 
      prev.includes(vendorId) 
        ? prev.filter(id => id !== vendorId)
        : [...prev, vendorId]
    )
  }

  // Filter vendors based on search
  const filteredVendors = vendors.filter(vendor => 
    vendor.businessName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vendor.services?.some(service => 
      service.toLowerCase().includes(searchTerm.toLowerCase())
    ) ||
    vendor.address?.city?.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const VendorList = () => {
    if (loading) {
      return (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-3 p-3 border rounded">
              <Skeleton className="h-4 w-4" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          ))}
        </div>
      )
    }

    if (filteredVendors.length === 0) {
      return (
        <div className="text-center py-12 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p className="text-lg font-medium">No vendors available</p>
          <p className="text-sm">
            {vendors.length === 0 
              ? 'No vendors match the lead requirements' 
              : 'No vendors match your search criteria'
            }
          </p>
        </div>
      )
    }

    return (
                <div className="space-y-2">
            {filteredVendors.map((vendor) => (
              <div 
                key={vendor._id}
                className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${
                  selectedVendors.includes(vendor._id) 
                    ? 'bg-blue-50 border-blue-200 ring-1 ring-blue-200' 
                    : 'hover:border-muted-foreground/20'
                }`}
                onClick={() => handleVendorToggle(vendor._id)}
              >
                <Checkbox 
                  checked={selectedVendors.includes(vendor._id)}
                  readOnly
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate flex items-center gap-2">
                    {vendor.businessName || vendor.name || `Vendor ${vendor._id?.slice(-6)}`}
                    {selectedVendors.includes(vendor._id) && (
                      <Badge variant="secondary" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {vendor.userData?.email || 'No email'} • {vendor.address?.city || 'Location not set'}
                  </div>
                  {vendor.userData?.phone && (
                    <div className="text-xs text-muted-foreground mt-1">
                      📞 {vendor.userData.phone}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-3 text-sm">
                  <div className="flex items-center">
                    <Star className="h-4 w-4 text-yellow-500 mr-1" />
                    <span>{vendor.rating?.toFixed(1) || 'N/A'}</span>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Active Vendor
                  </Badge>
                </div>
              </div>
            ))}
          </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Assign {selectedLeads.length === 1 ? 'Lead' : 'Leads'} to Vendors
          </DialogTitle>
          <DialogDescription>
            Select vendors to assign {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} to
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 py-4 min-h-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors by name, service, or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Assignment Options */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Assignment:</span>
              {selectedVendors.length > 0 ? (
                <span className="text-sm text-blue-700">
                  {selectedVendors.length} vendor{selectedVendors.length > 1 ? 's' : ''} selected
                </span>
              ) : (
                <span className="text-sm text-muted-foreground">
                  No vendors selected
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {selectedVendors.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedVendors([])}
                >
                  Clear Selection
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedVendors(filteredVendors.map(v => v._id))}
                disabled={filteredVendors.length === 0}
              >
                Select All ({filteredVendors.length})
              </Button>
            </div>
          </div>

          {/* Vendor List */}
          <div className="flex-1 min-h-0">
            <ScrollArea className="h-full pr-4">
              <VendorList />
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 pt-4 border-t bg-background">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
            <Button 
              variant="outline"
              onClick={() => handleAssign(true)}
              disabled={filteredVendors.length === 0 || loading}
              className="w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to All ({filteredVendors.length})
            </Button>
            
            <Button 
              onClick={() => handleAssign(false)}
              disabled={selectedVendors.length === 0 || loading}
              className="w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to Selected ({selectedVendors.length})
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 