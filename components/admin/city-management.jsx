"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Plus, Edit, Trash2, MapPin, Loader2 } from "lucide-react"
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
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import cityService from "@/lib/services/cityService"
import { getStates } from "@/lib/utils/stateCityUtils"

export function CityManagement() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Get URL parameters
  const currentPage = parseInt(searchParams.get('page')) || 1
  const currentSearch = searchParams.get('search') || ""
  const currentState = searchParams.get('state') || ""

  // State management
  const [cities, setCities] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 50,
    hasNextPage: false,
    hasPrevPage: false
  })

  // Dialog states
  const [isAddCityOpen, setIsAddCityOpen] = useState(false)
  const [isEditCityOpen, setIsEditCityOpen] = useState(false)
  const [isDeleteCityDialogOpen, setIsDeleteCityDialogOpen] = useState(false)
  const [currentCity, setCurrentCity] = useState(null)
  const [editingCity, setEditingCity] = useState(null)

  // Form states
  const [searchTerm, setSearchTerm] = useState(currentSearch)
  const [selectedState, setSelectedState] = useState(currentState || "all")
  const [availableStates] = useState(() => getStates())

  // Load cities
  useEffect(() => {
    fetchCities()
  }, [currentPage, currentSearch, currentState])

  const fetchCities = async () => {
    try {
      setLoading(true)
      const result = await cityService.getCities({
        page: currentPage,
        limit: pagination.itemsPerPage,
        search: currentSearch,
        state: currentState
      })

      if (result.success) {
        setCities(result.data)
        setPagination(result.pagination)
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error fetching cities:', error)
      toast.error('Failed to fetch cities')
    } finally {
      setLoading(false)
    }
  }

  // URL management
  const updateURL = (params) => {
    const newSearchParams = new URLSearchParams(searchParams)
    
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        newSearchParams.delete(key)
      } else {
        newSearchParams.set(key, value.toString())
      }
    })
    
    router.push(`?${newSearchParams.toString()}`)
  }

  // Search and filter handlers
  const handleSearch = (value) => {
    setSearchTerm(value)
    updateURL({ search: value, page: undefined })
  }

  const handleStateFilter = (value) => {
    const stateValue = value === "all" ? "" : value
    setSelectedState(stateValue)
    updateURL({ state: stateValue, page: undefined })
  }

  const handlePageChange = (page) => {
    updateURL({ page })
  }

  // City CRUD handlers
  const handleAddCity = async (formData) => {
    try {
      setLoading(true)
      const result = await cityService.addCity(formData.state, formData.city)

      if (result.success) {
        toast.success(`City Added: ${formData.city} has been added to ${formData.state} successfully.`)
        setIsAddCityOpen(false)
        fetchCities()
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error adding city:', error)
      toast.error(error.message || 'Failed to add city')
    } finally {
      setLoading(false)
    }
  }

  const handleEditCity = (city) => {
    setEditingCity(city)
    setIsEditCityOpen(true)
  }

  const handleUpdateCity = async (formData) => {
    try {
      setLoading(true)
      const result = await cityService.updateCity(
        editingCity.state, 
        editingCity.city, 
        formData.newCityName
      )

      if (result.success) {
        toast.success(`City Updated: ${editingCity.city} has been updated to ${formData.newCityName} successfully.`)
        setIsEditCityOpen(false)
        setEditingCity(null)
        fetchCities()
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating city:', error)
      toast.error(error.message || 'Failed to update city')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCity = (city) => {
    setCurrentCity(city)
    setIsDeleteCityDialogOpen(true)
  }

  const confirmDeleteCity = async () => {
    try {
      setLoading(true)
      const result = await cityService.deleteCity(currentCity.state, currentCity.city)

      if (result.success) {
        toast.success(`City Deleted: ${currentCity.city} has been removed from ${currentCity.state} successfully.`)
        setIsDeleteCityDialogOpen(false)
        setCurrentCity(null)
        fetchCities()
      } else {
        toast.error(`Error: ${result.error}`)
      }
    } catch (error) {
      console.error('Error deleting city:', error)
      toast.error(error.message || 'Failed to delete city')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">City Management</h1>
        <p className="text-muted-foreground">
          Manage cities and their availability across different states.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cities</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">States Covered</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{availableStates.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Page</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pagination.currentPage}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-2">
              <CardTitle>Cities</CardTitle>
              <CardDescription>
                Manage cities across all states
              </CardDescription>
            </div>
            <Button onClick={() => setIsAddCityOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add City
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search cities..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-8"
              />
            </div>
                         <Select value={selectedState || "all"} onValueChange={handleStateFilter}>
               <SelectTrigger className="w-[200px]">
                 <SelectValue placeholder="Filter by state" />
               </SelectTrigger>
               <SelectContent>
                 <SelectItem value="all">All States</SelectItem>
                 {availableStates.map((state) => (
                   <SelectItem key={state} value={state}>
                     {state}
                   </SelectItem>
                 ))}
               </SelectContent>
             </Select>
          </div>

          {/* Cities Table */}
          <div className="mt-6">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                <div className="text-muted-foreground">Loading cities...</div>
              </div>
            ) : cities.length === 0 ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-muted-foreground">No cities found</div>
              </div>
            ) : (
              <div className="space-y-4">
                {cities.map((cityData, index) => (
                  <div
                    key={`${cityData.state}-${cityData.city}-${index}`}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{cityData.city}</div>
                        <div className="text-sm text-muted-foreground">
                          {cityData.state}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditCity(cityData)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteCity(cityData)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{" "}
                {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{" "}
                {pagination.totalItems} cities
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage - 1)}
                  disabled={!pagination.hasPrevPage}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageChange(pagination.currentPage + 1)}
                  disabled={!pagination.hasNextPage}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add City Dialog */}
      <AddCityDialog
        isOpen={isAddCityOpen}
        onClose={() => setIsAddCityOpen(false)}
        onSubmit={handleAddCity}
        availableStates={availableStates}
        loading={loading}
      />

      {/* Edit City Dialog */}
      <EditCityDialog
        isOpen={isEditCityOpen}
        onClose={() => {
          setIsEditCityOpen(false)
          setEditingCity(null)
        }}
        city={editingCity}
        onSubmit={handleUpdateCity}
        loading={loading}
      />

      {/* Delete City Dialog */}
      <AlertDialog open={isDeleteCityDialogOpen} onOpenChange={setIsDeleteCityDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the city
              "{currentCity?.city}" from "{currentCity?.state}".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteCity} className="bg-red-500 hover:bg-red-600">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Add City Dialog Component
function AddCityDialog({ isOpen, onClose, onSubmit, availableStates, loading }) {
  const [formData, setFormData] = useState({
    state: '',
    city: ''
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.state || !formData.city) {
      toast.error('Please fill in all fields')
      return
    }
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New City</DialogTitle>
          <DialogDescription>
            Add a new city to an existing state.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="state">State</Label>
            <Select value={formData.state} onValueChange={(value) => setFormData(prev => ({ ...prev, state: value }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select a state" />
              </SelectTrigger>
              <SelectContent>
                {availableStates.map((state) => (
                  <SelectItem key={state} value={state}>
                    {state}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="city">City Name</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Enter city name"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add City
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

// Edit City Dialog Component
function EditCityDialog({ isOpen, onClose, city, onSubmit, loading }) {
  const [formData, setFormData] = useState({
    newCityName: ''
  })

  useEffect(() => {
    if (city) {
      setFormData({ newCityName: city.city })
    }
  }, [city])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.newCityName) {
      toast.error('Please enter a city name')
      return
    }
    onSubmit(formData)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit City</DialogTitle>
          <DialogDescription>
            Update the name of "{city?.city}" in "{city?.state}".
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="newCityName">New City Name</Label>
            <Input
              id="newCityName"
              value={formData.newCityName}
              onChange={(e) => setFormData(prev => ({ ...prev, newCityName: e.target.value }))}
              placeholder="Enter new city name"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update City
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
