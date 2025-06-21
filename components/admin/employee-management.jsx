"use client"

import { useState, useRef, useEffect } from "react"
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
  // Employee data state
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({})

  // Employee states
  const [isAddEmployeeOpen, setIsAddEmployeeOpen] = useState(false)
  const [isEditEmployeeOpen, setIsEditEmployeeOpen] = useState(false)
  const [isDeleteEmployeeDialogOpen, setIsDeleteEmployeeDialogOpen] = useState(false)
  const [currentEmployee, setCurrentEmployee] = useState(null)

  // Search and filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)

  // File input ref
  const employeeFileInputRef = useRef(null)

  // Load employees on component mount
  useEffect(() => {
    loadEmployees()
  }, [currentPage, pageSize, searchTerm])

  // API functions
  const loadEmployees = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await employeeService.getEmployees({
        page: currentPage,
        limit: pageSize,
        search: searchTerm
      })

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
      const result = await employeeService.createEmployee(formData)
      
      if (result.success) {
        toast.success(`Employee Added: ${result.employee.name} has been added successfully.`)
        setIsAddEmployeeOpen(false)
        loadEmployees() // Refresh the list
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
      const result = await employeeService.updateEmployee(currentEmployee._id, formData)
      
      if (result.success) {
        toast.success(`Employee Updated: ${result.employee.name} has been updated successfully.`)
        setIsEditEmployeeOpen(false)
        setCurrentEmployee(null)
        loadEmployees() // Refresh the list
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
        loadEmployees() // Refresh the list
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
    employeeFileInputRef.current.click()
  }

  const handleEmployeeFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      // For now, show a message that import is not implemented
      toast.info("Import functionality will be implemented soon.")
      // TODO: Implement CSV import functionality
    }
  }

  const handleSearch = (term) => {
    setSearchTerm(term)
    setCurrentPage(1) // Reset to first page when searching
  }

  const handlePageChange = (page) => {
    setCurrentPage(page)
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
        loading={loading}
        error={error}
        pagination={pagination}
        onAddEmployee={() => setIsAddEmployeeOpen(true)}
        onEditEmployee={handleEditEmployee}
        onDeleteEmployee={handleDeleteEmployee}
        onExport={handleEmployeeExport}
        onImport={handleEmployeeImport}
        onSearch={handleSearch}
        onPageChange={handlePageChange}
        currentPage={currentPage}
        searchTerm={searchTerm}
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