"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  UserPlus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Star,
  Download
} from "lucide-react"

export function LeadActions({ 
  selectedCount, 
  onAssign, 
  onBulkAction 
}) {
  if (selectedCount === 0) {
    return null
  }

  return (
    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
      <div className="flex items-center space-x-2">
        <Badge variant="secondary" className="px-3 py-1">
          {selectedCount} lead{selectedCount > 1 ? 's' : ''} selected
        </Badge>
      </div>
      
      <div className="flex items-center space-x-2">
        {/* Primary Actions */}
        <Button
          size="sm"
          onClick={onAssign}
          className="flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Assign to Vendors
        </Button>

        {/* Secondary Actions */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('updateStatus')}
        >
          <Edit className="h-4 w-4 mr-2" />
          Update Status
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('addNote')}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Add Note
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('setPriority')}
        >
          <Star className="h-4 w-4 mr-2" />
          Set Priority
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onBulkAction('export')}
        >
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>

        {/* Destructive Actions */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => onBulkAction('delete')}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </Button>
      </div>
    </div>
  )
} 