"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { ArrowLeft, Send, MessageCircle, Clock, CheckCircle, AlertCircle, Star, RotateCcw, FileText } from "lucide-react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"

export default function VendorSupportTicketPage() {
  const router = useRouter()
  const params = useParams()
  const messagesEndRef = useRef(null)
  
  const [ticket, setTicket] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [newMessage, setNewMessage] = useState('')
  const [showSatisfactionRating, setShowSatisfactionRating] = useState(false)
  const [rating, setRating] = useState(0)
  const [ratingFeedback, setRatingFeedback] = useState('')

  // Fetch ticket details
  const fetchTicket = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/vendors/support/${params.id}`)
      const data = await response.json()

      if (data.success) {
        setTicket(data.data.ticket)
        
        // Show satisfaction rating if ticket is resolved and not yet rated
        if (data.data.ticket.status === 'resolved' && !data.data.ticket.satisfaction?.rating) {
          setShowSatisfactionRating(true)
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error fetching ticket:', error)
      toast.error('Failed to fetch ticket details')
      router.push('/vendor/support')
    } finally {
      setLoading(false)
    }
  }

  // Send message
  const sendMessage = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    
    try {
      const response = await fetch(`/api/vendors/support/${params.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: newMessage.trim(),
          messageType: 'text'
        })
      })

      const data = await response.json()

      if (data.success) {
        setNewMessage('')
        fetchTicket() // Refresh to get updated messages
        toast.success('Message sent successfully')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message')
    } finally {
      setSending(false)
    }
  }

  // Handle ticket actions
  const handleTicketAction = async (action, additionalData = {}) => {
    try {
      const response = await fetch(`/api/vendors/support/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          ...additionalData
        })
      })

      const data = await response.json()

      if (data.success) {
        fetchTicket() // Refresh ticket data
        toast.success(data.message)
        
        if (action === 'rate_satisfaction') {
          setShowSatisfactionRating(false)
          setRating(0)
          setRatingFeedback('')
        }
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error performing action:', error)
      toast.error(error.message || 'Failed to perform action')
    }
  }

  // Submit satisfaction rating
  const submitRating = () => {
    if (rating === 0) {
      toast.error('Please select a rating')
      return
    }

    handleTicketAction('rate_satisfaction', {
      satisfactionRating: rating,
      satisfactionFeedback: ratingFeedback
    })
  }

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    fetchTicket()
  }, [params.id])

  useEffect(() => {
    scrollToBottom()
  }, [ticket?.messages])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-5 w-5 text-blue-500" />
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />
      case 'waiting_for_vendor':
        return <MessageCircle className="h-5 w-5 text-orange-500" />
      case 'waiting_for_admin':
        return <Clock className="h-5 w-5 text-gray-500" />
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case 'closed':
        return <CheckCircle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
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

  const getUserInitials = (name) => {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : '?'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!ticket) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8 text-center">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Ticket not found</h3>
            <p className="text-muted-foreground mb-4">
              The support ticket you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Button onClick={() => router.push('/vendor/support')}>
              Back to Support
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.push('/vendor/support')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Support
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-sm text-muted-foreground">
              {ticket.ticketId}
            </span>
            {ticket.isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Overdue
              </Badge>
            )}
          </div>
          <h1 className="text-2xl font-bold">{ticket.title}</h1>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Ticket Details Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <div className="flex items-center gap-2">
                  {getStatusIcon(ticket.status)}
                  <Badge className={`${getStatusColor(ticket.status)} text-xs`}>
                    {ticket.status.replace(/_/g, ' ')}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Priority</span>
                <Badge className={`${getPriorityColor(ticket.priority)} text-xs`}>
                  {ticket.priority}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Category</span>
                <span className="text-sm">{formatCategory(ticket.category)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Created</span>
                <span className="text-sm">{formatDate(ticket.createdAt)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Last Activity</span>
                <span className="text-sm">{formatDate(ticket.lastActivity)}</span>
              </div>

              {ticket.assignedTo && (
                <div>
                  <span className="text-sm font-medium">Assigned to</span>
                  <div className="flex items-center gap-2 mt-1">
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={ticket.assignedTo.profileImage} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(ticket.assignedTo.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm">{ticket.assignedTo.name}</span>
                  </div>
                </div>
              )}

              {ticket.tags && ticket.tags.length > 0 && (
                <div>
                  <span className="text-sm font-medium">Tags</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {ticket.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {ticket.satisfaction?.rating && (
                <div>
                  <span className="text-sm font-medium">Satisfaction Rating</span>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= ticket.satisfaction.rating
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm ml-2">
                      {ticket.satisfaction.rating}/5
                    </span>
                  </div>
                  {ticket.satisfaction.feedback && (
                    <p className="text-sm text-muted-foreground mt-1">
                      "{ticket.satisfaction.feedback}"
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {(ticket.status === 'resolved' || ticket.status === 'closed') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleTicketAction('reopen')}
                  className="w-full justify-start"
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reopen Ticket
                </Button>
              )}

              {ticket.relatedLead && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/vendor/leads/${ticket.relatedLead._id}`)}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Related Lead
                </Button>
              )}

              {ticket.relatedSubscription && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/vendor/subscriptions`)}
                  className="w-full justify-start"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View Related Subscription
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Related Information */}
          {(ticket.relatedLead || ticket.relatedSubscription) && (
            <Card>
              <CardHeader>
                <CardTitle>Related Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {ticket.relatedLead && (
                  <div>
                    <span className="text-sm font-medium">Related Lead</span>
                    <div className="text-sm text-muted-foreground">
                      <p>Customer: {ticket.relatedLead.customerName}</p>
                      <p>Service: {ticket.relatedLead.service}</p>
                      <p>Status: {ticket.relatedLead.status}</p>
                    </div>
                  </div>
                )}

                {ticket.relatedSubscription && (
                  <div>
                    <span className="text-sm font-medium">Related Subscription</span>
                    <div className="text-sm text-muted-foreground">
                      <p>Plan: {ticket.relatedSubscription.planSnapshot?.planName}</p>
                      <p>Status: {ticket.relatedSubscription.status}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-2">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                Messages ({ticket.messageCount || 0})
              </CardTitle>
            </CardHeader>
            
            {/* Messages */}
            <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
              {ticket.messages && ticket.messages.length > 0 ? (
                ticket.messages.map((message, index) => (
                  <div
                    key={message._id || index}
                    className={`flex gap-3 ${
                      message.senderType === 'vendor' ? 'flex-row-reverse' : ''
                    }`}
                  >
                    <Avatar className="h-8 w-8 flex-shrink-0">
                      <AvatarImage src={message.sender?.profileImage} />
                      <AvatarFallback className="text-xs">
                        {getUserInitials(message.sender?.name || 'System')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div
                      className={`flex-1 max-w-[80%] ${
                        message.senderType === 'vendor' ? 'text-right' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium">
                          {message.sender?.name || 'System'}
                        </span>
                        {message.senderType !== 'vendor' && (
                          <Badge variant="outline" className="text-xs">
                            {message.senderType}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatDate(message.createdAt)}
                        </span>
                      </div>
                      
                      <div
                        className={`rounded-lg p-3 ${
                          message.senderType === 'vendor'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : message.messageType === 'system_notification'
                            ? 'bg-muted'
                            : 'bg-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {message.attachments && message.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((attachment, attIndex) => (
                              <a
                                key={attIndex}
                                href={attachment.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block text-xs underline hover:no-underline"
                              >
                                📎 {attachment.filename}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No messages yet. Start the conversation!</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </CardContent>

            {/* Message Input */}
            {ticket.status !== 'closed' && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Type your message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={2}
                    disabled={sending}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        sendMessage()
                      }
                    }}
                  />
                  <Button 
                    onClick={sendMessage} 
                    disabled={sending || !newMessage.trim()}
                    size="sm"
                    className="self-end"
                  >
                    {sending ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>

          {/* Satisfaction Rating */}
          {showSatisfactionRating && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Rate Your Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Your ticket has been resolved. Please rate your experience with our support team.
                </p>
                
                <div>
                  <label className="text-sm font-medium">Rating</label>
                  <div className="flex items-center gap-1 mt-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1"
                      >
                        <Star
                          className={`h-6 w-6 ${
                            star <= rating
                              ? 'text-yellow-400 fill-current'
                              : 'text-gray-300 hover:text-yellow-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">Feedback (Optional)</label>
                  <Textarea
                    placeholder="Tell us about your experience..."
                    value={ratingFeedback}
                    onChange={(e) => setRatingFeedback(e.target.value)}
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={submitRating} disabled={rating === 0}>
                    Submit Rating
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setShowSatisfactionRating(false)}
                  >
                    Skip for Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
} 