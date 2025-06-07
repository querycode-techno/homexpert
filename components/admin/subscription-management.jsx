"use client"

import { useState, useRef, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, MoreHorizontal, Download, Upload } from "lucide-react"
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"

export function SubscriptionManagement() {
  const {
    subscriptions,
    vendors,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    updateVendor,
    exportToCSV,
    importFromCSV,
  } = useData()
  const { toast } = useToast()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("plans")
  const [isAddSubscriptionOpen, setIsAddSubscriptionOpen] = useState(false)
  const [isEditSubscriptionOpen, setIsEditSubscriptionOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [isEditVendorSubOpen, setIsEditVendorSubOpen] = useState(false)
  const [currentSubscription, setCurrentSubscription] = useState(null)
  const [currentVendor, setCurrentVendor] = useState(null)
  const [filteredSubscriptions, setFilteredSubscriptions] = useState([])
  const [filteredVendors, setFilteredVendors] = useState([])

  // File input ref
  const fileInputRef = useRef(null)

  // Form states
  const [subscriptionForm, setSubscriptionForm] = useState({
    name: "",
    duration: "",
    price: "",
    features: "",
    status: "Active",
  })

  const [vendorSubForm, setVendorSubForm] = useState({
    subscription: "",
    startDate: "",
    endDate: "",
    status: "Active",
  })

  // Update filtered data when data or search term changes
  useEffect(() => {
    setFilteredSubscriptions(
      subscriptions.filter(
        (subscription) =>
          subscription.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          subscription.name?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    )

    setFilteredVendors(
      vendors.filter(
        (vendor) =>
          vendor.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vendor.phone?.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    )
  }, [subscriptions, vendors, searchTerm])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setSubscriptionForm({
      ...subscriptionForm,
      [name]: value,
    })
  }

  const handleVendorSubChange = (e) => {
    const { name, value } = e.target
    setVendorSubForm({
      ...vendorSubForm,
      [name]: value,
    })
  }

  const handleSelectChange = (name, value) => {
    setSubscriptionForm({
      ...subscriptionForm,
      [name]: value,
    })
  }

  const handleVendorSubSelectChange = (name, value) => {
    setVendorSubForm({
      ...vendorSubForm,
      [name]: value,
    })
  }

  const resetSubscriptionForm = () => {
    setSubscriptionForm({
      name: "",
      duration: "",
      price: "",
      features: "",
      status: "Active",
    })
  }

  const resetVendorSubForm = () => {
    setVendorSubForm({
      subscription: "",
      startDate: "",
      endDate: "",
      status: "Active",
    })
  }

  const handleAddSubscription = () => {
    // Validate form
    if (!subscriptionForm.name || !subscriptionForm.duration || !subscriptionForm.price) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Add subscription
    const newSubscription = addSubscription(subscriptionForm)

    // Show success message
    toast({
      title: "Subscription Added",
      description: `${newSubscription.name} has been added successfully.`,
    })

    // Close dialog and reset form
    setIsAddSubscriptionOpen(false)
    resetSubscriptionForm()
  }

  const handleEditSubscriptionClick = (subscription) => {
    setCurrentSubscription(subscription)
    setSubscriptionForm({
      name: subscription.name,
      duration: subscription.duration,
      price: subscription.price,
      features: subscription.features,
      status: subscription.status,
    })
    setIsEditSubscriptionOpen(true)
  }

  const handleUpdateSubscription = () => {
    // Validate form
    if (!subscriptionForm.name || !subscriptionForm.duration || !subscriptionForm.price) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Update subscription
    updateSubscription(currentSubscription.id, subscriptionForm)

    // Show success message
    toast({
      title: "Subscription Updated",
      description: `${subscriptionForm.name} has been updated successfully.`,
    })

    // Close dialog and reset
    setIsEditSubscriptionOpen(false)
    setCurrentSubscription(null)
    resetSubscriptionForm()
  }

  const handleDeleteSubscriptionClick = (subscription) => {
    setCurrentSubscription(subscription)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteSubscription = () => {
    // Delete subscription
    deleteSubscription(currentSubscription.id)

    // Show success message
    toast({
      title: "Subscription Deleted",
      description: `${currentSubscription.name} has been deleted successfully.`,
    })

    // Close dialog and reset
    setIsDeleteDialogOpen(false)
    setCurrentSubscription(null)
  }

  const handleEditVendorSubClick = (vendor) => {
    setCurrentVendor(vendor)
    setVendorSubForm({
      subscription: vendor.subscription,
      startDate: vendor.startDate,
      endDate: vendor.endDate,
      status: vendor.status,
    })
    setIsEditVendorSubOpen(true)
  }

  const handleUpdateVendorSub = () => {
    // Validate form
    if (!vendorSubForm.subscription || !vendorSubForm.startDate || !vendorSubForm.endDate) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    // Update vendor subscription
    updateVendor(currentVendor.id, vendorSubForm)

    // Show success message
    toast({
      title: "Subscription Updated",
      description: `${currentVendor.name}'s subscription has been updated successfully.`,
    })

    // Close dialog and reset
    setIsEditVendorSubOpen(false)
    setCurrentVendor(null)
    resetVendorSubForm()
  }

  const handleExport = () => {
    if (activeTab === "plans") {
      exportToCSV(subscriptions, "subscription_plans")
      toast({
        title: "Export Successful",
        description: "Subscription plans data has been exported to CSV.",
      })
    } else {
      exportToCSV(vendors, "vendor_subscriptions")
      toast({
        title: "Export Successful",
        description: "Vendor subscriptions data has been exported to CSV.",
      })
    }
  }

  const handleImportClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      if (activeTab === "plans") {
        importFromCSV(file, "subscriptions", (data) => {
          toast({
            title: "Import Successful",
            description: `${data.length} subscription plans have been imported.`,
          })
        })
      } else {
        importFromCSV(file, "vendors", (data) => {
          toast({
            title: "Import Successful",
            description: `${data.length} vendor subscriptions have been imported.`,
          })
        })
      }
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Subscription Management</h1>
        <p className="text-muted-foreground">Manage subscription plans and vendor subscriptions.</p>
      </div>

      <Tabs defaultValue="plans" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="plans">Subscription Plans</TabsTrigger>
          <TabsTrigger value="vendors">Vendor Subscriptions</TabsTrigger>
        </TabsList>

        <TabsContent value="plans">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Subscription Plans</CardTitle>
                <CardDescription>Manage available subscription plans for vendors.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv" className="hidden" />
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleImportClick}>
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                <Dialog open={isAddSubscriptionOpen} onOpenChange={setIsAddSubscriptionOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                      <Plus className="h-4 w-4" />
                      <span>Add Plan</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Subscription Plan</DialogTitle>
                      <DialogDescription>Create a new subscription plan for vendors.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Plan Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={subscriptionForm.name}
                          onChange={handleInputChange}
                          placeholder="Enter plan name"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="duration">Duration</Label>
                          <Input
                            id="duration"
                            name="duration"
                            value={subscriptionForm.duration}
                            onChange={handleInputChange}
                            placeholder="e.g., 1 Month"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="price">Price</Label>
                          <Input
                            id="price"
                            name="price"
                            value={subscriptionForm.price}
                            onChange={handleInputChange}
                            placeholder="e.g., ₹999"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="features">Features</Label>
                        <Input
                          id="features"
                          name="features"
                          value={subscriptionForm.features}
                          onChange={handleInputChange}
                          placeholder="e.g., 10 Leads, Basic Support"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={subscriptionForm.status}
                          onValueChange={(value) => handleSelectChange("status", value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Inactive">Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddSubscriptionOpen(false)
                          resetSubscriptionForm()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddSubscription}>Create Plan</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search subscription plans..."
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
                          <th className="text-left font-medium p-2">ID</th>
                          <th className="text-left font-medium p-2">Name</th>
                          <th className="text-left font-medium p-2">Duration</th>
                          <th className="text-left font-medium p-2">Price</th>
                          <th className="text-left font-medium p-2">Features</th>
                          <th className="text-left font-medium p-2">Status</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredSubscriptions.length > 0 ? (
                          filteredSubscriptions.map((subscription) => (
                            <tr key={subscription.id} className="border-b">
                              <td className="p-2">{subscription.id}</td>
                              <td className="p-2">{subscription.name}</td>
                              <td className="p-2">{subscription.duration}</td>
                              <td className="p-2">{subscription.price}</td>
                              <td className="p-2">{subscription.features}</td>
                              <td className="p-2">
                                <Badge
                                  variant={subscription.status === "Active" ? "default" : "secondary"}
                                  className={
                                    subscription.status === "Active"
                                      ? "bg-green-500 hover:bg-green-500/80"
                                      : "bg-red-500 hover:bg-red-500/80"
                                  }
                                >
                                  {subscription.status}
                                </Badge>
                              </td>
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
                                      onClick={() => handleEditSubscriptionClick(subscription)}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-red-500"
                                      onClick={() => handleDeleteSubscriptionClick(subscription)}
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
                            <td colSpan={7} className="p-4 text-center text-muted-foreground">
                              No subscription plans found. Try a different search term or add a new plan.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="vendors">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Vendor Subscriptions</CardTitle>
                <CardDescription>View and manage vendor subscription statuses.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleImportClick}>
                  <Upload className="h-4 w-4" />
                  <span>Import</span>
                </Button>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search by vendor ID, name, or phone..."
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
                          <th className="text-left font-medium p-2">Vendor ID</th>
                          <th className="text-left font-medium p-2">Name</th>
                          <th className="text-left font-medium p-2">Phone</th>
                          <th className="text-left font-medium p-2">Subscription</th>
                          <th className="text-left font-medium p-2">Start Date</th>
                          <th className="text-left font-medium p-2">End Date</th>
                          <th className="text-left font-medium p-2">Status</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredVendors.length > 0 ? (
                          filteredVendors.map((vendor) => (
                            <tr key={vendor.id} className="border-b">
                              <td className="p-2">{vendor.id}</td>
                              <td className="p-2">{vendor.name}</td>
                              <td className="p-2">{vendor.phone}</td>
                              <td className="p-2">{vendor.subscription}</td>
                              <td className="p-2">{vendor.startDate}</td>
                              <td className="p-2">{vendor.endDate}</td>
                              <td className="p-2">
                                <Badge
                                  variant={vendor.status === "Active" ? "default" : "secondary"}
                                  className={
                                    vendor.status === "Active"
                                      ? "bg-green-500 hover:bg-green-500/80"
                                      : "bg-red-500 hover:bg-red-500/80"
                                  }
                                >
                                  {vendor.status}
                                </Badge>
                              </td>
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
                                      onClick={() => handleEditVendorSubClick(vendor)}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit Subscription</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={8} className="p-4 text-center text-muted-foreground">
                              No vendors found. Try a different search term.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Subscription Dialog */}
      <Dialog open={isEditSubscriptionOpen} onOpenChange={setIsEditSubscriptionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Subscription Plan</DialogTitle>
            <DialogDescription>Update subscription plan details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Plan Name</Label>
              <Input
                id="edit-name"
                name="name"
                value={subscriptionForm.name}
                onChange={handleInputChange}
                placeholder="Enter plan name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-duration">Duration</Label>
                <Input
                  id="edit-duration"
                  name="duration"
                  value={subscriptionForm.duration}
                  onChange={handleInputChange}
                  placeholder="e.g., 1 Month"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-price">Price</Label>
                <Input
                  id="edit-price"
                  name="price"
                  value={subscriptionForm.price}
                  onChange={handleInputChange}
                  placeholder="e.g., ₹999"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-features">Features</Label>
              <Input
                id="edit-features"
                name="features"
                value={subscriptionForm.features}
                onChange={handleInputChange}
                placeholder="e.g., 10 Leads, Basic Support"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={subscriptionForm.status} onValueChange={(value) => handleSelectChange("status", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditSubscriptionOpen(false)
                resetSubscriptionForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateSubscription}>Update Plan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {currentSubscription?.name} subscription plan. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSubscription} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Vendor Subscription Dialog */}
      <Dialog open={isEditVendorSubOpen} onOpenChange={setIsEditVendorSubOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Vendor Subscription</DialogTitle>
            <DialogDescription>Update subscription details for {currentVendor?.name}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="vendor-subscription">Subscription Plan</Label>
              <Select
                value={vendorSubForm.subscription}
                onValueChange={(value) => handleVendorSubSelectChange("subscription", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select subscription plan" />
                </SelectTrigger>
                <SelectContent>
                  {subscriptions
                    .filter((sub) => sub.status === "Active")
                    .map((sub) => (
                      <SelectItem key={sub.id} value={sub.name}>
                        {sub.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="vendor-startDate">Start Date</Label>
                <Input
                  id="vendor-startDate"
                  name="startDate"
                  type="date"
                  value={vendorSubForm.startDate}
                  onChange={handleVendorSubChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="vendor-endDate">End Date</Label>
                <Input
                  id="vendor-endDate"
                  name="endDate"
                  type="date"
                  value={vendorSubForm.endDate}
                  onChange={handleVendorSubChange}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="vendor-status">Status</Label>
              <Select
                value={vendorSubForm.status}
                onValueChange={(value) => handleVendorSubSelectChange("status", value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditVendorSubOpen(false)
                resetVendorSubForm()
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateVendorSub}>Update Subscription</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Toaster />
    </div>
  )
}
