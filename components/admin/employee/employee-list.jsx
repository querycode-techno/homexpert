"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, Plus, Edit, Trash2, MoreHorizontal, Download, Upload, Mail, Phone, User, Shield } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "sonner"

export function EmployeeList({
  employees = [],
  loading = false,
  error = null,
  pagination = {},
  onAddEmployee,
  onEditEmployee,
  onDeleteEmployee,
  onExport,
  onImport,
  onSearch,
  onPageChange,
  currentPage = 1,
  searchTerm = "",
}) {
  const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm)

  // Update local search term when prop changes
  useEffect(() => {
    setLocalSearchTerm(searchTerm)
  }, [searchTerm])

  // Handle search with debounce
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (onSearch) {
        onSearch(localSearchTerm)
      }
    }, 500)

    return () => clearTimeout(timeoutId)
  }, [localSearchTerm, onSearch])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Employees</CardTitle>
          <CardDescription>Manage employee information and access.</CardDescription>
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
          <Button size="sm" className="h-8 gap-1" onClick={onAddEmployee}>
            <Plus className="h-4 w-4" />
            <span>Add Employee</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search employees..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="pl-8"
              disabled={loading}
            />
          </div>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Role</TableHead>
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
                      <span className="ml-2">Loading employees...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : error ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-4 text-red-500">
                    Error: {error}
                  </TableCell>
                </TableRow>
              ) : employees?.length > 0 ? (
                employees.map((employee) => (
                  <TableRow key={employee._id}>
                    <TableCell>
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-4 w-4 text-muted-foreground" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="font-medium">{employee.name || "N/A"}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {employee._id ? employee._id.slice(-8) : "N/A"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="flex items-center text-sm">
                          <Mail className="h-3 w-3 mr-1" /> {employee.email || "N/A"}
                        </span>
                        <span className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1" /> {employee.phone || "N/A"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {employee.role?.name || employee.role ? (
                        <Badge variant="outline" className="bg-blue-50">
                          <Shield className="h-3 w-3 mr-1" />
                          {employee.role?.name || employee.role}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="bg-gray-50">
                          <Shield className="h-3 w-3 mr-1" />
                          No Role
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          employee.status === "Active" || !employee.status
                            ? "default"
                            : employee.status === "Inactive"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {employee.status || "Active"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={loading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem 
                            className="flex items-center gap-2" 
                            onClick={() => onEditEmployee(employee)}
                          >
                            <Edit className="h-4 w-4" />
                            <span>Edit</span>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="flex items-center gap-2 text-red-500"
                            onClick={() => onDeleteEmployee(employee)}
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
                  <TableCell colSpan={5} className="text-center py-4">
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
      
      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <CardFooter className="flex justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {((currentPage - 1) * (pagination.itemsPerPage || 10)) + 1} to {Math.min(currentPage * (pagination.itemsPerPage || 10), pagination.totalItems || 0)} of {pagination.totalItems || 0} employees
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(currentPage - 1)}
              disabled={!pagination.hasPrevPage || loading}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onPageChange && onPageChange(currentPage + 1)}
              disabled={!pagination.hasNextPage || loading}
            >
              Next
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  )
} 