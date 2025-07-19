"use client"

import { useState, useRef, useEffect } from "react"
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
import employeeService from "@/lib/services/employeeService"

// Import employee components
import { EmployeeList, EmployeeForm } from "./employee"

export function EmployeeManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get URL parameters
  const currentPage = parseInt(searchParams.get('page')) || 1
  const currentSearch = searchParams.get('search') || ""
  const currentRole = searchParams.get('role') || ""
  const currentStatus = searchParams.get('status') || ""

  // Employee data state
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Available roles for filtering
  const [availableRoles, setAvailableRoles] = useState([])
  const [rolesLoading, setRolesLoading] = useState(false)

  // Employee states
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [isDeleteEmployeeDialogOpen, setIsDeleteEmployeeDialogOpen] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)

  // Search and filter states (derived from URL)
  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const [filters, setFilters] = useState({
    role: currentRole,
    status: currentStatus
  })
  const [pageSize, setPageSize] = useState(10)

  // File input ref
  const employeeFileInputRef = useRef(null)

  // Update URL with new parameters
  const updateURL = (newParams) => {
    console.log('🔄 updateURL called with:', newParams)
    console.log('📍 Current URL params:', Object.fromEntries(searchParams.entries()))
    
    const params = new URLSearchParams(searchParams.toString())
    
    // Update or remove parameters
    Object.keys(newParams).forEach(key => {
      const value = newParams[key]
      if (value !== undefined) {
        if (value && value !== '' && value !== 'all') {
          params.set(key, value.toString())
        } else {
          params.delete(key)
        }
      }
    })

    // Only remove page=1 from URL for cleaner URLs (don't remove other page numbers)
    // Temporarily disabled to debug pagination issues
    // if (params.get('page') === '1' && newParams.page !== 1) {
    //   params.delete('page')
    // }

    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`
    console.log('➡️ Navigating to:', newURL)
    router.push(newURL, { scroll: false })
  }

  // Debug URL parameter changes
  useEffect(() => {
    console.log('📊 URL params changed:', { 
      page: currentPage, 
      search: currentSearch, 
      role: currentRole, 
      status: currentStatus 
    })
  }, [currentPage, currentSearch, currentRole, currentStatus])

  // Load initial data on component mount
  useEffect(() => {
    loadInitialData()
  }, [])

  // Load employees when URL parameters change
  useEffect(() => {
    loadEmployees()
  }, [currentPage, currentSearch, currentRole, currentStatus])

  // Sync local state with URL parameters
  useEffect(() => {
    setSearchTerm(currentSearch)
    setFilters({
      role: currentRole,
      status: currentStatus
    })
  }, [currentSearch, currentRole, currentStatus])

  // Load initial data (roles only - employees loaded by URL useEffect)
  const loadInitialData = async () => {
    await loadRoles() // Only load roles initially, employees loaded by URL params useEffect
  }

  // Load available roles for filtering
  const loadRoles = async () => {
    try {
      setRolesLoading(true)
      const result = await employeeService.getRoles()
      
      if (result.success) {
        setAvailableRoles(result.roles)
      } else {
        console.error('Failed to load roles:', result.error)
        // Don't show error toast for roles as it's not critical
      }
    } catch (err) {
      console.error('Error loading roles:', err.message)
    } finally {
      setRolesLoading(false)
    }
  }

  // API functions
  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const params = {
        page: currentPage,
        limit: pageSize,
        search: currentSearch,
        role: currentRole,
        status: currentStatus
      }
      
      const result = await employeeService.getEmployees(params)

      if (result.success) {
        setEmployees(result.employees)
        setPagination(result.pagination)
      } else {
        setError(result.error)
        toast.error(`Error: ${result.error}`)
      }
    } catch (err) {
      setError(err.message)
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Employee handlers
  const handleAddEmployee = async (formData) => {
    try {
      setLoading(true)
      console.log(formData);
      const result = await employeeService.createEmployee(formData)
      
      if (result.success) {
        toast.success(`Employee Added: ${result.employee.name} has been added successfully.`)
        setIsAddEmployeeOpen(false)
        // Go to first page to see new employee, but only if not already on page 1
        if (currentPage !== 1) {
          updateURL({ page: undefined }) // Remove page param to go to page 1
        } else {
          await loadEmployees() // Just refresh current page
        }
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEditEmployee = (employee) => {
    setCurrentEmployee(employee)
    setIsEditEmployeeOpen(true)
  }

  const handleUpdateEmployee = async (formData) => {
    try {
      setLoading(true)
      console.log("formDAta", formData);
      const result = await employeeService.updateEmployee(currentEmployee._id, formData)
      
      if (result.success) {
        toast.success(`Employee Updated: ${result.employee.name} has been updated successfully.`)
        setIsEditEmployeeOpen(false)
        setCurrentEmployee(null)
        await loadEmployees() // Refresh the list
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteEmployee = (employee) => {
    setCurrentEmployee(employee)
    setIsDeleteEmployeeDialogOpen(true)
  }

  const confirmDeleteEmployee = async () => {
    try {
      setLoading(true)
      const result = await employeeService.deleteEmployee(currentEmployee._id)
      
      if (result.success) {
        toast.success(`Employee Deleted: ${currentEmployee.name} has been deleted successfully.`)
        setIsDeleteEmployeeDialogOpen(false)
        setCurrentEmployee(null)
        await loadEmployees() // Refresh the list
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (err) {
      toast.error(`Error: ${err.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleEmployeeExport = async () => {
    try {
      const result = await employeeService.exportEmployees()
      if (result.success) {
        toast.success("Employee data has been exported to CSV.")
      } else {
        toast.error(`Export Error: ${result.error}`)
      }
    } catch (err) {
      toast.error(`Export Error: ${err.message}`)
    }
  }

  const handleEmployeeImport = () => {
    employeeFileInputRef.current?.click()
  }

  const handleEmployeeFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      // For now, show a message that import is not implemented
      toast.info("Import functionality will be implemented soon.")
      // TODO: Implement CSV import functionality
    }
  }

  const handleSearch = (term) => {
    console.log('🔍 handleSearch called with:', term, 'current:', currentSearch)
    setSearchTerm(term)
    // Only reset to page 1 if this is an actual search action (not initial sync)
    if (term !== currentSearch) {
      console.log('🔄 Search changed, updating URL')
      updateURL({ 
        search: term || undefined,
        page: undefined // Reset to page 1 by removing page param
      })
    }
  }

  const handleFilterChange = (newFilters) => {
    console.log('🔧 handleFilterChange called with:', newFilters, 'current:', { role: currentRole, status: currentStatus })
    setFilters(newFilters)
    // Only reset to page 1 if filters actually changed (not initial sync)
    if (newFilters.role !== currentRole || newFilters.status !== currentStatus) {
      console.log('🔄 Filters changed, updating URL')
      updateURL({ 
        role: newFilters.role || undefined, 
        status: newFilters.status || undefined, 
        page: undefined // Reset to page 1 by removing page param
      })
    }
  }

  const handlePageChange = (page) => {
    console.log('📄 handlePageChange called with:', page)
    // Ensure valid page number  
    const validatedPage = Math.max(1, page)
    updateURL({ page: validatedPage })
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Employee Management</h1>
        <p className="text-muted-foreground">Manage your employees, their roles, and permissions.</p>
      </div>

      {/* Employee Management */}
      <EmployeeList
        employees={employees}
        loading={loading || rolesLoading}
        error={error}
        pagination={pagination}
        availableRoles={availableRoles}
        onAddEmployee={() => setIsAddEmployeeOpen(true)}
        onEditEmployee={handleEditEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onExport={handleEmployeeExport}
        onImport={handleEmployeeImport}
        onSearch={handleSearch}
        onFilterChange={handleFilterChange}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        searchTerm={currentSearch}
        filters={{
          role: currentRole,
          status: currentStatus
        }}
      />

      {/* Employee Form Dialogs */}
      <EmployeeForm
        isOpen={isAddEmployeeOpen}
        onClose={() => setIsAddEmployeeOpen(false)}
        onSubmit={handleAddEmployee}
        title="Add New Employee"
        description="Create a new employee account with role and permissions."
      />

      <EmployeeForm
        isOpen={isEditEmployeeOpen}
        onClose={() => {
          setIsEditEmployeeOpen(false)
          setCurrentEmployee(null)
        }}
        employee={currentEmployee}
        onSubmit={handleUpdateEmployee}
        title="Edit Employee"
        description="Update employee information and settings."
      />

      {/* Delete Employee Dialog */}
      <AlertDialog open={isDeleteEmployeeDialogOpen} onOpenChange={setIsDeleteEmployeeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the employee
              "{currentEmployee?.name}" and remove all their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteEmployee} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={employeeFileInputRef} 
        onChange={handleEmployeeFileChange} 
        accept=".csv" 
        className="hidden" 
      />
    </div>
  )
}