"use client"

import { createContext, useContext, useState, useEffect } from "react"

// Initial data
const initialEmployees = [
  {
    id: "EMP-001",
    name: "Rahul Sharma",
    email: "rahul.sharma@homexpert.com",
    phone: "+91 9876543210",
    role: "Helpline",
    status: "Active",
  },
  {
    id: "EMP-002",
    name: "Priya Patel",
    email: "priya.patel@homexpert.com",
    phone: "+91 9876543211",
    role: "Telecaller",
    status: "Active",
  },
  {
    id: "EMP-003",
    name: "Amit Kumar",
    email: "amit.kumar@homexpert.com",
    phone: "+91 9876543212",
    role: "Helpline",
    status: "Inactive",
  },
  {
    id: "EMP-004",
    name: "Neha Singh",
    email: "neha.singh@homexpert.com",
    phone: "+91 9876543213",
    role: "Telecaller",
    status: "Active",
  },
  {
    id: "EMP-005",
    name: "Vikram Mehta",
    email: "vikram.mehta@homexpert.com",
    phone: "+91 9876543214",
    role: "Helpline",
    status: "Active",
  },
]

const initialSubscriptions = [
  {
    id: "SUB-001",
    name: "Basic Plan",
    duration: "1 Month",
    price: "₹999",
    features: "10 Leads, Basic Support",
    status: "Active",
  },
  {
    id: "SUB-002",
    name: "Standard Plan",
    duration: "3 Months",
    price: "₹2,499",
    features: "50 Leads, Priority Support",
    status: "Active",
  },
  {
    id: "SUB-003",
    name: "Premium Plan",
    duration: "6 Months",
    price: "₹4,999",
    features: "Unlimited Leads, Premium Support",
    status: "Active",
  },
  {
    id: "SUB-004",
    name: "Trial Plan",
    duration: "7 Days",
    price: "Free",
    features: "5 Leads, Basic Support",
    status: "Inactive",
  },
]

const initialVendors = [
  {
    id: "V-1234",
    name: "Rajesh Plumbing Services",
    phone: "+91 9876543210",
    subscription: "Standard Plan",
    startDate: "2023-04-15",
    endDate: "2023-07-15",
    status: "Active",
  },
  {
    id: "V-1235",
    name: "Kumar Electricals",
    phone: "+91 9876543211",
    subscription: "Basic Plan",
    startDate: "2023-05-01",
    endDate: "2023-06-01",
    status: "Active",
  },
  {
    id: "V-1236",
    name: "Clean Home Services",
    phone: "+91 9876543212",
    subscription: "Premium Plan",
    startDate: "2023-03-10",
    endDate: "2023-09-10",
    status: "Active",
  },
  {
    id: "V-1237",
    name: "Perfect Painters",
    phone: "+91 9876543213",
    subscription: "Standard Plan",
    startDate: "2023-02-15",
    endDate: "2023-05-15",
    status: "Expired",
  },
  {
    id: "V-1238",
    name: "Fix It All",
    phone: "+91 9876543214",
    subscription: "Trial Plan",
    startDate: "2023-05-05",
    endDate: "2023-05-12",
    status: "Active",
  },
]

const initialLeads = [
  {
    id: "L-1234",
    customer: "Rahul Sharma",
    phone: "+91 9876543210",
    service: "Plumbing",
    location: "Andheri, Mumbai",
    date: "2023-05-12",
    status: "New",
    assignedTo: "Rajesh Plumbing Services",
  },
  {
    id: "L-1235",
    customer: "Priya Patel",
    phone: "+91 9876543211",
    service: "Electrical",
    location: "Bandra, Mumbai",
    date: "2023-05-12",
    status: "Assigned",
    assignedTo: "Kumar Electricals",
  },
  {
    id: "L-1236",
    customer: "Amit Kumar",
    phone: "+91 9876543212",
    service: "Cleaning",
    location: "Powai, Mumbai",
    date: "2023-05-11",
    status: "In Progress",
    assignedTo: "Clean Home Services",
  },
  {
    id: "L-1237",
    customer: "Neha Singh",
    phone: "+91 9876543213",
    service: "Painting",
    location: "Juhu, Mumbai",
    date: "2023-05-11",
    status: "Completed",
    assignedTo: "Perfect Painters",
  },
  {
    id: "L-1238",
    customer: "Vikram Mehta",
    phone: "+91 9876543214",
    service: "Plumbing",
    location: "Dadar, Mumbai",
    date: "2023-05-10",
    status: "Cancelled",
    assignedTo: "Unassigned",
  },
]

