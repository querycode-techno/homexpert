"use client"

import { useState, useEffect, useMemo } from "react"
import { Search, Calendar, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from "@/hooks/use-debounce"
import { format } from "date-fns"
import { serviceUtils } from "@/lib/utils"

const LEAD_STATUSES = [
  'pending', 'available', 'taken', 'contacted', 'completed', 'cancelled'
]

const ASSIGNMENT_STATUSES = [
  { value: 'all', label: 'All Leads' },
  { value: 'assigned', label: 'Assigned' },
  { value: 'unassigned', label: 'Unassigned' }
]

const SORT_OPTIONS = [
  { value: 'createdAt', label: 'Date Created' },
  { value: 'updatedAt', label: 'Last Updated' },
  { value: 'customerName', label: 'Customer Name' },
  { value: 'service', label: 'Service' },
  { value: 'status', label: 'Status' }
]

export function LeadFilters({ filters, onFilterChange, loading }) {
  const [localSearch, setLocalSearch] = useState(filters.search || '')
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || '',
    service: filters.service || '',
    city: filters.city || '',
    assignedStatus: filters.assignedStatus || '',
    sortBy: filters.sortBy || 'createdAt',
    sortOrder: filters.sortOrder || 'desc'
  })
  const [dateRange, setDateRange] = useState({
    from: filters.dateFrom ? new Date(filters.dateFrom) : null,
    to: filters.dateTo ? new Date(filters.dateTo) : null
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(localSearch, 300)

  // Update local state when props change
  useEffect(() => {
    setLocalSearch(filters.search || '')
    setLocalFilters({
      status: filters.status || '',
      service: filters.service || '',
      city: filters.city || '',
      assignedStatus: filters.assignedStatus || '',
      sortBy: filters.sortBy || 'createdAt',
      sortOrder: filters.sortOrder || 'desc'
    })
    setDateRange({
      from: filters.dateFrom ? new Date(filters.dateFrom) : null,
      to: filters.dateTo ? new Date(filters.dateTo) : null
    })
  }, [filters])

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onFilterChange])

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value === 'all' ? '' : value }
    setLocalFilters(newFilters)
    onFilterChange(newFilters)
  }

  // Handle date range changes
  const handleDateRangeChange = (range) => {
    setDateRange(range)
    onFilterChange({
      dateFrom: range.from ? range.from.toISOString().split('T')[0] : '',
      dateTo: range.to ? range.to.toISOString().split('T')[0] : ''
    })
  }

  // Clear all filters
  const clearAllFilters = () => {
    const emptyFilters = {
      search: '',
      status: '',
      service: '',
      city: '',
      assignedStatus: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    }
    
    setLocalSearch('')
    setLocalFilters({
      status: '',
      service: '',
      city: '',
      assignedStatus: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
    setDateRange({ from: null, to: null })
    
    onFilterChange(emptyFilters)
  }

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return localSearch || 
           localFilters.status || 
           localFilters.service || 
           localFilters.city || 
           localFilters.assignedStatus || 
           dateRange.from || 
           dateRange.to ||
           localFilters.sortBy !== 'createdAt' ||
           localFilters.sortOrder !== 'desc'
  }, [localSearch, localFilters, dateRange])

  // Get available services
  const availableServices = useMemo(() => {
    try {
      const services = serviceUtils.getAllServices()
      return services.map(service => service.name).sort()
    } catch (error) {
      console.error('Error getting services:', error)
      return []
    }
  }, [])

  return (
    <div className="space-y-4">
      {/* Search and Main Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search leads by customer name, phone, or email..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>

        {/* Status Filter */}
        <Select 
          value={localFilters.status || "all"} 
          onValueChange={(value) => handleFilterChange('status', value)}
          disabled={loading}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignment Status Filter */}
        <Select 
          value={localFilters.assignedStatus || "all"} 
          onValueChange={(value) => handleFilterChange('assignedStatus', value)}
          disabled={loading}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="All Leads" />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNMENT_STATUSES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={loading}
          className="whitespace-nowrap"
        >
          <Filter className="h-4 w-4 mr-2" />
          {showAdvanced ? 'Hide' : 'More'} Filters
        </Button>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clearAllFilters}
            disabled={loading}
            className="whitespace-nowrap"
            type="button"
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-lg">
          {/* Service Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Service</label>
            <Select 
              value={localFilters.service || "all"} 
              onValueChange={(value) => handleFilterChange('service', value)}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Services" />
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
          </div>

          {/* City Filter */}
          <div className="space-y-2">
            <label className="text-sm font-medium">City</label>
            <Input
              placeholder="Enter city..."
              value={localFilters.city}
              onChange={(e) => handleFilterChange('city', e.target.value)}
              disabled={loading}
            />
          </div>

          {/* Date Range */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal" disabled={loading}>
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      `${format(dateRange.from, "MMM dd")} - ${format(dateRange.to, "MMM dd")}`
                    ) : (
                      format(dateRange.from, "MMM dd, yyyy")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeChange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Sort By</label>
            <div className="flex gap-2">
              <Select 
                value={localFilters.sortBy || "createdAt"} 
                onValueChange={(value) => handleFilterChange('sortBy', value)}
                disabled={loading}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select 
                value={localFilters.sortOrder || "desc"} 
                onValueChange={(value) => handleFilterChange('sortOrder', value)}
                disabled={loading}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">↓</SelectItem>
                  <SelectItem value="asc">↑</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {localSearch && (
            <Badge variant="secondary" className="gap-1">
              Search: {localSearch}
              <button
                type="button"
                onClick={() => {
                  setLocalSearch('')
                  onFilterChange({ search: '' })
                }}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {localFilters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {localFilters.status}
              <button
                type="button"
                onClick={() => handleFilterChange('status', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {localFilters.assignedStatus && localFilters.assignedStatus !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              Assignment: {ASSIGNMENT_STATUSES.find(s => s.value === localFilters.assignedStatus)?.label}
              <button
                type="button"
                onClick={() => handleFilterChange('assignedStatus', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {localFilters.service && (
            <Badge variant="secondary" className="gap-1">
              Service: {localFilters.service}
              <button
                type="button"
                onClick={() => handleFilterChange('service', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {localFilters.city && (
            <Badge variant="secondary" className="gap-1">
              City: {localFilters.city}
              <button
                type="button"
                onClick={() => handleFilterChange('city', '')}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {(dateRange.from || dateRange.to) && (
            <Badge variant="secondary" className="gap-1">
              Date: {dateRange.from && format(dateRange.from, "MMM dd")}
              {dateRange.to && ` - ${format(dateRange.to, "MMM dd")}`}
              <button
                type="button"
                onClick={() => handleDateRangeChange({ from: null, to: null })}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={loading}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
        </div>
      )}
    </div>
  )
} 