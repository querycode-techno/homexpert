"use client"

import { useState, useEffect } from 'react'
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table'
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious,
  PaginationEllipsis
} from '@/components/ui/pagination'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  MoreHorizontal, 
  Trash2, 
  AlertCircle,
  Trash 
} from 'lucide-react'
import { toast } from 'sonner'

export default function VendorLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalLogs, setTotalLogs] = useState(0)
  const [deletingId, setDeletingId] = useState(null)
  const [selectedLogIds, setSelectedLogIds] = useState(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)
  
  const ITEMS_PER_PAGE = 20

  const isValidObjectId = (value) => /^[a-f\d]{24}$/i.test(value ?? '')

  const enrichLogsWithLeadDetails = async (logsData) => {
    const leadLogsNeedingDetails = logsData.filter(
      (log) =>
        log.type === 'lead' &&
        log.leadId &&
        !(log.leadCustomerName || log.leadService)
    )

    if (leadLogsNeedingDetails.length === 0) {
      return logsData
    }

    const uniqueLeadIds = Array.from(
      new Set(
        leadLogsNeedingDetails
          .map((log) => log.leadId)
          .filter((leadId) => leadId && isValidObjectId(leadId))
      )
    )

    if (uniqueLeadIds.length === 0) {
      return logsData
    }

    const leadResponses = await Promise.all(
      uniqueLeadIds.map(async (leadId) => {
        try {
          const response = await fetch(`/api/admin/leads/${leadId}`)
          if (!response.ok) {
            return [leadId, null]
          }
          const result = await response.json()
          if (result?.success && result?.data) {
            return [leadId, result.data]
          }
        } catch (error) {
          console.error(`Failed to enrich lead ${leadId}:`, error)
        }
        return [leadId, null]
      })
    )

    const leadMap = Object.fromEntries(leadResponses)

    if (Object.keys(leadMap).length === 0) {
      return logsData
    }

    return logsData.map((log) => {
      if (log.type !== 'lead' || !log.leadId) {
        return log
      }

      const leadData = leadMap[log.leadId]
      if (!leadData) {
        return log
      }

      return {
        ...log,
        leadService: leadData.service ?? log.leadService,
        leadStatus: leadData.status ?? log.leadStatus,
        leadCustomerName: leadData.customerName ?? log.leadCustomerName,
        leadCustomerPhone: leadData.customerPhone ?? log.leadCustomerPhone,
        leadCustomerEmail: leadData.customerEmail ?? log.leadCustomerEmail,
        leadAddress: leadData.address ?? log.leadAddress,
        leadPrice: leadData.price ?? log.leadPrice
      }
    })
  }

  // Fetch vendor logs with pagination
  const fetchLogs = async (page = currentPage) => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/vendorlog?page=${page}&limit=${ITEMS_PER_PAGE}`)
      const data = await response.json()
      
      if (data.success) {
        const enrichedLogs = await enrichLogsWithLeadDetails(data.logs || [])
        setLogs(enrichedLogs)
        setTotalPages(data.pagination?.totalPages || 1)
        setTotalLogs(data.pagination?.total || 0)
      } else {
        toast.error('Failed to fetch vendor logs')
      }
    } catch (error) {
      console.error('Error fetching logs:', error)
      toast.error('Error fetching vendor logs')
    } finally {
      setLoading(false)
    }
  }

  // Delete vendor log
  const deleteLog = async (logId) => {
    try {
      setDeletingId(logId)
      const response = await fetch(`/api/admin/vendorlog?vendorlogId=${logId}`, {
        method: 'DELETE',
      })
      
      const data = await response.json()
      
      if (data.success) {
        toast.success('Vendor log deleted successfully')
        fetchLogs(currentPage) // Refresh current page
      } else {
        toast.error(data.error || 'Failed to delete vendor log')
      }
    } catch (error) {
      console.error('Error deleting log:', error)
      toast.error('Error deleting vendor log')
    } finally {
      setDeletingId(null)
    }
  }

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get log type badge
  const getLogTypeBadge = (type) => {
    const typeColors = {
      subscription: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      lead: 'bg-amber-100 text-amber-800 hover:bg-amber-200'
    }
    
    return (
      <Badge className={`capitalize ${typeColors[type] || 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}>
        {type || 'N/A'}
      </Badge>
    )
  }

  const getLeadStatusBadge = (status) => {
    if (!status) return null
    const statusColors = {
      pending: 'bg-slate-100 text-slate-800 border-slate-200',
      available: 'bg-blue-100 text-blue-800 border-blue-200',
      assigned: 'bg-indigo-100 text-indigo-800 border-indigo-200',
      taken: 'bg-purple-100 text-purple-800 border-purple-200',
      contacted: 'bg-amber-100 text-amber-800 border-amber-200',
      interested: 'bg-green-100 text-green-800 border-green-200',
      completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
      cancelled: 'bg-red-100 text-red-800 border-red-200',
      not_interested: 'bg-rose-100 text-rose-800 border-rose-200',
      scheduled: 'bg-cyan-100 text-cyan-800 border-cyan-200',
      in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      converted: 'bg-teal-100 text-teal-800 border-teal-200',
      expired: 'bg-gray-200 text-gray-800 border-gray-300',
      refund_requested: 'bg-orange-100 text-orange-800 border-orange-200'
    }

    return (
      <Badge variant="outline" className={`capitalize ${statusColors[status] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
        {status.replace(/_/g, ' ')}
      </Badge>
    )
  }

  // Get paginated logs (now logs are already paginated from server)
  const getPaginatedLogs = () => {
    return logs // Server already returns paginated data
  }

  // Handle page change
  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      fetchLogs(page) // Fetch new page from server
      // Scroll to top of table
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Generate pagination page numbers with ellipsis
  const getPaginationPages = () => {
    const pages = []
    const maxVisiblePages = 7 // Show max 7 page numbers
    const sidePages = 2 // Pages to show on each side of current page

    if (totalPages <= maxVisiblePages) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Always show first page
      pages.push(1)

      let startPage = Math.max(2, currentPage - sidePages)
      let endPage = Math.min(totalPages - 1, currentPage + sidePages)

      // Adjust if we're near the start
      if (currentPage <= sidePages + 2) {
        endPage = Math.min(maxVisiblePages - 1, totalPages - 1)
      }

      // Adjust if we're near the end
      if (currentPage >= totalPages - sidePages - 1) {
        startPage = Math.max(2, totalPages - maxVisiblePages + 2)
      }

      // Add ellipsis after first page if needed
      if (startPage > 2) {
        pages.push('ellipsis-start')
      }

      // Add page numbers around current page
      for (let i = startPage; i <= endPage; i++) {
        pages.push(i)
      }

      // Add ellipsis before last page if needed
      if (endPage < totalPages - 1) {
        pages.push('ellipsis-end')
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages)
      }
    }

    return pages
  }

  useEffect(() => {
    fetchLogs(currentPage)
  }, [])


  // const dummyLogs = [
  //   {
  //     id: '1',
  //     type: 'login',
  //     time: '2024-01-15T10:30:00Z',
  //     userId: 'user1',
  //     leadId: null,
  //     subscriptionId: null,
  //     name: 'John Smith',
  //     mobile: '+91 98765 43210',
  //     city: 'Mumbai',
  //     planName: 'Premium Plan',
  //     selectedService: 'Plumbing',
  //     selectedSubservice: 'Pipe Repair'
  //   },
  //   {
  //     id: '2',
  //     type: 'subscription',
  //     time: '2024-01-14T15:45:00Z',
  //     userId: 'user2',
  //     leadId: null,
  //     subscriptionId: 'sub1',
  //     name: 'Sarah Johnson',
  //     mobile: '+91 87654 32109',
  //     city: 'Delhi',
  //     planName: 'Basic Plan',
  //     selectedService: 'Electrical',
  //     selectedSubservice: 'Wiring Installation'
  //   },
  //   {
  //     id: '3',
  //     type: 'lead',
  //     time: '2024-01-13T09:15:00Z',
  //     userId: 'user3',
  //     leadId: 'lead1',
  //     subscriptionId: null,
  //     name: 'Mike Wilson',
  //     mobile: '+91 76543 21098',
  //     city: 'Bangalore',
  //     planName: 'Standard Plan',
  //     selectedService: 'Cleaning',
  //     selectedSubservice: 'Deep Cleaning'
  //   },
  //   {
  //     id: '4',
  //     type: 'payment',
  //     time: '2024-01-12T14:20:00Z',
  //     userId: 'user4',
  //     leadId: null,
  //     subscriptionId: 'sub2',
  //     name: 'Emily Davis',
  //     mobile: '+91 65432 10987',
  //     city: 'Chennai',
  //     planName: 'Premium Plan',
  //     selectedService: 'Painting',
  //     selectedSubservice: 'Interior Painting'
  //   },
  //   {
  //     id: '5',
  //     type: 'logout',
  //     time: '2024-01-11T18:30:00Z',
  //     userId: 'user5',
  //     leadId: null,
  //     subscriptionId: null,
  //     name: 'David Brown',
  //     mobile: '+91 54321 09876',
  //     city: 'Kolkata',
  //     planName: 'Basic Plan',
  //     selectedService: 'Carpentry',
  //     selectedSubservice: 'Furniture Repair'
  //   }
  // ]

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Vendor Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">

            {/* Add title and some discription about this page */}
            <div className="flex justify-start flex-col gap-2 pb-8">   
                <h1 className="text-2xl font-bold">Vendor Logs</h1>
                <p className="text-muted-foreground">Manage vendor logs and their activities</p>
            </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {/* <AlertCircle className="h-5 w-5" /> */}
            Vendor Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
                  <div className="text-sm text-muted-foreground">
                    Total logs: {totalLogs}
                  </div>
            <div className="flex items-center gap-2">
              <Button
                variant="destructive"
                size="sm"
                disabled={selectedLogIds.size === 0 || bulkDeleting}
                onClick={async () => {
                  if (selectedLogIds.size === 0) {
                    return
                  }
                  
                  try {
                    setBulkDeleting(true)
                    const ids = Array.from(selectedLogIds)

                    const results = await Promise.all(
                      ids.map(async (id) => {
                        const response = await fetch(`/api/admin/vendorlog?vendorlogId=${id}`, {
                          method: 'DELETE'
                        })
                        const data = await response.json()
                        return { id, ok: response.ok && data.success, error: data.error }
                      })
                    )

                    const failed = results.filter(res => !res.ok)
                    if (failed.length === 0) {
                      toast.success(`Deleted ${ids.length} log${ids.length > 1 ? 's' : ''}`)
                    } else {
                      toast.error(`Failed to delete ${failed.length} log${failed.length > 1 ? 's' : ''}`)
                      failed.forEach(res => console.error(`Failed to delete log ${res.id}:`, res.error))
                    }

                    setSelectedLogIds(new Set())
                    fetchLogs(currentPage) // Refresh current page
                  } catch (error) {
                    console.error('Error deleting selected logs:', error)
                    toast.error('Error deleting selected logs')
                  } finally {
                    setBulkDeleting(false)
                  }
                }}
              >
                <Trash className="h-4 w-4 mr-2" />
                {bulkDeleting ? 'Deleting...' : `Delete Selected (${selectedLogIds.size})`}
              </Button>
            </div>
          </div>

          {logs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No vendor logs found</p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <input
                          type="checkbox"
                          className="h-4 w-4 accent-primary"
                          checked={
                            getPaginatedLogs().length > 0 &&
                            getPaginatedLogs().every((log) => selectedLogIds.has(log.id))
                          }
                          onChange={() => {
                            const logsOnPage = getPaginatedLogs()
                            const allIds = logsOnPage.map(log => log.id)
                            const allSelected = allIds.every(id => selectedLogIds.has(id))

                            setSelectedLogIds(prev => {
                              const next = new Set(prev)
                              if (allSelected) {
                                allIds.forEach(id => next.delete(id))
                              } else {
                                allIds.forEach(id => next.add(id))
                              }
                              return next
                            })
                          }}
                          aria-label="Select all logs on this page"
                        />
                      </TableHead>

                      <TableHead>Name</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Click on</TableHead>
                      <TableHead>subscription plan</TableHead>
                      <TableHead>Leads</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead className="w-[50px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getPaginatedLogs().map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <input
                            type="checkbox"
                            className="h-4 w-4 accent-primary"
                            checked={selectedLogIds.has(log.id)}
                            onChange={() => {
                              setSelectedLogIds(prev => {
                                const next = new Set(prev)
                                if (next.has(log.id)) {
                                  next.delete(log.id)
                                } else {
                                  next.add(log.id)
                                }
                                return next
                              })
                            }}
                            aria-label={`Select log ${log.id}`}
                          />
                        </TableCell>
                       
                        <TableCell className="font-medium">
                          {log.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {log.mobile || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {log.email || 'N/A'}
                        </TableCell>
                        <TableCell>
                          {getLogTypeBadge(log.type)}
                        </TableCell>
                      <TableCell>
                        {log.planName || 'N/A'}
                      </TableCell>
                      <TableCell>
                        {log.type === 'lead' ? (
                          log.leadCustomerName ||
                          log.leadCustomerPhone ||
                          log.leadCustomerEmail ||
                          log.leadService ||
                          log.leadAddress ? (
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {log.leadCustomerName || 'Lead details'}
                            </div>
                            {(log.leadCustomerPhone || log.leadCustomerEmail) && (
                              <div className="text-xs text-muted-foreground flex flex-col">
                                {log.leadCustomerPhone && <span>📞 {log.leadCustomerPhone}</span>}
                                {log.leadCustomerEmail && <span>✉️ {log.leadCustomerEmail}</span>}
                              </div>
                            )}
                            {(log.leadService || log.selectedService) && (
                              <div className="text-xs text-muted-foreground">
                                Service: {log.leadService || log.selectedService}
                                {log.selectedSubservice && (
                                  <span className="block">
                                    Sub-service: {log.selectedSubservice}
                                  </span>
                                )}
                              </div>
                            )}
                            {typeof log.leadPrice === 'number' && (
                              <div className="text-xs text-muted-foreground">
                                Price: ₹{log.leadPrice}
                              </div>
                            )}
                            {log.leadAddress && (
                              <div className="text-xs text-muted-foreground truncate max-w-[220px]">
                                📍 {log.leadAddress}
                              </div>
                            )}
                            {getLeadStatusBadge(log.leadStatus)}
                            {log.leadId && (
                              <div className="text-xs text-muted-foreground">
                                Lead ID: {log.leadId}
                              </div>
                            )}
                          </div>
                          ) : (
                            <div className="flex flex-col text-xs text-muted-foreground gap-1">
                              <span>No lead details found</span>
                              {log.leadId && (
                                <span>Lead ID: {log.leadId}</span>
                              )}
                            </div>
                          )
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                        <TableCell>
                          {formatDate(log.time)}
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="h-8 w-8 p-0"
                                disabled={deletingId === log.id}
                              >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => deleteLog(log.id)}
                                className="text-red-600 focus:text-red-600"
                                disabled={deletingId === log.id}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                {deletingId === log.id ? 'Deleting...' : 'Delete'}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalLogs)} of {totalLogs} entries
                  </div>
                  
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {getPaginationPages().map((page, index) => {
                        if (page === 'ellipsis-start' || page === 'ellipsis-end') {
                          return (
                            <PaginationItem key={`ellipsis-${index}`}>
                              <PaginationEllipsis />
                            </PaginationItem>
                          )
                        }
                        
                        return (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer min-w-[2.5rem]"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        )
                      })}
                      
                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => handlePageChange(currentPage + 1)}
                          className={currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}

            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
