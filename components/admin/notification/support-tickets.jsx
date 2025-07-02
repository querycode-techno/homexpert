"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, MessageSquare, Plus, Trash2, MoreHorizontal, CheckCircle } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { ScrollArea } from "@/components/ui/scroll-area"

export function SupportTickets({ page = 1, limit = 10, onPageChange, onLimitChange }) {
  const [searchTerm, setSearchTerm] = useState("")
  const [supportTickets, setSupportTickets] = useState([])
  const [filteredTickets, setFilteredTickets] = useState([])
  const [isCreateTicketOpen, setIsCreateTicketOpen] = useState(false)
  const [isViewTicketOpen, setIsViewTicketOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentTicket, setCurrentTicket] = useState(null)

  // Form states
  const [ticketForm, setTicketForm] = useState({
    subject: "",
    description: "",
    priority: "Medium",
    type: "Technical",
    assignedTo: "Support Team",
  })

  const [replyForm, setReplyForm] = useState("")

  // Initialize mock data
  useEffect(() => {
    // Mock support tickets
    const mockTickets = [
      {
        id: "T-001",
        subject: "Unable to access vendor dashboard",
        description: "I'm trying to log in to my vendor dashboard but keep getting an error message.",
        date: "2023-05-12",
        time: "09:45 AM",
        status: "Open",
        priority: "High",
        type: "Technical",
        submittedBy: "Rajesh Plumbing Services",
        assignedTo: "Support Team",
        conversation: [
          {
            sender: "Rajesh Plumbing Services",
            message: "I'm trying to log in to my vendor dashboard but keep getting an error message.",
            timestamp: "2023-05-12 09:45 AM",
          },
          {
            sender: "Support Team",
            message: "Can you please provide more details about the error message you're seeing?",
            timestamp: "2023-05-12 10:30 AM",
          },
          {
            sender: "Rajesh Plumbing Services",
            message: "It says 'Invalid credentials' but I'm sure I'm using the correct password.",
            timestamp: "2023-05-12 11:15 AM",
          },
        ],
      },
      {
        id: "T-002",
        subject: "Payment not received",
        description: "I completed a booking but haven't received the payment yet.",
        date: "2023-05-11",
        time: "02:30 PM",
        status: "In Progress",
        priority: "Medium",
        type: "Billing",
        submittedBy: "Kumar Electricals",
        assignedTo: "Finance Team",
        conversation: [
          {
            sender: "Kumar Electricals",
            message: "I completed a booking but haven't received the payment yet.",
            timestamp: "2023-05-11 02:30 PM",
          },
          {
            sender: "Finance Team",
            message: "We're looking into this issue. Can you provide the booking ID?",
            timestamp: "2023-05-11 03:15 PM",
          },
          {
            sender: "Kumar Electricals",
            message: "The booking ID is B-1235.",
            timestamp: "2023-05-11 03:45 PM",
          },
          {
            sender: "Finance Team",
            message: "Thank you. We've identified the issue and are processing your payment now.",
            timestamp: "2023-05-11 04:30 PM",
          },
        ],
      },
      {
        id: "T-003",
        subject: "Need to update service offerings",
        description: "I want to add new services to my vendor profile but can't find the option.",
        date: "2023-05-10",
        time: "11:20 AM",
        status: "Resolved",
        priority: "Low",
        type: "Account",
        submittedBy: "Clean Home Services",
        assignedTo: "Support Team",
        conversation: [
          {
            sender: "Clean Home Services",
            message: "I want to add new services to my vendor profile but can't find the option.",
            timestamp: "2023-05-10 11:20 AM",
          },
          {
            sender: "Support Team",
            message:
              "You can update your services by going to your profile settings and selecting 'Service Offerings'.",
            timestamp: "2023-05-10 12:00 PM",
          },
          {
            sender: "Clean Home Services",
            message: "Found it, thank you!",
            timestamp: "2023-05-10 12:30 PM",
          },
          {
            sender: "Support Team",
            message: "You're welcome! Let us know if you need anything else.",
            timestamp: "2023-05-10 01:00 PM",
          },
        ],
      },
      {
        id: "T-004",
        subject: "App crashing on booking confirmation",
        description: "The app crashes whenever I try to confirm a booking.",
        date: "2023-05-09",
        time: "04:15 PM",
        status: "Open",
        priority: "Critical",
        type: "Technical",
        submittedBy: "Perfect Painters",
        assignedTo: "Development Team",
        conversation: [
          {
            sender: "Perfect Painters",
            message: "The app crashes whenever I try to confirm a booking.",
            timestamp: "2023-05-09 04:15 PM",
          },
          {
            sender: "Development Team",
            message: "We're sorry to hear that. What device and app version are you using?",
            timestamp: "2023-05-09 05:00 PM",
          },
        ],
      },
      {
        id: "T-005",
        subject: "Need help with subscription renewal",
        description: "My subscription is expiring soon and I need help with renewal.",
        date: "2023-05-08",
        time: "10:00 AM",
        status: "Closed",
        priority: "Medium",
        type: "Billing",
        submittedBy: "Fix It All",
        assignedTo: "Finance Team",
        conversation: [
          {
            sender: "Fix It All",
            message: "My subscription is expiring soon and I need help with renewal.",
            timestamp: "2023-05-08 10:00 AM",
          },
          {
            sender: "Finance Team",
            message: "We can help you with that. Would you like to renew with the same plan or upgrade?",
            timestamp: "2023-05-08 10:45 AM",
          },
          {
            sender: "Fix It All",
            message: "I'd like to upgrade to the Premium plan.",
            timestamp: "2023-05-08 11:30 AM",
          },
          {
            sender: "Finance Team",
            message:
              "Great! We've processed your upgrade. Your new subscription will start when the current one expires.",
            timestamp: "2023-05-08 12:15 PM",
          },
          {
            sender: "Fix It All",
            message: "Thank you for your help!",
            timestamp: "2023-05-08 01:00 PM",
          },
        ],
      },
    ]

    setSupportTickets(mockTickets)
  }, [])

  // Filter tickets based on search term
  useEffect(() => {
    setFilteredTickets(
      supportTickets.filter(
        (ticket) =>
          ticket.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ticket.submittedBy.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    )
  }, [supportTickets, searchTerm])

  // Calculate paginated tickets
  const startIdx = (page - 1) * limit
  const paginatedTickets = filteredTickets.slice(startIdx, startIdx + limit)
  const totalPages = Math.ceil(filteredTickets.length / limit)

  const handleInputChange = (e, formSetter, formState) => {
    const { name, value } = e.target
    formSetter({
      ...formState,
      [name]: value,
    })
  }

  const handleSelectChange = (name, value, formSetter, formState) => {
    formSetter({
      ...formState,
      [name]: value,
    })
  }

  const resetTicketForm = () => {
    setTicketForm({
      subject: "",
      description: "",
      priority: "Medium",
      type: "Technical",
      assignedTo: "Support Team",
    })
  }

  const handleCreateTicket = () => {
    // Validate form
    if (!ticketForm.subject || !ticketForm.description) {
      toast.error("Please fill in all required fields.")
      return
    }

    // Create new ticket
    const newTicket = {
      id: `T-${String(supportTickets.length + 1).padStart(3, "0")}`,
      subject: ticketForm.subject,
      description: ticketForm.description,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      status: "Open",
      priority: ticketForm.priority,
      type: ticketForm.type,
      submittedBy: "Admin",
      assignedTo: ticketForm.assignedTo,
      conversation: [
        {
          sender: "Admin",
          message: ticketForm.description,
          timestamp: new Date().toLocaleString(),
        },
      ],
    }

    setSupportTickets([...supportTickets, newTicket])

    // Show success message
    toast.success(`Support ticket #${newTicket.id} has been created successfully.`)

    // Close dialog and reset form
    setIsCreateTicketOpen(false)
    resetTicketForm()
  }

  const handleViewTicket = (ticket) => {
    setCurrentTicket(ticket)
    setIsViewTicketOpen(true)
  }

  const handleDeleteTicket = () => {
    // Delete ticket
    setSupportTickets(supportTickets.filter((ticket) => ticket.id !== currentTicket.id))

    // Show success message
    toast.success(`Support ticket #${currentTicket.id} has been deleted successfully.`)

    // Close dialog and reset
    setIsDeleteDialogOpen(false)
    setCurrentTicket(null)
  }

  const handleReplyToTicket = () => {
    if (!replyForm.trim()) {
      toast.error("Please enter a reply message.")
      return
    }

    // Add reply to conversation
    const updatedTicket = {
      ...currentTicket,
      conversation: [
        ...currentTicket.conversation,
        {
          sender: "Admin",
          message: replyForm,
          timestamp: new Date().toLocaleString(),
        },
      ],
    }

    // Update ticket status if it's open
    if (updatedTicket.status === "Open") {
      updatedTicket.status = "In Progress"
    }

    // Update tickets
    setSupportTickets(supportTickets.map((ticket) => (ticket.id === currentTicket.id ? updatedTicket : ticket)))

    // Show success message
    toast.success(`Your reply to ticket #${currentTicket.id} has been sent.`)

    // Reset form
    setReplyForm("")
    setCurrentTicket(updatedTicket)
  }

  const handleCloseTicket = (ticket) => {
    // Update ticket status to Closed
    const updatedTicket = {
      ...ticket,
      status: "Closed",
    }

    // Update tickets
    setSupportTickets(supportTickets.map((t) => (t.id === ticket.id ? updatedTicket : t)))

    // Show success message
    toast.success(`Support ticket #${ticket.id} has been closed.`)

    // Update current ticket if it's open
    if (currentTicket && currentTicket.id === ticket.id) {
      setCurrentTicket(updatedTicket)
    }
  }

  const handleReopenTicket = (ticket) => {
    // Update ticket status to Open
    const updatedTicket = {
      ...ticket,
      status: "Open",
    }

    // Update tickets
    setSupportTickets(supportTickets.map((t) => (t.id === ticket.id ? updatedTicket : t)))

    // Show success message
    toast.success(`Support ticket #${ticket.id} has been reopened.`)

    // Update current ticket if it's open
    if (currentTicket && currentTicket.id === ticket.id) {
      setCurrentTicket(updatedTicket)
    }
  }

  const getTicketStatusColor = (status) => {
    switch (status) {
      case "Open":
        return "bg-blue-500 hover:bg-blue-500/80"
      case "In Progress":
        return "bg-yellow-500 hover:bg-yellow-500/80"
      case "Resolved":
        return "bg-green-500 hover:bg-green-500/80"
      case "Closed":
        return "bg-gray-500 hover:bg-gray-500/80"
      default:
        return "bg-gray-500 hover:bg-gray-500/80"
    }
  }

  const getTicketPriorityColor = (priority) => {
    switch (priority) {
      case "Low":
        return "bg-green-500 hover:bg-green-500/80"
      case "Medium":
        return "bg-blue-500 hover:bg-blue-500/80"
      case "High":
        return "bg-yellow-500 hover:bg-yellow-500/80"
      case "Critical":
        return "bg-red-500 hover:bg-red-500/80"
      default:
        return "bg-gray-500 hover:bg-gray-500/80"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">Manage support requests and inquiries.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Support Tickets</CardTitle>
            <CardDescription>Manage support requests and inquiries.</CardDescription>
          </div>
          <Dialog open={isCreateTicketOpen} onOpenChange={setIsCreateTicketOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <Plus className="h-4 w-4" />
                <span>Create Ticket</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Support Ticket</DialogTitle>
                <DialogDescription>Create a new support ticket for tracking issues.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={ticketForm.subject}
                    onChange={(e) => handleInputChange(e, setTicketForm, ticketForm)}
                    placeholder="Enter ticket subject"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={ticketForm.description}
                    onChange={(e) => handleInputChange(e, setTicketForm, ticketForm)}
                    placeholder="Enter ticket description"
                    rows={4}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={ticketForm.priority}
                      onValueChange={(value) => handleSelectChange("priority", value, setTicketForm, ticketForm)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Low">Low</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="High">High</SelectItem>
                        <SelectItem value="Critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={ticketForm.type}
                      onValueChange={(value) => handleSelectChange("type", value, setTicketForm, ticketForm)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Technical">Technical</SelectItem>
                        <SelectItem value="Billing">Billing</SelectItem>
                        <SelectItem value="Account">Account</SelectItem>
                        <SelectItem value="Feature Request">Feature Request</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedTo">Assign To</Label>
                  <Select
                    value={ticketForm.assignedTo}
                    onValueChange={(value) => handleSelectChange("assignedTo", value, setTicketForm, ticketForm)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Support Team">Support Team</SelectItem>
                      <SelectItem value="Development Team">Development Team</SelectItem>
                      <SelectItem value="Finance Team">Finance Team</SelectItem>
                      <SelectItem value="Admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsCreateTicketOpen(false)
                    resetTicketForm()
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateTicket}>Create Ticket</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tickets..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="rounded-md border">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left font-medium p-2">Ticket ID</th>
                      <th className="text-left font-medium p-2">Subject</th>
                      <th className="text-left font-medium p-2">Submitted By</th>
                      <th className="text-left font-medium p-2">Date</th>
                      <th className="text-left font-medium p-2">Status</th>
                      <th className="text-left font-medium p-2">Priority</th>
                      <th className="text-left font-medium p-2">Type</th>
                      <th className="text-left font-medium p-2">Assigned To</th>
                      <th className="text-right font-medium p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedTickets.length > 0 ? (
                      paginatedTickets.map((ticket) => (
                        <tr key={ticket.id} className="border-b">
                          <td className="p-2">{ticket.id}</td>
                          <td className="p-2 max-w-[200px] truncate">{ticket.subject}</td>
                          <td className="p-2">{ticket.submittedBy}</td>
                          <td className="p-2">{`${ticket.date}, ${ticket.time}`}</td>
                          <td className="p-2">
                            <Badge variant="default" className={getTicketStatusColor(ticket.status)}>
                              {ticket.status}
                            </Badge>
                          </td>
                          <td className="p-2">
                            <Badge variant="default" className={getTicketPriorityColor(ticket.priority)}>
                              {ticket.priority}
                            </Badge>
                          </td>
                          <td className="p-2">{ticket.type}</td>
                          <td className="p-2">{ticket.assignedTo}</td>
                          <td className="p-2 text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  className="flex items-center gap-2"
                                  onClick={() => handleViewTicket(ticket)}
                                >
                                  <MessageSquare className="h-4 w-4" />
                                  <span>View & Reply</span>
                                </DropdownMenuItem>
                                {ticket.status !== "Closed" && (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => handleCloseTicket(ticket)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Close Ticket</span>
                                  </DropdownMenuItem>
                                )}
                                {ticket.status === "Closed" && (
                                  <DropdownMenuItem
                                    className="flex items-center gap-2"
                                    onClick={() => handleReopenTicket(ticket)}
                                  >
                                    <CheckCircle className="h-4 w-4" />
                                    <span>Reopen Ticket</span>
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem
                                  className="flex items-center gap-2 text-red-500"
                                  onClick={() => {
                                    setCurrentTicket(ticket)
                                    setIsDeleteDialogOpen(true)
                                  }}
                                >
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete</span>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={9} className="p-4 text-center text-muted-foreground">
                          No tickets found. Try a different search term or create a new ticket.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination controls below the table */}
            <div className="flex items-center justify-between px-2 py-6">
              <div>
                <label>Rows per page: </label>
                <select
                  value={limit}
                  onChange={e => {
                    onLimitChange(Number(e.target.value))
                    onPageChange(1)
                  }}
                  className="border rounded px-2 py-1"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => onPageChange(page - 1)}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >Previous</button>
                <span>
                  Page {page} of {totalPages || 1}
                </span>
                <button
                  disabled={page === totalPages || totalPages === 0}
                  onClick={() => onPageChange(page + 1)}
                  className="px-2 py-1 border rounded disabled:opacity-50"
                >Next</button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* View Ticket Dialog */}
      <Dialog open={isViewTicketOpen} onOpenChange={setIsViewTicketOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Ticket #{currentTicket?.id}</DialogTitle>
            <DialogDescription>
              {currentTicket?.subject} - {currentTicket?.date}, {currentTicket?.time}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="default" className={currentTicket && getTicketStatusColor(currentTicket.status)}>
                {currentTicket?.status}
              </Badge>
              <Badge variant="default" className={currentTicket && getTicketPriorityColor(currentTicket.priority)}>
                {currentTicket?.priority}
              </Badge>
              <Badge variant="outline">{currentTicket?.type}</Badge>
              <Badge variant="outline">Assigned to: {currentTicket?.assignedTo}</Badge>
            </div>
            <div className="space-y-2">
              <Label>Conversation</Label>
              <ScrollArea className="h-[300px] rounded-md border p-4">
                {currentTicket?.conversation.map((message, index) => (
                  <div
                    key={index}
                    className={`mb-4 flex ${message.sender === "Admin" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.sender === "Admin" ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      <div className="mb-1 text-xs font-medium">
                        {message.sender} - {message.timestamp}
                      </div>
                      <div>{message.message}</div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
            {currentTicket?.status !== "Closed" && (
              <div className="space-y-2">
                <Label htmlFor="reply">Reply</Label>
                <Textarea
                  id="reply"
                  value={replyForm}
                  onChange={(e) => setReplyForm(e.target.value)}
                  placeholder="Type your reply here..."
                  rows={3}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsViewTicketOpen(false)
                setReplyForm("")
              }}
            >
              Close
            </Button>
            {currentTicket?.status !== "Closed" && <Button onClick={handleReplyToTicket}>Send Reply</Button>}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Ticket Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete ticket #{currentTicket?.id}. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTicket} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}