const initialBookings = [
  {
    id: "B-1234",
    customer: "Rahul Sharma",
    phone: "+91 9876543210",
    service: "Plumbing",
    location: "Andheri, Mumbai",
    date: "2023-05-12",
    time: "10:00 AM",
    status: "Pending",
    vendor: "Rajesh Plumbing Services",
  },
  {
    id: "B-1235",
    customer: "Priya Patel",
    phone: "+91 9876543211",
    service: "Electrical",
    location: "Bandra, Mumbai",
    date: "2023-05-12",
    time: "2:00 PM",
    status: "Confirmed",
    vendor: "Kumar Electricals",
  },
  {
    id: "B-1236",
    customer: "Amit Kumar",
    phone: "+91 9876543212",
    service: "Cleaning",
    location: "Powai, Mumbai",
    date: "2023-05-11",
    time: "11:30 AM",
    status: "In Progress",
    vendor: "Clean Home Services",
  },
  {
    id: "B-1237",
    customer: "Neha Singh",
    phone: "+91 9876543213",
    service: "Painting",
    location: "Juhu, Mumbai",
    date: "2023-05-11",
    time: "9:00 AM",
    status: "Completed",
    vendor: "Perfect Painters",
  },
  {
    id: "B-1238",
    customer: "Vikram Mehta",
    phone: "+91 9876543214",
    service: "Plumbing",
    location: "Dadar, Mumbai",
    date: "2023-05-10",
    time: "4:00 PM",
    status: "Cancelled",
    vendor: "Unassigned",
  },
]

// Create context
const DataContext = createContext(null)

