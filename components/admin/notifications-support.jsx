"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Trash2, MoreHorizontal, CheckCircle } from "lucide-react"
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
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { createNotification, deleteNotification, fetchNotifications, markAsRead } from "@/lib/services/notificationService"
import { useSession } from "next-auth/react"
import { SupportTickets } from "./notification/support-tickets"
import { formatToCustomDateTime } from "@/lib/dateFormateUtils"

export function NotificationsSupport() {
  const [activeTab, setActiveTab] = useState("notifications")
  const [searchTerm, setSearchTerm] = useState("")
  const [notifications, setNotifications] = useState([])
  const [filteredNotifications, setFilteredNotifications] = useState([])
  const [currentNotification, setCurrentNotification] = useState(null)
  const [isDeleteNotificationOpen, setIsDeleteNotificationOpen] = useState(false)
  const [isCreateNotificationOpen, setIsCreateNotificationOpen] = useState(false)
  const [noficationLoading, setNotificationLoading] = useState(false);

  // Form states
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "Info",
    target: "All Users",
  })

  const { data: session } = useSession()
  const userId = session?.user?.id;

  const titlemap = {
    "All Users": "user",
    "Vendors": "vendor",
    "Customers": "customer",
    "Support Team": "support_team",
    "Admin": "admin",
    "Helpline":"helpline",
    "Telecaller":"telecaller",
  }

  // Notifications pagination state
  const [notificationPage, setNotificationPage] = useState(1)
  const [notificationLimit, setNotificationLimit] = useState(10)

  // Support tickets pagination state
  const [supportPage, setSupportPage] = useState(1)
  const [supportLimit, setSupportLimit] = useState(10)

  useEffect(() => {
      setNotificationLoading(true);
      const fetchNotis = async () => {
        const notis = await fetchNotifications()
        setNotifications(notis)
      }
      fetchNotis()
      setNotificationLoading(false);
  }, [])

  // Filter notifications based on search term
  useEffect(() => {
    setFilteredNotifications(
      notifications.filter(
        (notification) =>
          notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          notification.message.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    )
  }, [notifications, searchTerm])

  // Paginate notifications
  const notificationStartIdx = (notificationPage - 1) * notificationLimit
  const paginatedNotifications = filteredNotifications.slice(
    notificationStartIdx,
    notificationStartIdx + notificationLimit
  )
  const notificationTotalPages = Math.ceil(filteredNotifications.length / notificationLimit)

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

  const resetNotificationForm = () => {
    setNotificationForm({
      title: "",
      message: "",
      type: "Info",
      target: "All Users",
    })
  }

  const handleCreateNotification = async () => {
    // Validate form
    if (!notificationForm.title || !notificationForm.message) {
      toast.error("Please fill in all required fields.")
      return
    }

    // Create new notification
    const newNotification = {
      id: `N-${String(notifications.length + 1).padStart(3, "0")}`,
      title: notificationForm.title,
      message: notificationForm.message,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      type: notificationForm.type,
      read: false,
      target: notificationForm.target,
    }
    

    const res = await createNotification({
      title: notificationForm.title,
      message: notificationForm.message,
      type: notificationForm.type,
      target: titlemap[notificationForm.target],
      isBulkNotification: false,
      createdBy: userId,
      date: new Date().toISOString().split("T")[0],
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    })
    console.log("res", res)

    newNotification._id = res._id;
    newNotification.read = true;

    setNotifications([newNotification, ...notifications])

    // Show success message
    toast.success(`Notification has been created and sent to ${notificationForm.target}.`)

    // Close dialog and reset form
    setIsCreateNotificationOpen(false)
    resetNotificationForm()
  }

  const handleDeleteNotification = async () => {
    // Delete notification
    setNotifications(notifications.filter((notification) => notification._id !== currentNotification._id))
    const res = await deleteNotification(currentNotification._id)
    console.log("res", res)

    // Show success message
    toast.success("Notification has been deleted successfully.")

    // Close dialog and reset
    setIsDeleteNotificationOpen(false)
    setCurrentNotification(null)
  }

  const handleMarkAsRead = async (notification) => {
    // Mark notification as read
    const res = await markAsRead(notification._id)
    console.log("res", res)
    setNotifications(notifications.map((n) => (n._id === notification._id ? { ...n, read: true } : n)))

    // Show success message
    toast.success("Notification has been marked as read.")
  }

  const handleMarkAllAsRead = () => {
    // Mark all notifications as read
    setNotifications(notifications.map((n) => ({ ...n, read: true })))

    // Show success message
    toast.success("All notifications have been marked as read.")
  }

  const getNotificationTypeColor = (type) => {
    switch (type) {
      case "Info":
        return "bg-blue-500 hover:bg-blue-500/80"
      case "Success":
        return "bg-green-500 hover:bg-green-500/80"
      case "Warning":
        return "bg-yellow-500 hover:bg-yellow-500/80"
      case "Alert":
        return "bg-red-500 hover:bg-red-500/80"
      default:
        return "bg-gray-500 hover:bg-gray-500/80"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Notifications & Support</h1>
        <p className="text-muted-foreground">Manage notifications and support requests.</p>
      </div>

      <Tabs defaultValue="notifications" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="support">Support Tickets</TabsTrigger>
        </TabsList>

        <TabsContent value="notifications">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage system notifications and alerts.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8" onClick={handleMarkAllAsRead}>
                  Mark All as Read
                </Button>
                <Dialog open={isCreateNotificationOpen} onOpenChange={setIsCreateNotificationOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="h-8 gap-1">
                      <Plus className="h-4 w-4" />
                      <span>Create Notification</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create Notification</DialogTitle>
                      <DialogDescription>Create a new notification to send to users.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input
                          id="title"
                          name="title"
                          value={notificationForm.title}
                          onChange={(e) => handleInputChange(e, setNotificationForm, notificationForm)}
                          placeholder="Enter notification title"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="message">Message</Label>
                        <Textarea
                          id="message"
                          name="message"
                          value={notificationForm.message}
                          onChange={(e) => handleInputChange(e, setNotificationForm, notificationForm)}
                          placeholder="Enter notification message"
                          rows={4}
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">

                        <div className="space-y-2">
                          <Label htmlFor="type">Type</Label>
                          <Select
                            value={notificationForm.type}
                            onValueChange={(value) =>
                              handleSelectChange("type", value, setNotificationForm, notificationForm)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Info">Info</SelectItem>
                              <SelectItem value="Success">Success</SelectItem>
                              <SelectItem value="Warning">Warning</SelectItem>
                              <SelectItem value="Alert">Alert</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="target">Target</Label>
                          <Select
                            value={notificationForm.target}
                            onValueChange={(value) =>
                              handleSelectChange("target", value, setNotificationForm, notificationForm)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="All Users">All Users</SelectItem>
                              <SelectItem value="Vendors">Vendors</SelectItem>
                              <SelectItem value="Customers">Customers</SelectItem>
                              <SelectItem value="Support Team">Support Team</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsCreateNotificationOpen(false)
                          resetNotificationForm()
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleCreateNotification}>Send Notification</Button>
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
                      placeholder="Search notifications..."
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
                          <th className="text-left font-medium p-2">Title</th>
                          <th className="text-left font-medium p-2">Message</th>
                          <th className="text-left font-medium p-2">Date & Time</th>
                          <th className="text-left font-medium p-2">Type</th>
                          <th className="text-left font-medium p-2">Target</th>
                          <th className="text-left font-medium p-2">Status</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        { paginatedNotifications.length > 0 ? (
                          paginatedNotifications.map((notification) => (
                            <tr key={notification._id} className="border-b">
                              <td className="p-2">{notification._id.slice(0, 8)}...</td>
                              <td className="p-2">{notification.title}</td>
                              <td className="p-2 max-w-[200px] truncate">{notification.message}</td>
                              <td className="p-2">{formatToCustomDateTime(notification.date, notification.time)}</td>
                              <td className="p-2">
                                <Badge variant="default" className={getNotificationTypeColor(notification.type)}>
                                  {notification.type}
                                </Badge>
                              </td>
                              <td className="p-2">{notification.target}</td>
                              <td className="p-2">
                                <Badge variant="outline" className={notification.read ? "bg-gray-200" : "bg-blue-200"}>
                                  {notification.read ? "Read" : "Unread"}
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
                                    {!notification.read && (
                                      <DropdownMenuItem
                                        className="flex items-center gap-2"
                                        onClick={() => handleMarkAsRead(notification)}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                        <span>Mark as Read</span>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem
                                      className="flex items-center gap-2 text-red-500"
                                      onClick={() => {
                                        setCurrentNotification(notification)
                                        setIsDeleteNotificationOpen(true)
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
                            <td colSpan={8} className="p-4 text-center text-muted-foreground">
                              No notifications found. Try a different search term.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Pagination controls below the table */}
                  <div className="flex items-center justify-between px-2 py-6">
                    <div>
                      <label>Rows per page: </label>
                      <select
                        value={notificationLimit}
                        onChange={e => {
                          setNotificationLimit(Number(e.target.value))
                          setNotificationPage(1)
                        }}
                        className="border rounded px-2 py-1"
                      >
                        <option value={10}>10</option>
                        <option value={20}>20</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        disabled={notificationPage === 1}
                        onClick={() => setNotificationPage(notificationPage - 1)}
                        className="px-2 py-1 border rounded disabled:opacity-50"
                      >Previous</button>
                      <span>
                        Page {notificationPage} of {notificationTotalPages || 1}
                      </span>
                      <button
                        disabled={notificationPage === notificationTotalPages || notificationTotalPages === 0}
                        onClick={() => setNotificationPage(notificationPage + 1)}
                        className="px-2 py-1 border rounded  disabled:opacity-50"
                      >Next</button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="support">
          <SupportTickets
            page={supportPage}
            limit={supportLimit}
            onPageChange={setSupportPage}
            onLimitChange={setSupportLimit}
          />
        </TabsContent>
      </Tabs>

      {/* Delete Notification Confirmation Dialog */}
      <AlertDialog open={isDeleteNotificationOpen} onOpenChange={setIsDeleteNotificationOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this notification. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDeleteNotificationOpen(false)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNotification} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}