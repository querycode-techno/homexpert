"use client"

import { useMemo, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { 
  Phone, 
  Mail, 
  MapPin, 
  Calendar, 
  MoreHorizontal, 
  Eye, 
  EyeOff,
  UserPlus, 
  Edit, 
  Trash2,
  Clock,
  Users,
  CheckCircle,
  AlertTriangle,
  User
} from "lucide-react"
import { format, formatDistanceToNow } from "date-fns"

// Function to parse city from address format
const parseCity = (address) => {
  if (!address) return 'Unknown'
  
  try {
    // Remove pincode pattern (ends with - followed by numbers)
    const withoutPincode = address.replace(/\s*-\s*\d+\s*$/, '')
    
    // Split by comma and get the parts
    const parts = withoutPincode.split(',').map(part => part.trim())
    
    if (parts.length >= 2) {
      // Get the second-to-last part (city is usually before state)
      const cityPart = parts[parts.length - 2]
      
      // Handle cases like "Noida Sector 35/4, Noida, Uttar Pradesh"
      // where city might be repeated
      const lastPart = parts[parts.length - 1]
      
      // If last part doesn't look like a state (contains numbers or special chars)
      // then use the last part as city
      if (lastPart && /\d|\//.test(lastPart)) {
        return cityPart || 'Unknown'
      }
      
      // Otherwise use the second-to-last part
      return cityPart || 'Unknown'
    }
    
    // If only one part, return it as city
    return parts[0] || 'Unknown'
  } catch (error) {
    console.error('Error parsing city:', error)
    return 'Unknown'
  }
}

// Function to mask phone number
const maskPhone = (phone) => {
  if (!phone) return 'No phone'
  const cleanPhone = phone.replace(/\D/g, '') // Remove non-digits
  if (cleanPhone.length >= 4) {
    const lastFour = cleanPhone.slice(-4)
    return `******${lastFour}`
  }
  return '******'
}

// Status configuration
const STATUS_CONFIG = {
  pending: {
    variant: "secondary",
    color: "bg-yellow-100 text-yellow-800",
    icon: Clock
  },
  available: {
    variant: "default", 
    color: "bg-blue-100 text-blue-800",
    icon: Users
  },
  taken: {
    variant: "outline",
    color: "bg-purple-100 text-purple-800", 
    icon: CheckCircle
  },
  contacted: {
    variant: "destructive",
    color: "bg-orange-100 text-orange-800",
    icon: AlertTriangle
  },
  completed: {
    variant: "success",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle
  },
  cancelled: {
    variant: "destructive",
    color: "bg-red-100 text-red-800",
    icon: AlertTriangle
  }
}

function LeadTableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-8 w-8" />
        </div>
      ))}
    </div>
  )
}

