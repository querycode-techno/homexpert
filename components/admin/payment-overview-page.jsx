"use client"

import { useState, useEffect } from "react"
import { useData } from "@/lib/data-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Download, Filter, MoreHorizontal, ArrowUpRight, CreditCard, Calendar, Wallet } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts"

export function PaymentOverviewPage() {
  const { bookings, vendors, exportToCSV } = useData()

  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [dateRange, setDateRange] = useState("month")
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [filterOptions, setFilterOptions] = useState({
    startDate: "",
    endDate: "",
    minAmount: "",
    maxAmount: "",
    paymentStatus: "all",
    paymentMethod: "all",
  })
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [statistics, setStatistics] = useState({
    totalRevenue: 0,
    pendingAmount: 0,
    completedPayments: 0,
    failedPayments: 0,
  })

  // Generate mock transaction data based on bookings
  useEffect(() => {
    const mockTransactions = bookings.map((booking) => {
      const amount = Math.floor(Math.random() * 5000) + 500
      const commission = Math.floor(amount * 0.15)
      const vendorPayout = amount - commission

      return {
        id: `TXN-${booking.id.split("-")[1]}`,
        bookingId: booking.id,
        customer: booking.customer,
        vendor: booking.vendor,
        date: booking.date,
        amount: `₹${amount}`,
        amountValue: amount,
        commission: `₹${commission}`,
        commissionValue: commission,
        vendorPayout: `₹${vendorPayout}`,
        vendorPayoutValue: vendorPayout,
        paymentMethod: ["UPI", "Credit Card", "Debit Card", "Net Banking"][Math.floor(Math.random() * 4)],
        paymentStatus: ["Completed", "Pending", "Failed"][
          booking.status === "Completed" ? 0 : booking.status === "Cancelled" ? 2 : 1
        ],
      }
    })

    setTransactions(mockTransactions)

    // Calculate statistics
    const totalRevenue = mockTransactions.reduce((sum, txn) => sum + txn.amountValue, 0)
    const pendingAmount = mockTransactions
      .filter((txn) => txn.paymentStatus === "Pending")
      .reduce((sum, txn) => sum + txn.amountValue, 0)
    const completedPayments = mockTransactions.filter((txn) => txn.paymentStatus === "Completed").length
    const failedPayments = mockTransactions.filter((txn) => txn.paymentStatus === "Failed").length

    setStatistics({
      totalRevenue,
      pendingAmount,
      completedPayments,
      failedPayments,
    })
  }, [bookings])

  // Filter transactions based on search term and active tab
  useEffect(() => {
    let filtered = transactions.filter(
      (txn) =>
        txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.bookingId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.vendor.toLowerCase().includes(searchTerm.toLowerCase()),
    )

    // Filter by tab
    if (activeTab !== "all") {
      filtered = filtered.filter((txn) => txn.paymentStatus.toLowerCase() === activeTab)
    }

    // Apply additional filters
    if (filterOptions.startDate) {
      filtered = filtered.filter((txn) => new Date(txn.date) >= new Date(filterOptions.startDate))
    }
    if (filterOptions.endDate) {
      filtered = filtered.filter((txn) => new Date(txn.date) <= new Date(filterOptions.endDate))
    }
    if (filterOptions.minAmount) {
      filtered = filtered.filter((txn) => txn.amountValue >= Number.parseInt(filterOptions.minAmount))
    }
    if (filterOptions.maxAmount) {
      filtered = filtered.filter((txn) => txn.amountValue <= Number.parseInt(filterOptions.maxAmount))
    }
    if (filterOptions.paymentStatus !== "all") {
      filtered = filtered.filter((txn) => txn.paymentStatus === filterOptions.paymentStatus)
    }
    if (filterOptions.paymentMethod !== "all") {
      filtered = filtered.filter((txn) => txn.paymentMethod === filterOptions.paymentMethod)
    }

    setFilteredTransactions(filtered)
  }, [transactions, searchTerm, activeTab, filterOptions])

  const handleExport = () => {
    exportToCSV(filteredTransactions, "payment_transactions")
    toast.success("Payment transactions data has been exported to CSV.")
  }

  const handleFilterChange = (name, value) => {
    setFilterOptions({
      ...filterOptions,
      [name]: value,
    })
  }

  const resetFilters = () => {
    setFilterOptions({
      startDate: "",
      endDate: "",
      minAmount: "",
      maxAmount: "",
      paymentStatus: "all",
      paymentMethod: "all",
    })
  }

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500 hover:bg-green-500/80"
      case "Pending":
        return "bg-yellow-500 hover:bg-yellow-500/80"
      case "Failed":
        return "bg-red-500 hover:bg-red-500/80"
      default:
        return "bg-gray-500 hover:bg-gray-500/80"
    }
  }

  // Chart data
  const revenueData = [
    { name: "Jan", revenue: 12000, payout: 10200 },
    { name: "Feb", revenue: 19000, payout: 16150 },
    { name: "Mar", revenue: 15000, payout: 12750 },
    { name: "Apr", revenue: 25000, payout: 21250 },
    { name: "May", revenue: 30000, payout: 25500 },
    { name: "Jun", revenue: 18000, payout: 15300 },
    { name: "Jul", revenue: 20000, payout: 17000 },
  ]

  const paymentMethodData = [
    { name: "UPI", value: 45, color: "#0959AF" },
    { name: "Credit Card", value: 25, color: "#43B02A" },
    { name: "Debit Card", value: 20, color: "#FF6B6B" },
    { name: "Net Banking", value: 10, color: "#FFD166" },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Payment Overview</h1>
        <p className="text-muted-foreground">Monitor payments, transactions, and financial statistics.</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{statistics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-green-500">
              +12%
              <ArrowUpRight className="ml-1 h-3 w-3" />
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Amount</CardTitle>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{statistics.pendingAmount.toLocaleString()}</div>
            <div className="flex items-center text-xs text-yellow-500">
              {statistics.pendingAmount > 0 ? "Needs attention" : "All clear"}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed Payments</CardTitle>
            <Wallet className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.completedPayments}</div>
            <div className="flex items-center text-xs text-green-500">
              +8%
              <ArrowUpRight className="ml-1 h-3 w-3" />
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Payments</CardTitle>
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.failedPayments}</div>
            <div className="flex items-center text-xs text-red-500">
              {statistics.failedPayments > 0 ? "Needs attention" : "All clear"}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
            <CardDescription>Revenue and vendor payouts over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Bar dataKey="revenue" name="Total Revenue" fill="#0959AF" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="payout" name="Vendor Payouts" fill="#43B02A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Distribution of payment methods used</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {paymentMethodData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Tabs defaultValue="all" className="space-y-6" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All Transactions</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="pending">Pending</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab}>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Payment Transactions</CardTitle>
                <CardDescription>View and manage payment transactions.</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="h-8 gap-1">
                      <Filter className="h-4 w-4" />
                      <span>Filter</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Filter Transactions</DialogTitle>
                      <DialogDescription>Set filters to narrow down transaction results.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="startDate">Start Date</Label>
                          <Input
                            id="startDate"
                            type="date"
                            value={filterOptions.startDate}
                            onChange={(e) => handleFilterChange("startDate", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="endDate">End Date</Label>
                          <Input
                            id="endDate"
                            type="date"
                            value={filterOptions.endDate}
                            onChange={(e) => handleFilterChange("endDate", e.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="minAmount">Min Amount (₹)</Label>
                          <Input
                            id="minAmount"
                            type="number"
                            value={filterOptions.minAmount}
                            onChange={(e) => handleFilterChange("minAmount", e.target.value)}
                            placeholder="Min amount"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="maxAmount">Max Amount (₹)</Label>
                          <Input
                            id="maxAmount"
                            type="number"
                            value={filterOptions.maxAmount}
                            onChange={(e) => handleFilterChange("maxAmount", e.target.value)}
                            placeholder="Max amount"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="paymentStatus">Payment Status</Label>
                          <Select
                            value={filterOptions.paymentStatus}
                            onValueChange={(value) => handleFilterChange("paymentStatus", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select status" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Statuses</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Failed">Failed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="paymentMethod">Payment Method</Label>
                          <Select
                            value={filterOptions.paymentMethod}
                            onValueChange={(value) => handleFilterChange("paymentMethod", value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Methods</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                              <SelectItem value="Credit Card">Credit Card</SelectItem>
                              <SelectItem value="Debit Card">Debit Card</SelectItem>
                              <SelectItem value="Net Banking">Net Banking</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetFilters}>
                        Reset Filters
                      </Button>
                      <Button onClick={() => setIsFilterOpen(false)}>Apply Filters</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button variant="outline" size="sm" className="h-8 gap-1" onClick={handleExport}>
                  <Download className="h-4 w-4" />
                  <span>Export</span>
                </Button>
                <Select value={dateRange} onValueChange={setDateRange}>
                  <SelectTrigger className="w-[150px] h-8">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="week">Last Week</SelectItem>
                    <SelectItem value="month">Last Month</SelectItem>
                    <SelectItem value="quarter">Last Quarter</SelectItem>
                    <SelectItem value="year">Last Year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
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
                          <th className="text-left font-medium p-2">Transaction ID</th>
                          <th className="text-left font-medium p-2">Booking ID</th>
                          <th className="text-left font-medium p-2">Customer</th>
                          <th className="text-left font-medium p-2">Vendor</th>
                          <th className="text-left font-medium p-2">Date</th>
                          <th className="text-left font-medium p-2">Amount</th>
                          <th className="text-left font-medium p-2">Commission</th>
                          <th className="text-left font-medium p-2">Vendor Payout</th>
                          <th className="text-left font-medium p-2">Method</th>
                          <th className="text-left font-medium p-2">Status</th>
                          <th className="text-right font-medium p-2">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.length > 0 ? (
                          filteredTransactions.map((transaction) => (
                            <tr key={transaction.id} className="border-b">
                              <td className="p-2">{transaction.id}</td>
                              <td className="p-2">{transaction.bookingId}</td>
                              <td className="p-2">{transaction.customer}</td>
                              <td className="p-2">{transaction.vendor}</td>
                              <td className="p-2">{transaction.date}</td>
                              <td className="p-2">{transaction.amount}</td>
                              <td className="p-2">{transaction.commission}</td>
                              <td className="p-2">{transaction.vendorPayout}</td>
                              <td className="p-2">{transaction.paymentMethod}</td>
                              <td className="p-2">
                                <Badge variant="default" className={getStatusColor(transaction.paymentStatus)}>
                                  {transaction.paymentStatus}
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
                                    <DropdownMenuItem className="flex items-center gap-2">
                                      <span>View Details</span>
                                    </DropdownMenuItem>
                                    {transaction.paymentStatus === "Pending" && (
                                      <DropdownMenuItem className="flex items-center gap-2">
                                        <span>Mark as Completed</span>
                                      </DropdownMenuItem>
                                    )}
                                    {transaction.paymentStatus === "Failed" && (
                                      <DropdownMenuItem className="flex items-center gap-2">
                                        <span>Retry Payment</span>
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuItem className="flex items-center gap-2">
                                      <span>Download Invoice</span>
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={11} className="p-4 text-center text-muted-foreground">
                              No transactions found. Try a different search term or filter.
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


    </div>
  )
}
