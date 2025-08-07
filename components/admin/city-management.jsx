"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner"
import {
  Plus,
  Search,
  Edit,
  Trash2,
  RefreshCw,
  Database,
  Clock,
  Activity
} from "lucide-react"

export default function CityManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [cities, setCities] = useState([])
  const [states, setStates] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedState, setSelectedState] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)
  const [itemsPerPage] = useState(50)
  
  // Form states
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingCity, setEditingCity] = useState(null)
  const [deletingCity, setDeletingCity] = useState(null)
  
  // Form data
  const [formData, setFormData] = useState({
    state: "",
    city: ""
  })
  
  // Cache management states
  const [cacheStats, setCacheStats] = useState(null)
  const [showCacheDialog, setShowCacheDialog] = useState(false)
  const [cacheLoading, setCacheLoading] = useState(false)

  // Search timeout for debounced search
  const [searchTimeout, setSearchTimeout] = useState(null)

  // Get URL parameters
  useEffect(() => {
    const page = parseInt(searchParams.get('page')) || 1
    const search = searchParams.get('search') || ""
    const state = searchParams.get('state') || "all"
    
    setCurrentPage(page)
    setSearchTerm(search)
    setSelectedState(state)
  }, [searchParams])

  // Fetch cities
  const fetchCities = async (page = currentPage, search = searchTerm, state = selectedState) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: page.toString(),
        limit: itemsPerPage.toString(),
        search: search,
        state: state
      })
      
      const response = await fetch(`/api/admin/cities?${params}`)
      const data = await response.json()
      
      if (data.success) {
        setCities(data.data)
        setTotalPages(data.pagination.pages)
        setTotalItems(data.pagination.total)
      } else {
        toast.error("Failed to fetch cities")
      }
    } catch (error) {
      console.error("Error fetching cities:", error)
      toast.error("Error fetching cities")
    } finally {
      setLoading(false)
    }
  }

  // Fetch states
  const fetchStates = async () => {
    try {
      const response = await fetch('/api/admin/cities/states')
      const data = await response.json()
      
      if (data.success) {
        setStates(data.data)
      } else {
        toast.error("Failed to fetch states")
      }
    } catch (error) {
      console.error("Error fetching states:", error)
      toast.error("Error fetching states")
    }
  }

  // Fetch cache statistics
  const fetchCacheStats = async () => {
    try {
      setCacheLoading(true)
      const response = await fetch('/api/admin/cities/cache')
      const data = await response.json()
      
      if (data.success) {
        setCacheStats(data.data)
      } else {
        toast.error("Failed to fetch cache statistics")
      }
    } catch (error) {
      console.error("Error fetching cache stats:", error)
      toast.error("Error fetching cache statistics")
    } finally {
      setCacheLoading(false)
    }
  }

  // Clear cache
  const clearCache = async () => {
    try {
      setCacheLoading(true)
      const response = await fetch('/api/admin/cities/cache', {
        method: 'DELETE'
      })
      const data = await response.json()
      
      if (data.success) {
        toast.success("Cache cleared successfully")
        fetchCacheStats() // Refresh stats
      } else {
        toast.error("Failed to clear cache")
      }
    } catch (error) {
      console.error("Error clearing cache:", error)
      toast.error("Error clearing cache")
    } finally {
      setCacheLoading(false)
    }
  }

  // Load data on component mount
  useEffect(() => {
    fetchCities()
    fetchStates()
    fetchCacheStats()
  }, [currentPage, searchTerm, selectedState])

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  // Update URL when filters change
  const updateURL = (page, search, state) => {
    const params = new URLSearchParams()
    if (page > 1) params.set('page', page.toString())
    if (search) params.set('search', search)
    if (state && state !== 'all') params.set('state', state)
    
    const newURL = params.toString() ? `?${params.toString()}` : ''
    router.push(`/admin/cities${newURL}`)
  }

  // Handle search
  const handleSearch = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
    updateURL(1, value, selectedState)
    // Fetch cities immediately with new search term
    fetchCities(1, value, selectedState)
  }

  // Debounced search handler
  const handleSearchChange = (value) => {
    setSearchTerm(value)
    setCurrentPage(1)
    updateURL(1, value, selectedState)
    
    // Clear existing timeout
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Set new timeout for debounced search
    const timeout = setTimeout(() => {
      fetchCities(1, value, selectedState)
    }, 300) // 300ms delay
    
    setSearchTimeout(timeout)
  }

  // Handle state filter
  const handleStateFilter = (value) => {
    setSelectedState(value)
    setCurrentPage(1)
    updateURL(1, searchTerm, value)
    // Fetch cities immediately with new state filter
    fetchCities(1, searchTerm, value)
  }

  // Handle pagination
  const handlePageChange = (page) => {
    setCurrentPage(page)
    updateURL(page, searchTerm, selectedState)
    // Fetch cities immediately with new page
    fetchCities(page, searchTerm, selectedState)
  }

  // Handle add city
  const handleAddCity = async () => {
    try {
      const response = await fetch('/api/admin/cities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("City added successfully")
        setShowAddDialog(false)
        setFormData({ state: "", city: "" })
        fetchCities()
        fetchCacheStats() // Refresh cache stats
      } else {
        toast.error(data.error || "Failed to add city")
      }
    } catch (error) {
      console.error("Error adding city:", error)
      toast.error("Error adding city")
    }
  }

  // Handle edit city
  const handleEditCity = async () => {
    try {
      const response = await fetch(`/api/admin/cities/${editingCity.state}/${editingCity.city}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (data.success) {
        toast.success("City updated successfully")
        setShowEditDialog(false)
        setEditingCity(null)
        setFormData({ state: "", city: "" })
        fetchCities()
        fetchCacheStats() // Refresh cache stats
      } else {
        toast.error(data.error || "Failed to update city")
      }
    } catch (error) {
      console.error("Error updating city:", error)
      toast.error("Error updating city")
    }
  }

  // Handle delete city
  const confirmDeleteCity = async () => {
    try {
      const response = await fetch(`/api/admin/cities/${deletingCity.state}/${deletingCity.city}`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (data.success) {
        toast.success("City deleted successfully")
        setShowDeleteDialog(false)
        setDeletingCity(null)
        fetchCities()
        fetchCacheStats() // Refresh cache stats
      } else {
        toast.error(data.error || "Failed to delete city")
      }
    } catch (error) {
      console.error("Error deleting city:", error)
      toast.error("Error deleting city")
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">City Management</h1>
          <p className="text-muted-foreground">
            Manage cities and states in the system
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowCacheDialog(true)}
            disabled={cacheLoading}
          >
            <Database className="h-4 w-4 mr-2" />
            Cache Stats
          </Button>
          <Button
            variant="outline"
            onClick={clearCache}
            disabled={cacheLoading}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Clear Cache
          </Button>
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add City
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search cities or states..."
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedState} onValueChange={handleStateFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All States</SelectItem>
                {states.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Cities Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Cities ({totalItems} total)
            {cacheStats && (
              <Badge variant="secondary" className="ml-2">
                <Activity className="h-3 w-3 mr-1" />
                Cache: {cacheStats.cacheSize} entries
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>Loading cities...</p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>State</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cities.map((city, index) => (
                    <TableRow key={index}>
                      <TableCell>{city.state}</TableCell>
                      <TableCell>{city.city}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setEditingCity(city)
                              setFormData({ state: city.state, city: city.city })
                              setShowEditDialog(true)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setDeletingCity(city)
                              setShowDeleteDialog(true)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Page {currentPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add City Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New City</DialogTitle>
            <DialogDescription>
              Add a new city to the system
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">State</label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <Input
                placeholder="Enter city name"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCity}>
              Add City
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit City Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit City</DialogTitle>
            <DialogDescription>
              Update city information
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">State</label>
              <Select
                value={formData.state}
                onValueChange={(value) => setFormData({ ...formData, state: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">City</label>
              <Input
                placeholder="Enter city name"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditCity}>
              Update City
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete City</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingCity?.city}, {deletingCity?.state}?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCity}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cache Statistics Dialog */}
      <Dialog open={showCacheDialog} onOpenChange={setShowCacheDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cache Statistics</DialogTitle>
            <DialogDescription>
              View cache performance and statistics
            </DialogDescription>
          </DialogHeader>
          {cacheStats && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Cache Size</span>
                  </div>
                  <p className="text-2xl font-bold">{cacheStats.cacheSize}</p>
                  <p className="text-sm text-muted-foreground">Cached entries</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span className="font-medium">Cache Timeout</span>
                  </div>
                  <p className="text-2xl font-bold">{Math.round(cacheStats.cacheTimeout / 1000 / 60)}m</p>
                  <p className="text-sm text-muted-foreground">Minutes</p>
                </div>
              </div>
              <div className="p-4 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="h-4 w-4" />
                  <span className="font-medium">States Cache</span>
                </div>
                <Badge variant={cacheStats.statesCached ? "default" : "secondary"}>
                  {cacheStats.statesCached ? "Cached" : "Not cached"}
                </Badge>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCacheDialog(false)}>
              Close
            </Button>
            <Button onClick={clearCache} disabled={cacheLoading}>
              Clear Cache
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
