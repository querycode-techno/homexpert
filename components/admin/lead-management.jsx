"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"
import {
  Search,
  Plus,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Calendar,
  Phone,
  Mail,
  MapPin,
} from "lucide-react"

// UI Components
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from "@/components/ui/table"
import { Card } from "@/components/ui/card"
import { CardContent } from "@/components/ui/card"
import { CardDescription } from "@/components/ui/card"
import { CardFooter } from "@/components/ui/card"
import { CardHeader } from "@/components/ui/card"
import { CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

// Sample data for leads
const initialLeads = [
  {
    id: 1,
    name: "John Smith",
    phone: "9876543210",
    email: "john@example.com",
    service: "Plumbing",
    location: "Bangalore",
    status: "New",
    date: "2023-05-15",
    assignedTo: null,
  },
  {
    id: 2,
    name: "Priya Sharma",
    phone: "8765432109",
    email: "priya@example.com",
    service: "Electrical",
    location: "Mumbai",
    status: "Contacted",
    date: "2023-05-14",
    assignedTo: "ABC Services",
  },
  {
    id: 3,
    name: "Rahul Verma",
    phone: "7654321098",
    email: "rahul@example.com",
    service: "Cleaning",
    location: "Delhi",
    status: "Qualified",
    date: "2023-05-13",
    assignedTo: null,
  },
  {
    id: 4,
    name: "Ananya Patel",
    phone: "6543210987",
    email: "ananya@example.com",
    service: "Painting",
    location: "Hyderabad",
    status: "Converted",
    date: "2023-05-12",
    assignedTo: "XYZ Painters",
  },
  {
    id: 5,
    name: "Vikram Singh",
    phone: "5432109876",
    email: "vikram@example.com",
    service: "Appliance Repair",
    location: "Chennai",
    status: "Not Interested",
    date: "2023-05-11",
    assignedTo: null,
  },
]

// Sample data for vendors
const initialVendors = [
  {
    id: 1,
    name: "ABC Services",
    service: "Plumbing",
    location: "Bangalore",
    rating: 4.5,
    leadQuota: 50,
    leadsUsed: 5,
    leadHistory: [],
  },
  {
    id: 2,
    name: "XYZ Painters",
    service: "Painting",
    location: "Mumbai",
    rating: 4.2,
    leadQuota: 40,
    leadsUsed: 12,
    leadHistory: [],
  },
  {
    id: 3,
    name: "123 Electricals",
    service: "Electrical",
    location: "Delhi",
    rating: 4.7,
    leadQuota: 60,
    leadsUsed: 8,
    leadHistory: [],
  },
  {
    id: 4,
    name: "Clean Masters",
    service: "Cleaning",
    location: "Hyderabad",
    rating: 4.0,
    leadQuota: 30,
    leadsUsed: 15,
    leadHistory: [],
  },
  {
    id: 5,
    name: "Fix It All",
    service: "Appliance Repair",
    location: "Chennai",
    rating: 4.3,
    leadQuota: 45,
    leadsUsed: 20,
    leadHistory: [],
  },
]

// Lead statuses
const leadStatuses = ["New", "Contacted", "Qualified", "Converted", "Not Interested"]

// Service types
const serviceTypes = ["Plumbing", "Electrical", "Cleaning", "Painting", "Appliance Repair", "Carpentry", "Pest Control"]

// Locations
const locations = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad"]

export function LeadManagement() {

  const [leads, setLeads] = useState(initialLeads)
  const [vendors, setVendors] = useState(initialVendors)
  const [filteredLeads, setFilteredLeads] = useState(leads)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [serviceFilter, setServiceFilter] = useState("")
  const [locationFilter, setLocationFilter] = useState("")
  const [selectedLeads, setSelectedLeads] = useState([])
  const [isAddLeadOpen, setIsAddLeadOpen] = useState(false)
  const [isAssignLeadOpen, setIsAssignLeadOpen] = useState(false)
  const [isGenerateLeadsOpen, setIsGenerateLeadsOpen] = useState(false)
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false)
  const [isManageVendorLeadsOpen, setIsManageVendorLeadsOpen] = useState(false)
  const [currentVendor, setCurrentVendor] = useState(null)
  const [activeTab, setActiveTab] = useState("leads")
  const [newLead, setNewLead] = useState({
    name: "",
    phone: "",
    email: "",
    service: "",
    location: "",
    status: "New",
    date: new Date().toISOString().split("T")[0],
  })
  const [newVendor, setNewVendor] = useState({
    name: "",
    service: "",
    location: "",
    rating: 4.0,
    leadQuota: 50,
    leadsUsed: 0,
    leadHistory: [],
  })
  const [leadsToGenerate, setLeadsToGenerate] = useState(10)
  const [leadsToAdd, setLeadsToAdd] = useState(5)
  const [leadsToRemove, setLeadsToRemove] = useState(5)
  const [addLeadReason, setAddLeadReason] = useState("")
  const [removeLeadReason, setRemoveLeadReason] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [leadHistory, setLeadHistory] = useState([])

  // New states for enhanced lead generation
  const [generationStep, setGenerationStep] = useState(1)
  const [generatedLeads, setGeneratedLeads] = useState([])
  const [distributionMethod, setDistributionMethod] = useState("keep_unassigned")
  const [selectedDistributionVendor, setSelectedDistributionVendor] = useState("")
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false)
  const [bulkAddVendor, setBulkAddVendor] = useState(null)
  const [bulkAddCount, setBulkAddCount] = useState(10)
  const [bulkAddReason, setBulkAddReason] = useState("")

  // Filter leads based on search term and filters
  useEffect(() => {
    let result = leads

    if (searchTerm) {
      result = result.filter(
        (lead) =>
          lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          lead.phone.includes(searchTerm),
      )
    }

    if (statusFilter && statusFilter !== "all") {
      result = result.filter((lead) => lead.status === statusFilter)
    }

    if (serviceFilter && serviceFilter !== "all") {
      result = result.filter((lead) => lead.service === serviceFilter)
    }

    if (locationFilter && locationFilter !== "all") {
      result = result.filter((lead) => lead.location === locationFilter)
    }

    setFilteredLeads(result)
  }, [leads, searchTerm, statusFilter, serviceFilter, locationFilter])

  // Handle lead selection
  const handleSelectLead = (leadId) => {
    if (selectedLeads.includes(leadId)) {
      setSelectedLeads(selectedLeads.filter((id) => id !== leadId))
    } else {
      setSelectedLeads([...selectedLeads, leadId])
    }
  }

  // Handle select all leads
  const handleSelectAllLeads = () => {
    if (selectedLeads.length === filteredLeads.length) {
      setSelectedLeads([])
    } else {
      setSelectedLeads(filteredLeads.map((lead) => lead.id))
    }
  }

  // Add a new lead
  const handleAddLead = () => {
    // Validate required fields
    if (!newLead.name || !newLead.phone || !newLead.service || !newLead.location) {
      toast.error("Please fill in all required fields.")
      return
    }

    const id = leads.length > 0 ? Math.max(...leads.map((lead) => lead.id)) + 1 : 1
    const leadToAdd = { ...newLead, id, assignedTo: null }

    setLeads([...leads, leadToAdd])
    setNewLead({
      name: "",
      phone: "",
      email: "",
      service: "",
      location: "",
      status: "New",
      date: new Date().toISOString().split("T")[0],
    })

    setIsAddLeadOpen(false)

    toast.success("New lead has been successfully added.")
  }

  // Generate multiple leads
  const handleGenerateLeads = async () => {
    setIsProcessing(true)
    setProgress(0)
    setGeneratedLeads([])

    const numLeadsToGenerate = Number.parseInt(leadsToGenerate, 10) || 10
    const newLeads = []

    for (let i = 0; i < numLeadsToGenerate; i++) {
      await new Promise((resolve) => setTimeout(resolve, 50)) // Simulate processing time

      const id = leads.length + newLeads.length + 1
      const services = ["Plumbing", "Electrical", "Cleaning", "Painting", "Appliance Repair"]
      const cities = ["Bangalore", "Mumbai", "Delhi", "Hyderabad", "Chennai"]
      const statuses = ["New", "Contacted", "Qualified"]
      const firstNames = ["Raj", "Priya", "Amit", "Neha", "Vikram", "Ananya", "Rahul", "Meera", "Sanjay", "Divya"]
      const lastNames = ["Sharma", "Patel", "Singh", "Verma", "Kumar", "Gupta", "Joshi", "Reddy", "Nair", "Iyer"]

      const randomLead = {
        id,
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
          lastNames[Math.floor(Math.random() * lastNames.length)]
        }`,
        phone: `9${Math.floor(Math.random() * 900000000) + 100000000}`,
        email: `lead${id}@example.com`,
        service: services[Math.floor(Math.random() * services.length)],
        location: cities[Math.floor(Math.random() * cities.length)],
        status: statuses[Math.floor(Math.random() * statuses.length)],
        date: new Date().toISOString().split("T")[0],
        assignedTo: null,
      }

      newLeads.push(randomLead)
      setProgress(Math.floor(((i + 1) / numLeadsToGenerate) * 100))
    }

    setGeneratedLeads(newLeads)
    setIsProcessing(false)
    setGenerationStep(2)

    toast.success(`${numLeadsToGenerate} leads have been successfully generated. Choose how to distribute them.`)
  }

  // Complete the lead generation process
  const handleCompleteGeneration = () => {
    if (distributionMethod === "keep_unassigned") {
      // Just add the leads without assigning them
      setLeads([...leads, ...generatedLeads])

      setIsGenerateLeadsOpen(false)
      setGenerationStep(1)

      toast.success(`${generatedLeads.length} leads have been successfully added.`)

      return
    }

    // Handle lead assignment based on the selected distribution method
    if (distributionMethod === "specific_vendor" && selectedDistributionVendor) {
      // Assign to specific vendor
      const vendor = vendors.find((v) => v.name === selectedDistributionVendor)

      if (!vendor) {
        toast.error("Vendor Not Found: The selected vendor could not be found.")
        return
      }

      // Assign all leads to the selected vendor
      const updatedLeads = generatedLeads.map((lead) => ({
        ...lead,
        assignedTo: vendor.name,
        status: "Assigned",
      }))

      // Update vendor's lead usage
      const updatedVendors = vendors.map((v) => {
        if (v.id === vendor.id) {
          return {
            ...v,
            leadsUsed: v.leadsUsed + generatedLeads.length,
          }
        }
        return v
      })

      setLeads([...leads, ...updatedLeads])
      setVendors(updatedVendors)

      toast.success(`${generatedLeads.length} leads have been assigned to ${vendor.name}.`)
    } else if (distributionMethod === "distribute_all") {
      // Distribute to all available vendors
      const activeVendors = vendors.filter((v) => v.leadQuota > v.leadsUsed)

      if (activeVendors.length === 0) {
        toast.error("No Available Vendors: There are no vendors with available lead quota.")

        // Add leads without assigning
        setLeads([...leads, ...generatedLeads])

        toast.warning(`Leads Added Without Assignment: ${generatedLeads.length} leads have been added without assignment due to no available vendors.`)

        setIsGenerateLeadsOpen(false)
        setGenerationStep(1)
        return
      }

      const updatedLeads = [...generatedLeads]
      const updatedVendors = [...vendors]
      let leadIndex = 0

      // Create a distribution plan to show in the toast
      const distribution = {}

      // Distribute leads in a round-robin fashion
      for (const lead of updatedLeads) {
        const vendorIndex = leadIndex % activeVendors.length
        const vendor = activeVendors[vendorIndex]

        // Update the lead
        lead.assignedTo = vendor.name
        lead.status = "Assigned"

        // Update distribution count for reporting
        distribution[vendor.name] = (distribution[vendor.name] || 0) + 1

        // Update vendor's leads used count
        const vendorToUpdate = updatedVendors.find((v) => v.id === vendor.id)
        if (vendorToUpdate) {
          vendorToUpdate.leadsUsed += 1
        }

        leadIndex++
      }

      setLeads([...leads, ...updatedLeads])
      setVendors(updatedVendors)

      // Create a distribution summary for the toast
      const distributionSummary = Object.entries(distribution)
        .map(([vendor, count]) => `${vendor}: ${count} leads`)
        .join(", ")

      toast.success(`Leads Distributed: ${updatedLeads.length} leads have been distributed among ${activeVendors.length} vendors. ${distributionSummary}`)
    } else if (distributionMethod === "distribute_by_service") {
      // Distribute by service type
      const updatedLeads = [...generatedLeads]
      const updatedVendors = [...vendors]

      // Group vendors by service
      const vendorsByService = {}
      vendors.forEach((vendor) => {
        if (vendor.leadQuota > vendor.leadsUsed) {
          if (!vendorsByService[vendor.service]) {
            vendorsByService[vendor.service] = []
          }
          vendorsByService[vendor.service].push(vendor)
        }
      })

      // Create a distribution plan to show in the toast
      const distribution = {}
      let assignedCount = 0
      let unassignedCount = 0

      // Assign each lead to a vendor that offers the matching service
      for (const lead of updatedLeads) {
        const service = lead.service
        const serviceVendors = vendorsByService[service] || []

        if (serviceVendors.length > 0) {
          // Find the vendor with the most remaining capacity
          const vendorWithCapacity = serviceVendors.reduce((prev, current) => {
            const prevRemaining = prev.leadQuota - prev.leadsUsed
            const currentRemaining = current.leadQuota - current.leadsUsed
            return prevRemaining > currentRemaining ? prev : current
          })

          // Assign the lead
          lead.assignedTo = vendorWithCapacity.name
          lead.status = "Assigned"

          // Update distribution count for reporting
          distribution[vendorWithCapacity.name] = (distribution[vendorWithCapacity.name] || 0) + 1

          // Update vendor's leads used count
          const vendorToUpdate = updatedVendors.find((v) => v.id === vendorWithCapacity.id)
          if (vendorToUpdate) {
            vendorToUpdate.leadsUsed += 1
          }

          assignedCount++
        } else {
          // No vendor available for this service
          unassignedCount++
        }
      }

      setLeads([...leads, ...updatedLeads])
      setVendors(updatedVendors)

      // Create a distribution summary for the toast
      const distributionSummary = Object.entries(distribution)
        .map(([vendor, count]) => `${vendor}: ${count} leads`)
        .join(", ")

      toast.success(`${assignedCount} leads have been assigned based on service type. ${
        unassignedCount > 0 ? `${unassignedCount} leads could not be assigned due to no matching vendor.` : ""
      } ${distributionSummary}`)
    }

    setIsGenerateLeadsOpen(false)
    setGenerationStep(1)
  }

  // Reset the lead generation dialog
  const handleResetGeneration = () => {
    setGenerationStep(1)
    setDistributionMethod("keep_unassigned")
    setSelectedDistributionVendor("")
    setGeneratedLeads([])
  }

  // Delete selected leads
  const handleDeleteLeads = () => {
    if (selectedLeads.length === 0) {
      toast.error("No Leads Selected: Please select at least one lead to delete.")
      return
    }

    const updatedLeads = leads.filter((lead) => !selectedLeads.includes(lead.id))
    setLeads(updatedLeads)
    setSelectedLeads([])

          toast.success(`Leads Deleted: ${selectedLeads.length} leads have been deleted.`)
  }

  // Assign leads to vendor
  const handleAssignLeads = (vendorName) => {
    if (selectedLeads.length === 0) {
              toast.error("No Leads Selected: Please select at least one lead to assign.")
      return
    }

    // Handle "All Vendors" selection
    if (vendorName === "all_vendors") {
      // Get only active vendors
      const activeVendors = vendors.filter((v) => v.leadQuota > v.leadsUsed)

      if (activeVendors.length === 0) {
        toast.error("No Available Vendors: There are no vendors with available lead quota.")
        return
      }

      // Distribute leads evenly among active vendors
      const updatedLeads = [...leads]
      const updatedVendors = [...vendors]
      let leadIndex = 0

      // Create a distribution plan to show in the toast
      const distribution = {}

      // Distribute leads in a round-robin fashion
      for (const leadId of selectedLeads) {
        const vendorIndex = leadIndex % activeVendors.length
        const vendor = activeVendors[vendorIndex]

        // Find the lead and update it
        const leadToUpdate = updatedLeads.find((lead) => lead.id === leadId)
        if (leadToUpdate) {
          leadToUpdate.assignedTo = vendor.name
          leadToUpdate.status = "Assigned"

          // Update distribution count for reporting
          distribution[vendor.name] = (distribution[vendor.name] || 0) + 1

          // Update vendor's leads used count
          const vendorToUpdate = updatedVendors.find((v) => v.id === vendor.id)
          if (vendorToUpdate) {
            vendorToUpdate.leadsUsed += 1
          }
        }

        leadIndex++
      }

      setLeads(updatedLeads)
      setVendors(updatedVendors)
      setSelectedLeads([])
      setIsAssignLeadOpen(false)

      // Create a distribution summary for the toast
      const distributionSummary = Object.entries(distribution)
        .map(([vendor, count]) => `${vendor}: ${count} leads`)
        .join(", ")

      toast.success(`${selectedLeads.length} leads have been distributed among ${activeVendors.length} vendors. ${distributionSummary}`)

      return
    }

    // Handle distribution by service type
    if (vendorName === "all_vendors_by_service") {
      const updatedLeads = [...leads]
      const updatedVendors = [...vendors]

      // Group vendors by service
      const vendorsByService = {}
      vendors.forEach((vendor) => {
        if (vendor.leadQuota > vendor.leadsUsed) {
          if (!vendorsByService[vendor.service]) {
            vendorsByService[vendor.service] = []
          }
          vendorsByService[vendor.service].push(vendor)
        }
      })

      // Create a distribution plan to show in the toast
      const distribution = {}
      let assignedCount = 0
      let unassignedCount = 0

      // Assign each lead to a vendor that offers the matching service
      for (const leadId of selectedLeads) {
        const leadToUpdate = updatedLeads.find((lead) => lead.id === leadId)
        if (!leadToUpdate) continue

        const service = leadToUpdate.service
        const serviceVendors = vendorsByService[service] || []

        if (serviceVendors.length > 0) {
          // Find the vendor with the most remaining capacity
          const vendorWithCapacity = serviceVendors.reduce((prev, current) => {
            const prevRemaining = prev.leadQuota - prev.leadsUsed
            const currentRemaining = current.leadQuota - current.leadsUsed
            return prevRemaining > currentRemaining ? prev : current
          })

          // Assign the lead
          leadToUpdate.assignedTo = vendorWithCapacity.name
          leadToUpdate.status = "Assigned"

          // Update distribution count for reporting
          distribution[vendorWithCapacity.name] = (distribution[vendorWithCapacity.name] || 0) + 1

          // Update vendor's leads used count
          const vendorToUpdate = updatedVendors.find((v) => v.id === vendorWithCapacity.id)
          if (vendorToUpdate) {
            vendorToUpdate.leadsUsed += 1
          }

          assignedCount++
        } else {
          // No vendor available for this service
          unassignedCount++
        }
      }

      setLeads(updatedLeads)
      setVendors(updatedVendors)
      setSelectedLeads([])
      setIsAssignLeadOpen(false)

      // Create a distribution summary for the toast
      const distributionSummary = Object.entries(distribution)
        .map(([vendor, count]) => `${vendor}: ${count} leads`)
        .join(", ")

      toast({
        title: "Leads Distributed by Service",
        description: `${assignedCount} leads have been assigned based on service type. ${unassignedCount > 0 ? `${unassignedCount} leads could not be assigned due to no matching vendor.` : ""} ${distributionSummary}`,
      })

      return
    }

    // Original code for assigning to a single vendor
    const updatedLeads = leads.map((lead) => {
      if (selectedLeads.includes(lead.id)) {
        return { ...lead, assignedTo: vendorName, status: "Assigned" }
      }
      return lead
    })

    // Update vendor's leads used count
    const updatedVendors = vendors.map((vendor) => {
      if (vendor.name === vendorName) {
        return {
          ...vendor,
          leadsUsed: vendor.leadsUsed + selectedLeads.length,
        }
      }
      return vendor
    })

    setLeads(updatedLeads)
    setVendors(updatedVendors)
    setSelectedLeads([])
    setIsAssignLeadOpen(false)

    toast({
      title: "Leads Assigned",
      description: `${selectedLeads.length} leads have been assigned to ${vendorName}.`,
    })
  }

  // Add a new vendor
  const handleAddVendor = () => {
    // Validate required fields
    if (!newVendor.name || !newVendor.service || !newVendor.location) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const id = vendors.length > 0 ? Math.max(...vendors.map((vendor) => vendor.id)) + 1 : 1
    const vendorToAdd = { ...newVendor, id, leadHistory: [] }

    setVendors([...vendors, vendorToAdd])
    setNewVendor({
      name: "",
      service: "",
      location: "",
      rating: 4.0,
      leadQuota: 50,
      leadsUsed: 0,
      leadHistory: [],
    })

    setIsAddVendorOpen(false)

    toast.success("New vendor has been successfully added.")
  }

  // Open vendor lead management dialog
  const handleManageVendorLeads = (vendor) => {
    setCurrentVendor(vendor)
    setLeadsToAdd(5)
    setLeadsToRemove(5)
    setAddLeadReason("")
    setRemoveLeadReason("")
    setIsManageVendorLeadsOpen(true)

    // Get lead history for this vendor
    const vendorHistory = vendor.leadHistory || []
    setLeadHistory(vendorHistory)
  }

  // Add leads to vendor
  const handleAddLeads = async () => {
    if (!currentVendor) return

    setIsProcessing(true)
    setProgress(0)

    const numLeadsToAdd = Number.parseInt(leadsToAdd, 10)
    if (isNaN(numLeadsToAdd) || numLeadsToAdd <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of leads to add.",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    // Create a timestamp for this operation
    const timestamp = new Date().toISOString()

    // Record the before state
    const beforeCount = currentVendor.leadsUsed || 0
    const afterCount = beforeCount
    const beforeQuota = currentVendor.leadQuota || 0
    const afterQuota = beforeQuota + numLeadsToAdd

    // Create history entry
    const historyEntry = {
      id: Date.now(),
      type: "add",
      count: numLeadsToAdd,
      beforeCount: beforeCount,
      afterCount: afterCount,
      beforeQuota: beforeQuota,
      afterQuota: afterQuota,
      reason: addLeadReason || "Additional leads allocation",
      timestamp: timestamp,
    }

    // Process in batches to show progress
    for (let i = 0; i < numLeadsToAdd; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20)) // Simulate processing time
      setProgress(Math.floor(((i + 1) / numLeadsToAdd) * 100))
    }

    // Update the vendor's lead quota
    const updatedVendors = vendors.map((vendor) => {
      if (vendor.id === currentVendor.id) {
        const updatedHistory = [...(vendor.leadHistory || []), historyEntry]
        return {
          ...vendor,
          leadQuota: vendor.leadQuota + numLeadsToAdd,
          leadHistory: updatedHistory,
        }
      }
      return vendor
    })

    setVendors(updatedVendors)
    setCurrentVendor({
      ...currentVendor,
      leadQuota: currentVendor.leadQuota + numLeadsToAdd,
      leadHistory: [...(currentVendor.leadHistory || []), historyEntry],
    })

    setLeadHistory([...leadHistory, historyEntry])
    setIsProcessing(false)
    setAddLeadReason("")

    toast({
      title: "Leads Added",
      description: `${numLeadsToAdd} leads have been added to ${currentVendor.name}'s quota. Before: ${beforeCount} of ${beforeQuota}, After: ${afterCount} of ${afterQuota}`,
    })
  }

  // Handle bulk add of leads to vendor
  const handleOpenBulkAdd = (vendor) => {
    setBulkAddVendor(vendor)
    setBulkAddCount(10)
    setBulkAddReason("")
    setIsBulkAddOpen(true)
  }

  const handleBulkAddLeads = async () => {
    if (!bulkAddVendor) return

    setIsProcessing(true)
    setProgress(0)

    const numLeadsToAdd = Number.parseInt(bulkAddCount, 10)
    if (isNaN(numLeadsToAdd) || numLeadsToAdd <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of leads to add.",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    // Create a timestamp for this operation
    const timestamp = new Date().toISOString()

    // Record the before state
    const beforeCount = bulkAddVendor.leadsUsed || 0
    const afterCount = beforeCount
    const beforeQuota = bulkAddVendor.leadQuota || 0
    const afterQuota = beforeQuota + numLeadsToAdd

    // Create history entry
    const historyEntry = {
      id: Date.now(),
      type: "add",
      count: numLeadsToAdd,
      beforeCount: beforeCount,
      afterCount: afterCount,
      beforeQuota: beforeQuota,
      afterQuota: afterQuota,
      reason: bulkAddReason || "Additional leads allocation",
      timestamp: timestamp,
    }

    // Generate new leads
    const newLeads = []

    for (let i = 0; i < numLeadsToAdd; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20)) // Simulate processing time

      const id = leads.length + newLeads.length + 1
      const services = [bulkAddVendor.service] // Use vendor's service
      const cities = [bulkAddVendor.location] // Use vendor's location
      const statuses = ["New", "Contacted", "Qualified"]
      const firstNames = ["Raj", "Priya", "Amit", "Neha", "Vikram", "Ananya", "Rahul", "Meera", "Sanjay", "Divya"]
      const lastNames = ["Sharma", "Patel", "Singh", "Verma", "Kumar", "Gupta", "Joshi", "Reddy", "Nair", "Iyer"]

      const randomLead = {
        id,
        name: `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${
          lastNames[Math.floor(Math.random() * lastNames.length)]
        }`,
        phone: `9${Math.floor(Math.random() * 900000000) + 100000000}`,
        email: `lead${id}@example.com`,
        service: services[Math.floor(Math.random() * services.length)],
        location: cities[Math.floor(Math.random() * cities.length)],
        status: "Assigned",
        date: new Date().toISOString().split("T")[0],
        assignedTo: bulkAddVendor.name,
      }

      newLeads.push(randomLead)
      setProgress(Math.floor(((i + 1) / numLeadsToAdd) * 100))
    }

    // Update the vendor
    const updatedVendors = vendors.map((vendor) => {
      if (vendor.id === bulkAddVendor.id) {
        const updatedHistory = [...(vendor.leadHistory || []), historyEntry]
        return {
          ...vendor,
          leadQuota: vendor.leadQuota + numLeadsToAdd,
          leadsUsed: vendor.leadsUsed + numLeadsToAdd,
          leadHistory: updatedHistory,
        }
      }
      return vendor
    })

    // Add the leads
    setLeads([...leads, ...newLeads])
    setVendors(updatedVendors)

    setIsProcessing(false)
    setIsBulkAddOpen(false)

    toast({
      title: "Leads Added",
      description: `${numLeadsToAdd} leads have been generated and assigned to ${bulkAddVendor.name}.`,
    })
  }

  // Remove leads from vendor
  const handleRemoveLeads = async () => {
    if (!currentVendor) return

    setIsProcessing(true)
    setProgress(0)

    const numLeadsToRemove = Number.parseInt(leadsToRemove, 10)
    if (isNaN(numLeadsToRemove) || numLeadsToRemove <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter a valid number of leads to remove.",
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    if (numLeadsToRemove > currentVendor.leadQuota) {
      toast({
        title: "Too Many Leads",
        description: `Cannot remove more than the current quota (${currentVendor.leadQuota}).`,
        variant: "destructive",
      })
      setIsProcessing(false)
      return
    }

    // Create a timestamp for this operation
    const timestamp = new Date().toISOString()

    // Record the before state
    const beforeCount = currentVendor.leadsUsed || 0
    const afterCount = beforeCount
    const beforeQuota = currentVendor.leadQuota || 0
    const afterQuota = beforeQuota - numLeadsToRemove

    // Create history entry
    const historyEntry = {
      id: Date.now(),
      type: "remove",
      count: numLeadsToRemove,
      beforeCount: beforeCount,
      afterCount: afterCount,
      beforeQuota: beforeQuota,
      afterQuota: afterQuota,
      reason: removeLeadReason || "Lead quota reduction",
      timestamp: timestamp,
    }

    // Process in batches to show progress
    for (let i = 0; i < numLeadsToRemove; i++) {
      await new Promise((resolve) => setTimeout(resolve, 20)) // Simulate processing time
      setProgress(Math.floor(((i + 1) / numLeadsToRemove) * 100))
    }

    // Update the vendor's lead quota
    const updatedVendors = vendors.map((vendor) => {
      if (vendor.id === currentVendor.id) {
        const updatedHistory = [...(vendor.leadHistory || []), historyEntry]
        return {
          ...vendor,
          leadQuota: vendor.leadQuota - numLeadsToRemove,
          leadHistory: updatedHistory,
        }
      }
      return vendor
    })

    setVendors(updatedVendors)
    setCurrentVendor({
      ...currentVendor,
      leadQuota: currentVendor.leadQuota - numLeadsToRemove,
      leadHistory: [...(currentVendor.leadHistory || []), historyEntry],
    })

    setLeadHistory([...leadHistory, historyEntry])
    setIsProcessing(false)
    setRemoveLeadReason("")

    toast({
      title: "Leads Removed",
      description: `${numLeadsToRemove} leads have been removed from ${currentVendor.name}'s quota. Before: ${beforeCount} of ${beforeQuota}, After: ${afterCount} of ${afterQuota}`,
    })
  }

  // Format date for display
  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "short", day: "numeric" }
    return new Date(dateString).toLocaleDateString(undefined, options)
  }

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp)
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
  }

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="text-2xl font-bold">Lead Management</CardTitle>
          <TabsList className="grid grid-cols-2 w-[300px]">
            <TabsTrigger value="leads" className="text-sm">
              Leads
            </TabsTrigger>
            <TabsTrigger value="vendors" className="text-sm">
              Vendors
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Leads Tab */}
        <TabsContent value="leads">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>All Leads</CardTitle>
                  <CardDescription>Manage and track all customer leads</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsGenerateLeadsOpen(true)
                      setGenerationStep(1)
                      setDistributionMethod("keep_unassigned")
                    }}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate Leads
                  </Button>
                  <Button onClick={() => setIsAddLeadOpen(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Lead
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search leads..."
                    className="pl-8"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {leadStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={serviceFilter} onValueChange={setServiceFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Service" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Services</SelectItem>
                    {serviceTypes.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={locationFilter} onValueChange={setLocationFilter}>
                  <SelectTrigger className="w-full md:w-[180px]">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedLeads.length > 0 && (
                <div className="flex justify-between items-center mb-4 p-2 bg-muted rounded-md">
                  <span>{selectedLeads.length} leads selected</span>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setIsAssignLeadOpen(true)}>
                      Assign to Vendor
                    </Button>
                    <Button variant="destructive" size="sm" onClick={handleDeleteLeads}>
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                </div>
              )}

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">
                        <Checkbox
                          checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                          onCheckedChange={handleSelectAllLeads}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Assigned To</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center py-4">
                          No leads found. Try adjusting your filters or add new leads.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredLeads.map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell>
                            <Checkbox
                              checked={selectedLeads.includes(lead.id)}
                              onCheckedChange={() => handleSelectLead(lead.id)}
                            />
                          </TableCell>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="flex items-center text-sm">
                                <Phone className="h-3 w-3 mr-1" /> {lead.phone}
                              </span>
                              <span className="flex items-center text-sm text-muted-foreground">
                                <Mail className="h-3 w-3 mr-1" /> {lead.email}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>{lead.service}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              {lead.location}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                lead.status === "New"
                                  ? "default"
                                  : lead.status === "Contacted"
                                    ? "secondary"
                                    : lead.status === "Qualified"
                                      ? "outline"
                                      : lead.status === "Converted"
                                        ? "success"
                                        : "destructive"
                              }
                            >
                              {lead.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {formatDate(lead.date)}
                            </div>
                          </TableCell>
                          <TableCell>
                            {lead.assignedTo ? (
                              <Badge variant="outline" className="bg-green-50">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                {lead.assignedTo}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="bg-amber-50">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Unassigned
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {filteredLeads.length} of {leads.length} leads
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4 mr-2" />
                  Import
                </Button>
              </div>
            </CardFooter>
          </Card>
        </TabsContent>

        {/* Vendors Tab */}
        <TabsContent value="vendors">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Vendor Management</CardTitle>
                  <CardDescription>Manage vendors and their lead quotas</CardDescription>
                </div>
                <Button onClick={() => setIsAddVendorOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Vendor
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vendor Name</TableHead>
                      <TableHead>Service</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Lead Quota</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-4">
                          No vendors found. Add a new vendor to get started.
                        </TableCell>
                      </TableRow>
                    ) : (
                      vendors.map((vendor) => (
                        <TableRow key={vendor.id}>
                          <TableCell className="font-medium">{vendor.name}</TableCell>
                          <TableCell>{vendor.service}</TableCell>
                          <TableCell>{vendor.location}</TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              <span className="text-amber-500 mr-1">★</span>
                              {vendor.rating.toFixed(1)}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>
                                  {vendor.leadsUsed} of {vendor.leadQuota} leads used (
                                  {vendor.leadQuota - vendor.leadsUsed} remaining)
                                </span>
                                <span>{Math.round((vendor.leadsUsed / vendor.leadQuota) * 100)}%</span>
                              </div>
                              <Progress value={(vendor.leadsUsed / vendor.leadQuota) * 100} className="h-2" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button variant="outline" size="sm" onClick={() => handleManageVendorLeads(vendor)}>
                                Manage Leads
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => handleOpenBulkAdd(vendor)}>
                                <Plus className="h-3 w-3 mr-1" />
                                Generate
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Lead Dialog */}
      <Dialog open={isAddLeadOpen} onOpenChange={setIsAddLeadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Enter the details of the new lead below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={newLead.name}
                  onChange={(e) => setNewLead({ ...newLead, name: e.target.value })}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={newLead.phone}
                  onChange={(e) => setNewLead({ ...newLead, phone: e.target.value })}
                  placeholder="9876543210"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={newLead.email}
                onChange={(e) => setNewLead({ ...newLead, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service">Service Required</Label>
                <Select value={newLead.service} onValueChange={(value) => setNewLead({ ...newLead, service: value })}>
                  <SelectTrigger id="service">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Select value={newLead.location} onValueChange={(value) => setNewLead({ ...newLead, location: value })}>
                  <SelectTrigger id="location">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={newLead.status} onValueChange={(value) => setNewLead({ ...newLead, status: value })}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {leadStatuses.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={newLead.date}
                  onChange={(e) => setNewLead({ ...newLead, date: e.target.value })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddLeadOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddLead}>Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Lead Dialog */}
      <Dialog open={isAssignLeadOpen} onOpenChange={setIsAssignLeadOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Assign Leads to Vendor</DialogTitle>
            <DialogDescription>Select a vendor to assign {selectedLeads.length} lead(s).</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendor">Select Vendor</Label>
              <Select onValueChange={(value) => handleAssignLeads(value)}>
                <SelectTrigger id="vendor">
                  <SelectValue placeholder="Select vendor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all_vendors" className="font-semibold text-primary">
                    Distribute to All Available Vendors
                  </SelectItem>
                  <SelectItem value="all_vendors_by_service" className="font-semibold text-primary">
                    Distribute by Service Type
                  </SelectItem>
                  {vendors.map((vendor) => (
                    <SelectItem key={vendor.id} value={vendor.name}>
                      {vendor.name} ({vendor.service}) - {vendor.leadQuota - vendor.leadsUsed} leads available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAssignLeadOpen(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Leads Dialog */}
      <Dialog
        open={isGenerateLeadsOpen}
        onOpenChange={(open) => {
          if (!open) {
            setGenerationStep(1)
            setDistributionMethod("keep_unassigned")
            setSelectedDistributionVendor("")
            setGeneratedLeads([])
          }
          setIsGenerateLeadsOpen(open)
        }}
      >
        <DialogContent className={`${generationStep === 2 ? "sm:max-w-[650px]" : "sm:max-w-[500px]"}`}>
          <DialogHeader>
            <DialogTitle>{generationStep === 1 ? "Generate Leads" : "Distribute Generated Leads"}</DialogTitle>
            <DialogDescription>
              {generationStep === 1
                ? "Generate multiple sample leads for testing."
                : `Choose how to distribute the ${generatedLeads.length} generated leads.`}
            </DialogDescription>
          </DialogHeader>

          {generationStep === 1 ? (
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="leadsCount">Number of Leads to Generate</Label>
                <Input
                  id="leadsCount"
                  type="number"
                  min="1"
                  max="100"
                  value={leadsToGenerate}
                  onChange={(e) => setLeadsToGenerate(e.target.value)}
                />
              </div>
              {isProcessing && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Generating leads...</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsGenerateLeadsOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerateLeads} disabled={isProcessing}>
                  {isProcessing ? "Generating..." : "Generate Leads"}
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="grid gap-6 py-4">
              <div className="space-y-3">
                <Label>Lead Distribution Method</Label>
                <RadioGroup value={distributionMethod} onValueChange={setDistributionMethod} className="space-y-3">
                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="keep_unassigned" id="keep_unassigned" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="keep_unassigned" className="font-medium">
                        Keep Leads Unassigned
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Add leads to your lead pool without assigning to any vendor.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="specific_vendor" id="specific_vendor" />
                    <div className="grid gap-1.5 leading-none w-full">
                      <Label htmlFor="specific_vendor" className="font-medium">
                        Assign to Specific Vendor
                      </Label>
                      <p className="text-sm text-muted-foreground mb-2">
                        Assign all generated leads to a single vendor.
                      </p>
                      <Select
                        disabled={distributionMethod !== "specific_vendor"}
                        value={selectedDistributionVendor}
                        onValueChange={setSelectedDistributionVendor}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.name}>
                              {vendor.name} ({vendor.service}) - {vendor.leadQuota - vendor.leadsUsed} leads available
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="distribute_all" id="distribute_all" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="distribute_all" className="font-medium">
                        Distribute to All Available Vendors
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Evenly distribute leads among all vendors with available quota.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-2">
                    <RadioGroupItem value="distribute_by_service" id="distribute_by_service" />
                    <div className="grid gap-1.5 leading-none">
                      <Label htmlFor="distribute_by_service" className="font-medium">
                        Distribute by Service Type
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Match leads to vendors based on the service type they offer.
                      </p>
                    </div>
                  </div>
                </RadioGroup>
              </div>

              {/* Generated leads preview */}
              <div className="space-y-3">
                <Label>Generated Leads Preview</Label>
                <div className="border rounded-md max-h-[200px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Service</TableHead>
                        <TableHead>Location</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {generatedLeads.slice(0, 5).map((lead) => (
                        <TableRow key={lead.id}>
                          <TableCell className="font-medium">{lead.name}</TableCell>
                          <TableCell>{lead.service}</TableCell>
                          <TableCell>{lead.location}</TableCell>
                        </TableRow>
                      ))}
                      {generatedLeads.length > 5 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground">
                            And {generatedLeads.length - 5} more leads...
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={handleResetGeneration}>
                  Back
                </Button>
                <Button
                  onClick={handleCompleteGeneration}
                  disabled={distributionMethod === "specific_vendor" && !selectedDistributionVendor}
                >
                  Complete
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Vendor Dialog */}
      <Dialog open={isAddVendorOpen} onOpenChange={setIsAddVendorOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Vendor</DialogTitle>
            <DialogDescription>Enter the details of the new vendor below.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendorName">Vendor Name</Label>
              <Input
                id="vendorName"
                value={newVendor.name}
                onChange={(e) => setNewVendor({ ...newVendor, name: e.target.value })}
                placeholder="ABC Services"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorService">Service Offered</Label>
                <Select
                  value={newVendor.service}
                  onValueChange={(value) => setNewVendor({ ...newVendor, service: value })}
                >
                  <SelectTrigger id="vendorService">
                    <SelectValue placeholder="Select service" />
                  </SelectTrigger>
                  <SelectContent>
                    {serviceTypes.map((service) => (
                      <SelectItem key={service} value={service}>
                        {service}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendorLocation">Location</Label>
                <Select
                  value={newVendor.location}
                  onValueChange={(value) => setNewVendor({ ...newVendor, location: value })}
                >
                  <SelectTrigger id="vendorLocation">
                    <SelectValue placeholder="Select location" />
                  </SelectTrigger>
                  <SelectContent>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendorRating">Rating</Label>
                <Select
                  value={newVendor.rating.toString()}
                  onValueChange={(value) => setNewVendor({ ...newVendor, rating: Number.parseFloat(value) })}
                >
                  <SelectTrigger id="vendorRating">
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    {[3.0, 3.5, 4.0, 4.5, 5.0].map((rating) => (
                      <SelectItem key={rating} value={rating.toString()}>
                        {rating.toFixed(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadQuota">Lead Quota</Label>
                <Input
                  id="leadQuota"
                  type="number"
                  min="10"
                  max="200"
                  value={newVendor.leadQuota}
                  onChange={(e) => setNewVendor({ ...newVendor, leadQuota: Number.parseInt(e.target.value, 10) })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddVendorOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddVendor}>Add Vendor</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Add Leads for Vendor Dialog */}
      <Dialog open={isBulkAddOpen} onOpenChange={setIsBulkAddOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Generate Leads for {bulkAddVendor?.name || "Vendor"}</DialogTitle>
            <DialogDescription>Generate and assign leads to this vendor.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="bulkAddCount">Number of Leads to Generate</Label>
              <Input
                id="bulkAddCount"
                type="number"
                min="1"
                max="100"
                value={bulkAddCount}
                onChange={(e) => setBulkAddCount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bulkAddReason">Reason (Optional)</Label>
              <Textarea
                id="bulkAddReason"
                placeholder="Enter reason for generating these leads..."
                value={bulkAddReason}
                onChange={(e) => setBulkAddReason(e.target.value)}
              />
            </div>
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Generating leads...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsBulkAddOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkAddLeads} disabled={isProcessing}>
              {isProcessing ? "Generating..." : "Generate & Assign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Manage Vendor Leads Dialog */}
      <Dialog open={isManageVendorLeadsOpen} onOpenChange={setIsManageVendorLeadsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Manage Vendor Leads</DialogTitle>
            <DialogDescription>{currentVendor && `Manage lead quota for ${currentVendor.name}`}</DialogDescription>
          </DialogHeader>
          {currentVendor && (
            <Tabs defaultValue="add" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="add">Add Leads</TabsTrigger>
                <TabsTrigger value="remove">Remove Leads</TabsTrigger>
                <TabsTrigger value="history">Lead History</TabsTrigger>
              </TabsList>

              {/* Add Leads Tab */}
              <TabsContent value="add" className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="addLeads">Number of Leads to Add</Label>
                    <span className="text-sm text-muted-foreground">
                      Current: {currentVendor.leadsUsed} of {currentVendor.leadQuota} leads
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
                    After adding: {currentVendor.leadsUsed} of{" "}
                    {currentVendor.leadQuota + Number.parseInt(leadsToAdd || 0, 10)} leads
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="addReason">Reason for Adding Leads</Label>
                  <Textarea
                    id="addReason"
                    placeholder="Enter reason for adding leads..."
                    value={addLeadReason}
                    onChange={(e) => setAddLeadReason(e.target.value)}
                  />
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsManageVendorLeadsOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddLeads} disabled={isProcessing}>
                    {isProcessing ? "Processing..." : `Add ${leadsToAdd || 0} Leads`}
                  </Button>
                </div>
              </TabsContent>

              {/* Remove Leads Tab */}
              <TabsContent value="remove" className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label htmlFor="removeLeads">Number of Leads to Remove</Label>
                    <span className="text-sm text-muted-foreground">
                      Current: {currentVendor.leadsUsed} of {currentVendor.leadQuota} leads
                    </span>
                  </div>
                  <Input
                    id="removeLeads"
                    type="number"
                    min="1"
                    max={currentVendor.leadQuota}
                    value={leadsToRemove}
                    onChange={(e) => setLeadsToRemove(e.target.value)}
                  />
                  <div className="text-sm text-muted-foreground">
                    After removing: {currentVendor.leadsUsed} of{" "}
                    {currentVendor.leadQuota - Number.parseInt(leadsToRemove || 0, 10)} leads
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="removeReason">Reason for Removing Leads</Label>
                  <Textarea
                    id="removeReason"
                    placeholder="Enter reason for removing leads..."
                    value={removeLeadReason}
                    onChange={(e) => setRemoveLeadReason(e.target.value)}
                  />
                </div>

                {isProcessing && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Processing...</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>
                )}

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsManageVendorLeadsOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleRemoveLeads}
                    disabled={isProcessing || Number.parseInt(leadsToRemove, 10) > currentVendor.leadQuota}
                  >
                    {isProcessing ? "Processing..." : `Remove ${leadsToRemove || 0} Leads`}
                  </Button>
                </div>
              </TabsContent>

              {/* Lead History Tab */}
              <TabsContent value="history" className="py-4">
                <div className="rounded-md border">
                  <ScrollArea className="h-[300px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date & Time</TableHead>
                          <TableHead>Action</TableHead>
                          <TableHead>Count</TableHead>
                          <TableHead>Before</TableHead>
                          <TableHead>After</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {leadHistory.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-4">
                              No lead history found for this vendor.
                            </TableCell>
                          </TableRow>
                        ) : (
                          leadHistory.map((entry) => (
                            <TableRow key={entry.id}>
                              <TableCell className="text-xs">{formatTimestamp(entry.timestamp)}</TableCell>
                              <TableCell>
                                <Badge variant={entry.type === "add" ? "success" : "destructive"}>
                                  {entry.type === "add" ? "Added" : "Removed"}
                                </Badge>
                              </TableCell>
                              <TableCell>{entry.count}</TableCell>
                              <TableCell>
                                {entry.type === "add"
                                  ? `${entry.beforeCount} of ${entry.beforeQuota}`
                                  : `${entry.beforeCount} of ${entry.beforeQuota}`}
                              </TableCell>
                              <TableCell>
                                {entry.type === "add"
                                  ? `${entry.afterCount} of ${entry.afterQuota}`
                                  : `${entry.afterCount} of ${entry.afterQuota}`}
                              </TableCell>
                              <TableCell className="text-xs max-w-[150px] truncate" title={entry.reason}>
                                {entry.reason}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </div>
                <div className="flex justify-end mt-4">
                  <Button variant="outline" onClick={() => setIsManageVendorLeadsOpen(false)}>
                    Close
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default LeadManagement
