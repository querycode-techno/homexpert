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
  const [dateRange, setDateRange] = useState({
    from: filters.dateFrom ? new Date(filters.dateFrom) : null,
    to: filters.dateTo ? new Date(filters.dateTo) : null
  })
  const [showAdvanced, setShowAdvanced] = useState(false)
  
  // Debounce search to avoid excessive API calls
  const debouncedSearch = useDebounce(localSearch, 300)

  // Services from utils
  const services = useMemo(() => serviceUtils.getAllServices(), [])
  
  // Common cities (could be fetched from API)
  const cities = useMemo(() => [
    'Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 
    'Kolkata', 'Pune', 'Ahmedabad', 'Surat', 'Jaipur'
  ], [])

  // Handle debounced search
  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      onFilterChange({ search: debouncedSearch })
    }
  }, [debouncedSearch, filters.search, onFilterChange])

  // Handle date range changes
  useEffect(() => {
    const dateFrom = dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : ''
    const dateTo = dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : ''
    
    if (dateFrom !== filters.dateFrom || dateTo !== filters.dateTo) {
      onFilterChange({ dateFrom, dateTo })
    }
  }, [dateRange, filters.dateFrom, filters.dateTo, onFilterChange])

  // Get active filter count
  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.search) count++
    if (filters.status && filters.status !== 'all') count++
    if (filters.service && filters.service !== 'all') count++
    if (filters.city && filters.city !== 'all') count++
    if (filters.assignedStatus && filters.assignedStatus !== 'all') count++
    if (filters.dateFrom || filters.dateTo) count++
    return count
  }, [filters])

  // Clear all filters
  const clearAllFilters = () => {
    setLocalSearch('')
    setDateRange({ from: null, to: null })
    onFilterChange({
      search: '',
      status: '',
      service: '',
      city: '',
      assignedStatus: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'createdAt',
      sortOrder: 'desc'
    })
  }

  // Clear individual filter
  const clearFilter = (filterName) => {
    if (filterName === 'search') {
      setLocalSearch('')
    } else if (filterName === 'dateRange') {
      setDateRange({ from: null, to: null })
    } else {
      onFilterChange({ [filterName]: '' })
    }
  }

  return (
    <div className="space-y-4">
      {/* Primary Filters */}
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search leads by name, phone, email, or service..."
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            className="pl-10"
            disabled={loading}
          />
        </div>

        {/* Status Filter */}
        <Select 
          value={filters.status || 'all'} 
          onValueChange={(value) => onFilterChange({ status: value === 'all' ? '' : value })}
          disabled={loading}
        >
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {LEAD_STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assignment Status */}
        <Select 
          value={filters.assignedStatus || 'all'} 
          onValueChange={(value) => onFilterChange({ assignedStatus: value === 'all' ? '' : value })}
          disabled={loading}
        >
          <SelectTrigger className="w-full lg:w-[150px]">
            <SelectValue placeholder="Assignment" />
          </SelectTrigger>
          <SelectContent>
            {ASSIGNMENT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Advanced Filters Toggle */}
        <Button
          variant="outline"
          onClick={() => setShowAdvanced(!showAdvanced)}
          disabled={loading}
        >
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 border rounded-lg bg-muted/50">
          {/* Service Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">Service</label>
            <Select 
              value={filters.service || 'all'} 
              onValueChange={(value) => onFilterChange({ service: value === 'all' ? '' : value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Services" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Services</SelectItem>
                {services.map((service) => (
                  <SelectItem key={service} value={service}>
                    {service}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* City Filter */}
          <div>
            <label className="text-sm font-medium mb-2 block">City</label>
            <Select 
              value={filters.city || 'all'} 
              onValueChange={(value) => onFilterChange({ city: value === 'all' ? '' : value })}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {cities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div>
            <label className="text-sm font-medium mb-2 block">Date Range</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                  disabled={loading}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {dateRange.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, "LLL dd")} -{" "}
                        {format(dateRange.to, "LLL dd")}
                      </>
                    ) : (
                      format(dateRange.from, "LLL dd, y")
                    )
                  ) : (
                    "Pick a date range"
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  initialFocus
                  mode="range"
                  selected={dateRange}
                  onSelect={setDateRange}
                  numberOfMonths={2}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Sort Options */}
          <div>
            <label className="text-sm font-medium mb-2 block">Sort By</label>
            <div className="flex gap-2">
              <Select 
                value={filters.sortBy || 'createdAt'} 
                onValueChange={(value) => onFilterChange({ sortBy: value })}
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
                value={filters.sortOrder || 'desc'} 
                onValueChange={(value) => onFilterChange({ sortOrder: value })}
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

      {/* Active Filters */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: {filters.search}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('search')}
              />
            </Badge>
          )}
          
          {filters.status && filters.status !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('status')}
              />
            </Badge>
          )}
          
          {filters.service && filters.service !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Service: {filters.service}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('service')}
              />
            </Badge>
          )}
          
          {filters.city && filters.city !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              City: {filters.city}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('city')}
              />
            </Badge>
          )}
          
          {filters.assignedStatus && filters.assignedStatus !== 'all' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Assignment: {ASSIGNMENT_STATUSES.find(s => s.value === filters.assignedStatus)?.label}
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('assignedStatus')}
              />
            </Badge>
          )}
          
          {(filters.dateFrom || filters.dateTo) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Date Range
              <X 
                className="h-3 w-3 cursor-pointer" 
                onClick={() => clearFilter('dateRange')}
              />
            </Badge>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
} 