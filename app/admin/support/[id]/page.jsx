"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  MessageSquare,
  Clock,
  User,
  Building,
  Tag,
  AlertTriangle,
  CheckCircle,
  Send,
  Loader2,
  UserCog,
  Calendar,
  FileText
} from "lucide-react"

const PRIORITY_CONFIG = {
  low: { label: "Low", color: "bg-blue-500", textColor: "text-blue-700", bgColor: "bg-blue-50" },
  medium: { label: "Medium", color: "bg-yellow-500", textColor: "text-yellow-700", bgColor: "bg-yellow-50" },
  high: { label: "High", color: "bg-orange-500", textColor: "text-orange-700", bgColor: "bg-orange-50" },
  urgent: { label: "Urgent", color: "bg-red-500", textColor: "text-red-700", bgColor: "bg-red-50" }
}

const STATUS_CONFIG = {
  open: { label: "Open", color: "bg-blue-500", textColor: "text-blue-700" },
  in_progress: { label: "In Progress", color: "bg-yellow-500", textColor: "text-yellow-700" },
  waiting_for_vendor: { label: "Waiting for Vendor", color: "bg-purple-500", textColor: "text-purple-700" },
  waiting_for_admin: { label: "Waiting for Admin", color: "bg-orange-500", textColor: "text-orange-700" },
  resolved: { label: "Resolved", color: "bg-green-500", textColor: "text-green-700" },
  closed: { label: "Closed", color: "bg-gray-500", textColor: "text-gray-700" }
}

