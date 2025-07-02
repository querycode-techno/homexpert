"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Send, Paperclip } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function NewSupportTicketPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    priority: 'medium',
    tags: [],
    relatedLead: '',
    relatedSubscription: ''
  })
  
  const [tagInput, setTagInput] = useState('')

  const categories = [
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'billing_support', label: 'Billing Support' },
    { value: 'account_access', label: 'Account Access' },
    { value: 'lead_management', label: 'Lead Management' },
    { value: 'subscription_issue', label: 'Subscription Issue' },
    { value: 'profile_verification', label: 'Profile Verification' },
    { value: 'payment_issue', label: 'Payment Issue' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'general_inquiry', label: 'General Inquiry' },
    { value: 'urgent_support', label: 'Urgent Support' }
  ]

  const priorities = [
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'urgent', label: 'Urgent', color: 'bg-red-100 text-red-800' }
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!formData.title.trim() || !formData.description.trim() || !formData.category) {
      toast.error('Please fill in all required fields')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/vendors/support', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Support ticket created successfully!')
        router.push(`/vendor/support/${data.data.ticket._id}`)
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error creating ticket:', error)
      toast.error(error.message || 'Failed to create support ticket')
    } finally {
      setLoading(false)
    }
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, tagInput.trim()]
      })
      setTagInput('')
    }
  }

  const removeTag = (tagToRemove) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    })
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && e.target.name === 'tagInput') {
      e.preventDefault()
      addTag()
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Create Support Ticket</h1>
          <p className="text-muted-foreground">
            Get help from our support team
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ticket Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="Brief description of your issue"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                maxLength={200}
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.title.length}/200 characters
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Category <span className="text-red-500">*</span>
              </label>
              <Select value={formData.category} onValueChange={(value) => setFormData({...formData, category: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <div className="flex items-center gap-2">
                        <Badge className={`${priority.color} text-xs`}>
                          {priority.label}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <Textarea
                placeholder="Please describe your issue in detail. Include any error messages, steps to reproduce the problem, and what you expected to happen."
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={6}
                maxLength={5000}
                required
              />
              <div className="text-xs text-muted-foreground mt-1">
                {formData.description.length}/5000 characters
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium mb-2">Tags (Optional)</label>
              <div className="flex gap-2 mb-2">
                <Input
                  name="tagInput"
                  placeholder="Add tags to help categorize your ticket"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                />
                <Button type="button" variant="outline" onClick={addTag}>
                  Add
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-xs hover:text-red-500"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Related Information */}
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-medium mb-2">Related Lead ID (Optional)</label>
                <Input
                  placeholder="Lead ID if this ticket relates to a specific lead"
                  value={formData.relatedLead}
                  onChange={(e) => setFormData({...formData, relatedLead: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Related Subscription ID (Optional)</label>
                <Input
                  placeholder="Subscription ID if this is a billing/subscription issue"
                  value={formData.relatedSubscription}
                  onChange={(e) => setFormData({...formData, relatedSubscription: e.target.value})}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Help Tips */}
        <Card>
          <CardHeader>
            <CardTitle>Tips for Getting Better Support</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>• <strong>Be specific:</strong> Include exact error messages, steps you took, and what you expected to happen</li>
              <li>• <strong>Choose the right category:</strong> This helps us route your ticket to the right specialist</li>
              <li>• <strong>Set appropriate priority:</strong> Use "Urgent" only for critical issues affecting your business</li>
              <li>• <strong>Add context:</strong> Include relevant lead IDs, subscription details, or screenshots if applicable</li>
              <li>• <strong>One issue per ticket:</strong> Create separate tickets for different problems</li>
            </ul>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={loading} className="min-w-[120px]">
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Creating...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                Create Ticket
              </div>
            )}
          </Button>
        </div>
      </form>
    </div>
  )
} 