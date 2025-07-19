"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
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
import vendorService from "@/lib/services/vendorService"

// Import vendor components
import { VendorList, VendorForm } from "./vendor"
import { VendorDetailsDialog } from "./vendor/vendor-details-dialog"

export function VendorManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get URL parameters
  const currentPage = parseInt(searchParams.get('page')) || 1
  const currentSearch = searchParams.get('search') || ""
  const currentStatus = searchParams.get('status') || ""
  const currentCity = searchParams.get('city') || ""
  const currentService = searchParams.get('service') || ""
  const currentVerified = searchParams.get('verified') || ""

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
  const [isViewVendorDialogOpen, setIsViewVendorDialogOpen] = useState(false)
  const [currentVendor, setCurrentVendor] = useState(null)

  // Local state synced with URL parameters
  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const [filters, setFilters] = useState({
    status: currentStatus,
    city: currentCity,
    service: currentService,
    verified: currentVerified
  })

  // File input ref
  const vendorFileInputRef = useRef(null)

  // Update URL with new parameters
  const updateURL = (newParams) => {
    console.log('🔄 updateURL called with:', newParams)
    console.log('📍 Current URL params:', Object.fromEntries(searchParams.entries()))
    
    const params = new URLSearchParams(searchParams.toString())
    
    // Update or remove parameters
    Object.keys(newParams).forEach(key => {
      const value = newParams[key]
      
      // If value is explicitly undefined, delete the parameter
      if (value === undefined) {
        params.delete(key)
      }
      // If value exists and is not empty/all, set it
      else if (value && value !== '' && value !== 'all') {
        params.set(key, value.toString())
      }
      // If value is empty/falsy, delete the parameter
      else {
        params.delete(key)
      }
    })

    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    console.log('➡️ Navigating to:', newURL)
    router.push(newURL, { scroll: false })
  }

  // Load vendors when URL parameters change
  useEffect(() => {
    fetchVendors()
  }, [currentPage, currentSearch, currentStatus, currentCity, currentService, currentVerified])

  // Sync local state with URL parameters
  useEffect(() => {
    setSearchTerm(currentSearch)
    setFilters({
      status: currentStatus,
      city: currentCity,
      service: currentService,
      verified: currentVerified
    })
  }, [currentSearch, currentStatus, currentCity, currentService, currentVerified])

  // Fetch vendors using the vendor service
  const fetchVendors = async () => {
    try {
      setLoading(true)
      const params = {
        page: currentPage,
        limit: pagination.itemsPerPage,
        search: currentSearch,
        status: currentStatus,
        city: currentCity,
        service: currentService,
        verified: currentVerified
      }

      const result = await vendorService.getVendors(params)

      if (result.success) {
        setVendors(result.vendors)
        setPagination(result.pagination)
        setStats(result.stats)
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error fetching vendors:', error)
      toast.error('Failed to fetch vendors')
    } finally {
      setLoading(false)
    }
  }

  // Vendor handlers using vendor service
  const handleAddVendor = async (formData) => {
    try {
      setLoading(true)
      const result = await vendorService.createVendor(formData)

      if (result.success) {
        toast.success(`Vendor Added: ${result.vendor.userData?.name || result.vendor.businessName} has been added successfully.`)
        setIsAddVendorOpen(false)
        fetchVendors()
      } else {
        toast.error(`Error: ${result.error}`)
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
      const result = await vendorService.updateVendor(currentVendor._id, formData)

      if (result.success) {
        toast.success(`Vendor Updated: ${result.vendor.userData?.name || result.vendor.businessName} has been updated successfully.`)
        setIsEditVendorOpen(false)
        setCurrentVendor(null)
        fetchVendors()
      } else {
        toast.error(`Error: ${result.error}`)
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
      const result = await vendorService.deleteVendor(currentVendor._id)

      if (result.success) {
        toast.success(`Vendor Deleted: ${currentVendor.userData?.name || currentVendor.businessName} has been deleted successfully.`)
        setIsDeleteVendorDialogOpen(false)
        setCurrentVendor(null)
        fetchVendors()
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting vendor:', error)
      toast.error(error.message || 'Failed to delete vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleViewVendor = (vendor) => {
    setCurrentVendor(vendor)
    setIsViewVendorDialogOpen(true)
  }

  const handleVerifyVendor = async (vendor) => {
    try {
      setLoading(true)
      const result = await vendorService.verifyVendor(vendor._id)

      if (result.success) {
        toast.success(`Vendor Verified: ${vendor.userData?.name || vendor.businessName} has been verified.`)
        fetchVendors()
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error verifying vendor:', error)
      toast.error(error.message || 'Failed to verify vendor')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (search) => {
    console.log('🔍 handleSearch called with:', search, 'current:', currentSearch)
    setSearchTerm(search)
    
    // Always update URL for search changes, including clearing search
    // Special handling for empty search to ensure it always clears
    if (search !== currentSearch || (!search && currentSearch)) {
      console.log('🔄 Search changed, updating URL')
      updateURL({ 
        search: search || undefined,
        page: undefined // Reset to page 1 by removing page param
      })
    }
  }

  const handleFilter = (newFilters) => {
    console.log('🔧 handleFilter called with:', newFilters)
    setFilters(newFilters)
    
    // Always update URL when filters change, including when clearing filters
    // Check if any filter values actually changed
    const filtersChanged = 
      newFilters.status !== currentStatus ||
      newFilters.city !== currentCity ||
      newFilters.service !== currentService ||
      newFilters.verified !== currentVerified
    
    // Also trigger update if this is a clear operation (all filters empty)
    const isClearOperation = !newFilters.status && !newFilters.city && !newFilters.service && !newFilters.verified
    const hadFilters = currentStatus || currentCity || currentService || currentVerified
    
    if (filtersChanged || (isClearOperation && hadFilters)) {
      console.log('🔄 Filters changed, updating URL', { filtersChanged, isClearOperation, hadFilters })
      updateURL({ 
        status: newFilters.status || undefined,
        city: newFilters.city || undefined,
        service: newFilters.service || undefined,
        verified: newFilters.verified || undefined,
        page: undefined // Reset to page 1 by removing page param
      })
    }
  }

  const handlePageChange = (page) => {
    console.log('📄 handlePageChange called with:', page)
    const validatedPage = Math.max(1, page)
    updateURL({ page: validatedPage })
  }

  // Export functionality using vendor service
  const handleVendorExport = async () => {
    try {
      const result = await vendorService.exportVendors()
      if (result.success) {
        toast.success("Vendor data has been exported to CSV.")
      } else {
        toast.error(`Export Error: ${result.error}`)
      }
    } catch (err) {
      toast.error(`Export Error: ${err.message}`)
    }
  }

  // Import functionality using vendor service
  const handleVendorImport = () => {
    vendorFileInputRef.current?.click()
  }

  // Download template functionality
  const handleDownloadTemplate = () => {
    try {
      const result = vendorService.downloadTemplate()
      if (result.success) {
        toast.success("CSV template downloaded successfully.")
      } else {
        toast.error("Failed to download template.")
      }
    } catch (err) {
      toast.error(`Download Error: ${err.message}`)
    }
  }

  const handleVendorFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (file) {
      try {
        setLoading(true)
        const result = await vendorService.importVendors(file)
        
        if (result.success) {
          toast.success(result.message)
          if (result.results) {
            const { successful, failed, errors } = result.results
            console.log('Import results:', { successful, failed, errors })
            
            if (failed > 0) {
              toast.warning(`${failed} vendors failed to import. Check console for details.`)
              console.warn('Import errors:', errors)
            }
          }
          // Refresh vendor list after import
          fetchVendors()
        } else {
          toast.error(`Import Error: ${result.error}`)
        }
      } catch (err) {
        toast.error(`Import Error: ${err.message}`)
      } finally {
        setLoading(false)
        // Reset file input
        e.target.value = ''
      }
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
        onDownloadTemplate={handleDownloadTemplate}
        onSearch={handleSearch}
        onFilter={handleFilter}
        onPageChange={handlePageChange}
        searchTerm={currentSearch}
        filters={{
          status: currentStatus,
          city: currentCity,
          service: currentService,
          verified: currentVerified
        }}
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
              "{currentVendor?.userData?.name || currentVendor?.businessName}" and remove all their data from our servers.
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

      {/* Vendor Details Dialog */}
      <VendorDetailsDialog
        open={isViewVendorDialogOpen}
        onOpenChange={setIsViewVendorDialogOpen}
        vendor={currentVendor}
      />
    </div>
  )
} 