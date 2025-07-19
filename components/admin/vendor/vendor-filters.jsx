"use client"

import { useMemo } from "react"
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

export function VendorFilters({ filters = {}, vendors = [], onChange, disabled = false }) {
  // Extract unique values for filter options
  const filterOptions = useMemo(() => {
    const cities = [...new Set(
      vendors
        .map(vendor => vendor.address?.city)
        .filter(Boolean)
    )].sort()

    const services = [...new Set(
      vendors
        .flatMap(vendor => vendor.services || [])
        .filter(Boolean)
    )].sort()

    return { cities, services }
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
      city: "",
      service: "",
      verified: ""
    })
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        {/* City Filter */}
        <div className="space-y-2">
          <label className="text-sm font-medium">City</label>
          <Select
            value={filters.city || "all"}
            onValueChange={(value) => handleFilterChange("city", value)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder="All cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cities</SelectItem>
              {filterOptions.cities.map((city) => (
                <SelectItem key={city} value={city}>
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
              {filterOptions.services.map((service) => (
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
      </div>

      {/* Active Filters */}
      {activeFiltersCount > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          
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