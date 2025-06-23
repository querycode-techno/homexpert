"use client"

import { useState, useEffect, useRef } from "react"
import { toast } from "sonner"
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

// Import vendor components
import { VendorList, VendorForm } from "./vendor"

export function VendorManagement() {
  // State management
  const [vendors, setVendors] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Dialog states
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false)
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false)
  const [isDeleteVendorDialogOpen, setIsDeleteVendorDialogOpen] = useState(false)
  const [currentVendor, setCurrentVendor] = useState(null)

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [filters, setFilters] = useState({
    status: "",
    city: "",
    service: "",
    verified: ""
  })

  // File input ref
  const vendorFileInputRef = useRef(null)

  // Fetch vendors
  const fetchVendors = async (page = 1, search = "", filterParams = {}) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: pagination.itemsPerPage.toString(),
        ...(search && { search }),
        ...filterParams
      })

      const response = await fetch(`/api/admin/vendors?${params}`)
      const data = await response.json()

      if (data.success) {
        setVendors(data.data.vendors)
        setPagination(data.data.pagination)
        setStats(data.data.stats)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to fetch vendors')
    } finally {
      setLoading(false)
    }
  }

  // Load vendors on component mount
  useEffect(() => {
    fetchVendors()
  }, [])

  // Vendor handlers
  const handleAddVendor = async (formData) => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/vendors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Vendor Added: ${data.data.userData.name} has been added successfully.`)
        setIsAddVendorOpen(false)
        fetchVendors(pagination.currentPage, searchTerm, filters)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error adding vendor:', error)
      toast.error(error.message || 'Failed to add vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleEditVendor = (vendor) => {
    setCurrentVendor(vendor)
    setIsEditVendorOpen(true)
  }

  const handleUpdateVendor = async (formData) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/vendors/${currentVendor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Vendor Updated: ${data.data.userData.name} has been updated successfully.`)
        setIsEditVendorOpen(false)
        setCurrentVendor(null)
        fetchVendors(pagination.currentPage, searchTerm, filters)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error updating vendor:', error)
      toast.error(error.message || 'Failed to update vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteVendor = (vendor) => {
    setCurrentVendor(vendor)
    setIsDeleteVendorDialogOpen(true)
  }

  const confirmDeleteVendor = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/vendors/${currentVendor._id}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Vendor Deleted: ${currentVendor.userData.name} has been deleted successfully.`)
        setIsDeleteVendorDialogOpen(false)
        setCurrentVendor(null)
        fetchVendors(pagination.currentPage, searchTerm, filters)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error deleting vendor:', error)
      toast.error(error.message || 'Failed to delete vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleViewVendor = (vendor) => {
    // TODO: Implement vendor detail view
    toast.info(`View details for ${vendor.userData.name} - To be implemented`)
  }

  const handleVerifyVendor = async (vendor) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/vendors/${vendor._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          verified: {
            isVerified: true,
            verificationNotes: 'Vendor verified by admin'
          }
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast.success(`Vendor Verified: ${vendor.userData.name} has been verified.`)
        fetchVendors(pagination.currentPage, searchTerm, filters)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error verifying vendor:', error)
      toast.error(error.message || 'Failed to verify vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (search) => {
    setSearchTerm(search)
    fetchVendors(1, search, filters)
  }

  const handleFilter = (newFilters) => {
    setFilters(newFilters)
    fetchVendors(1, searchTerm, newFilters)
  }

  const handlePageChange = (page) => {
    fetchVendors(page, searchTerm, filters)
  }

  const handleVendorExport = () => {
    // TODO: Implement export functionality
    toast.info("Export functionality - To be implemented")
  }

  const handleVendorImport = () => {
    vendorFileInputRef.current.click()
  }

  const handleVendorFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // TODO: Implement import functionality
      toast.info("Import functionality - To be implemented")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Vendor Management</h1>
        <p className="text-muted-foreground">Manage your vendors, their subscriptions, and lead quotas.</p>
      </div>

      {/* Vendor Management */}
      <VendorList
        vendors={vendors}
        stats={stats}
        loading={loading}
        pagination={pagination}
        onAddVendor={() => setIsAddVendorOpen(true)}
        onEditVendor={handleEditVendor}
        onDeleteVendor={handleDeleteVendor}
        onViewVendor={handleViewVendor}
        onVerifyVendor={handleVerifyVendor}
        onExport={handleVendorExport}
        onImport={handleVendorImport}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onPageChange={handlePageChange}
      />

      {/* Vendor Form Dialogs */}
      <VendorForm
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        onSubmit={handleAddVendor}
        loading={loading}
        title="Add New Vendor"
        description="Create a new vendor account with business details."
      />

      <VendorForm
        isOpen={isEditVendorOpen}
        onClose={() => {
          setIsEditVendorOpen(false)
          setCurrentVendor(null)
        }}
        vendor={currentVendor}
        onSubmit={handleUpdateVendor}
        loading={loading}
        title="Edit Vendor"
        description="Update vendor information and business details."
      />

      {/* Delete Vendor Dialog */}
      <AlertDialog open={isDeleteVendorDialogOpen} onOpenChange={setIsDeleteVendorDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor
              "{currentVendor?.name}" and remove all their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteVendor} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={vendorFileInputRef} 
        onChange={handleVendorFileChange} 
        accept=".csv" 
        className="hidden" 
      />
    </div>
  )
} 