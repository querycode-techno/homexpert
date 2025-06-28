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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { toast } from "sonner"
import { serviceUtils } from "@/lib/utils"


export function BookingManagement() {
  const { bookings, vendors, addBooking, updateBooking, deleteBooking, exportToCSV, importFromCSV } = useData()


  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isAddBookingOpen, setIsAddBookingOpen] = useState(false)
  const [isEditBookingOpen, setIsEditBookingOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [currentBooking, setCurrentBooking] = useState(null)
  const [filteredBookings, setFilteredBookings] = useState([])

  // Form states
  const [formData, setFormData] = useState({
    customer: "",
    phone: "",
    service: "",
    location: "",
    date: new Date().toISOString().split("T")[0],
    time: "10:00",
    status: "Pending",
    vendor: "Unassigned",
    details: "",
  })

  // File input ref
  const fileInputRef = useRef(null)

  // Update filtered bookings when bookings, search term, or active tab changes
  useEffect(() => {
    let filtered = bookings.filter(
      (booking) =>
        booking.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.customer?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.service?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        booking.location?.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Filter by status if not on "all" tab
    if (activeTab !== "all") {
      const statusMap = {
        pending: "Pending",
        confirmed: "Confirmed",
        "in-progress": "In Progress",
        completed: "Completed",
        cancelled: "Cancelled",
      }
      filtered = filtered.filter((booking) => booking.status === statusMap[activeTab])
    }

    setFilteredBookings(filtered)
  }, [bookings, searchTerm, activeTab])

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value,
    })
  }

  const resetForm = () => {
    setFormData({
      customer: "",
      phone: "",
      service: "",
      location: "",
      date: new Date().toISOString().split("T")[0],
      time: "10:00",
      status: "Pending",
      vendor: "Unassigned",
      details: "",
    })
  }

  const handleAddBooking = () => {
    // Validate form
    if (
      !formData.customer ||
      !formData.phone ||
      !formData.service ||
      !formData.location ||
      !formData.date ||
      !formData.time
    ) {
      
      toast.error("Please fill in all required fields.")
      return
    }

    // Add booking
    const newBooking = addBooking(formData)

    // Show success message
    toast.success(`Booking for ${newBooking.customer} has been added successfully.`)

    // Close dialog and reset form
    setIsAddBookingOpen(false)
    resetForm()
  }

  const handleEditClick = (booking) => {
    setCurrentBooking(booking)
    setFormData({
      customer: booking.customer,
      phone: booking.phone,
      service: booking.service,
      location: booking.location,
      date: booking.date,
      time: booking.time,
      status: booking.status,
      vendor: booking.vendor,
      details: booking.details || "",
    })
    setIsEditBookingOpen(true)
  }

  const handleUpdateBooking = () => {
    // Validate form
    if (
      !formData.customer ||
      !formData.phone ||
      !formData.service ||
      !formData.location ||
      !formData.date ||
      !formData.time
    ) {
      toast.error("Please fill in all required fields.")
      return
    }

    // Update booking
    updateBooking(currentBooking.id, formData)

    // Show success message
    
    toast.success(`Booking for ${formData.customer} has been updated successfully.`)

    // Close dialog and reset
    setIsEditBookingOpen(false)
    setCurrentBooking(null)
    resetForm()
  }

  const handleDeleteClick = (booking) => {
    setCurrentBooking(booking)
    setIsDeleteDialogOpen(true)
  }

  const handleDeleteBooking = () => {
    // Delete booking
    deleteBooking(currentBooking.id)

    // Show success message
    toast.success(`Booking for ${currentBooking.customer} has been deleted successfully.`)

    // Close dialog and reset
    setIsDeleteDialogOpen(false)
    setCurrentBooking(null)
  }

  const handleExport = () => {
    exportToCSV(filteredBookings, "bookings")
    toast.success("Bookings data has been exported to CSV.")
  }

  const handleImportClick = () => {
    fileInputRef.current.click()
  }

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (file) {
      importFromCSV(file, "bookings", (data) => {
        toast.success(`${data.length} bookings have been imported.`)
      })
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "bg-yellow-500 hover:bg-yellow-500/80"
      case "Confirmed":
        return "bg-blue-500 hover:bg-blue-500/80"
      case "In Progress":
        return "bg-purple-500 hover:bg-purple-500/80"
      case "Completed":
        return "bg-green-500 hover:bg-green-500/80"
      case "Cancelled":
        return "bg-red-500 hover:bg-red-500/80"
      default:
        return "bg-gray-500 hover:bg-gray-500/80"
    }
  }
