"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  CheckCircle,
  XCircle
} from 'lucide-react'
import { toast } from 'sonner'

export default function AppUpdatesPage() {
  const [updates, setUpdates] = useState([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingUpdate, setEditingUpdate] = useState(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [formData, setFormData] = useState({
    version: '',
    versionCode: '',
    isActive: true,
    releaseDate: new Date().toISOString().split('T')[0]
  })

  // Fetch app updates
  const fetchUpdates = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('isActive', statusFilter === 'active')

      const response = await fetch(`/api/admin/settings/app-updates?${params}`)
      const data = await response.json()

      if (data.success) {
        setUpdates(data.data)
      } else {
        toast.error('Failed to fetch app updates')
      }
    } catch (error) {
      console.error('Error fetching updates:', error)
      toast.error('Error fetching app updates')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUpdates()
  }, [statusFilter])

  // Filter updates by search term
  const filteredUpdates = updates.filter(update => {
    if (!searchTerm) return true
    const search = searchTerm.toLowerCase()
    return (
      update.version.toLowerCase().includes(search) ||
      update.versionCode.toString().includes(search)
    )
  })

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      const payload = {
        ...formData,
        versionCode: parseInt(formData.versionCode)
      }

      const url = editingUpdate 
        ? `/api/admin/settings/app-updates/${editingUpdate.id}`
        : '/api/admin/settings/app-updates'
      
      const method = editingUpdate ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      const data = await response.json()

      if (data.success) {
        toast.success(editingUpdate ? 'App update updated successfully' : 'App update created successfully')
        setDialogOpen(false)
        resetForm()
        fetchUpdates()
      } else {
        toast.error(data.error || 'Failed to save app update')
      }
    } catch (error) {
      console.error('Error saving update:', error)
      toast.error('Error saving app update')
    }
  }

  // Handle delete
  const handleDelete = async () => {
    if (!deletingId) return

    try {
      const response = await fetch(`/api/admin/settings/app-updates/${deletingId}`, {
        method: 'DELETE'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('App update deleted successfully')
        setDeleteDialogOpen(false)
        setDeletingId(null)
        fetchUpdates()
      } else {
        toast.error(data.error || 'Failed to delete app update')
      }
    } catch (error) {
      console.error('Error deleting update:', error)
      toast.error('Error deleting app update')
    }
  }

  // Reset form
  const resetForm = () => {
    setFormData({
      version: '',
      versionCode: '',
      isActive: true,
      releaseDate: new Date().toISOString().split('T')[0]
    })
    setEditingUpdate(null)
  }

  // Open edit dialog
  const openEditDialog = (update) => {
    setEditingUpdate(update)
    setFormData({
      version: update.version,
      versionCode: update.versionCode.toString(),
      isActive: update.isActive,
      releaseDate: update.releaseDate ? new Date(update.releaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]
    })
    setDialogOpen(true)
  }

  // Open create dialog
  const openCreateDialog = () => {
    resetForm()
    setDialogOpen(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">App Updates</h1>
          <p className="text-muted-foreground">Manage mobile app updates for vendors</p>
        </div>
        <Button onClick={openCreateDialog}>
          <Plus className="h-4 w-4 mr-2" />
          Create Update
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by version or version code..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Updates Table */}
      <Card>
        <CardHeader>
          <CardTitle>App Updates ({filteredUpdates.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : filteredUpdates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No app updates found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Version</TableHead>
                  <TableHead>Version Code</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Release Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUpdates.map((update) => (
                  <TableRow key={update.id}>
                    <TableCell className="font-medium">{update.version}</TableCell>
                    <TableCell>{update.versionCode}</TableCell>
                    <TableCell>
                      {update.isActive ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <XCircle className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(update.releaseDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(update)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeletingId(update.id)
                            setDeleteDialogOpen(true)
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
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open)
        if (!open) resetForm()
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingUpdate ? 'Edit App Update' : 'Create App Update'}
            </DialogTitle>
            <DialogDescription>
              {editingUpdate ? 'Update app update information' : 'Create a new app update for vendors'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="version">Version *</Label>
                <Input
                  id="version"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  placeholder="e.g., 1.0.0"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="versionCode">Version Code *</Label>
                <Input
                  id="versionCode"
                  type="number"
                  value={formData.versionCode}
                  onChange={(e) => setFormData({ ...formData, versionCode: e.target.value })}
                  placeholder="e.g., 1"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="releaseDate">Release Date *</Label>
              <Input
                id="releaseDate"
                type="date"
                value={formData.releaseDate}
                onChange={(e) => setFormData({ ...formData, releaseDate: e.target.value })}
                required
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <Label htmlFor="isActive">Active (visible to vendors)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => {
                setDialogOpen(false)
                resetForm()
              }}>
                Cancel
              </Button>
              <Button type="submit">
                {editingUpdate ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete App Update</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this app update? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setDeleteDialogOpen(false)
              setDeletingId(null)
            }}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