function LeadTableRow({ 
  lead, 
  isSelected, 
  onSelection, 
  onViewLead, 
  onLeadAction 
}) {
  const [showPhone, setShowPhone] = useState(false)
  const statusConfig = STATUS_CONFIG[lead.status] || STATUS_CONFIG.pending
  const StatusIcon = statusConfig.icon

  const handleQuickStatusChange = (newStatus) => {
    onLeadAction('updateStatus', lead._id, { 
      status: newStatus,
      notes: `Quick status update via table`
    })
  }

  const handleAssignVendors = () => {
    // This would open an assignment dialog for this specific lead
    onLeadAction('openAssignment', lead._id)
  }

  const handleDeleteLead = () => {
    onLeadAction('delete', lead._id, { 
      reason: 'Deleted from lead table'
    })
  }

  return (
    <TableRow className="hover:bg-muted/50">
      {/* Selection Checkbox */}
      <TableCell className="w-12">
        <Checkbox
          checked={isSelected}
          onCheckedChange={(checked) => onSelection(lead._id, checked)}
        />
      </TableCell>

      {/* Customer Info with Phone Toggle */}
      <TableCell>
        <div className="flex items-center space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {lead.customerName?.charAt(0)?.toUpperCase() || 'L'}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">
              {lead.customerName || 'Unknown'}
            </div>
            <div className="flex items-center text-xs text-muted-foreground gap-2">
              <Phone className="h-3 w-3" />
              <span className="select-none">
                {showPhone ? (lead.customerPhone || 'No phone') : maskPhone(lead.customerPhone)}
              </span>
              <button
                onClick={() => setShowPhone(!showPhone)}
                className="ml-1 p-0.5 hover:bg-muted rounded transition-colors"
                type="button"
              >
                {showPhone ? (
                  <EyeOff className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                ) : (
                  <Eye className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                )}
              </button>
      
            </div>
          </div>
        </div>
      </TableCell>

      {/* City */}
      <TableCell>
        <div className="flex items-center text-sm">
          <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
          <span className="truncate max-w-[120px]">
            {parseCity(lead.address)}
          </span>
        </div>
      </TableCell>

      {/* Service */}
      <TableCell className="w-48">
        <div className="min-w-0 max-w-[180px]">
          <div className="font-medium truncate">
            {lead.selectedService || lead.service || 'No service'}
          </div>
          {lead.selectedSubService && (
            <div className="text-xs text-muted-foreground truncate">
              {lead.selectedSubService}
            </div>
          )}
        </div>
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge variant={statusConfig.variant} className="flex items-center gap-1">
          <StatusIcon className="h-3 w-3" />
          {lead.status?.charAt(0).toUpperCase() + lead.status?.slice(1) || 'Unknown'}
        </Badge>
      </TableCell>

      {/* Assignment */}
      <TableCell>
        {lead.isAssigned ? (
          <div className="space-y-1">
            <Badge variant="outline" className="bg-green-50 border-green-200">
              <CheckCircle className="h-3 w-3 mr-1" />
              Assigned
            </Badge>
            <div className="text-xs text-muted-foreground">
              {lead.assignedVendorCount} vendor(s)
            </div>
          </div>
        ) : (
          <Badge variant="outline" className="bg-amber-50 border-amber-200">
            <Clock className="h-3 w-3 mr-1" />
            Unassigned
          </Badge>
        )}
      </TableCell>

      {/* Created By */}
      <TableCell>
        <div className="flex items-center space-x-2">
          <User className="h-3 w-3 text-muted-foreground" />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium truncate">
              {lead.createdByUser?.name || 'Unknown'}
            </div>
            <div className="text-xs text-muted-foreground truncate">
              {lead.createdByUser?.roleName || 'N/A'}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Actions */}
      <TableCell className="w-12">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onViewLead(lead)}>
              <Eye className="h-4 w-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onLeadAction('editBasicInfo', lead._id)}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Lead
            </DropdownMenuItem>
            {!lead.isAssigned && (
              <DropdownMenuItem onClick={handleAssignVendors}>
                <UserPlus className="h-4 w-4 mr-2" />
                Assign Vendors
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleDeleteLead}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Lead
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function PaginationControls({ pagination, onPageChange }) {
  const { currentPage, totalPages, totalItems, hasNextPage, hasPrevPage } = pagination

  return (
    <div className="flex items-center justify-between px-2 py-4">
      <div className="text-sm text-muted-foreground">
        Showing page {currentPage} of {totalPages} ({totalItems} total items)
      </div>
      <div className="flex items-center space-x-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!hasPrevPage}
          onClick={() => onPageChange(currentPage - 1)}
        >
          Previous
        </Button>
        
        {/* Page numbers */}
        <div className="flex items-center space-x-1">
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            let pageNum
            if (totalPages <= 5) {
              pageNum = i + 1
            } else if (currentPage <= 3) {
              pageNum = i + 1
            } else if (currentPage >= totalPages - 2) {
              pageNum = totalPages - 4 + i
            } else {
              pageNum = currentPage - 2 + i
            }

            return (
              <Button
                key={pageNum}
                variant={pageNum === currentPage ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => onPageChange(pageNum)}
              >
                {pageNum}
              </Button>
            )
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          disabled={!hasNextPage}
          onClick={() => onPageChange(currentPage + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

export function LeadTable({
  leads = [],
  loading = false,
  selectedLeads = [],
  onLeadSelection,
  onSelectAll,
  onViewLead,
  onLeadAction,
  pagination,
  onPageChange
}) {
  const allSelected = useMemo(() => {
    return leads.length > 0 && selectedLeads.length === leads.length
  }, [leads.length, selectedLeads.length])

  const indeterminate = useMemo(() => {
    return selectedLeads.length > 0 && selectedLeads.length < leads.length
  }, [selectedLeads.length, leads.length])

  if (loading) {
    return <LeadTableSkeleton />
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border">
        <div className="overflow-x-auto min-w-full ">
          <Table className=" min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = indeterminate;
                    }}
                    onCheckedChange={(checked) => onSelectAll(checked)}
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>City</TableHead>
                <TableHead className="w-48">Service</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Assignment</TableHead>
                <TableHead>Created By</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="text-muted-foreground">No leads found</div>
                      <div className="text-sm text-muted-foreground">
                        Try adjusting your filters or add new leads
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <LeadTableRow
                    key={lead._id}
                    lead={lead}
                    isSelected={selectedLeads.includes(lead._id)}
                    onSelection={onLeadSelection}
                    onViewLead={onViewLead}
                    onLeadAction={onLeadAction}
                  />
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {pagination && (
        <PaginationControls
          pagination={pagination}
          onPageChange={onPageChange}
        />
      )}
    </div>
  )
} 