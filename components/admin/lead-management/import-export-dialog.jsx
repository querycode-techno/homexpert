"use client"

import React, { useState, useRef, useEffect } from 'react'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Upload, Download, FileText, AlertCircle, CheckCircle, XCircle } from 'lucide-react'

export function ImportExportDialog({ 
  open, 
  onOpenChange, 
  currentFilters = {},
  onImportComplete,
  onExportComplete 
}) {
  const { data: session } = useSession()
  const [selectedFile, setSelectedFile] = useState(null)
  const [isImporting, setIsImporting] = useState(false)
  const [isExporting, setIsExporting] = useState(false)
  const [importResults, setImportResults] = useState(null)
  const [selectedUser, setSelectedUser] = useState('current')
  const [users, setUsers] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [skipDuplicates, setSkipDuplicates] = useState(false)
  const fileInputRef = useRef(null)

  // Fetch users when dialog opens
  useEffect(() => {
    if (open) {
      fetchUsers()
    }
  }, [open])

  // Fetch users for createdBy selection based on current user's role
  const fetchUsers = async () => {
    setLoadingUsers(true)
    try {
      const currentUserRole = session?.user?.role?.name?.toLowerCase()
      
      // If current user is admin/super_admin, show all admin users
      if (['admin', 'super_admin'].includes(currentUserRole)) {
        const response = await fetch('/api/admin/users/by-role?roles=admin,super_admin,regional_manager,telecaller,helpline')
        const data = await response.json()
        if (data.success) {
          setUsers(data.users || [])
        } else {
          console.error('Failed to fetch users:', data.error)
        }
      } else {
        // For telecaller/helpline, only show themselves
        setUsers([])
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoadingUsers(false)
    }
  }

  // Reset state when dialog closes
  const handleOpenChange = (open) => {
    if (!open) {
             setSelectedFile(null)
       setImportResults(null)
       setSelectedUser('current')
       setSkipDuplicates(false)
    }
    onOpenChange(open)
  }

  // Handle file selection
  const handleFileSelect = (event) => {
    const file = event.target.files[0]
    if (file) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB')
        return
      }
      setSelectedFile(file)
      setImportResults(null)
    }
  }

  // Handle import
  const handleImport = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    setIsImporting(true)
    setImportResults(null)

         try {
       const formData = new FormData()
       formData.append('file', selectedFile)
       
                                                               // Add options including createdBy and skipDuplicates
          const options = {}
          if (selectedUser === 'current') {
            // Use current user's ID
            options.createdBy = session?.user?.id || session?.user?.userId
          } else if (selectedUser) {
            // Use selected user's ID
            options.createdBy = selectedUser
          }
          options.skipDuplicates = skipDuplicates
          formData.append('options', JSON.stringify(options))

       const response = await fetch('/api/admin/leads/import', {
         method: 'POST',
         body: formData
       })

      const data = await response.json()

      if (data.success) {
        setImportResults(data.results)
        toast.success(data.message)
        onImportComplete?.(data.results)
      } else {
        toast.error(data.error || 'Import failed')
      }
    } catch (error) {
      console.error('Import error:', error)
      toast.error('Import failed: ' + error.message)
    } finally {
      setIsImporting(false)
    }
  }

  // Handle export
  const handleExport = async () => {
    setIsExporting(true)

    try {
      const response = await fetch('/api/admin/leads/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          filters: currentFilters
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `leads-export-${new Date().toISOString().split('T')[0]}.csv`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success('Export completed successfully')
        onExportComplete?.()
      } else {
        const errorData = await response.json()
        toast.error(errorData.error || 'Export failed')
      }
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Export failed: ' + error.message)
    } finally {
      setIsExporting(false)
    }
  }

  // Download template
  const handleDownloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/leads/export')
      
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'leads-import-template.csv'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        window.URL.revokeObjectURL(url)
        
        toast.success('Template downloaded successfully')
      } else {
        toast.error('Failed to download template')
      }
    } catch (error) {
      console.error('Template download error:', error)
      toast.error('Failed to download template')
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import & Export Leads</DialogTitle>
          <DialogDescription>
            Import leads from CSV or export current leads data
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">Import</TabsTrigger>
            <TabsTrigger value="export">Export</TabsTrigger>
          </TabsList>

          {/* Import Tab */}
          <TabsContent value="import" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file-upload">Select CSV File</Label>
                    <div className="mt-2">
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".csv"
                        onChange={handleFileSelect}
                        ref={fileInputRef}
                        className="cursor-pointer"
                      />
                    </div>
                    {selectedFile && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                      </p>
                    )}
                                     </div>

                   <div>
                     <Label htmlFor="created-by">Created By (Optional)</Label>
                     <div className="mt-2">
                                               <Select value={selectedUser} onValueChange={setSelectedUser}>
                          <SelectTrigger>
                            <SelectValue placeholder={loadingUsers ? "Loading users..." : "Select user (default: current user)"} />
                          </SelectTrigger>
                                                     <SelectContent>
                             <SelectItem value="current">
                               {session?.user?.name || 'Current User'} (Current User)
                             </SelectItem>
                             {users.map((user) => (
                               <SelectItem key={user._id} value={user._id}>
                                 {user.name} ({user.email}) - {user.role?.name}
                               </SelectItem>
                             ))}
                           </SelectContent>
                        </Select>
                     </div>
                                           <p className="text-xs text-muted-foreground mt-1">
                        Choose who should be marked as the creator of imported leads
                        {!['admin', 'super_admin'].includes(session?.user?.role?.name?.toLowerCase()) && 
                          ' (Limited to current user based on your role)'}
                                             </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="skip-duplicates" 
                        checked={skipDuplicates} 
                        onCheckedChange={setSkipDuplicates}
                      />
                      <Label htmlFor="skip-duplicates" className="text-sm">
                        Skip duplicate checking (import all leads)
                      </Label>
                    </div>

                    <div className="flex gap-2">
                    <Button
                      onClick={handleImport}
                      disabled={!selectedFile || isImporting}
                      className="flex-1"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {isImporting ? 'Importing...' : 'Import Leads'}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={handleDownloadTemplate}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download Template
                    </Button>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p><strong>Required columns:</strong> Customer Name, Phone Number, Service, Address</p>
                    <p><strong>Optional columns:</strong> Email Address, Sub Service, Description, Price, Preferred Date, Preferred Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Import Results */}
            {importResults && (
              <Card>
                <CardContent className="pt-4">
                  <div className="space-y-3">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Import Results
                    </h4>
                    
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Successful: {importResults.successful}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Failed: {importResults.failed}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span>Total: {importResults.total}</span>
                      </div>
                    </div>

                    {importResults.errors && importResults.errors.length > 0 && (
                      <div className="mt-4">
                        <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-red-500" />
                          Errors:
                        </h5>
                        <div className="bg-red-50 border border-red-200 rounded p-3 max-h-32 overflow-y-auto">
                          {importResults.errors.slice(0, 10).map((error, index) => (
                            <p key={index} className="text-xs text-red-700">{error}</p>
                          ))}
                          {importResults.errors.length > 10 && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              ... and {importResults.errors.length - 10} more errors
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Export Tab */}
          <TabsContent value="export" className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Export Current Leads</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Export leads based on your current filters and search criteria.
                    </p>
                  </div>

                  {Object.keys(currentFilters).length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-3">
                      <h5 className="font-medium text-sm mb-2">Current Filters:</h5>
                      <div className="text-xs space-y-1">
                        {currentFilters.status && currentFilters.status !== 'all' && (
                          <p>Status: {currentFilters.status}</p>
                        )}
                        {currentFilters.service && currentFilters.service !== 'all' && (
                          <p>Service: {currentFilters.service}</p>
                        )}
                        {currentFilters.search && (
                          <p>Search: "{currentFilters.search}"</p>
                        )}
                        {currentFilters.dateFrom && (
                          <p>Date From: {currentFilters.dateFrom}</p>
                        )}
                        {currentFilters.dateTo && (
                          <p>Date To: {currentFilters.dateTo}</p>
                        )}
                      </div>
                    </div>
                  )}

                  <Button
                    onClick={handleExport}
                    disabled={isExporting}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {isExporting ? 'Exporting...' : 'Export to CSV'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
} 