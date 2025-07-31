"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
  const [currentPage, setCurrentPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [totalVendors, setTotalVendors] = useState(0)
  const [serviceFilter, setServiceFilter] = useState('')
  const [cityFilter, setCityFilter] = useState('')
  const [availableServices, setAvailableServices] = useState([])
  const [availableCities, setAvailableCities] = useState([])

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
      setServiceFilter('')
      setCityFilter('')
      setCurrentPage(1)
      setHasMore(true)
      setVendors([])
      setTotalVendors(0)
      setAvailableServices([])
      setAvailableCities([])
    }
  }, [open])

  // Handle search with debouncing
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (open && selectedLeads.length > 0) {
        setCurrentPage(1)
        fetchVendors(1, searchTerm, serviceFilter, cityFilter, true)
      }
    }, 500)

    return () => clearTimeout(delayedSearch)
  }, [searchTerm, serviceFilter, cityFilter, open, selectedLeads])

  // Load more vendors
  const loadMoreVendors = () => {
    if (hasMore && !loadingMore && !loading) {
      fetchVendors(currentPage + 1, searchTerm, serviceFilter, cityFilter, false)
    }
  }

  const fetchVendors = async (page = 1, search = '', service = '', city = '', reset = false) => {
    if (page === 1) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const params = new URLSearchParams({
        leadIds: selectedLeads.join(','),
        page: page.toString(),
        limit: '20',
        search: search
      });
      
      if (service) params.append('service', service);
      if (city) params.append('city', city);
      
      const response = await fetch(`/api/admin/leads/assign?${params}`)
      const result = await response.json()
      console.log(result);
      
              if (result.success) {
          const newVendors = result.data.suggestedVendors || []
          
          if (reset || page === 1) {
            setVendors(newVendors)
            // Extract unique services and cities for filters
            const services = [...new Set(newVendors.flatMap(v => v.services || []))].sort()
            const cities = [...new Set(newVendors.map(v => v.address?.city).filter(Boolean))].sort()
            setAvailableServices(services)
            setAvailableCities(cities)
          } else {
            setVendors(prev => [...prev, ...newVendors])
          }
          
          setHasMore(result.data.pagination?.hasMore || false)
          setTotalVendors(result.data.pagination?.total || 0)
          setCurrentPage(page)
      } else {
        toast.error('Failed to fetch vendors')
        if (page === 1) setVendors([])
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to fetch vendors')
      if (page === 1) setVendors([])
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const handleAssign = async (assignToAll = false) => {
    const vendorsToAssign = assignToAll ? vendors.map(v => v._id) : selectedVendors
    
    
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
      const result = await onAssign('assign', assignmentData)
      
      // Show success message with notification info
      let successMessage = `Successfully assigned ${selectedLeads.length} lead${selectedLeads.length > 1 ? 's' : ''} to ${vendorsToAssign.length} vendor${vendorsToAssign.length > 1 ? 's' : ''}`
      
      if (result?.data?.notifications?.sent) {
        const { sentCount, totalVendors } = result.data.notifications
        successMessage += `. Notifications sent to ${sentCount}/${totalVendors} vendors.`
      } else if (result?.data?.notifications?.sent === false) {
        successMessage += '. Note: Notifications could not be sent.'
      }
      
      toast.success(successMessage)
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

  // Use vendors directly since filtering is now done server-side
  const filteredVendors = vendors

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
          <p className="text-lg font-medium">No vendors found</p>
          <p className="text-sm">
            {searchTerm 
              ? 'No vendors match your search criteria' 
              : vendors.length === 0 
                ? 'No vendors available in the system'
                : 'No vendors available'
            }
          </p>
          {vendors.length > 0 && searchTerm && (
            <p className="text-xs mt-2 text-blue-600">
              Try searching with different keywords or clear the search to see all {vendors.length} available vendors
            </p>
          )}
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
                {vendor.businessName || vendor.userData?.name || `Vendor ${vendor._id?.slice(-6)}`}
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
              {vendor.services && vendor.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {vendor.services.slice(0, 3).map((service, index) => (
                    <Badge 
                      key={index} 
                      variant="secondary" 
                      className="text-xs px-2 py-1"
                    >
                      {service}
                    </Badge>
                  ))}
                  {vendor.services.length > 3 && (
                    <Badge 
                      variant="outline" 
                      className="text-xs px-2 py-1"
                    >
                      +{vendor.services.length - 3} more
                    </Badge>
                  )}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <div className="flex items-center">
                <Star className="h-4 w-4 text-yellow-500 mr-1" />
                <span>{vendor.rating?.toFixed(1) || 'N/A'}</span>
              </div>
              <Badge variant="outline" className="text-xs">
               {vendor.status}
              </Badge>
            </div>
          </div>
        ))}
        
        {/* Load More Button */}
        {hasMore && vendors.length > 0 && (
          <div className="flex justify-center py-4">
            <Button
              variant="outline"
              onClick={loadMoreVendors}
              disabled={loadingMore || loading}
              className="w-full max-w-xs"
            >
              {loadingMore ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  Loading...
                </>
              ) : (
                `Load More (${vendors.length} of ${totalVendors})`
              )}
            </Button>
          </div>
        )}
        
        {/* End of List Indicator */}
        {!hasMore && vendors.length > 0 && (
          <div className="text-center py-4 text-sm text-muted-foreground">
            All vendors loaded ({totalVendors} total)
          </div>
        )}
      </div>
    )
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] h-[85vh] flex flex-col">
        <DialogHeader className="flex-shrink-0 pb-4">
          <DialogTitle>
            Assign {selectedLeads.length === 1 ? 'Lead' : 'Leads'} to Vendors
          </DialogTitle>
          <DialogDescription>
            Select vendors to assign {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''} to
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col space-y-4 min-h-0 overflow-hidden">
          {/* Search and Filters */}
          <div className="flex-shrink-0 space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, phone and email, city, services..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            {/* Filters */}
            <div className="flex gap-3">
              <Select value={serviceFilter || "all"} onValueChange={(value) => setServiceFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  {availableServices.map((service) => (
                    <SelectItem key={service} value={service}>
                      {service}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={cityFilter || "all"} onValueChange={(value) => setCityFilter(value === "all" ? "" : value)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filter by city" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {availableCities.map((city) => (
                    <SelectItem key={city} value={city}>
                      {city}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {/* Clear Filters */}
              {(serviceFilter || cityFilter) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setServiceFilter('')
                    setCityFilter('')
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>

          {/* Assignment Options */}
          <div className="flex-shrink-0 flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
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
              {totalVendors > 0 && (
                <span className="text-xs text-muted-foreground">
                  ({vendors.length} of {totalVendors} loaded)
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
                onClick={() => setSelectedVendors(vendors.map(v => v._id))}
                disabled={vendors.length === 0}
              >
                Select All Loaded ({vendors.length})
              </Button>
            </div>
          </div>

          {/* Vendor List */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <ScrollArea className="h-full">
              <div className="pr-4">
                <VendorList />
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 flex flex-col sm:flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          
          <div className="flex flex-col sm:flex-row gap-2 sm:ml-auto">
            <Button 
              variant="outline"
              onClick={() => handleAssign(true)}
              disabled={vendors.length === 0 || loading}
              className="w-full sm:w-auto"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Assign to All Loaded ({vendors.length})
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