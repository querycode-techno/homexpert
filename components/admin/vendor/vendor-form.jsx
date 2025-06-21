"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { toast } from "sonner"

export function VendorForm({
  isOpen,
  onClose,
  vendor = null,
  onSubmit,
  subscriptions = [],
  title = "Add New Vendor",
  description = "Create a new vendor account with subscription details.",
}) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    subscription: "Basic Plan",
    startDate: "",
    endDate: "",
    status: "Active",
    leadQuota: 10,
    leadsUsed: 0,
  })

  // Update form data when vendor changes (for editing)
  useEffect(() => {
    if (vendor) {
      setFormData({
        name: vendor.name || "",
        phone: vendor.phone || "",
        subscription: vendor.subscription || "Basic Plan",
        startDate: vendor.startDate || "",
        endDate: vendor.endDate || "",
        status: vendor.status || "Active",
        leadQuota: vendor.leadQuota || 10,
        leadsUsed: vendor.leadsUsed || 0,
      })
    } else {
      // Set default dates for new vendor
      const today = new Date()
      const threeMonthsLater = new Date(today)
      threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

      setFormData({
        name: "",
        phone: "",
        subscription: "Basic Plan",
        startDate: today.toISOString().split("T")[0],
        endDate: threeMonthsLater.toISOString().split("T")[0],
        status: "Active",
        leadQuota: 10,
        leadsUsed: 0,
      })
    }
  }, [vendor])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }))
    
    // Auto-set lead quota based on subscription
    if (name === "subscription") {
      const subscription = subscriptions.find(sub => sub.name === value)
      if (subscription) {
        setFormData(prev => ({ ...prev, leadQuota: subscription.features?.leadQuota || 10 }))
      }
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Validate form
    if (!formData.name || !formData.phone || !formData.subscription) {
      toast.error("Missing Fields: Please fill in all required fields.")
      return
    }

    // Set dates if not provided
    if (!formData.startDate) {
      formData.startDate = new Date().toISOString().split("T")[0]
    }

    if (!formData.endDate) {
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 3) // Default 3 months
      formData.endDate = endDate.toISOString().split("T")[0]
    }

    onSubmit(formData)
    resetForm()
  }

  const resetForm = () => {
    const today = new Date()
    const threeMonthsLater = new Date(today)
    threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3)

    setFormData({
      name: "",
      phone: "",
      subscription: "Basic Plan",
      startDate: today.toISOString().split("T")[0],
      endDate: threeMonthsLater.toISOString().split("T")[0],
      status: "Active",
      leadQuota: 10,
      leadsUsed: 0,
    })
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Vendor Name *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Enter vendor name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  placeholder="Enter phone number"
                  required
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subscription">Subscription Plan *</Label>
                <Select 
                  value={formData.subscription} 
                  onValueChange={(value) => handleSelectChange("subscription", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select subscription" />
                  </SelectTrigger>
                  <SelectContent>
                    {subscriptions.length > 0 ? (
                      subscriptions.map((sub) => (
                        <SelectItem key={sub.id} value={sub.name}>
                          {sub.name} - ${sub.price}
                        </SelectItem>
                      ))
                    ) : (
                      <>
                        <SelectItem value="Basic Plan">Basic Plan</SelectItem>
                        <SelectItem value="Premium Plan">Premium Plan</SelectItem>
                        <SelectItem value="Enterprise Plan">Enterprise Plan</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadQuota">Lead Quota</Label>
                <Input
                  id="leadQuota"
                  name="leadQuota"
                  type="number"
                  min="0"
                  value={formData.leadQuota}
                  onChange={handleInputChange}
                  placeholder="Enter lead quota"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit">
              {vendor ? "Update Vendor" : "Add Vendor"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 