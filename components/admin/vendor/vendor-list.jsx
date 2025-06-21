"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Download, 
  Upload, 
  Clock, 
  PlusCircle, 
  MinusCircle, 
  History 
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function VendorList({
  vendors = [],
  vendorLeadCounts = {},
  onAddVendor,
  onEditVendor,
  onDeleteVendor,
  onAddLeads,
  onRemoveLeads,
  onViewLeadHistory,
  onExport,
  onImport,
}) {
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredVendors, setFilteredVendors] = useState([])

  // Update filtered vendors when vendors or search term changes
  useEffect(() => {
    if (!vendors) return

    setFilteredVendors(
      vendors.filter(
        (vendor) =>
          (vendor.id && vendor.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vendor.name && vendor.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vendor.phone && vendor.phone.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (vendor.subscription && vendor.subscription.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    )
  }, [vendors, searchTerm])

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-500 hover:bg-green-500/80"
      case "Inactive":
        return "bg-red-500 hover:bg-red-500/80"
      case "Suspended":
        return "bg-yellow-500 hover:bg-yellow-500/80"
      default:
        return "bg-gray-500 hover:bg-gray-500/80"
    }
  }

  const calculateDaysRemaining = (endDate) => {
    if (!endDate) return 0

    try {
      const end = new Date(endDate)
      const today = new Date()
      const diffTime = end - today
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays > 0 ? diffDays : 0
    } catch (error) {
      console.error("Error calculating days remaining:", error)
      return 0
    }
  }

  const safeRenderVendorRow = (vendor) => {
    try {
      const leadsUsed = vendorLeadCounts[vendor.id] || vendor.leadsUsed || 0
      const leadQuota = vendor.leadQuota || 0
      const leadsRemaining = Math.max(0, leadQuota - leadsUsed)
      const leadsPercentage = leadQuota > 0 ? Math.round((leadsUsed / leadQuota) * 100) : 0
      const daysRemaining = calculateDaysRemaining(vendor.endDate)

      return (
        <tr key={vendor.id} className="hover:bg-gray-50">
          <td className="p-2">
            <div className="flex items-center">
              <div className="flex-shrink-0 h-8 w-8">
                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-xs font-medium text-gray-700">
                    {vendor.name ? vendor.name.charAt(0).toUpperCase() : "?"}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <div className="text-sm font-medium text-gray-900">{vendor.name || "N/A"}</div>
                <div className="text-xs text-gray-500">{vendor.phone || "N/A"}</div>
              </div>
            </div>
          </td>
          <td className="p-2">
            <div className="text-sm text-gray-900">{vendor.subscription || "N/A"}</div>
            <div className="text-xs text-gray-500">
              {vendor.startDate && vendor.endDate
                ? `${vendor.startDate} to ${vendor.endDate}`
                : "N/A"}
            </div>
          </td>
          <td className="p-2">
            <Badge
              className={`text-white ${getStatusColor(vendor.status)}`}
            >
              {vendor.status || "N/A"}
            </Badge>
          </td>
          <td className="p-2">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3 text-muted-foreground" />
              <span>{daysRemaining} days</span>
            </div>
          </td>
          <td className="p-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium">
                  {leadsUsed} of {leadQuota} leads used ({leadsRemaining} remaining)
                </span>
                <span>{leadsPercentage}%</span>
              </div>
              <Progress value={leadsPercentage} className="h-2" />
            </div>
          </td>
          <td className="p-2 text-right">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem 
                  className="flex items-center gap-2" 
                  onClick={() => onEditVendor(vendor)}
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2" 
                  onClick={() => onAddLeads(vendor)}
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Leads</span>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="flex items-center gap-2" 
                  onClick={() => onRemoveLeads(vendor)}
                >
                  <MinusCircle className="h-4 w-4" />
                  <span>Remove Leads</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2"
                  onClick={() => onViewLeadHistory(vendor)}
                >
                  <History className="h-4 w-4" />
                  <span>Lead History</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-500"
                  onClick={() => onDeleteVendor(vendor)}
                >
                  <Trash2 className="h-4 w-4" />
                  <span>Delete</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </td>
        </tr>
      )
    } catch (error) {
      console.error("Error rendering vendor row:", error, vendor)
      return null
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Vendors</CardTitle>
          <CardDescription>Manage vendor subscriptions and lead quotas.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onImport}>
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={onExport}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={onAddVendor}>
            <Plus className="h-4 w-4" />
            <span>Add Vendor</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search vendors..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="rounded-md border">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vendor
                </th>
                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subscription
                </th>
                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expires In
                </th>
                <th className="p-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Lead Usage
                </th>
                <th className="p-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors?.length > 0 ? (
                filteredVendors.map((vendor) => safeRenderVendorRow(vendor))
              ) : (
                <tr>
                  <td colSpan="6" className="p-4 text-center text-gray-500">
                    No vendors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
} 