"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertTriangle } from "lucide-react"

export function DeleteConfirmationDialog({ 
  open, 
  onOpenChange, 
  leads = [],
  onConfirm,
  loading = false
}) {
  const isMultiple = leads.length > 1
  const leadCount = leads.length

  const handleConfirm = () => {
    const leadIds = leads.map(lead => lead._id || lead)
    onConfirm({ leadIds, reason: 'Deleted by admin' })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Delete {isMultiple ? 'Leads' : 'Lead'}
          </DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {isMultiple ? `these ${leadCount} leads` : 'this lead'}? 
            This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 