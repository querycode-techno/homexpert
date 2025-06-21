"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, X, Clock, Users, Tag } from "lucide-react"
import { toast } from "sonner"
import subscriptionService from "@/lib/services/subscriptionService"

export function SubscriptionForm({ plan, isOpen, onClose, onSuccess }) {
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    planName: "",
    description: "",
    duration: "",
    totalLeads: "",
    price: "",
    discountedPrice: "",
    currency: "INR",
    isActive: true,
    features: [],
    limitations: {
      maxActiveLeads: "",
      leadRefreshInterval: "",
      supportLevel: "basic"
    },
    tags: [],
    notes: "",
    tncLink: ""
  })
  
  const [newFeature, setNewFeature] = useState({ name: "", description: "", isIncluded: true })
  const [newTag, setNewTag] = useState("")

  // Initialize form with plan data if editing
  useEffect(() => {
    if (plan) {
      setFormData({
        planName: plan.planName || "",
        description: plan.description || "",
        duration: plan.duration || "",
        totalLeads: plan.totalLeads?.toString() || "",
        price: plan.price?.toString() || "",
        discountedPrice: plan.discountedPrice?.toString() || "",
        currency: plan.currency || "INR",
        isActive: plan.isActive ?? true,
        features: plan.features || [],
        limitations: {
          maxActiveLeads: plan.limitations?.maxActiveLeads?.toString() || "",
          leadRefreshInterval: plan.limitations?.leadRefreshInterval?.toString() || "",
          supportLevel: plan.limitations?.supportLevel || "basic"
        },
        tags: plan.tags || [],
        notes: plan.notes || "",
        tncLink: plan.tncLink || ""
      })
    } else {
      // Reset form for new plan
      setFormData({
        planName: "",
        description: "",
        duration: "",
        totalLeads: "",
        price: "",
        discountedPrice: "",
        currency: "INR",
        isActive: true,
        features: [],
        limitations: {
          maxActiveLeads: "",
          leadRefreshInterval: "",
          supportLevel: "basic"
        },
        tags: [],
        notes: "",
        tncLink: ""
      })
    }
  }, [plan])

  // Handle form input changes
  const handleInputChange = (field, value) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.')
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: value
        }
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }))
    }
  }

  // Add feature
  const handleAddFeature = () => {
    if (newFeature.name.trim()) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, { ...newFeature }]
      }))
      setNewFeature({ name: "", description: "", isIncluded: true })
    }
  }

  // Remove feature
  const handleRemoveFeature = (index) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter((_, i) => i !== index)
    }))
  }

  // Add tag
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag("")
    }
  }

  // Remove tag
  const handleRemoveTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }))
  }

  // Validate form using service method
  const validateForm = () => {
    const planData = {
      ...formData,
      totalLeads: Number(formData.totalLeads),
      price: Number(formData.price),
      discountedPrice: formData.discountedPrice ? Number(formData.discountedPrice) : undefined
    }
    
    return subscriptionService.validatePlanData(planData)
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    const validation = validateForm()
    if (!validation.isValid) {
      toast.error(`Validation Error: ${validation.errors.join(', ')}`)
      return
    }

    setLoading(true)

    try {
      // Prepare form data for API
      const submitData = {
        ...formData,
        totalLeads: Number(formData.totalLeads),
        price: Number(formData.price),
        discountedPrice: formData.discountedPrice ? Number(formData.discountedPrice) : undefined,
        limitations: {
          ...formData.limitations,
          maxActiveLeads: formData.limitations.maxActiveLeads ? Number(formData.limitations.maxActiveLeads) : undefined,
          leadRefreshInterval: formData.limitations.leadRefreshInterval ? Number(formData.limitations.leadRefreshInterval) : undefined
        }
      }

      let result
      if (plan) {
        result = await subscriptionService.updatePlan(plan._id, submitData)
      } else {
        result = await subscriptionService.createPlan(submitData)
      }

      toast.success(result.message || `Plan ${plan ? 'updated' : 'created'} successfully`)
      onSuccess()
      
    } catch (error) {
      toast.error(`Error: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {plan ? 'Edit Subscription Plan' : 'Create New Subscription Plan'}
          </DialogTitle>
          <DialogDescription>
            {plan 
              ? 'Update the subscription plan details below.'
              : 'Enter the details for the new subscription plan.'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="planName">Plan Name *</Label>
                  <Input
                    id="planName"
                    value={formData.planName}
                    onChange={(e) => handleInputChange('planName', e.target.value)}
                    placeholder="e.g., Premium Plan"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration *</Label>
                  <Select value={formData.duration} onValueChange={(value) => handleInputChange('duration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1-month">1 Month</SelectItem>
                      <SelectItem value="3-month">3 Months</SelectItem>
                      <SelectItem value="6-month">6 Months</SelectItem>
                      <SelectItem value="12-month">12 Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Describe what this plan offers..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Leads */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing & Lead Allocation</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (INR) *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">₹</span>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.price}
                      onChange={(e) => handleInputChange('price', e.target.value)}
                      className="pl-8"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="discountedPrice">Discounted Price (INR)</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-3 text-sm text-muted-foreground">₹</span>
                    <Input
                      id="discountedPrice"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.discountedPrice}
                      onChange={(e) => handleInputChange('discountedPrice', e.target.value)}
                      className="pl-8"
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="totalLeads">Total Leads *</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="totalLeads"
                      type="number"
                      min="1"
                      value={formData.totalLeads}
                      onChange={(e) => handleInputChange('totalLeads', e.target.value)}
                      className="pl-10"
                      placeholder="100"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
              <CardDescription>Add features included in this plan</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={newFeature.name}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Feature name"
                  className="flex-1"
                />
                <Input
                  value={newFeature.description}
                  onChange={(e) => setNewFeature(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Description (optional)"
                  className="flex-1"
                />
                <Button type="button" onClick={handleAddFeature} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {formData.features.length > 0 && (
                <div className="space-y-2">
                  {formData.features.map((feature, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                      <div>
                        <span className="font-medium">{feature.name}</span>
                        {feature.description && (
                          <span className="text-sm text-muted-foreground ml-2">
                            - {feature.description}
                          </span>
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveFeature(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Limitations */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Limitations & Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxActiveLeads">Max Active Leads</Label>
                  <Input
                    id="maxActiveLeads"
                    type="number"
                    min="0"
                    value={formData.limitations.maxActiveLeads}
                    onChange={(e) => handleInputChange('limitations.maxActiveLeads', e.target.value)}
                    placeholder="Unlimited"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="leadRefreshInterval">Lead Refresh (days)</Label>
                  <Input
                    id="leadRefreshInterval"
                    type="number"
                    min="0"
                    value={formData.limitations.leadRefreshInterval}
                    onChange={(e) => handleInputChange('limitations.leadRefreshInterval', e.target.value)}
                    placeholder="30"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supportLevel">Support Level</Label>
                  <Select 
                    value={formData.limitations.supportLevel} 
                    onValueChange={(value) => handleInputChange('limitations.supportLevel', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="standard">Standard</SelectItem>
                      <SelectItem value="premium">Premium</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                />
                <Label htmlFor="isActive">Active Plan</Label>
              </div>
            </CardContent>
          </Card>

          {/* Tags & Additional Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tags & Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add tag"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddTag()
                      }
                    }}
                  />
                  <Button type="button" onClick={handleAddTag} size="sm">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                
                {formData.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="gap-1">
                        <Tag className="h-3 w-3" />
                        {tag}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 ml-1"
                          onClick={() => handleRemoveTag(tag)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="tncLink">Terms & Conditions Link</Label>
                <Input
                  id="tncLink"
                  type="url"
                  value={formData.tncLink}
                  onChange={(e) => handleInputChange('tncLink', e.target.value)}
                  placeholder="https://example.com/terms"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Internal notes about this plan..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : (plan ? 'Update Plan' : 'Create Plan')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 