//   console.log("All services:", serviceUtils.getAllServices())
// console.log("Service utils:", serviceUtils)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Booking Management</h1>
        <p className="text-muted-foreground">Create, track, and manage service bookings.</p>
      </div>

      <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Bookings</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="in-progress">In Progress</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>

        <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>
              {activeTab === "all" ? "All Bookings" : 
               activeTab === "pending" ? "Pending Bookings" :
               activeTab === "confirmed" ? "Confirmed Bookings" :
               activeTab === "in-progress" ? "In Progress Bookings" :
               activeTab === "completed" ? "Completed Bookings" :
               "Cancelled Bookings"}
            </CardTitle>
            <CardDescription>
              {activeTab === "all" ? "View and manage all service bookings." :
               `View and manage ${activeTab} service bookings.`}
            </CardDescription>
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
            <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                  <Plus className="h-4 w-4" />
                  <span>Add Booking</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Booking</DialogTitle>
                  <DialogDescription>Create a new service booking for a customer.</DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="customer">Customer Name</Label>
                      <Input
                        id="customer"
                        name="customer"
                        value={formData.customer}
                        onChange={handleInputChange}
                        placeholder="Enter customer name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Phone Number</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="Enter phone number"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="service">Service</Label>
                      <Select
                        value={formData.service}
                        onValueChange={(value) => handleSelectChange("service", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceUtils.getAllServices().map((service, index) => (
                            
                            <SelectItem key={index} value={service} >{service}</SelectItem>
                            
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location</Label>
                      <Input
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        placeholder="Enter location"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="time">Time</Label>
                      <Input id="time" name="time" type="time" value={formData.time} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => handleSelectChange("status", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Confirmed">Confirmed</SelectItem>
                          <SelectItem value="In Progress">In Progress</SelectItem>
                          <SelectItem value="Completed">Completed</SelectItem>
                          <SelectItem value="Cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="vendor">Assign to Vendor</Label>
                      <Select
                        value={formData.vendor}
                        onValueChange={(value) => handleSelectChange("vendor", value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select vendor" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Unassigned">Unassigned</SelectItem>
                          {vendors.map((vendor) => (
                            <SelectItem key={vendor.id} value={vendor.name}>
                              {vendor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="details">Details</Label>
                    <Textarea
                      id="details"
                      name="details"
                      value={formData.details}
                      onChange={handleInputChange}
                      placeholder="Enter booking details"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsAddBookingOpen(false)
                      resetForm()
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddBooking}>Create Booking</Button>
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
                  placeholder={`Search ${activeTab === "all" ? "" : activeTab} bookings...`}
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
                      <th className="text-left font-medium p-2">Customer</th>
                      <th className="text-left font-medium p-2">Service</th>
                      <th className="text-left font-medium p-2">Location</th>
                      <th className="text-left font-medium p-2">Date & Time</th>
                      <th className="text-left font-medium p-2">Status</th>
                      <th className="text-left font-medium p-2">Vendor</th>
                      <th className="text-right font-medium p-2">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.length > 0 ? (
                      filteredBookings.map((booking) => (
                        <tr key={booking.id} className="border-b">
                          <td className="p-2">{booking.id}</td>
                          <td className="p-2">{booking.customer}</td>
                          <td className="p-2">{booking.service}</td>
                          <td className="p-2">{booking.location}</td>
                          <td className="p-2">{`${booking.date}, ${booking.time}`}</td>
                          <td className="p-2">
                            <Badge variant="default" className={getStatusColor(booking.status)}>
                              {booking.status}
                            </Badge>
                          </td>
                          <td className="p-2">{booking.vendor}</td>
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
                                  onClick={() => handleEditClick(booking)}
                                >
                                  <Edit className="h-4 w-4" />
                                  <span>Edit</span>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="flex items-center gap-2 text-red-500"
                                  onClick={() => handleDeleteClick(booking)}
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
                        <td colSpan={8} className="p-4 text-center text-muted-foreground">
                          {activeTab === "all" 
                            ? "No bookings found. Try a different search term or add a new booking."
                            : `No ${activeTab} bookings found.`
                          }
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

        {/* <TabsContent value="all">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Bookings</CardTitle>
                <CardDescription>View and manage all service bookings.</CardDescription>
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
                <Dialog open={isAddBookingOpen} onOpenChange={setIsAddBookingOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                      <Plus className="h-4 w-4" />
                      <span>Add Booking</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add New Booking</DialogTitle>
                      <DialogDescription>Create a new service booking for a customer.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="customer">Customer Name</Label>
                          <Input
                            id="customer"
                            name="customer"
                            value={formData.customer}
                            onChange={handleInputChange}
                            placeholder="Enter customer name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Enter phone number"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="service">Service</Label>
                          <Select
                            value={formData.service}
                            onValueChange={(value) => handleSelectChange("service", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select service" />
                            </SelectTrigger>
                            <SelectContent>
                              {serviceUtils.getAllServices().map((service) => (
                                <SelectItem key={service} value={service}>{service}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="location">Location</Label>
                          <Input
                            id="location"
                            name="location"
                            value={formData.location}
                            onChange={handleInputChange}
                            placeholder="Enter location"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="date">Date</Label>
                          <Input id="date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="time">Time</Label>
                          <Input id="time" name="time" type="time" value={formData.time} onChange={handleInputChange} />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="status">Status</Label>
                          <Select
                            value={formData.status}
                            onValueChange={(value) => handleSelectChange("status", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Confirmed">Confirmed</SelectItem>
                              <SelectItem value="In Progress">In Progress</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="vendor">Assign to Vendor</Label>
                          <Select
                            value={formData.vendor}
                            onValueChange={(value) => handleSelectChange("vendor", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select vendor" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Unassigned">Unassigned</SelectItem>
                              {vendors.map((vendor) => (
                                <SelectItem key={vendor.id} value={vendor.name}>
                                  {vendor.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="details">Details</Label>
                        <Textarea
                          id="details"
                          name="details"
                          value={formData.details}
                          onChange={handleInputChange}
                          placeholder="Enter booking details"
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsAddBookingOpen(false)
                          resetForm()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleAddBooking}>Create Booking</Button>
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
                      placeholder="Search bookings..."
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
                          <th className="text-left font-medium p-2">Customer</th>
                          <th className="text-left font-medium p-2">Service</th>
                          <th className="text-left font-medium p-2">Location</th>
                          <th className="text-left font-medium p-2">Date & Time</th>
                          <th className="text-left font-medium p-2">Status</th>
                          <th className="text-left font-medium p-2">Vendor</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <tr key={booking.id} className="border-b">
                              <td className="p-2">{booking.id}</td>
                              <td className="p-2">{booking.customer}</td>
                              <td className="p-2">{booking.service}</td>
                              <td className="p-2">{booking.location}</td>
                              <td className="p-2">{`${booking.date}, ${booking.time}`}</td>
                              <td className="p-2">
                                <Badge variant="default" className={getStatusColor(booking.status)}>
                                  {booking.status}
                                </Badge>
                              </td>
                              <td className="p-2">{booking.vendor}</td>
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
                                      onClick={() => handleEditClick(booking)}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-red-500"
                                      onClick={() => handleDeleteClick(booking)}
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
                            <td colSpan={8} className="p-4 text-center text-muted-foreground">
                              No bookings found. Try a different search term or add a new booking.
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
        </TabsContent> */}

        {/* Other tab contents with the same structure but filtered by status */}
        {/* <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Bookings</CardTitle>
              <CardDescription>View and manage pending service bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search pending bookings..."
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
                          <th className="text-left font-medium p-2">Customer</th>
                          <th className="text-left font-medium p-2">Service</th>
                          <th className="text-left font-medium p-2">Location</th>
                          <th className="text-left font-medium p-2">Date & Time</th>
                          <th className="text-left font-medium p-2">Vendor</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <tr key={booking.id} className="border-b">
                              <td className="p-2">{booking.id}</td>
                              <td className="p-2">{booking.customer}</td>
                              <td className="p-2">{booking.service}</td>
                              <td className="p-2">{booking.location}</td>
                              <td className="p-2">{`${booking.date}, ${booking.time}`}</td>
                              <td className="p-2">{booking.vendor}</td>
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
                                      onClick={() => handleEditClick(booking)}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-red-500"
                                      onClick={() => handleDeleteClick(booking)}
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
                              No pending bookings found.
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
        </TabsContent> */}

        {/* Similar structure for other tabs */}
        {/* <TabsContent value="confirmed">
          <Card>
            <CardHeader>
              <CardTitle>Confirmed Bookings</CardTitle>
              <CardDescription>View and manage confirmed service bookings.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search confirmed bookings..."
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
                          <th className="text-left font-medium p-2">Customer</th>
                          <th className="text-left font-medium p-2">Service</th>
                          <th className="text-left font-medium p-2">Location</th>
                          <th className="text-left font-medium p-2">Date & Time</th>
                          <th className="text-left font-medium p-2">Vendor</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredBookings.length > 0 ? (
                          filteredBookings.map((booking) => (
                            <tr key={booking.id} className="border-b">
                              <td className="p-2">{booking.id}</td>
                              <td className="p-2">{booking.customer}</td>
                              <td className="p-2">{booking.service}</td>
                              <td className="p-2">{booking.location}</td>
                              <td className="p-2">{`${booking.date}, ${booking.time}`}</td>
                              <td className="p-2">{booking.vendor}</td>
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
                                      onClick={() => handleEditClick(booking)}
                                    >
                                      <Edit className="h-4 w-4" />
                                      <span>Edit</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-red-500"
                                      onClick={() => handleDeleteClick(booking)}
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
                              No confirmed bookings found.
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
        </TabsContent>  */}

        {/* Edit Booking Dialog */}
        <Dialog open={isEditBookingOpen} onOpenChange={setIsEditBookingOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Booking</DialogTitle>
              <DialogDescription>Update booking information.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-customer">Customer Name</Label>
                  <Input
                    id="edit-customer"
                    name="customer"
                    value={formData.customer}
                    onChange={handleInputChange}
                    placeholder="Enter customer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-phone">Phone Number</Label>
                  <Input
                    id="edit-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-service">Service</Label>
                  <Select value={formData.service} onValueChange={(value) => handleSelectChange("service", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select service" />
                    </SelectTrigger>
                    <SelectContent>
                      {serviceUtils.getAllServices().map((service) => (
                        <SelectItem key={service.id} value={service}>{service}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-location">Location</Label>
                  <Input
                    id="edit-location"
                    name="location"
                    value={formData.location}
                    onChange={handleInputChange}
                    placeholder="Enter location"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-date">Date</Label>
                  <Input id="edit-date" name="date" type="date" value={formData.date} onChange={handleInputChange} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-time">Time</Label>
                  <Input id="edit-time" name="time" type="time" value={formData.time} onChange={handleInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleSelectChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Confirmed">Confirmed</SelectItem>
                      <SelectItem value="In Progress">In Progress</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-vendor">Assign to Vendor</Label>
                  <Select value={formData.vendor} onValueChange={(value) => handleSelectChange("vendor", value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Unassigned">Unassigned</SelectItem>
                      {vendors.map((vendor) => (
                        <SelectItem key={vendor.id} value={vendor.name}>
                          {vendor.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-details">Details</Label>
                <Textarea
                  id="edit-details"
                  name="details"
                  value={formData.details}
                  onChange={handleInputChange}
                  placeholder="Enter booking details"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditBookingOpen(false)
                  resetForm()
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleUpdateBooking}>Update Booking</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will permanently delete the booking for {currentBooking?.customer}. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteBooking} className="bg-red-500 hover:bg-red-600">
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Tabs>


    </div>
  )
}
