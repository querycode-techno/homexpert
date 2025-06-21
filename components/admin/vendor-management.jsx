"use client"

import { useState, useRef } from "react"
import { useData } from "@/lib/data-context"
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
  const {
    vendors,
    addVendor,
    updateVendor,
    deleteVendor,
    subscriptions,
    leads,
    exportToCSV,
    importFromCSV,
  } = useData()

  // Vendor states
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false)
  const [isEditVendorOpen, setIsEditVendorOpen] = useState(false)
  const [isDeleteVendorDialogOpen, setIsDeleteVendorDialogOpen] = useState(false)
  const [currentVendor, setCurrentVendor] = useState(null)

  // File input ref
  const vendorFileInputRef = useRef(null)

  // Calculate vendor lead counts
  const vendorLeadCounts = {}
  if (vendors && leads) {
    vendors.forEach((vendor) => {
      if (vendor && vendor.name) {
        const vendorLeads = leads.filter((lead) => lead.assignedTo === vendor.name)
        vendorLeadCounts[vendor.id] = vendorLeads.length
      }
    })
  }

  // Vendor handlers
  const handleAddVendor = (formData) => {
    const newVendor = addVendor(formData)
    toast.success(`Vendor Added: ${newVendor.name} has been added successfully.`)
    setIsAddVendorOpen(false)
  }

  const handleEditVendor = (vendor) => {
    setCurrentVendor(vendor)
    setIsEditVendorOpen(true)
  }

  const handleUpdateVendor = (formData) => {
    updateVendor(currentVendor.id, formData)
    toast.success(`Vendor Updated: ${formData.name} has been updated successfully.`)
    setIsEditVendorOpen(false)
    setCurrentVendor(null)
  }

  const handleDeleteVendor = (vendor) => {
    setCurrentVendor(vendor)
    setIsDeleteVendorDialogOpen(true)
  }

  const confirmDeleteVendor = () => {
    deleteVendor(currentVendor.id)
    toast.success(`Vendor Deleted: ${currentVendor.name} has been deleted successfully.`)
    setIsDeleteVendorDialogOpen(false)
    setCurrentVendor(null)
  }

  const handleVendorExport = () => {
    exportToCSV(vendors, "vendors")
    toast.success("Vendor data has been exported to CSV.")
  }

  const handleVendorImport = () => {
    vendorFileInputRef.current.click()
  }

  const handleVendorFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      importFromCSV(file, "vendors", (data) => {
        toast.success(`Import Successful: ${data.length} vendors have been imported.`)
      })
    }
  }

  // Vendor lead management handlers (placeholders for now)
  const handleAddLeads = (vendor) => {
    // This can be implemented with a separate dialog
    toast.info(`Add leads functionality for ${vendor.name} - To be implemented`)
  }

  const handleRemoveLeads = (vendor) => {
    // This can be implemented with a separate dialog
    toast.info(`Remove leads functionality for ${vendor.name} - To be implemented`)
  }

  const handleViewLeadHistory = (vendor) => {
    // This can be implemented with a separate dialog
    toast.info(`Lead history for ${vendor.name} - To be implemented`)
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
        vendorLeadCounts={vendorLeadCounts}
        onAddVendor={() => setIsAddVendorOpen(true)}
        onEditVendor={handleEditVendor}
        onDeleteVendor={handleDeleteVendor}
        onAddLeads={handleAddLeads}
        onRemoveLeads={handleRemoveLeads}
        onViewLeadHistory={handleViewLeadHistory}
        onExport={handleVendorExport}
        onImport={handleVendorImport}
      />

      {/* Vendor Form Dialogs */}
      <VendorForm
        isOpen={isAddVendorOpen}
        onClose={() => setIsAddVendorOpen(false)}
        onSubmit={handleAddVendor}
        subscriptions={subscriptions}
        title="Add New Vendor"
        description="Create a new vendor account with subscription details."
      />

      <VendorForm
        isOpen={isEditVendorOpen}
        onClose={() => {
          setIsEditVendorOpen(false)
          setCurrentVendor(null)
        }}
        vendor={currentVendor}
        onSubmit={handleUpdateVendor}
        subscriptions={subscriptions}
        title="Edit Vendor"
        description="Update vendor information and subscription details."
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