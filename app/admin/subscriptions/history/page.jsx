"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import subscriptionService from "@/lib/services/subscriptionService"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Eye,
  Download,
  AlertTriangle,
  DollarSign,
  Users,
  FileText,
  Check,
  ChevronsUpDown,
  MoreHorizontal,
  Trash2,
  TrendingUp
} from "lucide-react"

const PAYMENT_STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500", icon: Clock },
  submitted: { label: "Submitted", color: "bg-blue-500", icon: FileText },
  completed: { label: "Completed", color: "bg-green-500", icon: CheckCircle },
  failed: { label: "Failed", color: "bg-red-500", icon: XCircle },
  refunded: { label: "Refunded", color: "bg-gray-500", icon: AlertTriangle }
}

const SUBSCRIPTION_STATUS_CONFIG = {
  pending: { label: "Pending", color: "bg-yellow-500" },
  active: { label: "Active", color: "bg-green-500" },
  expired: { label: "Expired", color: "bg-gray-500" },
  cancelled: { label: "Cancelled", color: "bg-red-500" },
  refunded: { label: "Refunded", color: "bg-purple-500" }
}

export default function SubscriptionHistoryPage() {
  const [subscriptions, setSubscriptions] = useState([])
  const [summary, setSummary] = useState({})
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  
  // Filters
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("all")
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all")
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  
  // Dialogs
  const [verificationDialog, setVerificationDialog] = useState({ open: false, subscription: null })
  const [rejectionDialog, setRejectionDialog] = useState({ open: false, subscription: null })
  const [detailsDialog, setDetailsDialog] = useState({ open: false, subscription: null })
  const [createDialog, setCreateDialog] = useState({ open: false })
  const [deleteDialog, setDeleteDialog] = useState({ open: false, subscription: null })
  const [cancelDialog, setCancelDialog] = useState({ open: false, subscription: null })
  const [leadAdjustmentDialog, setLeadAdjustmentDialog] = useState({ open: false, subscription: null })
  
  // Form data
  const [verificationNotes, setVerificationNotes] = useState("")
  const [transactionId, setTransactionId] = useState("")
  const [leadAdjustmentData, setLeadAdjustmentData] = useState({
    type: "increase", // "increase" or "decrease"
    amount: "",
    reason: ""
  })
  
  // Create subscription form data
  const [vendors, setVendors] = useState([])
  const [subscriptionPlans, setSubscriptionPlans] = useState([])
  const [loadingVendorsAndPlans, setLoadingVendorsAndPlans] = useState(false)
  const [planSearchOpen, setPlanSearchOpen] = useState(false)
  const [vendorSearch, setVendorSearch] = useState("")
  const [filteredVendors, setFilteredVendors] = useState([])
  const [createFormData, setCreateFormData] = useState({
    vendorId: "",
    subscriptionPlanId: "",
    paymentMethod: "online",
    transactionId: "",
    amount: "",
    paymentStatus: "completed",
    status: "active",
    notes: ""
  })

  const loadSubscriptions = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '20',
        search,
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter }),
        ...(paymentStatusFilter && paymentStatusFilter !== 'all' && { paymentStatus: paymentStatusFilter }),
        ...(paymentMethodFilter && paymentMethodFilter !== 'all' && { paymentMethod: paymentMethodFilter }),
        sortBy: 'createdAt',
        sortOrder: 'desc'
      })

      const response = await fetch(`/api/admin/subscriptions/history?${params}`)
      const data = await response.json()

      if (data.success) {
        setSubscriptions(data.data.subscriptions)
        setSummary(data.data.summary)
        setTotalPages(data.data.pagination.totalPages)
        setTotalItems(data.data.pagination.totalItems)
      } else {
        toast.error(data.error || "Failed to load subscription history")
      }
    } catch (error) {
      console.error("Error loading subscriptions:", error)
      toast.error("Failed to load subscription history")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubscriptions()
    loadVendorsAndPlans()
  }, [currentPage, search, statusFilter, paymentStatusFilter, paymentMethodFilter])

  // Filter vendors based on search (similar to subscription form)
  useEffect(() => {
    if (!vendorSearch.trim()) {
      setFilteredVendors(vendors)
    } else {
      const searchTerm = vendorSearch.toLowerCase()
      const filtered = vendors.filter(vendor => 
        vendor.businessName?.toLowerCase().includes(searchTerm) ||
        vendor.userData?.name?.toLowerCase().includes(searchTerm) ||
        vendor.userData?.email?.toLowerCase().includes(searchTerm) ||
        vendor.userData?.phone?.includes(searchTerm)
      )
      setFilteredVendors(filtered)
    }
  }, [vendors, vendorSearch])

  // Load vendors and subscription plans for create dialog
  const loadVendorsAndPlans = async () => {
    try {
      setLoadingVendorsAndPlans(true)
      console.log("Loading vendors and plans...")
      
      // Load vendors using direct API call (similar to subscription form approach)
      const response = await fetch('/api/admin/vendors?limit=1000')
      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          const vendorsList = data.data.vendors || []
          // Filter to only vendors with proper user data (temporarily allow all vendors for debugging)
          const validVendors = vendorsList.filter(vendor => 
            vendor.userData && vendor.userData.name && vendor.userData.email
          )
          setVendors(validVendors)
          setFilteredVendors(validVendors)
          console.log("Loaded vendors:", validVendors.length, "out of", vendorsList.length, "total")
          console.log("Sample vendor data:", validVendors[0]) // Debug vendor structure
        } else {
          console.error("Failed to load vendors:", data.error)
          toast.error(data.error || "Failed to load vendors")
          setVendors([])
        }
      } else {
        console.error("Failed to fetch vendors - HTTP error")
        toast.error("Failed to load vendors")
        setVendors([])
        setFilteredVendors([])
      }

      // Load subscription plans using subscription service
      try {
        const plansResult = await subscriptionService.getAllPlans({ limit: 100 })
        console.log("Plans result:", plansResult)
        
        if (plansResult.success && plansResult.data && plansResult.data.plans) {
          // Filter to only active plans for the dropdown
          const activePlans = plansResult.data.plans.filter(plan => plan.isActive !== false)
          setSubscriptionPlans(activePlans)
          console.log("Loaded plans:", activePlans.length, "out of", plansResult.data.plans.length, "total")
        } else {
          console.error("Invalid plans response:", plansResult)
          setSubscriptionPlans([])
        }
      } catch (plansError) {
        console.error("Failed to load subscription plans:", plansError)
        toast.error(plansError.message || "Failed to load subscription plans")
        setSubscriptionPlans([])
      }
    } catch (error) {
      console.error("Error loading vendors and plans:", error)
      toast.error("Failed to load vendors and subscription plans")
    } finally {
      setLoadingVendorsAndPlans(false)
    }
  }

  const handleVerifyAndActivate = async () => {
    if (!verificationDialog.subscription) return

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/subscriptions/history', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: verificationDialog.subscription._id,
          action: 'verify_and_activate',
          verificationNotes,
          transactionId: transactionId || verificationDialog.subscription.payment.transactionId
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Subscription verified and activated successfully")
        setVerificationDialog({ open: false, subscription: null })
        setVerificationNotes("")
        setTransactionId("")
        loadSubscriptions()
      } else {
        toast.error(data.error || "Failed to verify subscription")
      }
    } catch (error) {
      console.error("Error verifying subscription:", error)
      toast.error("Failed to verify subscription")
    } finally {
      setProcessing(false)
    }
  }

  const handleRejectPayment = async () => {
    if (!rejectionDialog.subscription) return

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/subscriptions/history', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: rejectionDialog.subscription._id,
          action: 'reject_payment',
          verificationNotes
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Payment rejected successfully")
        setRejectionDialog({ open: false, subscription: null })
        setVerificationNotes("")
        loadSubscriptions()
      } else {
        toast.error(data.error || "Failed to reject payment")
      }
    } catch (error) {
      console.error("Error rejecting payment:", error)
      toast.error("Failed to reject payment")
    } finally {
      setProcessing(false)
    }
  }

  const handleCreateSubscription = async () => {
    try {
      setProcessing(true)
      
      // Validation
      if (!createFormData.vendorId || !createFormData.subscriptionPlanId || !createFormData.amount) {
        toast.error("Please fill in all required fields")
        return
      }

      // Check if vendor already has an active subscription
      const selectedVendor = vendors.find(v => (v.vendorId || v._id) === createFormData.vendorId)
      if (selectedVendor) {
        const hasActiveSubscription = subscriptions.some(sub => 
          sub.userInfo?.email === selectedVendor.userData?.email && 
          sub.status === 'active'
        )
        
        if (hasActiveSubscription) {
          toast.error("This vendor already has an active subscription. Please wait for it to expire first.")
          return
        }
      }

      // Debug logging
      console.log("Creating subscription with data:", {
        vendorId: createFormData.vendorId,
        subscriptionPlanId: createFormData.subscriptionPlanId,
        amount: createFormData.amount,
        paymentMethod: createFormData.paymentMethod
      })

      const response = await fetch('/api/admin/subscriptions/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_subscription',
          ...createFormData,
          amount: parseFloat(createFormData.amount)
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Subscription created successfully")
        setCreateDialog({ open: false })
        setCreateFormData({
          vendorId: "",
          subscriptionPlanId: "",
          paymentMethod: "online",
          transactionId: "",
          amount: "",
          paymentStatus: "completed",
          status: "active",
          notes: ""
        })
        loadSubscriptions()
      } else {
        toast.error(data.error || "Failed to create subscription")
      }
    } catch (error) {
      console.error("Error creating subscription:", error)
      toast.error("Failed to create subscription")
    } finally {
      setProcessing(false)
    }
  }

  const handleDeleteSubscription = async () => {
    if (!deleteDialog.subscription) return

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/subscriptions/history', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: deleteDialog.subscription._id
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Subscription deleted successfully")
        setDeleteDialog({ open: false, subscription: null })
        loadSubscriptions()
      } else {
        toast.error(data.error || "Failed to delete subscription")
      }
    } catch (error) {
      console.error("Error deleting subscription:", error)
      toast.error("Failed to delete subscription")
    } finally {
      setProcessing(false)
    }
  }

  const handleCancelSubscription = async () => {
    if (!cancelDialog.subscription) return

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/subscriptions/history', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: cancelDialog.subscription._id,
          status: 'cancelled'
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("Subscription cancelled successfully")
        setCancelDialog({ open: false, subscription: null })
        loadSubscriptions()
      } else {
        toast.error(data.error || "Failed to cancel subscription")
      }
    } catch (error) {
      console.error("Error cancelling subscription:", error)
      toast.error("Failed to cancel subscription")
    } finally {
      setProcessing(false)
    }
  }

  const handleAdjustLeads = async () => {
    if (!leadAdjustmentDialog.subscription || !leadAdjustmentData.amount || !leadAdjustmentData.reason) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      setProcessing(true)
      const response = await fetch('/api/admin/subscriptions/history/adjust-leads', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscriptionId: leadAdjustmentDialog.subscription._id,
          type: leadAdjustmentData.type,
          amount: parseInt(leadAdjustmentData.amount),
          reason: leadAdjustmentData.reason
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Leads ${leadAdjustmentData.type === 'increase' ? 'increased' : 'decreased'} successfully`)
        setLeadAdjustmentDialog({ open: false, subscription: null })
        setLeadAdjustmentData({ type: "increase", amount: "", reason: "" })
        loadSubscriptions()
      } else {
        toast.error(data.error || "Failed to adjust leads")
      }
    } catch (error) {
      console.error("Error adjusting leads:", error)
      toast.error("Failed to adjust leads")
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Subscription History</h1>
          <p className="text-muted-foreground">Manage and verify vendor subscriptions</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="default"
            onClick={() => setCreateDialog({ open: true })}
          >
            Create Subscription
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Users className="h-4 w-4 text-muted-foreground" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Subscriptions</p>
                <p className="text-2xl font-bold">{summary.totalSubscriptions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Active</p>
                <p className="text-2xl font-bold">{summary.activeSubscriptions || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Pending Payments</p>
                <p className="text-2xl font-bold">{summary.pendingPayments || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertTriangle className="h-4 w-4 text-orange-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Bank Transfer Pending</p>
                <p className="text-2xl font-bold">{summary.bankTransferPending || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <FileText className="h-4 w-4 text-blue-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Payment Submitted</p>
                <p className="text-2xl font-bold">{summary.bankTransferSubmitted || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <DollarSign className="h-4 w-4 text-green-600" />
              <div className="ml-2">
                <p className="text-sm font-medium leading-none">Total Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(summary.totalRevenue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by user, plan, transaction..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Status</Label>
              <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All payment statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All payment statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="submitted">Submitted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All methods" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All methods</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearch("")
                  setStatusFilter("all")
                  setPaymentStatusFilter("all")
                  setPaymentMethodFilter("all")
                  setCurrentPage(1)
                }}
                className="w-full"
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Table */}
      <Card>
        <CardHeader>
          <CardTitle>Subscription History ({totalItems} total)</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Lead Usage</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscriptions.map((subscription) => {
                    const statusConfig = SUBSCRIPTION_STATUS_CONFIG[subscription.status]
                    const paymentConfig = PAYMENT_STATUS_CONFIG[subscription.payment.paymentStatus]
                    
                    return (
                      <TableRow key={subscription._id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.userInfo?.name || 'Unknown'}</div>
                            <div className="text-sm text-muted-foreground">{subscription.userInfo?.email}</div>
                            {subscription.userInfo?.phone && (
                              <div className="text-sm text-muted-foreground">{subscription.userInfo.phone}</div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div>
                            <div className="font-medium">{subscription.planSnapshot.planName}</div>
                            <div className="text-sm text-muted-foreground">
                              {subscription.planSnapshot.duration} • {subscription.planSnapshot.totalLeads} leads
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <Badge className={`${statusConfig?.color} text-white`}>
                              {statusConfig?.label}
                            </Badge>
                            {subscription.isActive && (
                              <div className="text-sm text-muted-foreground">
                                {subscription.daysRemaining} days left
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <Badge className={`${paymentConfig?.color} text-white`}>
                                {paymentConfig?.label}
                              </Badge>
                              <Badge variant="outline">
                                {subscription.payment.paymentMethod === 'bank_transfer' ? 'Bank' : 'Online'}
                              </Badge>
                            </div>
                            {subscription.payment.transactionId && (
                              <div className="text-sm text-muted-foreground">
                                TXN: {subscription.payment.transactionId}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="font-medium">
                            {formatCurrency(subscription.payment.amount)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">
                              <span className="font-medium">{subscription.usage?.leadsConsumed || 0}</span>
                              <span className="text-muted-foreground"> / {subscription.planSnapshot.totalLeads} consumed</span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {subscription.usage?.leadsRemaining || 0} remaining
                            </div>
                            {subscription.status === 'active' && subscription.usage?.leadsConsumed > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-1.5">
                                <div 
                                  className="bg-blue-600 h-1.5 rounded-full" 
                                  style={{ 
                                    width: `${Math.min(100, ((subscription.usage.leadsConsumed / subscription.planSnapshot.totalLeads) * 100))}%` 
                                  }}
                                ></div>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        

                        
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(subscription.createdAt)}
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setDetailsDialog({ open: true, subscription })}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {subscription.status === 'active' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setLeadAdjustmentDialog({ open: true, subscription })}
                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                              >
                                <TrendingUp className="h-4 w-4 mr-1" />
                                Adjust
                              </Button>
                            )}
                            
                            {subscription.payment.paymentMethod === 'bank_transfer' && 
                             (subscription.payment.paymentStatus === 'pending' || subscription.payment.paymentStatus === 'submitted') && (
                              <>
                                <Button
                                  variant="default"
                                  size="sm"
                                  onClick={() => {
                                    setVerificationDialog({ open: true, subscription })
                                    setTransactionId(subscription.payment.transactionId || "")
                                  }}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => setRejectionDialog({ open: true, subscription })}
                                >
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}

                            {/* 3-dot menu */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                {subscription.status === 'active' && (
                                  <DropdownMenuItem
                                    onClick={() => setCancelDialog({ open: true, subscription })}
                                    className="text-orange-600 focus:text-orange-600"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Cancel Subscription
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  onClick={() => setDeleteDialog({ open: true, subscription })}
                                  className="text-red-600 focus:text-red-600"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete Subscription
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * 20) + 1} to {Math.min(currentPage * 20, totalItems)} of {totalItems} results
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="text-sm">
                      Page {currentPage} of {totalPages}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Verification Dialog */}
      <Dialog open={verificationDialog.open} onOpenChange={(open) => {
        setVerificationDialog({ open, subscription: open ? verificationDialog.subscription : null })
        if (!open) {
          setVerificationNotes("")
          setTransactionId("")
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify and Activate Subscription</DialogTitle>
            <DialogDescription>
              Review the bank transfer details and activate the subscription if payment is verified.
            </DialogDescription>
          </DialogHeader>
          
          {verificationDialog.subscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">User:</Label>
                  <p>{verificationDialog.subscription.userInfo?.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Plan:</Label>
                  <p>{verificationDialog.subscription.planSnapshot.planName}</p>
                </div>
                <div>
                  <Label className="font-medium">Amount:</Label>
                  <p>{formatCurrency(verificationDialog.subscription.payment.amount)}</p>
                </div>
                <div>
                  <Label className="font-medium">Current TXN ID:</Label>
                  <p>{verificationDialog.subscription.payment.transactionId || 'Not provided'}</p>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label>Transaction ID</Label>
                <Input
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter verified transaction ID"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Verification Notes</Label>
                <Textarea
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="Add verification notes..."
                  rows={3}
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVerificationDialog({ open: false, subscription: null })}
            >
              Cancel
            </Button>
            <Button onClick={handleVerifyAndActivate} disabled={processing}>
              {processing ? "Processing..." : "Verify & Activate"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <AlertDialog open={rejectionDialog.open} onOpenChange={(open) => {
        setRejectionDialog({ open, subscription: open ? rejectionDialog.subscription : null })
        if (!open) setVerificationNotes("")
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reject this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          <div className="space-y-2">
            <Label>Rejection Reason</Label>
            <Textarea
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              placeholder="Provide reason for rejection..."
              rows={3}
            />
          </div>
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRejectPayment}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? "Processing..." : "Reject Payment"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Details Dialog */}
      <Dialog open={detailsDialog.open} onOpenChange={(open) => {
        setDetailsDialog({ open, subscription: open ? detailsDialog.subscription : null })
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Subscription Details</DialogTitle>
          </DialogHeader>
          
          {detailsDialog.subscription && (
            <div className="space-y-6 overflow-y-auto flex-1 pr-2">
              {/* User & Plan Info */}
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">User Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="font-medium">Name:</Label>
                      <p>{detailsDialog.subscription.userInfo?.name || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Email:</Label>
                      <p>{detailsDialog.subscription.userInfo?.email || 'Unknown'}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Phone:</Label>
                      <p>{detailsDialog.subscription.userInfo?.phone || 'Unknown'}</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Plan Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div>
                      <Label className="font-medium">Plan:</Label>
                      <p>{detailsDialog.subscription.planSnapshot.planName}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Duration:</Label>
                      <p>{detailsDialog.subscription.planSnapshot.duration}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Total Leads:</Label>
                      <p>{detailsDialog.subscription.planSnapshot.totalLeads}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Usage:</Label>
                      <p>{detailsDialog.subscription.usage.leadsConsumed} / {detailsDialog.subscription.planSnapshot.totalLeads} ({detailsDialog.subscription.usagePercentage}%)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payment Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="font-medium">Amount:</Label>
                      <p>{formatCurrency(detailsDialog.subscription.payment.amount)}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Method:</Label>
                      <p className="capitalize">{detailsDialog.subscription.payment.paymentMethod.replace('_', ' ')}</p>
                    </div>
                    <div>
                      <Label className="font-medium">Status:</Label>
                      <Badge className={`${PAYMENT_STATUS_CONFIG[detailsDialog.subscription.payment.paymentStatus]?.color} text-white`}>
                        {PAYMENT_STATUS_CONFIG[detailsDialog.subscription.payment.paymentStatus]?.label}
                      </Badge>
                    </div>
                    {detailsDialog.subscription.payment.transactionId && (
                      <div className="col-span-3">
                        <Label className="font-medium">Transaction ID:</Label>
                        <p>{detailsDialog.subscription.payment.transactionId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* History */}
              {detailsDialog.subscription.history && detailsDialog.subscription.history.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">History</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {detailsDialog.subscription.history.map((entry, index) => (
                        <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div>
                            <span className="font-medium capitalize">{entry.action}</span>
                            {entry.reason && <p className="text-sm text-muted-foreground">{entry.reason}</p>}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {formatDate(entry.date)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lead History */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Lead History</CardTitle>
                </CardHeader>
                <CardContent>
                  {detailsDialog.subscription.history && detailsDialog.subscription.history.length > 0 ? (
                    <div className="space-y-3">
                      {detailsDialog.subscription.history
                        .filter(item => item.action === 'leads_increased' || item.action === 'leads_decreased')
                        .map((item, index) => (
                          <div key={index} className="flex items-start justify-between p-3 border rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <div className={`font-semibold text-lg ${
                                  item.action === 'leads_increased' 
                                    ? 'text-green-600' 
                                    : 'text-red-600'
                                }`}>
                                  {item.action === 'leads_increased' ? '+' : '-'}
                                  {item.metadata?.adjustmentAmount || 0} leads
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {item.action === 'leads_increased' ? 'Increased' : 'Decreased'}
                                </Badge>
                              </div>
                              {item.reason && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  <span className="font-medium">Reason:</span> {item.reason}
                                </p>
                              )}
                              <div className="text-xs text-muted-foreground mt-2">
                                {formatDate(item.date)}
                              </div>
                            </div>
                          </div>
                        ))
                      }
                      {detailsDialog.subscription.history.filter(item => 
                        item.action === 'leads_increased' || item.action === 'leads_decreased'
                      ).length === 0 && (
                        <div className="text-center py-6 text-muted-foreground">
                          <div className="text-lg font-medium mb-2">No Lead Adjustments</div>
                          <p className="text-sm">No lead increases or decreases have been made to this subscription.</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 text-muted-foreground">
                      <div className="text-lg font-medium mb-2">No History Available</div>
                      <p className="text-sm">No history records found for this subscription.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create Subscription Dialog */}
      <Dialog open={createDialog.open} onOpenChange={(open) => {
        setCreateDialog({ open })
        if (open) {
          loadVendorsAndPlans()
        } else {
          setCreateFormData({
            vendorId: "",
            subscriptionPlanId: "",
            paymentMethod: "online",
            transactionId: "",
            amount: "",
            paymentStatus: "completed",
            status: "active",
            notes: ""
          })
          setPlanSearchOpen(false)
          setVendorSearch("")
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create New Subscription</DialogTitle>
            <DialogDescription>
              Manually create a subscription record for a vendor
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto flex-1 pr-2">
            {/* Vendor Selection */}
            <div className="space-y-2">
              <Label>Vendor *</Label>
              
              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search vendors by name, email, or phone..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {loadingVendorsAndPlans ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  <span className="ml-2 text-sm text-muted-foreground">Loading vendors...</span>
                </div>
              ) : (
                <div className="max-h-60 overflow-y-auto border rounded-md p-4 space-y-2">
                  {filteredVendors.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {vendors.length === 0 ? "No vendors available" : vendorSearch ? `No vendors match "${vendorSearch}"` : "No vendors found"}
                    </p>
                  ) : (
                    filteredVendors.map((vendor) => {
                      const hasActiveSubscription = subscriptions.some(sub => 
                        sub.userInfo?.email === vendor.userData?.email && 
                        sub.status === 'active'
                      )
                      
                      return (
                        <div key={vendor._id} className="flex items-center space-x-2">
                          <input
                            type="radio"
                            id={`vendor-${vendor._id}`}
                            name="selectedVendor"
                            checked={createFormData.vendorId === (vendor.vendorId || vendor._id)}
                            onChange={() => setCreateFormData(prev => ({ ...prev, vendorId: vendor.vendorId || vendor._id }))}
                            className="rounded"
                            disabled={hasActiveSubscription}
                          />
                          <Label 
                            htmlFor={`vendor-${vendor._id}`} 
                            className={`text-sm font-normal cursor-pointer flex-1 ${
                              !vendor.vendorId || hasActiveSubscription ? 'opacity-50' : ''
                            }`}
                          >
                            <div>
                              <div className="font-medium">
                                {vendor.businessName || vendor.userData?.name || 'Unknown'}
                                {!vendor.vendorId && <span className="text-red-500 ml-2">(Incomplete Profile)</span>}
                                {hasActiveSubscription && <span className="text-orange-500 ml-2">(Active Subscription)</span>}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {vendor.userData?.name} • {vendor.userData?.email} • {vendor.userData?.phone}
                                {!vendor.vendorId && <span className="text-red-500"> • No vendor profile</span>}
                                {hasActiveSubscription && <span className="text-orange-500"> • Already subscribed</span>}
                              </div>
                            </div>
                          </Label>
                        </div>
                      )
                    })
                  )}
                </div>
              )}
              
              {/* Search Results Summary */}
              {vendorSearch && (
                <div className="text-sm text-muted-foreground">
                  Showing {filteredVendors.length} of {vendors.length} vendors
                </div>
              )}
            </div>

            {/* Subscription Plan Selection */}
            <div className="space-y-2">
              <Label>Subscription Plan *</Label>
              <Popover open={planSearchOpen} onOpenChange={setPlanSearchOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    role="combobox"
                    aria-expanded={planSearchOpen}
                    className="w-full justify-between"
                    disabled={loadingVendorsAndPlans}
                  >
                    {createFormData.subscriptionPlanId
                      ? subscriptionPlans.find((plan) => plan._id === createFormData.subscriptionPlanId)
                          ? `${subscriptionPlans.find((plan) => plan._id === createFormData.subscriptionPlanId)?.planName} - ${
                               formatCurrency(subscriptionPlans.find((plan) => plan._id === createFormData.subscriptionPlanId)?.effectivePrice || 
                                             subscriptionPlans.find((plan) => plan._id === createFormData.subscriptionPlanId)?.price || 0)} (${
                               subscriptionPlans.find((plan) => plan._id === createFormData.subscriptionPlanId)?.duration})`
                          : "Select subscription plan..."
                      : loadingVendorsAndPlans 
                        ? "Loading plans..." 
                        : "Select subscription plan..."}
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0">
                  <Command>
                    <CommandInput placeholder="Search subscription plans..." />
                    <CommandEmpty>
                      {loadingVendorsAndPlans ? "Loading plans..." : "No subscription plans found."}
                    </CommandEmpty>
                    <CommandGroup className="max-h-[200px] overflow-auto">
                      {subscriptionPlans.map((plan) => (
                        <CommandItem
                          key={plan._id}
                          value={`${plan.planName} ${plan.duration}`}
                          onSelect={() => {
                            setCreateFormData(prev => ({ 
                              ...prev, 
                              subscriptionPlanId: plan._id,
                              amount: (plan.effectivePrice || plan.price || "").toString()
                            }))
                            setPlanSearchOpen(false)
                          }}
                        >
                          <Check
                            className={`mr-2 h-4 w-4 ${
                              createFormData.subscriptionPlanId === plan._id ? "opacity-100" : "opacity-0"
                            }`}
                          />
                          <div className="flex flex-col">
                            <span className="font-medium">{plan.planName}</span>
                            <span className="text-sm text-muted-foreground">
                              {formatCurrency(plan.effectivePrice || plan.price || 0)} • {plan.duration} • {plan.totalLeads} leads
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </Command>
                </PopoverContent>
              </Popover>
              {subscriptionPlans.length === 0 && !loadingVendorsAndPlans && (
                <p className="text-sm text-red-600">No subscription plans found. Please create subscription plans first.</p>
              )}
            </div>

            {/* Payment Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select 
                  value={createFormData.paymentMethod} 
                  onValueChange={(value) => setCreateFormData(prev => ({ ...prev, paymentMethod: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">Online Payment</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payment Status</Label>
                <Select 
                  value={createFormData.paymentStatus} 
                  onValueChange={(value) => setCreateFormData(prev => ({ ...prev, paymentStatus: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="submitted">Submitted</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="failed">Failed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount *</Label>
                <Input
                  type="number"
                  value={createFormData.amount}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, amount: e.target.value }))}
                  placeholder="Enter amount"
                />
              </div>

              <div className="space-y-2">
                <Label>Transaction ID</Label>
                <Input
                  value={createFormData.transactionId}
                  onChange={(e) => setCreateFormData(prev => ({ ...prev, transactionId: e.target.value }))}
                  placeholder="Enter transaction ID"
                />
              </div>
            </div>

            {/* Subscription Status */}
            <div className="space-y-2">
              <Label>Subscription Status</Label>
              <Select 
                value={createFormData.status} 
                onValueChange={(value) => setCreateFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expired</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={createFormData.notes}
                onChange={(e) => setCreateFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add any notes about this subscription..."
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter className="flex-shrink-0">
            <Button
              variant="outline"
              onClick={() => setCreateDialog({ open: false })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleCreateSubscription} 
              disabled={processing || !createFormData.vendorId || !createFormData.subscriptionPlanId || !createFormData.amount}
            >
              {processing ? "Creating..." : "Create Subscription"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialog.open} onOpenChange={(open) => {
        setDeleteDialog({ open, subscription: open ? deleteDialog.subscription : null })
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this subscription? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {deleteDialog.subscription && (
            <div className="space-y-2">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{deleteDialog.subscription.userInfo?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {deleteDialog.subscription.planSnapshot.planName} - {formatCurrency(deleteDialog.subscription.payment.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Created: {formatDate(deleteDialog.subscription.createdAt)}
                </p>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSubscription}
              disabled={processing}
              className="bg-red-600 hover:bg-red-700"
            >
              {processing ? "Deleting..." : "Delete Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Subscription Confirmation Dialog */}
      <AlertDialog open={cancelDialog.open} onOpenChange={(open) => {
        setCancelDialog({ open, subscription: open ? cancelDialog.subscription : null })
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Subscription</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this active subscription? The vendor will lose access to leads immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          
          {cancelDialog.subscription && (
            <div className="space-y-2">
              <div className="p-4 bg-muted rounded-lg">
                <p className="font-medium">{cancelDialog.subscription.userInfo?.name}</p>
                <p className="text-sm text-muted-foreground">
                  {cancelDialog.subscription.planSnapshot.planName} - {formatCurrency(cancelDialog.subscription.payment.amount)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Created: {formatDate(cancelDialog.subscription.createdAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Status: <Badge variant="default" className="ml-1">Active</Badge>
                </p>
              </div>
            </div>
          )}
          
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Active</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelSubscription}
              disabled={processing}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {processing ? "Cancelling..." : "Cancel Subscription"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Lead Adjustment Dialog */}
      <Dialog open={leadAdjustmentDialog.open} onOpenChange={(open) => {
        setLeadAdjustmentDialog({ open, subscription: open ? leadAdjustmentDialog.subscription : null })
        if (!open) {
          setLeadAdjustmentData({ type: "increase", amount: "", reason: "" })
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Subscription Leads</DialogTitle>
            <DialogDescription>
              Increase or decrease the number of leads available for this active subscription.
            </DialogDescription>
          </DialogHeader>
          
          {leadAdjustmentDialog.subscription && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="font-medium">Vendor:</Label>
                  <p>{leadAdjustmentDialog.subscription.userInfo?.name}</p>
                </div>
                <div>
                  <Label className="font-medium">Plan:</Label>
                  <p>{leadAdjustmentDialog.subscription.planSnapshot.planName}</p>
                </div>
                <div>
                  <Label className="font-medium">Current Leads Consumed:</Label>
                  <p>{leadAdjustmentDialog.subscription.usage?.leadsConsumed || 0}</p>
                </div>
                <div>
                  <Label className="font-medium">Current Leads Remaining:</Label>
                  <p>{leadAdjustmentDialog.subscription.usage?.leadsRemaining || 0}</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Adjustment Type</Label>
                  <div className="flex space-x-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="increase"
                        name="adjustmentType"
                        value="increase"
                        checked={leadAdjustmentData.type === "increase"}
                        onChange={(e) => setLeadAdjustmentData(prev => ({ ...prev, type: e.target.value }))}
                        className="rounded"
                      />
                      <Label htmlFor="increase" className="text-green-600 font-medium">Increase Leads</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="radio"
                        id="decrease"
                        name="adjustmentType"
                        value="decrease"
                        checked={leadAdjustmentData.type === "decrease"}
                        onChange={(e) => setLeadAdjustmentData(prev => ({ ...prev, type: e.target.value }))}
                        className="rounded"
                      />
                      <Label htmlFor="decrease" className="text-red-600 font-medium">Decrease Leads</Label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Number of Leads</Label>
                  <Input
                    type="number"
                    min="1"
                    value={leadAdjustmentData.amount}
                    onChange={(e) => setLeadAdjustmentData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="Enter number of leads"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Reason for Adjustment</Label>
                  <Textarea
                    value={leadAdjustmentData.reason}
                    onChange={(e) => setLeadAdjustmentData(prev => ({ ...prev, reason: e.target.value }))}
                    placeholder="Provide reason for this lead adjustment..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setLeadAdjustmentDialog({ open: false, subscription: null })}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustLeads} 
              disabled={processing || !leadAdjustmentData.amount || !leadAdjustmentData.reason}
              className={leadAdjustmentData.type === "increase" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {processing ? "Processing..." : `${leadAdjustmentData.type === "increase" ? "Increase" : "Decrease"} Leads`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
} 