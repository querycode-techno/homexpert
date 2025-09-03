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
  PaginationPrevious 
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
import { MoreHorizontal, Trash2, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'

export default function VendorLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  
  const ITEMS_PER_PAGE = 20

  // Fetch vendor logs
  const fetchLogs = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/vendorlog')
      const data = await response.json()
      
      if (data.success) {
        setLogs(data.logs)
        setTotalPages(Math.ceil(data.logs.length / ITEMS_PER_PAGE))
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
        fetchLogs() // Refresh the list
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
      'subscription': 'bg-blue-100 text-blue-800 hover:bg-blue-200',
      'lead': 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
    }
    
    return (
      <Badge className={typeColors[type] || 'bg-gray-100 text-gray-800 hover:bg-gray-200'}>
        {type}
      </Badge>
    )
  }

  // Get paginated logs
  const getPaginatedLogs = () => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE
    const endIndex = startIndex + ITEMS_PER_PAGE
    return logs.slice(startIndex, endIndex)
  }

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page)
  }

  useEffect(() => {
    fetchLogs()
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
                          <div className="space-y-1 ">
                            <div className="text-sm font-medium max-w-[180px] truncate">
                              {log.selectedService || 'N/A'}
                            </div>
                            {log.selectedSubservice && (
                              <div className="text-xs text-gray-500 max-w-[150px] truncate">
                                {log.selectedSubservice || 'N/A'}
                              </div>
                            )}
                          </div>
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
                <div className="mt-6">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => handlePageChange(currentPage - 1)}
                          className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                        />
                      </PaginationItem>
                      
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            onClick={() => handlePageChange(page)}
                            isActive={currentPage === page}
                            className="cursor-pointer"
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      
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

              {/* Summary */}
              <div className="mt-4 text-sm text-gray-500 text-center">
                Showing {((currentPage - 1) * ITEMS_PER_PAGE) + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, logs.length)} of {logs.length} entries
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
