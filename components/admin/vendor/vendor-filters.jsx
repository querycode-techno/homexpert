"use client"

import { useMemo, useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import { SearchableSelect } from '@/components/ui/searchable-select'
import { getStateOptions, getCityOptions } from '@/lib/utils/stateCityUtils'

export function VendorFilters({ filters = {}, vendors = [], onChange, disabled = false }) {
  const [employees, setEmployees] = useState([])
  const [employeesLoading, setEmployeesLoading] = useState(false)
  const [stateOptions, setStateOptions] = useState([])
  const [cityOptions, setCityOptions] = useState([])
  const [cityOptionsLoading, setCityOptionsLoading] = useState(false)

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
  // Load state options once
  useEffect(() => {
    const loadStates = async () => {
      try {
        const options = await getStateOptions()
        setStateOptions(options)
      } catch {
        setStateOptions([])
      }
    }
    loadStates()
  }, [])

  // Load city options when state filter changes
  useEffect(() => {
    const selectedState = filters.state
    if (!selectedState) {
      setCityOptions([])
      return
    }
    let cancelled = false
    const loadCities = async () => {
      setCityOptionsLoading(true)
      try {
        const options = await getCityOptions(selectedState)
        if (!cancelled) setCityOptions(options)
      } catch {
        if (!cancelled) setCityOptions([])
      } finally {
        if (!cancelled) setCityOptionsLoading(false)
      }
    }
    loadCities()
    return () => { cancelled = true }
  }, [filters.state])

  // Extract unique services from current vendors (services list is fine to derive from data)
  const serviceOptions = useMemo(() => {
    const services = [...new Set(
      vendors
        .flatMap(vendor => vendor.services || [])
        .filter(Boolean)
    )].sort()
    return services
  }, [vendors])

  const handleFilterChange = (key, value) => {
    if (disabled) return
    const newFilters = {
      ...filters,
      [key]: value === "all" ? "" : value
    }
    onChange?.(newFilters)
  }

  const clearAllFilters = () => {
    if (disabled) return
    onChange?.({
      status: "",
      state: "",
      city: "",
      service: "",
      verified: "",
      onboardedBy: "",
      online: "",
      subscriptionStatus: ""
    })
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-7 gap-4">
        {/* Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <Select
            value={filters.status || "all"}
            onValueChange={(value) => handleFilterChange("status", value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* State Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">State</label>
          <SearchableSelect
            options={[{ value: '', label: 'All states' }, ...stateOptions]}
            value={filters.state || ''}
            onValueChange={(value) => {
              // When state changes, reset city filter
              handleFilterChange("state", value || "")
              if (!value) {
                handleFilterChange("city", "")
              }
            }}
            placeholder="Search and select state..."
            searchPlaceholder="Type to search states..."
            emptyMessage="No states found"
            disabled={disabled}
            showSearch={true}
          />
        </div>

        {/* City Filter (depends on state) */}
        <div className="space-y-2">
          <label className="text-sm font-medium">City</label>
          <SearchableSelect
            options={[{ value: '', label: filters.state ? 'All cities' : 'Select state first' }, ...cityOptions]}
            value={filters.city || ''}
            onValueChange={(value) => handleFilterChange("city", value || "")}
            placeholder={
              !filters.state
                ? 'Select state first'
                : cityOptionsLoading
                  ? 'Loading cities...'
                  : cityOptions.length === 0
                    ? 'No cities available'
                    : 'Search and select city...'
            }
            searchPlaceholder="Type to search cities..."
            emptyMessage={!filters.state ? "Please select a state first" : "No cities found"}
            disabled={disabled || !filters.state || cityOptionsLoading}
            showSearch={true}
          />
        </div>

        {/* Service Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Service</label>
          <Select
            value={filters.service || "all"}
            onValueChange={(value) => handleFilterChange("service", value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All services" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All services</SelectItem>
              {serviceOptions.map((service) => (
                <SelectItem key={service} value={service}>
                  {service}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Verification Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Verification</label>
          <Select
            value={filters.verified || "all"}
            onValueChange={(value) => handleFilterChange("verified", value)}
            disabled={disabled}
          >
            <SelectTrigger>
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
          <label className="text-sm font-medium">Onboarded By</label>
          <Select
            value={filters.onboardedBy || "all"}
            onValueChange={(value) => handleFilterChange("onboardedBy", value)}
            disabled={disabled}
          >
            <SelectTrigger>
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

        {/* Online Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Online Status</label>
          <Select
            value={filters.online || "all"}
            onValueChange={(value) => handleFilterChange("online", value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All vendors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All vendors</SelectItem>
              <SelectItem value="online">Online only</SelectItem>
              <SelectItem value="offline">Offline only</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Subscription Status Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Subscription Status</label>
          <Select
            value={filters.subscriptionStatus || "all"}
            onValueChange={(value) => handleFilterChange("subscriptionStatus", value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="refunded">Refunded</SelectItem>
              <SelectItem value="unsubscribed">Unsubscribed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {filters.state && (
            <Badge variant="secondary" className="gap-1">
              State: {filters.state}
              <button
                type="button"
                onClick={() => handleFilterChange("state", "")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {filters.status && (
            <Badge variant="secondary" className="gap-1">
              Status: {filters.status}
              <button
                type="button"
                onClick={() => handleFilterChange("status", "")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.city && (
            <Badge variant="secondary" className="gap-1">
              City: {filters.city}
              <button
                type="button"
                onClick={() => handleFilterChange("city", "")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.service && (
            <Badge variant="secondary" className="gap-1">
              Service: {filters.service}
              <button
                type="button"
                onClick={() => handleFilterChange("service", "")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.verified && (
            <Badge variant="secondary" className="gap-1">
              {filters.verified === "verified" ? "Verified" : "Unverified"}
              <button
                type="button"
                onClick={() => handleFilterChange("verified", "")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.onboardedBy && (
            <Badge variant="secondary" className="gap-1">
              Onboarded By: {filters.onboardedBy === 'none' ? 'None' : (employees.find(e => e._id === filters.onboardedBy)?.name || filters.onboardedBy)}
              <button
                type="button"
                onClick={() => handleFilterChange("onboardedBy", "")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.online && (
            <Badge variant="secondary" className="gap-1">
              {filters.online === "online" ? "Online" : "Offline"}
              <button
                type="button"
                onClick={() => handleFilterChange("online", "")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          {filters.subscriptionStatus && (
            <Badge variant="secondary" className="gap-1">
              Subscription: {filters.subscriptionStatus.charAt(0).toUpperCase() + filters.subscriptionStatus.slice(1)}
              <button
                type="button"
                onClick={() => handleFilterChange("subscriptionStatus", "")}
                className="ml-1 hover:bg-muted-foreground/20 rounded-full p-0.5"
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="h-auto py-1 px-2 text-xs"
            disabled={disabled}
          >
            Clear all
          </Button>
        </div>
      )}
    </div>
  )
} 