export default function AdminSupportTicketDetailsPage({ params }) {
  const router = useRouter()
  const { id } = params
  
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [newMessage, setNewMessage] = useState("")
  const [updatingTicket, setUpdatingTicket] = useState(false)

  // Load ticket details
  useEffect(() => {
    if (id) {
      loadTicketDetails()
    }
  }, [id])

  const loadTicketDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/support/${id}`)
      const data = await response.json()

      if (data.success) {
        setTicket(data.data.ticket)
      } else {
        toast.error(data.error || "Failed to load ticket details")
        router.push('/admin/support')
      }
    } catch (error) {
      console.error("Error loading ticket:", error)
      toast.error("Failed to load ticket details")
      router.push('/admin/support')
    } finally {
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error("Please enter a message")
      return
    }

    try {
      setSendingMessage(true)
      const response = await fetch(`/api/admin/support/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: "text"
        }),
      })

      const data = await response.json()

      if (data.success) {
        setNewMessage("")
        loadTicketDetails() // Reload to get updated messages
        toast.success("Message sent successfully")
      } else {
        toast.error(data.error || "Failed to send message")
      }
    } catch (error) {
      console.error("Error sending message:", error)
      toast.error("Failed to send message")
    } finally {
      setSendingMessage(false)
    }
  }

  const updateTicketStatus = async (newStatus) => {
    try {
      setUpdatingTicket(true)
      const response = await fetch(`/api/admin/support/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_status",
          status: newStatus
        }),
      })

      const data = await response.json()

      if (data.success) {
        loadTicketDetails() // Reload to get updated ticket
        toast.success(`Ticket status updated to ${newStatus}`)
      } else {
        toast.error(data.error || "Failed to update ticket status")
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
      toast.error("Failed to update ticket status")
    } finally {
      setUpdatingTicket(false)
    }
  }

  const updateTicketPriority = async (newPriority) => {
    try {
      setUpdatingTicket(true)
      const response = await fetch(`/api/admin/support/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "update_priority",
          priority: newPriority
        }),
      })

      const data = await response.json()

      if (data.success) {
        loadTicketDetails() // Reload to get updated ticket
        toast.success(`Ticket priority updated to ${newPriority}`)
      } else {
        toast.error(data.error || "Failed to update ticket priority")
      }
    } catch (error) {
      console.error("Error updating ticket:", error)
      toast.error("Failed to update ticket priority")
    } finally {
      setUpdatingTicket(false)
    }
  }

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading ticket details...</span>
        </div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Ticket Not Found</h1>
          <Button onClick={() => router.push('/admin/support')}>
            Back to Support Tickets
          </Button>
        </div>
      </div>
    )
  }

  const priorityConfig = PRIORITY_CONFIG[ticket.priority] || PRIORITY_CONFIG.medium
  const statusConfig = STATUS_CONFIG[ticket.status] || STATUS_CONFIG.open

  return (
    <div className="container mx-auto p-6 max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/admin/support')}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold">{ticket.title}</h1>
            <Badge variant="outline" className="font-mono">
              {ticket.ticketId}
            </Badge>
          </div>
          <p className="text-muted-foreground">
            Created {formatDateTime(ticket.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Ticket Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Ticket Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm leading-relaxed">{ticket.description}</p>
              </div>
              
              {ticket.tags && ticket.tags.length > 0 && (
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">Tags</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {ticket.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Messages Thread */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Messages ({ticket.messages?.length || 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {ticket.messages && ticket.messages.length > 0 ? (
                  ticket.messages.map((message, index) => (
                    <div key={message.messageId || index} className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {message.senderType === 'vendor' ? 'V' : 
                           message.senderType === 'system' ? 'S' : 'A'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {message.senderType === 'vendor' ? 'Vendor' :
                             message.senderType === 'system' ? 'System' : 'Admin'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatDateTime(message.timestamp)}
                          </span>
                          {message.messageType !== 'text' && (
                            <Badge variant="outline" className="text-xs">
                              {message.messageType}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No messages yet
                  </p>
                )}
              </div>

              <Separator className="my-4" />

              {/* Send Message */}
              <div className="space-y-3">
                <Label htmlFor="message">Send Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  rows={3}
                />
                <Button 
                  onClick={sendMessage} 
                  disabled={sendingMessage || !newMessage.trim()}
                  className="w-full"
                >
                  {sendingMessage ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Send Message
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Status & Priority */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCog className="h-5 w-5" />
                Ticket Management
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={ticket.status}
                  onValueChange={updateTicketStatus}
                  disabled={updatingTicket}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={ticket.priority}
                  onValueChange={updateTicketPriority}
                  disabled={updatingTicket}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORITY_CONFIG).map(([value, config]) => (
                      <SelectItem key={value} value={value}>
                        <div className="flex items-center gap-2">
                          <div className={`h-2 w-2 rounded-full ${config.color}`} />
                          {config.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Ticket Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Ticket Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge className={`${statusConfig.color} text-white`}>
                    {statusConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Priority</span>
                  <Badge className={`${priorityConfig.color} text-white`}>
                    {priorityConfig.label}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Category</span>
                  <span className="text-sm text-muted-foreground capitalize">
                    {ticket.category.replace('_', ' ')}
                  </span>
                </div>

                {ticket.vendorId && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Building className="h-4 w-4" />
                      Vendor
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {ticket.vendorId.businessName || 'Unknown Vendor'}
                    </p>
                  </div>
                )}

                {ticket.assignedTo && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <UserCog className="h-4 w-4" />
                      Assigned To
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {ticket.assignedTo.name} ({ticket.assignedTo.email})
                    </p>
                  </div>
                )}

                <div className="space-y-1">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Created
                  </span>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(ticket.createdAt)}
                  </p>
                </div>

                {ticket.lastActivity && (
                  <div className="space-y-1">
                    <span className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      Last Activity
                    </span>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(ticket.lastActivity)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {ticket.status !== 'resolved' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateTicketStatus('resolved')}
                  disabled={updatingTicket}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Resolved
                </Button>
              )}
              
              {ticket.status !== 'closed' && ticket.status === 'resolved' && (
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => updateTicketStatus('closed')}
                  disabled={updatingTicket}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Close Ticket
                </Button>
              )}

              {ticket.priority !== 'urgent' && (
                <Button
                  variant="outline"
                  className="w-full justify-start text-red-600 hover:text-red-700"
                  onClick={() => updateTicketPriority('urgent')}
                  disabled={updatingTicket}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Mark as Urgent
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 