// Provider component
export function DataProvider({ children }) {
  // Load data from localStorage if available
  const [employees, setEmployees] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("employees")
      return saved ? JSON.parse(saved) : initialEmployees
    }
    return initialEmployees
  })

  const [subscriptions, setSubscriptions] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("subscriptions")
      return saved ? JSON.parse(saved) : initialSubscriptions
    }
    return initialSubscriptions
  })

  const [vendors, setVendors] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("vendors")
      return saved ? JSON.parse(saved) : initialVendors
    }
    return initialVendors
  })

  const [leads, setLeads] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("leads")
      return saved ? JSON.parse(saved) : initialLeads
    }
    return initialLeads
  })

  const [bookings, setBookings] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("bookings")
      return saved ? JSON.parse(saved) : initialBookings
    }
    return initialBookings
  })

  // Save data to localStorage when it changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("employees", JSON.stringify(employees))
      localStorage.setItem("subscriptions", JSON.stringify(subscriptions))
      localStorage.setItem("vendors", JSON.stringify(vendors))
      localStorage.setItem("leads", JSON.stringify(leads))
      localStorage.setItem("bookings", JSON.stringify(bookings))
    }
  }, [employees, subscriptions, vendors, leads, bookings])

  // Employee CRUD operations
  const addEmployee = (employee) => {
    const newEmployee = {
      ...employee,
      id: `EMP-${String(employees.length + 1).padStart(3, "0")}`,
    }
    setEmployees([...employees, newEmployee])
    return newEmployee
  }

  const updateEmployee = (id, updatedEmployee) => {
    setEmployees(employees.map((emp) => (emp.id === id ? { ...emp, ...updatedEmployee } : emp)))
  }

  const deleteEmployee = (id) => {
    setEmployees(employees.filter((emp) => emp.id !== id))
  }

  // Subscription CRUD operations
  const addSubscription = (subscription) => {
    const newSubscription = {
      ...subscription,
      id: `SUB-${String(subscriptions.length + 1).padStart(3, "0")}`,
    }
    setSubscriptions([...subscriptions, newSubscription])
    return newSubscription
  }

  const updateSubscription = (id, updatedSubscription) => {
    setSubscriptions(subscriptions.map((sub) => (sub.id === id ? { ...sub, ...updatedSubscription } : sub)))
  }

  const deleteSubscription = (id) => {
    setSubscriptions(subscriptions.filter((sub) => sub.id !== id))
  }

  // Vendor CRUD operations
  const addVendor = (vendor) => {
    const newVendor = {
      ...vendor,
      id: `V-${String(vendors.length + 1234 + 1).padStart(4, "0")}`,
    }
    setVendors([...vendors, newVendor])
    return newVendor
  }

  const updateVendor = (id, updatedVendor) => {
    setVendors(vendors.map((vendor) => (vendor.id === id ? { ...vendor, ...updatedVendor } : vendor)))
  }

  const deleteVendor = (id) => {
    setVendors(vendors.filter((vendor) => vendor.id !== id))
  }

  // Lead CRUD operations
  const addLead = (lead) => {
    const newLead = {
      ...lead,
      id: `L-${String(leads.length + 1234 + 1).padStart(4, "0")}`,
    }
    setLeads([...leads, newLead])
    return newLead
  }

  const updateLead = (id, updatedLead) => {
    setLeads(leads.map((lead) => (lead.id === id ? { ...lead, ...updatedLead } : lead)))
  }

  const deleteLead = (id) => {
    setLeads(leads.filter((lead) => lead.id !== id))
  }

  // Booking CRUD operations
  const addBooking = (booking) => {
    const newBooking = {
      ...booking,
      id: `B-${String(bookings.length + 1234 + 1).padStart(4, "0")}`,
    }
    setBookings([...bookings, newBooking])
    return newBooking
  }

  const updateBooking = (id, updatedBooking) => {
    setBookings(bookings.map((booking) => (booking.id === id ? { ...booking, ...updatedBooking } : booking)))
  }

  const deleteBooking = (id) => {
    setBookings(bookings.filter((booking) => booking.id !== id))
  }

  // Export data as CSV
  const exportToCSV = (data, filename) => {
    if (!data || !data.length) return

    // Get headers from first item
    const headers = Object.keys(data[0])

    // Convert data to CSV format
    const csvRows = []
    csvRows.push(headers.join(","))

    for (const row of data) {
      const values = headers.map((header) => {
        const value = row[header]
        return `"${value}"`
      })
      csvRows.push(values.join(","))
    }

    const csvString = csvRows.join("\n")
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" })

    // Create download link
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `${filename}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Import data from CSV
  const importFromCSV = (file, dataType, callback) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      const csvData = event.target.result
      const rows = csvData.split("\n")
      const headers = rows[0].split(",").map((header) => header.trim().replace(/"/g, ""))

      const parsedData = []

      for (let i = 1; i < rows.length; i++) {
        if (!rows[i].trim()) continue

        const values = rows[i].split(",").map((value) => value.trim().replace(/"/g, ""))
        const row = {}

        headers.forEach((header, index) => {
          row[header] = values[index]
        })

        parsedData.push(row)
      }

      // Update state based on data type
      switch (dataType) {
        case "employees":
          setEmployees(parsedData)
          break
        case "subscriptions":
          setSubscriptions(parsedData)
          break
        case "vendors":
          setVendors(parsedData)
          break
        case "leads":
          setLeads(parsedData)
          break
        case "bookings":
          setBookings(parsedData)
          break
        default:
          break
      }

      if (callback) callback(parsedData)
    }

    reader.readAsText(file)
  }

  return (
    <DataContext.Provider
      value={{
        employees,
        addEmployee,
        updateEmployee,
        deleteEmployee,

        subscriptions,
        addSubscription,
        updateSubscription,
        deleteSubscription,

        vendors,
        addVendor,
        updateVendor,
        deleteVendor,

        leads,
        addLead,
        updateLead,
        deleteLead,

        bookings,
        addBooking,
        updateBooking,
        deleteBooking,

        exportToCSV,
        importFromCSV,
      }}
    >
      {children}
    </DataContext.Provider>
  )
}

// Custom hook to use the data context
export function useData() {
  const context = useContext(DataContext)
  if (!context) {
    throw new Error("useData must be used within a DataProvider")
  }
  return context
}
