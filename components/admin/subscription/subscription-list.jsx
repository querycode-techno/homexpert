"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  MoreHorizontal, 
  Download, 
  Upload,
  Clock,
  Users,
  Tag
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import subscriptionService from "@/lib/services/subscriptionService"

export function SubscriptionList({ onCreatePlan, onEditPlan, refreshTrigger }) {
  const [plans, setPlans] = useState([])
  const [filteredPlans, setFilteredPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [durationFilter, setDurationFilter] = useState("all")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState(null)

  // Fetch plans
  const fetchPlans = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const filters = {
        search: searchTerm,
        status: statusFilter === 'all' ? null : statusFilter,
        duration: durationFilter === 'all' ? null : durationFilter,
        sortBy: 'created'
      }
      
      const response = await subscriptionService.getAllPlans(filters)
      setPlans(response.data?.plans || [])
    } catch (err) {
      setError(err.message)
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Initial fetch and refresh trigger
  useEffect(() => {
    fetchPlans()
  }, [refreshTrigger])

  // Trigger re-fetch when filters change (with debounce for search)
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchPlans()
    }, searchTerm ? 500 : 0) // 500ms debounce for search, immediate for other filters

    return () => clearTimeout(timeoutId)
  }, [searchTerm, statusFilter, durationFilter])

  // Set filtered plans from API response
  useEffect(() => {
    setFilteredPlans(plans)
  }, [plans])

  // Handle delete plan
  const handleDeleteClick = (plan) => {
    setPlanToDelete(plan)
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!planToDelete) return

    try {
      await subscriptionService.deletePlan(planToDelete._id)
      toast.success(`Plan "${planToDelete.planName}" deleted successfully`)
      fetchPlans() // Refresh the list
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    }
  }

  // Handle toggle active status
  const handleToggleStatus = async (plan) => {
    try {
      await subscriptionService.togglePlanStatus(plan._id)
      toast.success(`Plan "${plan.planName}" ${plan.isActive ? 'deactivated' : 'activated'} successfully`)
      fetchPlans() // Refresh the list
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    }
  }

  // Handle export
  const handleExport = async () => {
    try {
      const filters = {
        search: searchTerm,
        status: statusFilter === 'all' ? null : statusFilter,
        duration: durationFilter === 'all' ? null : durationFilter
      }
      await subscriptionService.exportPlans(filters)
      toast.success("Subscription plans exported successfully")
    } catch (err) {
      toast.error(`Export failed: ${err.message}`)
    }
  }

  // Handle import
  const handleImport = () => {
    // TODO: Implement CSV import
    toast.success("Import functionality will be implemented")
  }

  // Format currency using service method
  const formatCurrency = (amount) => {
    return subscriptionService.formatCurrency(amount)
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Subscription Plans</CardTitle>
          <CardDescription>Manage available subscription plans for vendors.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleImport}>
            <Upload className="h-4 w-4" />
            <span>Import</span>
          </Button>
          <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
            <Download className="h-4 w-4" />
            <span>Export</span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={onCreatePlan}>
            <Plus className="h-4 w-4" />
            <span>Add Plan</span>
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search plans..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={durationFilter} onValueChange={setDurationFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Duration" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Duration</SelectItem>
                <SelectItem value="1-month">1 Month</SelectItem>
                <SelectItem value="3-month">3 Months</SelectItem>
                <SelectItem value="6-month">6 Months</SelectItem>
                <SelectItem value="12-month">12 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan Details</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Duration & Leads</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4">
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                        <span className="ml-2">Loading plans...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-red-500">
                      Error: {error}
                    </TableCell>
                  </TableRow>
                ) : filteredPlans.length > 0 ? (
                  filteredPlans.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{plan.planName}</div>
                          <div className="text-sm text-muted-foreground line-clamp-2">
                            {plan.description}
                          </div>
                          {plan.tags && plan.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {plan.tags.slice(0, 2).map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  <Tag className="h-3 w-3 mr-1" />
                                  {tag}
                                </Badge>
                              ))}
                              {plan.tags.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{plan.tags.length - 2}
                                </Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground">₹</span>
                            <span className="font-medium">{formatCurrency(plan.effectivePrice)}</span>
                          </div>
                          {plan.isDiscounted && (
                            <div className="flex items-center gap-1">
                              <span className="text-sm text-muted-foreground line-through">
                                {formatCurrency(plan.price)}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                {plan.discountPercentage}% OFF
                              </Badge>
                            </div>
                          )}
                          <div className="text-xs text-muted-foreground">
                            ₹{plan.pricePerLead}/lead
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{plan.duration.replace('-', ' ')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{plan.totalLeads} leads</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {plan.leadsPerMonth} leads/month
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Badge
                          variant={plan.isActive ? "default" : "secondary"}
                          className={plan.isActive ? "bg-green-500 hover:bg-green-500/80" : ""}
                        >
                          {plan.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => onEditPlan(plan)}
                            >
                              <Edit className="h-4 w-4" />
                              <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2"
                              onClick={() => handleToggleStatus(plan)}
                            >
                              {plan.isActive ? (
                                <>
                                  <span className="h-4 w-4">⏸</span>
                                  <span>Deactivate</span>
                                </>
                              ) : (
                                <>
                                  <span className="h-4 w-4">▶</span>
                                  <span>Activate</span>
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="flex items-center gap-2 text-red-500"
                              onClick={() => handleDeleteClick(plan)}
                            >
                              <Trash2 className="h-4 w-4" />
                              <span>Delete</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-4 text-muted-foreground">
                      No subscription plans found. Try adjusting your filters or create a new plan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Summary */}
          {!loading && !error && (
            <div className="text-sm text-muted-foreground">
              Showing {filteredPlans.length} of {plans.length} plans
            </div>
          )}
        </div>
      </CardContent>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the "{planToDelete?.planName}" subscription plan. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm} 
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
} 