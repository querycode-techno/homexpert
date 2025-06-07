"use client"

import { useState, useRef, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Download,
  Upload,
  Users,
  Store,
  Clock,
  Package,
  PlusCircle,
  MinusCircle,
  History,
} from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Textarea } from "@/components/ui/textarea"

export function EmployeeManagement() {
  const {
    employees,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    subscriptions,
    leads,
    addLead,
    deleteLead,
    exportToCSV,
    importFromCSV,
  } = useData()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [vendorSearchTerm, setVendorSearchTerm] = useState("")
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)
  const [filteredEmployees, setFilteredEmployees] = useState([])

  // Vendor management states
  const [filteredVendors, setFilteredVendors] = useState([])
  const [currentVendor, setCurrentVendor] = useState(null)
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false)
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false)
  const [isDeleteVendorDialogOpen, setIsDeleteVendorDialogOpen] = useState(false)
  const [isAddLeadsDialogOpen, setIsAddLeadsDialogOpen] = useState(false)
  const [isRemoveLeadsDialogOpen, setIsRemoveLeadsDialogOpen] = useState(false)
  const [isLeadHistoryDialogOpen, setIsLeadHistoryDialogOpen] = useState(false)
  const [leadsToAdd, setLeadsToAdd] = useState("10")
  const [leadsToRemove, setLeadsToRemove] = useState("5")
  const [leadAddReason, setLeadAddReason] = useState("")
  const [leadRemoveReason, setLeadRemoveReason] = useState("")
  const [vendorLeadCounts, setVendorLeadCounts] = useState({})
  const [isProcessingLeads, setIsProcessingLeads] = useState(false)
  const [leadProcessingProgress, setLeadProcessingProgress] = useState(0)

  // Lead history tracking
  const [leadHistory, setLeadHistory] = useState({})
  const [isManageVendorLeadsOpen, setIsManageVendorLeadsOpen] = useState(false)

  // Form states
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "Active",
  })

  const [vendorFormData, setVendorFormData] = useState({
    name: "",
    phone: "",
    subscription: "Basic Plan",
    startDate: "",
    endDate: "",
    status: "Active",
    leadQuota: 10,
    leadsUsed: 0,
  })

  // File input ref
  const fileInputRef = useRef(null)
  const vendorFileInputRef = useRef(null)

  // Load lead history from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedHistory = localStorage.getItem("leadHistory")
      if (savedHistory) {
        setLeadHistory(JSON.parse(savedHistory))
      }
    }
  }, [])

  // Save lead history to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined" && Object.keys(leadHistory).length > 0) {
      localStorage.setItem("leadHistory", JSON.stringify(leadHistory))
    }
  }, [leadHistory])

  // Update filtered employees when employees or search term changes
  useEffect(() => {
    if (!employees) return

    setFilteredEmployees(
      employees.filter(
        (employee) =>
          (employee.id && employee.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (employee.name && employee.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (employee.email && employee.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (employee.phone && employee.phone.toLowerCase().includes(searchTerm.toLowerCase())),
      ),
    )
  }, [employees, searchTerm])

  // Update filtered vendors when vendors or search term changes
  useEffect(() => {
    if (!vendors) return

    setFilteredVendors(
      vendors.filter(
        (vendor) =>
          (vendor.id && vendor.id.toLowerCase().includes(vendorSearchTerm.toLowerCase())) ||
          (vendor.name && vendor.name.toLowerCase().includes(vendorSearchTerm.toLowerCase())) ||
          (vendor.phone && vendor.phone.toLowerCase().includes(vendorSearchTerm.toLowerCase())) ||
          (vendor.subscription && vendor.subscription.toLowerCase().includes(vendorSearchTerm.toLowerCase())),
      ),
    )
  }, [vendors, vendorSearchTerm])

  // Calculate lead counts for each vendor
  useEffect(() => {
    if (!vendors || !leads) return

    const counts = {}
    vendors.forEach((vendor) => {
      if (vendor && vendor.name) {
        const vendorLeads = leads.filter((lead) => lead.assignedTo === vendor.name)
        counts[vendor.id] = vendorLeads.length
      }
    })
    setVendorLeadCounts(counts)
  }, [vendors, leads])

  // Calculate days remaining for subscription
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

  // Get subscription quota
  const getSubscriptionQuota = (subscriptionName) => {
    if (!subscriptionName) return 0

    switch (subscriptionName) {
      case "Basic Plan":
        return 10
      case "Standard Plan":
        return 50
      case "Premium Plan":
        return 100
      case "Trial Plan":
        return 5
      default:
        return 0
    }
  }

  // Add entry to lead history
  const addToLeadHistory = (vendorId, action, count, reason) => {
    const timestamp = new Date().toISOString()
    const newEntry = {
      timestamp,
      action,
      count,
      beforeCount: vendorLeadCounts[vendorId] || 0,
      afterCount:
        action === "add"
          ? (vendorLeadCounts[vendorId] || 0) + count
          : Math.max(0, (vendorLeadCounts[vendorId] || 0) - count),
    }

    setLeadHistory((prev) => {
      const vendorHistory = prev[vendorId] || []
      return {
        ...prev,
        [vendorId]: [newEntry, ...vendorHistory].slice(0, 50), // Keep last 50 entries
      }
    })
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleVendorInputChange = (e) => {
    const { name, value } = e.target
    setVendorFormData({
      ...vendorFormData,
      [name]: value,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleVendorSelectChange = (name, value) => {
    const updatedFormData = {
      ...vendorFormData,
      [name]: value,
    }

    // Update lead quota based on subscription
    if (name === "subscription") {
      updatedFormData.leadQuota = getSubscriptionQuota(value)
    }

    setVendorFormData(updatedFormData)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      role: "",
      status: "Active",
    })
  }

  const resetVendorForm = () => {
    const today = new Date()
    const threeMonthsLater = new Date(today)
    threeMonthsLater.setMonth(today.getMonth() + 3)

    setVendorFormData({
      name: "",
      phone: "",
      subscription: "Basic Plan",
      startDate: today.toISOString().split("T")[0],
      endDate: threeMonthsLater.toISOString().split("T")[0],
      status: "Active",
      leadQuota: 10,
      leadsUsed: 0,
    })
  }

  const handleAddEmployee = () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Add employee
    const newEmployee = addEmployee(formData)

    // Show success message
    toast({
      title: "Employee Added",
      description: `${newEmployee.name} has been added successfully.`,
    })

    // Close dialog and reset form
    setIsAddEmployeeOpen(false)
    resetForm()
  }

  const handleAddVendor = () => {
    // Validate form
    if (!vendorFormData.name || !vendorFormData.phone || !vendorFormData.subscription) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Set dates if not provided
    if (!vendorFormData.startDate) {
      vendorFormData.startDate = new Date().toISOString().split("T")[0]
    }

    if (!vendorFormData.endDate) {
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3) // Default 3 months
      vendorFormData.endDate = endDate.toISOString().split("T")[0]
    }

    // Add vendor
    const newVendor = addVendor(vendorFormData)

    // Show success message
    toast({
      title: "Vendor Added",
      description: `${newVendor.name} has been added successfully.`,
    })

    // Close dialog and reset form
    setIsAddVendorOpen(false)
    resetVendorForm()
  }

  const handleEditClick = (employee) => {
    setCurrentEmployee(employee)
    setFormData({
      name: employee.name || "",
      email: employee.email || "",
      phone: employee.phone || "",
      role: employee.role || "",
      status: employee.status || "Active",
    })
    setIsEditEmployeeOpen(true)
  }

  const handleEditVendorClick = (vendor) => {
    setCurrentVendor(vendor)
    setVendorFormData({
      name: vendor.name || "",
      phone: vendor.phone || "",
      subscription: vendor.subscription || "Basic Plan",
      startDate: vendor.startDate || "",
      endDate: vendor.endDate || "",
      status: vendor.status || "Active",
      leadQuota: vendor.leadQuota || getSubscriptionQuota(vendor.subscription) || 0,
      leadsUsed: vendor.leadsUsed || vendorLeadCounts[vendor.id] || 0,
    })
    setIsEditVendorOpen(true)
  }

  const handleUpdateEmployee = () => {
    // Validate form
    if (!formData.name || !formData.email || !formData.phone || !formData.role) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Update employee
    updateEmployee(currentEmployee.id, formData)

    // Show success message
    toast({
      title: "Employee Updated",
      description: `${formData.name} has been updated successfully.`,
    })

    // Close dialog and reset
    setIsEditEmployeeOpen(false)
    setCurrentEmployee(null)
    resetForm()
  }

  const handleUpdateVendor = () => {
    // Validate form
    if (!vendorFormData.name || !vendorFormData.phone || !vendorFormData.subscription) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Update vendor
    updateVendor(currentVendor.id, vendorFormData)

    // Show success message
    toast({
      title: "Vendor Updated",
      description: `${vendorFormData.name} has been updated successfully.`,
    })

    // Close dialog and reset
    setIsEditVendorOpen(false)
    setCurrentVendor(null)
    resetVendorForm()
  }

  const handleDeleteClick = (employee) => {
    setCurrentEmployee(employee)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteVendorClick = (vendor) => {
    setCurrentVendor(vendor)
    setIsDeleteVendorDialogOpen(true)
  }

  const handleDeleteEmployee = () => {
    // Delete employee
    deleteEmployee(currentEmployee.id)

    // Show success message
    toast({
      title: "Employee Deleted",
      description: `${currentEmployee.name} has been deleted successfully.`,
    })

    // Close dialog and reset
    setIsDeleteDialogOpen(false)
    setCurrentEmployee(null)
  }

  const handleDeleteVendor = () => {
    // Delete vendor
    deleteVendor(currentVendor.id)

    // Show success message
    toast({
      title: "Vendor Deleted",
      description: `${currentVendor.name} has been deleted successfully.`,
    })

    // Close dialog and reset
    setIsDeleteVendorDialogOpen(false)
    setCurrentVendor(null)
  }

  const handleAddLeadsClick = (vendor) => {
    setCurrentVendor(vendor)
    setLeadsToAdd("10")
    setLeadAddReason("")
    setIsAddLeadsDialogOpen(true)
  }

  const handleRemoveLeadsClick = (vendor) => {
    setCurrentVendor(vendor)
    setLeadsToRemove("5")
    setLeadRemoveReason("")
    setIsRemoveLeadsDialogOpen(true)
  }

  const handleViewLeadHistoryClick = (vendor) => {
    setCurrentVendor(vendor)
    setIsLeadHistoryDialogOpen(true)
  }

  // Improved bulk lead addition with progress tracking and history
  const handleAddLeads = async () => {
    if (!currentVendor || !currentVendor.name) {
      toast({
        title: "Error",
        description: "Vendor information is missing.",
        variant: "destructive",
      })
      return
    }

    // Convert leadsToAdd to a number to ensure proper loop execution
    const numLeadsToAdd = Number.parseInt(leadsToAdd, 10) || 0

    if (numLeadsToAdd <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a positive number of leads to add.",
        variant: "destructive",
      })
      return
    }

    // Start processing
    setIsProcessingLeads(true)
    setLeadProcessingProgress(0)

    try {
      // Create a timestamp for this operation
      const timestamp = new Date().toISOString()

      // Record the before state
      const beforeCount = vendorLeadCounts[currentVendor.id] || 0
      const beforeQuota = currentVendor.leadQuota || getSubscriptionQuota(currentVendor.subscription) || 0
      const afterQuota = beforeQuota + numLeadsToAdd

      // Create history entry
      const historyEntry = {
        id: Date.now(),
        type: "add",
        count: numLeadsToAdd,
        beforeCount: beforeCount,
        beforeQuota: beforeQuota,
        afterCount: beforeCount,
        afterQuota: afterQuota,
        reason: leadAddReason || "Additional lead quota",
        timestamp: timestamp,
      }

      // Process in batches to show progress
      for (let i = 0; i < numLeadsToAdd; i++) {
        await new Promise((resolve) => setTimeout(resolve, 20)) // Simulate processing time
        setLeadProcessingProgress(Math.floor(((i + 1) / numLeadsToAdd) * 100))
      }

      // Update the vendor's lead quota using updateVendor
      const updatedVendor = {
        ...currentVendor,
        leadQuota: (currentVendor.leadQuota || 0) + numLeadsToAdd,
        leadHistory: [...(currentVendor.leadHistory || []), historyEntry],
      }

      // Update the vendor using the updateVendor function
      updateVendor(currentVendor.id, updatedVendor)

      // Update the current vendor state
      setCurrentVendor(updatedVendor)

      // Add to lead history
      addToLeadHistory(currentVendor.id, "add", numLeadsToAdd, leadAddReason || "Additional lead quota")

      setIsProcessingLeads(false)
      setLeadAddReason("")
      setIsAddLeadsDialogOpen(false)

      toast({
        title: "Leads Added",
        description: `${numLeadsToAdd} leads have been added to ${currentVendor.name}'s quota. Before: ${beforeCount} of ${beforeQuota}, After: ${beforeCount} of ${afterQuota}`,
      })
    } catch (error) {
      console.error("Error adding leads:", error)
      toast({
        title: "Error",
        description: "An error occurred while adding leads.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingLeads(false)
      setLeadProcessingProgress(0)
    }
  }

  // Improved bulk lead removal with progress tracking and history
  const handleRemoveLeads = async () => {
    if (!currentVendor || !currentVendor.name) {
      toast({
        title: "Error",
        description: "Vendor information is missing.",
        variant: "destructive",
      })
      return
    }

    // Convert leadsToRemove to a number
    const numLeadsToRemove = Number.parseInt(leadsToRemove, 10) || 0

    if (numLeadsToRemove <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a positive number of leads to remove.",
        variant: "destructive",
      })
      return
    }

    try {
      // Find leads assigned to this vendor
      const vendorLeads = leads ? leads.filter((lead) => lead.assignedTo === currentVendor.name) : []

      // Check if there are enough leads to remove
      if (vendorLeads.length < numLeadsToRemove) {
        toast({
          title: "Not Enough Leads",
          description: `${currentVendor.name} only has ${vendorLeads.length} leads. Cannot remove ${numLeadsToRemove} leads.`,
          variant: "destructive",
        })
        return
      }

      // Start processing
      setIsProcessingLeads(true)
      setLeadProcessingProgress(0)

      // Remove the specified number of leads
      const leadsToDelete = vendorLeads.slice(0, numLeadsToRemove)
      const deletedLeadIds = []

      // Process leads in batches to avoid UI freezing for large numbers
      const batchSize = 20
      const batches = Math.ceil(leadsToDelete.length / batchSize)

      for (let i = 0; i < batches; i++) {
        const start = i * batchSize
        const end = Math.min(start + batchSize, leadsToDelete.length)
        const batch = leadsToDelete.slice(start, end)

        // Delete each lead in the batch
        batch.forEach((lead) => {
          if (lead && lead.id) {
            deleteLead(lead.id)
            deletedLeadIds.push(lead.id)
          }
        })

        // Update progress
        const progress = Math.round((((i + 1) * batchSize) / numLeadsToRemove) * 100)
        setLeadProcessingProgress(Math.min(progress, 100))

        // Small delay to allow UI updates
        if (batches > 1) {
          await new Promise((resolve) => setTimeout(resolve, 50))
        }
      }

      // Force refresh the vendor lead counts
      const updatedCounts = { ...vendorLeadCounts }
      updatedCounts[currentVendor.id] = Math.max(0, (updatedCounts[currentVendor.id] || 0) - numLeadsToRemove)
      setVendorLeadCounts(updatedCounts)

      // Add to lead history
      addToLeadHistory(currentVendor.id, "remove", numLeadsToRemove, leadRemoveReason || "Bulk lead removal")

      // Show success message
      toast({
        title: "Leads Removed Successfully",
        description: `${numLeadsToRemove} leads have been removed from ${currentVendor.name}. Before: ${vendorLeadCounts[currentVendor.id] + numLeadsToRemove}, After: ${vendorLeadCounts[currentVendor.id]}`,
      })

      // Close dialog
      setIsRemoveLeadsDialogOpen(false)
      setCurrentVendor(null)
      setLeadRemoveReason("")
    } catch (error) {
      console.error("Error removing leads:", error)
      toast({
        title: "Error",
        description: "An error occurred while removing leads.",
        variant: "destructive",
      })
    } finally {
      setIsProcessingLeads(false)
      setLeadProcessingProgress(0)
    }
  }

  const handleExport = () => {
    try {
      exportToCSV(employees, "employees")
      toast({
        title: "Export Successful",
        description: "Employees data has been exported to CSV.",
      })
    } catch (error) {
      console.error("Error exporting employees:", error)
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting employees data.",
      })
    }
  }

  const handleVendorExport = () => {
    try {
      exportToCSV(vendors, "vendors")
      toast({
        title: "Export Successful",
        description: "Vendors data has been exported to CSV.",
      })
    } catch (error) {
      console.error("Error exporting vendors:", error)
      toast({
        title: "Export Failed",
        description: "An error occurred while exporting vendors data.",
      })
    }
  }

  const handleImportClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click()
    }
  }

  const handleVendorImportClick = () => {
    if (vendorFileInputRef.current) {
      vendorFileInputRef.current.click()
    }
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        importFromCSV(file, "employees", (data) => {
          toast({
            title: "Import Successful",
            description: `${data.length} employees have been imported.`,
          })
        })
      } catch (error) {
        console.error("Error importing employees:", error)
        toast({
          title: "Import Failed",
          description: "An error occurred while importing employees data.",
        })
      }
    }
  }

  const handleVendorFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        importFromCSV(file, "vendors", (data) => {
          toast({
            title: "Import Successful",
            description: `${data.length} vendors have been imported.`,
          })
        })
      } catch (error) {
        console.error("Error importing vendors:", error)
        toast({
          title: "Import Failed",
          description: "An error occurred while importing vendors data.",
        })
      }
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString)
      return date.toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    } catch (e) {
      return dateString
    }
  }

  // Safe rendering helper
  const safeRenderVendorRow = (vendor) => {
    if (!vendor || !vendor.id) return null

    try {
      const daysRemaining = calculateDaysRemaining(vendor.endDate)
      const leadQuota = vendor.leadQuota || getSubscriptionQuota(vendor.subscription) || 0
      const leadsUsed = vendorLeadCounts[vendor.id] || 0
      const leadsRemaining = Math.max(0, leadQuota - leadsUsed)
      const leadsPercentage = Math.min(100, Math.round((leadsUsed / (leadQuota || 1)) * 100))
      const hasLeadHistory = leadHistory[vendor.id] && leadHistory[vendor.id].length > 0

      return (
        <tr key={vendor.id} className="border-b">
          <td className="p-2">{vendor.id}</td>
          <td className="p-2">{vendor.name || "N/A"}</td>
          <td className="p-2">{vendor.phone || "N/A"}</td>
          <td className="p-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Package className="h-3 w-3" />
              <span>{vendor.subscription || "N/A"}</span>
            </Badge>
          </td>
          <td className="p-2">
            <Badge
              variant={vendor.status === "Active" ? "default" : "secondary"}
              className={
                vendor.status === "Active"
                  ? "bg-green-500 hover:bg-green-500/80"
                  : vendor.status === "Expired"
                    ? "bg-red-500 hover:bg-red-500/80"
                    : "bg-yellow-500 hover:bg-yellow-500/80"
              }
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
              {hasLeadHistory && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-1 h-6 text-xs flex items-center justify-center gap-1 text-muted-foreground"
                  onClick={() => handleViewLeadHistoryClick(vendor)}
                >
                  <History className="h-3 w-3" />
                  <span>View History</span>
                </Button>
              )}
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
                <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleEditVendorClick(vendor)}>
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleAddLeadsClick(vendor)}>
                  <PlusCircle className="h-4 w-4" />
                  <span>Add Leads</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="flex items-center gap-2" onClick={() => handleRemoveLeadsClick(vendor)}>
                  <MinusCircle className="h-4 w-4" />
                  <span>Remove Leads</span>
                </DropdownMenuItem>
                {hasLeadHistory && (
                  <DropdownMenuItem
                    className="flex items-center gap-2"
                    onClick={() => handleViewLeadHistoryClick(vendor)}
                  >
                    <History className="h-4 w-4" />
                    <span>Lead History</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  className="flex items-center gap-2 text-red-500"
                  onClick={() => handleDeleteVendorClick(vendor)}
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
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Staff & Vendor Management</h1>
        <p className="text-muted-foreground">Manage your employees, vendors, their roles, and permissions.</p>
      </div>

      <Tabs defaultValue="employees" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="employees" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>Employees</span>
          </TabsTrigger>
          <TabsTrigger value="vendors" className="flex items-center gap-2">
            <Store className="h-4 w-4" />
            <span>Vendors</span>
          </TabsTrigger>
        </TabsList>

        {/* Employees Tab Content */}
        <TabsContent value="employees">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Employees</CardTitle>
                <CardDescription>Manage employee information and access.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleImportClick}>
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                <Dialog open={isAddEmployeeOpen} onOpenChange={setIsAddEmployeeOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                      <Plus className="h-4 w-4" />
                      <span>Add Employee</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Employee</DialogTitle>
                      <DialogDescription>Create a new employee account with role and permissions.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Full Name</Label>
                          <Input
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleInputChange}
                            placeholder="Enter full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            placeholder="Enter email address"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter phone number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="role">Role</Label>
                          <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Helpline">Helpline</SelectItem>
                              <SelectItem value="Telecaller">Telecaller</SelectItem>
                              <SelectItem value="Admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="documents">Upload Documents</Label>
                        <Input id="documents" type="file" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddEmployeeOpen(false)
                          resetForm()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddEmployee}>Create Employee</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Employee ID, name, email, or phone..."
                      className="pl-8"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left font-medium p-2">Employee ID</th>
                          <th className="text-left font-medium p-2">Name</th>
                          <th className="text-left font-medium p-2">Email</th>
                          <th className="text-left font-medium p-2">Phone</th>
                          <th className="text-left font-medium p-2">Role</th>
                          <th className="text-left font-medium p-2">Status</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees && filteredEmployees.length > 0 ? (
                          filteredEmployees.map((employee) =>
                            employee && employee.id ? (
                              <tr key={employee.id} className="border-b">
                                <td className="p-2">{employee.id}</td>
                                <td className="p-2">{employee.name || "N/A"}</td>
                                <td className="p-2">{employee.email || "N/A"}</td>
                                <td className="p-2">{employee.phone || "N/A"}</td>
                                <td className="p-2">
                                  <Badge variant="outline">{employee.role || "N/A"}</Badge>
                                </td>
                                <td className="p-2">
                                  <Badge
                                    variant={employee.status === "Active" ? "default" : "secondary"}
                                    className={
                                      employee.status === "Active"
                                        ? "bg-green-500 hover:bg-green-500/80"
                                        : "bg-red-500 hover:bg-red-500/80"
                                    }
                                  >
                                    {employee.status || "N/A"}
                                  </Badge>
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
                                        onClick={() => handleEditClick(employee)}
                                      >
                                        <Edit className="h-4 w-4" />
                                        <span>Edit</span>
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                        className="flex items-center gap-2 text-red-500"
                                        onClick={() => handleDeleteClick(employee)}
                                      >
                                        <Trash2 className="h-4 w-4" />
                                        <span>Delete</span>
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                            ) : null,
                          )
                        ) : (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-muted-foreground">
                              No employees found. Try a different search term or add a new employee.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Vendors Tab Content */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendors</CardTitle>
                <CardDescription>Manage vendor information, subscriptions, and leads.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={vendorFileInputRef}
                  onChange={handleVendorFileChange}
                  accept=".csv"
                  className="hidden"
                />
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleVendorImportClick}>
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleVendorExport}>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                      <Plus className="h-4 w-4" />
                      <span>Add Vendor</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Vendor</DialogTitle>
                      <DialogDescription>Create a new vendor account with subscription details.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vendor-name">Business Name</Label>
                          <Input
                            id="vendor-name"
                            name="name"
                            value={vendorFormData.name}
                            onChange={handleVendorInputChange}
                            placeholder="Enter business name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vendor-phone">Phone Number</Label>
                          <Input
                            id="vendor-phone"
                            name="phone"
                            value={vendorFormData.phone}
                            onChange={handleVendorInputChange}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vendor-subscription">Subscription Plan</Label>
                          <Select
                            value={vendorFormData.subscription}
                            onValueChange={(value) => handleVendorSelectChange("subscription", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select subscription" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Basic Plan">Basic Plan (10 Leads)</SelectItem>
                              <SelectItem value="Standard Plan">Standard Plan (50 Leads)</SelectItem>
                              <SelectItem value="Premium Plan">Premium Plan (100 Leads)</SelectItem>
                              <SelectItem value="Trial Plan">Trial Plan (5 Leads)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vendor-status">Status</Label>
                          <Select
                            value={vendorFormData.status}
                            onValueChange={(value) => handleVendorSelectChange("status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Active">Active</SelectItem>
                              <SelectItem value="Inactive">Inactive</SelectItem>
                              <SelectItem value="Expired">Expired</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="vendor-start-date">Start Date</Label>
                          <Input
                            id="vendor-start-date"
                            name="startDate"
                            type="date"
                            value={vendorFormData.startDate}
                            onChange={handleVendorInputChange}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vendor-end-date">End Date</Label>
                          <Input
                            id="vendor-end-date"
                            name="endDate"
                            type="date"
                            value={vendorFormData.endDate}
                            onChange={handleVendorInputChange}
                          />
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddVendorOpen(false)
                          resetVendorForm()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddVendor}>Create Vendor</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by Vendor ID, name, phone, or subscription..."
                      className="pl-8"
                      value={vendorSearchTerm}
                      onChange={(e) => setVendorSearchTerm(e.target.value)}
                    />
                  </div>
                </div>

                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left font-medium p-2">Vendor ID</th>
                          <th className="text-left font-medium p-2">Business Name</th>
                          <th className="text-left font-medium p-2">Phone</th>
                          <th className="text-left font-medium p-2">Subscription</th>
                          <th className="text-left font-medium p-2">Status</th>
                          <th className="text-left font-medium p-2">Time Remaining</th>
                          <th className="text-left font-medium p-2">Leads</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVendors && filteredVendors.length > 0 ? (
                          filteredVendors.map((vendor) => safeRenderVendorRow(vendor))
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-muted-foreground">
                              No vendors found. Try a different search term or add a new vendor.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Employee Dialog */}
      <Dialog open={isEditEmployeeOpen} onOpenChange={setIsEditEmployeeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Employee</DialogTitle>
            <DialogDescription>Update employee information.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Full Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-email">Email</Label>
                <Input
                  id="edit-email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Phone Number</Label>
                <Input
                  id="edit-phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => handleSelectChange("role", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Helpline">Helpline</SelectItem>
                    <SelectItem value="Telecaller">Telecaller</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditEmployeeOpen(false)
                resetForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEmployee}>Update Employee</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={isEditVendorOpen} onOpenChange={setIsEditVendorOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vendor</DialogTitle>
            <DialogDescription>Update vendor information and subscription details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-vendor-name">Business Name</Label>
                <Input
                  id="edit-vendor-name"
                  name="name"
                  value={vendorFormData.name}
                  onChange={handleVendorInputChange}
                  placeholder="Enter business name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vendor-phone">Phone Number</Label>
                <Input
                  id="edit-vendor-phone"
                  name="phone"
                  value={vendorFormData.phone}
                  onChange={handleVendorInputChange}
                  placeholder="Enter phone number"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-vendor-subscription">Subscription Plan</Label>
                <Select
                  value={vendorFormData.subscription}
                  onValueChange={(value) => handleVendorSelectChange("subscription", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Basic Plan">Basic Plan (10 Leads)</SelectItem>
                    <SelectItem value="Standard Plan">Standard Plan (50 Leads)</SelectItem>
                    <SelectItem value="Premium Plan">Premium Plan (100 Leads)</SelectItem>
                    <SelectItem value="Trial Plan">Trial Plan (5 Leads)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vendor-status">Status</Label>
                <Select
                  value={vendorFormData.status}
                  onValueChange={(value) => handleVendorSelectChange("status", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="Inactive">Inactive</SelectItem>
                    <SelectItem value="Expired">Expired</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-vendor-start-date">Start Date</Label>
                <Input
                  id="edit-vendor-start-date"
                  name="startDate"
                  type="date"
                  value={vendorFormData.startDate}
                  onChange={handleVendorInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-vendor-end-date">End Date</Label>
                <Input
                  id="edit-vendor-end-date"
                  name="endDate"
                  type="date"
                  value={vendorFormData.endDate}
                  onChange={handleVendorInputChange}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditVendorOpen(false)
                resetVendorForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateVendor}>Update Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Employee Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {currentEmployee?.name}'s account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Vendor Confirmation Dialog */}
      <AlertDialog open={isDeleteVendorDialogOpen} onOpenChange={setIsDeleteVendorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {currentVendor?.name}'s account and all associated data. This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteVendorDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVendor} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Leads Dialog */}
      <Dialog open={isAddLeadsDialogOpen} onOpenChange={setIsAddLeadsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Leads to Vendor</DialogTitle>
            <DialogDescription>Add new leads to {currentVendor?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leads-to-add">Number of Leads to Add</Label>
              <Input
                id="leads-to-add"
                type="number"
                min="1"
                max="100"
                value={leadsToAdd}
                onChange={(e) => setLeadsToAdd(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Enter any number from 1 to 100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-add-reason">Reason for Adding Leads (Optional)</Label>
              <Textarea
                id="lead-add-reason"
                placeholder="Enter reason for adding leads"
                value={leadAddReason}
                onChange={(e) => setLeadAddReason(e.target.value)}
              />
            </div>

            {currentVendor && (
              <div className="rounded-md bg-muted p-4">
                <div className="text-sm font-medium">Lead Count Summary</div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Current Lead Count:</span>
                    <span>
                      {vendorLeadCounts[currentVendor.id] || 0} of{" "}
                      {currentVendor.leadQuota || getSubscriptionQuota(currentVendor.subscription) || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Leads to Add:</span>
                    <span>+{Number.parseInt(leadsToAdd, 10) || 0}</span>
                  </div>
                  <div className="border-t border-border my-1"></div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>After Addition:</span>
                    <span>
                      {(vendorLeadCounts[currentVendor.id] || 0) + (Number.parseInt(leadsToAdd, 10) || 0)} of{" "}
                      {currentVendor.leadQuota || getSubscriptionQuota(currentVendor.subscription) || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLeadsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLeads} disabled={isProcessingLeads}>
              {isProcessingLeads ? "Processing..." : "Add Leads"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Remove Leads Dialog */}
      <Dialog open={isRemoveLeadsDialogOpen} onOpenChange={setIsRemoveLeadsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Leads from Vendor</DialogTitle>
            <DialogDescription>Remove leads from {currentVendor?.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="leads-to-remove">Number of Leads to Remove</Label>
              <Input
                id="leads-to-remove"
                type="number"
                min="1"
                max="100"
                value={leadsToRemove}
                onChange={(e) => setLeadsToRemove(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Enter any number from 1 to 100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="lead-remove-reason">Reason for Removing Leads (Optional)</Label>
              <Textarea
                id="lead-remove-reason"
                placeholder="Enter reason for removing leads"
                value={leadRemoveReason}
                onChange={(e) => setLeadRemoveReason(e.target.value)}
              />
            </div>

            {currentVendor && (
              <div className="rounded-md bg-muted p-4">
                <div className="text-sm font-medium">Lead Count Summary</div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Current Lead Count:</span>
                    <span>
                      {vendorLeadCounts[currentVendor.id] || 0} of{" "}
                      {currentVendor.leadQuota || getSubscriptionQuota(currentVendor.subscription) || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium">Leads to Remove:</span>
                    <span>-{Number.parseInt(leadsToRemove, 10) || 0}</span>
                  </div>
                  <div className="border-t border-border my-1"></div>
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span>After Removal:</span>
                    <span>
                      {Math.max(
                        0,
                        (vendorLeadCounts[currentVendor.id] || 0) - (Number.parseInt(leadsToRemove, 10) || 0),
                      )}{" "}
                      of {currentVendor.leadQuota || getSubscriptionQuota(currentVendor.subscription) || 0}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRemoveLeadsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRemoveLeads} disabled={isProcessingLeads}>
              {isProcessingLeads ? "Processing..." : "Remove Leads"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lead History Dialog */}
      <Dialog open={isLeadHistoryDialogOpen} onOpenChange={setIsLeadHistoryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lead History for {currentVendor?.name}</DialogTitle>
            <DialogDescription>View the history of lead additions and removals for this vendor.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {leadHistory[currentVendor?.id] && leadHistory[currentVendor?.id].length > 0 ? (
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left font-medium p-2">Timestamp</th>
                        <th className="text-left font-medium p-2">Action</th>
                        <th className="text-left font-medium p-2">Count</th>
                        <th className="text-left font-medium p-2">Reason</th>
                        <th className="text-left font-medium p-2">Before Count</th>
                        <th className="text-left font-medium p-2">After Count</th>
                      </tr>
                    </thead>
                    <tbody>
                      {leadHistory[currentVendor?.id].map((entry, index) => (
                        <tr key={index} className="border-b">
                          <td className="p-2">{formatDate(entry.timestamp)}</td>
                          <td className="p-2">{entry.action}</td>
                          <td className="p-2">{entry.count}</td>
                          <td className="p-2">{entry.reason}</td>
                          <td className="p-2">{entry.beforeCount}</td>
                          <td className="p-2">{entry.afterCount}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground">No lead history available for this vendor.</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLeadHistoryDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Vendor Leads Dialog */}
      <Dialog open={isManageVendorLeadsOpen} onOpenChange={() => setIsManageVendorLeadsOpen(false)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Leads for {currentVendor?.name || "Vendor"}</DialogTitle>
            <DialogDescription>Add or remove leads from the vendor's quota.</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="add" className="w-full mt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="add">Add Leads</TabsTrigger>
              <TabsTrigger value="remove">Remove Leads</TabsTrigger>
            </TabsList>
            {/* Fix the Add Leads Tab in the Manage Vendor Leads Dialog to show correct counts */}
            <TabsContent value="add" className="space-y-4 py-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="addLeads">Number of Leads to Add</Label>
                  <span className="text-sm text-muted-foreground">
                    Current: {currentVendor?.leadsUsed || 0} of {currentVendor?.leadQuota || 0} leads
                  </span>
                </div>
                <Input
                  id="addLeads"
                  type="number"
                  min="1"
                  max="100"
                  value={leadsToAdd}
                  onChange={(e) => setLeadsToAdd(e.target.value)}
                />
                <div className="text-sm text-muted-foreground">
                  After adding: {currentVendor?.leadsUsed || 0} of{" "}
                  {(currentVendor?.leadQuota || 0) + Number.parseInt(leadsToAdd || 0, 10)} leads
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="addReason">Reason for Adding Leads</Label>
                <Textarea
                  id="addReason"
                  placeholder="Enter reason for adding leads..."
                  value={leadAddReason}
                  onChange={(e) => setLeadAddReason(e.target.value)}
                />
              </div>

              {isProcessingLeads && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing...</span>
                    <span>{leadProcessingProgress}%</span>
                  </div>
                  <Progress value={leadProcessingProgress} className="h-2" />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsManageVendorLeadsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddLeads} disabled={isProcessingLeads}>
                  {isProcessingLeads ? "Processing..." : `Add ${leadsToAdd || 0} Leads`}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="remove">{/* Implement Remove Leads Tab Content Here */}</TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  )
}
