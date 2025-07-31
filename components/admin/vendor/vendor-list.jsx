"use client"

import { useState, useMemo, useRef, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MoreHorizontal,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Star,
  MapPin,
  Briefcase,
  ChevronDown,
  X
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { VendorFilters } from "./vendor-filters"

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
    color: "text-yellow-500"
  },
  active: {
    label: "Active",
    variant: "success",
    icon: CheckCircle,
    color: "text-green-500"
  },
  suspended: {
    label: "Suspended",
    variant: "destructive",
    icon: XCircle,
    color: "text-red-500"
  },
  inactive: {
    label: "Inactive",
    variant: "secondary",
    icon: AlertCircle,
    color: "text-gray-500"
  },
  incomplete: {
    label: "Incomplete",
    variant: "outline",
    icon: AlertCircle,
    color: "text-orange-500"
  }
}

export function VendorList({
  vendors = [],
  loading = false,
  pagination = {},
  onAddVendor,
  onEditVendor,
  onDeleteVendor,
  onViewVendor,
  onVerifyVendor,
  onStatusChange,
  onExport,
  onImport,
  onDownloadTemplate,
  onSearch,
  onFilter,
  onPageChange,
  // Add current values as props
  searchTerm: currentSearchTerm = "",
  filters: currentFilters = {}
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(currentSearchTerm)
  const [showFilters, setShowFilters] = useState(false)
  const [localFilters, setLocalFilters] = useState(currentFilters)
  
  // Debounce timeout ref
  const searchTimeoutRef = useRef(null)

  // Note: Removed sync useEffect to prevent focus loss during typing
  // The localSearchTerm is initialized from currentSearchTerm and managed independently

  useEffect(() => {
    setLocalFilters(currentFilters)
  }, [currentFilters])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
  }, [])

  // Handle search with debounce
  const handleSearch = (value) => {
    setLocalSearchTerm(value)
    
    // Clear existing timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current)
    }
    
    // Set new timeout for debounced API call
    searchTimeoutRef.current = setTimeout(() => {
      onSearch?.(value)
    }, 500)
  }

  const handleFilterChange = (newFilters) => {
    setLocalFilters(newFilters)
    onFilter?.(newFilters)
  }

  // Clear all filters and search
  const clearFilters = () => {
    const emptyFilters = { status: "", city: "", service: "", verified: "" }
    
    // Update local state immediately
    setLocalFilters(emptyFilters)
    setLocalSearchTerm("")
    
    // Call parent handlers to trigger URL updates and server refresh
    // Call filter handler first with empty filters
    if (onFilter) {
      onFilter(emptyFilters)
    }
    
    // Then call search handler to clear search
    if (onSearch) {
      onSearch("")
    }
  }

  // Check if any filters are active
  const hasActiveFilters = localSearchTerm || localFilters.status || localFilters.city || localFilters.service || localFilters.verified

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'V'
  }

  const renderStatus = (status) => {
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    )
  }

  const renderRating = (rating) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rating || 0}</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle>Vendors</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your service providers and their information
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" disabled={loading}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import
                    <ChevronDown className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={onImport}>
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onDownloadTemplate}>
                    <Download className="h-4 w-4 mr-2" />
                    Download Template
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={onExport} variant="outline" size="sm" disabled={loading}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
              <Button onClick={onAddVendor} size="sm" disabled={loading}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <form 
              className="relative flex-1"
              onSubmit={(e) => {
                e.preventDefault()
                // Prevent form submission that causes page reload
              }}
            >
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search vendors, businesses, cities..."
                value={localSearchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </form>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="whitespace-nowrap"
              type="button"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            
            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={clearFilters}
                className="whitespace-nowrap"
                type="button"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="mb-6">
              <VendorFilters
                filters={localFilters}
                vendors={vendors}
                onChange={handleFilterChange}
              />
            </div>
          )}

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Business</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Services</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Verified</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading vendors...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : vendors.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="flex flex-col items-center gap-2">
                        <Briefcase className="h-8 w-8 text-muted-foreground" />
                        <p className="text-muted-foreground">No vendors found</p>
                        {localSearchTerm && (
                          <Button
                            variant="link"
                            onClick={() => {
                              setLocalSearchTerm("")
                              onSearch?.("")
                            }}
                            className="h-auto p-0"
                            type="button"
                          >
                            Clear search
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  vendors.map((vendor) => (
                    <TableRow key={vendor._id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={vendor.userData?.profileImage} />
                            <AvatarFallback>
                              {getInitials(vendor.userData?.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{vendor.userData?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {vendor.userData?.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div>
                          <p className="font-medium">{vendor.businessName}</p>
                          <p className="text-sm text-muted-foreground">
                            {vendor.totalJobs || 0} jobs completed
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div>
                          <p className="text-sm">{vendor.userData?.phone}</p>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-muted-foreground" />
                          <span className="text-sm">
                            {vendor.address?.city}, {vendor.address?.state}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {vendor.services?.slice(0, 2).map((service, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {service}
                            </Badge>
                          ))}
                          {vendor.services?.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{vendor.services.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        {renderRating(vendor.rating)}
                      </TableCell>

                      <TableCell>
                        {renderStatus(vendor.status)}
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          {vendor.verified?.isVerified ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {vendor.verified?.isVerified ? "Yes" : "No"}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0" disabled={loading}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onViewVendor?.(vendor)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEditVendor?.(vendor)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            {!vendor.verified?.isVerified && (
                              <DropdownMenuItem onClick={() => onVerifyVendor?.(vendor)}>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Verify
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => onDeleteVendor?.(vendor)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                {pagination.totalItems} vendors
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage || loading}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.currentPage} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onPageChange?.(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage || loading}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 