"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import { 
  AlertTriangle, 
  Edit, 
  MessageSquare, 
  Star, 
  Download, 
  Trash2,
  CheckCircle
} from "lucide-react"

export function BulkActionsDialog({ 
  open, 
  onOpenChange, 
  action,
  selectedLeads = [],
  onExecute 
}) {
  const [formData, setFormData] = useState({
    status: '',
    note: '',
    priority: '',
    exportFormat: 'csv'
  })
  const [loading, setLoading] = useState(false)

  const handleExecute = async () => {
    if (!formData[getRequiredField()]) {
      toast.error(`Please select a ${getRequiredField()}`)
      return
    }

    setLoading(true)
    try {
      await onExecute(action, { 
        leadIds: selectedLeads,
        ...formData,
        performedBy: 'admin' // This should come from auth context
      })
      onOpenChange(false)
      // Reset form
      setFormData({
        status: '',
        note: '',
        priority: '',
        exportFormat: 'csv'
      })
    } catch (error) {
      console.error('Bulk action error:', error)
    } finally {
      setLoading(false)
    }
  }

  const getRequiredField = () => {
    switch (action) {
      case 'updateStatus': return 'status'
      case 'addNote': return 'note'
      case 'setPriority': return 'priority'
      case 'export': return 'exportFormat'
      default: return ''
    }
  }

  const getActionTitle = () => {
    switch (action) {
      case 'updateStatus': return 'Update Status'
      case 'addNote': return 'Add Note'
      case 'setPriority': return 'Set Priority'
      case 'export': return 'Export Leads'
      case 'delete': return 'Delete Leads'
      default: return 'Bulk Action'
    }
  }

  const getActionIcon = () => {
    switch (action) {
      case 'updateStatus': return <Edit className="h-4 w-4" />
      case 'addNote': return <MessageSquare className="h-4 w-4" />
      case 'setPriority': return <Star className="h-4 w-4" />
      case 'export': return <Download className="h-4 w-4" />
      case 'delete': return <Trash2 className="h-4 w-4" />
      default: return null
    }
  }

  const getActionDescription = () => {
    const count = selectedLeads.length
    switch (action) {
      case 'updateStatus': 
        return `Update the status for ${count} lead${count > 1 ? 's' : ''}`
      case 'addNote': 
        return `Add a note to ${count} lead${count > 1 ? 's' : ''}`
      case 'setPriority': 
        return `Set priority for ${count} lead${count > 1 ? 's' : ''}`
      case 'export': 
        return `Export ${count} lead${count > 1 ? 's' : ''} to file`
      case 'delete': 
        return `Permanently delete ${count} lead${count > 1 ? 's' : ''}. This action cannot be undone.`
      default: 
        return `Perform bulk action on ${count} lead${count > 1 ? 's' : ''}`
    }
  }

  const isDestructive = action === 'delete'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getActionIcon()}
            {getActionTitle()}
          </DialogTitle>
          <DialogDescription>
            {getActionDescription()}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Selected Leads Summary */}
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Selected Leads</span>
            <Badge variant="secondary">
              {selectedLeads.length} lead{selectedLeads.length > 1 ? 's' : ''}
            </Badge>
          </div>

          {/* Action-specific Form Fields */}
          {action === 'updateStatus' && (
            <div className="space-y-2">
              <Label htmlFor="status">New Status</Label>
              <Select 
                value={formData.status} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="assigned">Assigned</SelectItem>
                  <SelectItem value="taken">Taken</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'addNote' && (
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter note to add to all selected leads..."
                value={formData.note}
                onChange={(e) => setFormData(prev => ({ ...prev, note: e.target.value }))}
                rows={4}
              />
            </div>
          )}

          {action === 'setPriority' && (
            <div className="space-y-2">
              <Label htmlFor="priority">Priority Level</Label>
              <Select 
                value={formData.priority} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priority: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low Priority</SelectItem>
                  <SelectItem value="medium">Medium Priority</SelectItem>
                  <SelectItem value="high">High Priority</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {action === 'export' && (
            <div className="space-y-2">
              <Label htmlFor="exportFormat">Export Format</Label>
              <Select 
                value={formData.exportFormat} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, exportFormat: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                  <SelectItem value="xlsx">Excel Spreadsheet</SelectItem>
                  <SelectItem value="json">JSON Format</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose the format for the exported file
              </p>
            </div>
          )}

          {/* Warning for destructive actions */}
          {isDestructive && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                This action will permanently delete the selected leads and cannot be undone. 
                All associated data including notes, follow-ups, and progress history will be lost.
              </AlertDescription>
            </Alert>
          )}

          {/* Confirmation for high-impact actions */}
          {(action === 'updateStatus' || action === 'delete') && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800">Confirmation Required</p>
                  <p className="text-amber-700 mt-1">
                    {action === 'updateStatus' 
                      ? 'This will update the status for all selected leads and create progress history entries.'
                      : 'This action cannot be undone. Please make sure you want to delete these leads.'
                    }
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleExecute}
            disabled={loading || (!formData[getRequiredField()] && getRequiredField())}
            variant={isDestructive ? "destructive" : "default"}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
                Processing...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {action === 'delete' ? (
                  <Trash2 className="h-4 w-4" />
                ) : action === 'export' ? (
                  <Download className="h-4 w-4" />
                ) : (
                  <CheckCircle className="h-4 w-4" />
                )}
                {action === 'delete' ? 'Delete Leads' : 
                 action === 'export' ? 'Export Leads' : 
                 'Apply Changes'}
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 