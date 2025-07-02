"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, MessageCircle, Clock, CheckCircle, AlertCircle, Filter } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function VendorSupportPage() {
  const router = useRouter()
  const [tickets, setTickets] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    category: 'all',
    priority: 'all'
  })
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0
  })

  // Fetch tickets
  const fetchTickets = async (page = 1) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        ...filters
      })

      const response = await fetch(`/api/vendors/support?${params}`)
      const data = await response.json()

      if (data.success) {
        setTickets(data.data.tickets)
        setStats(data.data.stats)
        setPagination(data.data.pagination)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching tickets:', error)
      toast.error('Failed to fetch support tickets')
    } finally {
      setLoading(false)
    }
  }

  // Load tickets on mount and filter changes
  useEffect(() => {
    fetchTickets()
  }, [filters])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-blue-500" />
      case 'in_progress':
        return <Clock className="h-4 w-4 text-yellow-500" />
      case 'waiting_for_vendor':
        return <MessageCircle className="h-4 w-4 text-orange-500" />
      case 'waiting_for_admin':
        return <Clock className="h-4 w-4 text-gray-500" />
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'closed':
        return <CheckCircle className="h-4 w-4 text-gray-400" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800'
      case 'in_progress': return 'bg-yellow-100 text-yellow-800'
      case 'waiting_for_vendor': return 'bg-orange-100 text-orange-800'
      case 'waiting_for_admin': return 'bg-gray-100 text-gray-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'closed': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatCategory = (category) => {
    return category.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">
            Get help with your account, leads, and technical issues
          </p>
        </div>
        <Button onClick={() => router.push('/vendor/support/new')} className="w-full md:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Create Ticket
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.open || 0}</div>
            <p className="text-sm text-muted-foreground">Open</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.in_progress || 0}</div>
            <p className="text-sm text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-orange-600">{stats.waiting_for_vendor || 0}</div>
            <p className="text-sm text-muted-foreground">Waiting for You</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-600">{stats.waiting_for_admin || 0}</div>
            <p className="text-sm text-muted-foreground">Waiting for Admin</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.resolved || 0}</div>
            <p className="text-sm text-muted-foreground">Resolved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-gray-500">{stats.closed || 0}</div>
            <p className="text-sm text-muted-foreground">Closed</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="text-sm font-medium">Status</label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_for_vendor">Waiting for You</option>
                <option value="waiting_for_admin">Waiting for Admin</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Category</label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.category}
                onChange={(e) => setFilters({...filters, category: e.target.value})}
              >
                <option value="all">All Categories</option>
                <option value="technical_issue">Technical Issue</option>
                <option value="billing_support">Billing Support</option>
                <option value="account_access">Account Access</option>
                <option value="lead_management">Lead Management</option>
                <option value="subscription_issue">Subscription Issue</option>
                <option value="profile_verification">Profile Verification</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="feature_request">Feature Request</option>
                <option value="general_inquiry">General Inquiry</option>
                <option value="urgent_support">Urgent Support</option>
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Priority</label>
              <select
                className="w-full mt-1 p-2 border rounded-md"
                value={filters.priority}
                onChange={(e) => setFilters({...filters, priority: e.target.value})}
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tickets List */}
      <div className="space-y-4">
        {tickets.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <MessageCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No support tickets found</h3>
              <p className="text-muted-foreground mb-4">
                {filters.status !== 'all' || filters.category !== 'all' || filters.priority !== 'all'
                  ? 'No tickets match your current filters.'
                  : 'You haven\'t created any support tickets yet.'
                }
              </p>
              <Button onClick={() => router.push('/vendor/support/new')}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Ticket
              </Button>
            </CardContent>
          </Card>
        ) : (
          tickets.map((ticket) => (
            <Card 
              key={ticket._id} 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/vendor/support/${ticket._id}`)}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-mono text-sm text-muted-foreground">
                        {ticket.ticketId}
                      </span>
                      {ticket.unreadCount?.vendor > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          {ticket.unreadCount.vendor} new
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold mb-2">{ticket.title}</h3>
                    <p className="text-muted-foreground text-sm line-clamp-2">
                      {ticket.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-4">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(ticket.status)}
                      <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                        {ticket.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center gap-4">
                    <span>{formatCategory(ticket.category)}</span>
                    <span className="flex items-center gap-1">
                      <MessageCircle className="h-3 w-3" />
                      {ticket.messageCount || 0}
                    </span>
                    {ticket.assignedTo && (
                      <span>Assigned to: {ticket.assignedTo.name}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Updated: {formatDate(ticket.lastActivity)}</span>
                    {ticket.isOverdue && (
                      <Badge variant="destructive" className="text-xs">
                        Overdue
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
            {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
            {pagination.totalItems} tickets
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTickets(pagination.currentPage - 1)}
              disabled={!pagination.hasPrevPage}
            >
              Previous
            </Button>
            <span className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchTickets(pagination.currentPage + 1)}
              disabled={!pagination.hasNextPage}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
} 