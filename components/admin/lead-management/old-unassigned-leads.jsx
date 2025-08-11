"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Trash2, 
  RefreshCw, 
  AlertTriangle, 
  Clock, 
  User, 
  Phone, 
  Mail, 
  MapPin,
  Wrench,
  Calendar
} from "lucide-react";
import oldUnassignedLeadsService from "@/lib/services/oldUnassignedLeadsService";

export function OldUnassignedLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [stats, setStats] = useState({});
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 20,
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false);
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteReason, setDeleteReason] = useState("");
  const [daysOld, setDaysOld] = useState(3);

  // Fetch old unassigned leads
  const fetchOldUnassignedLeads = async () => {
    try {
      setLoading(true);
      const data = await oldUnassignedLeadsService.fetchOldUnassignedLeads(
        pagination.currentPage,
        pagination.itemsPerPage,
        daysOld
      );
      
      setLeads(data.data);
      setPagination(data.pagination);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching old unassigned leads:', error);
      toast.error('Failed to fetch old unassigned leads');
    } finally {
      setLoading(false);
    }
  };

  // Delete selected leads
  const handleDeleteLeads = async () => {
    if (selectedLeads.length === 0) {
      toast.error('Please select leads to delete');
      return;
    }

    try {
      setDeleting(true);
      const data = await oldUnassignedLeadsService.deleteOldUnassignedLeads(
        selectedLeads,
        deleteReason || 'Admin cleanup of old unassigned leads'
      );
      
      toast.success(`Successfully deleted ${data.deletedCount} leads`);
      setSelectedLeads([]);
      setDeleteReason("");
      setDeleteDialogOpen(false);
      setBulkDeleteDialogOpen(false);
      fetchOldUnassignedLeads(); // Refresh the list
    } catch (error) {
      console.error('Error deleting leads:', error);
      toast.error('Failed to delete leads');
    } finally {
      setDeleting(false);
    }
  };

  // Delete all leads
  const handleDeleteAllLeads = async () => {
    if (leads.length === 0) {
      toast.error('No leads to delete');
      return;
    }

    try {
      setDeleting(true);
      const data = await oldUnassignedLeadsService.deleteAllOldUnassignedLeads(
        deleteReason || 'Admin cleanup of all old unassigned leads'
      );
      
      toast.success(`Successfully deleted all ${data.deletedCount} leads`);
      setSelectedLeads([]);
      setDeleteReason("");
      setDeleteAllDialogOpen(false);
      fetchOldUnassignedLeads(); // Refresh the list
    } catch (error) {
      console.error('Error deleting all leads:', error);
      toast.error('Failed to delete all leads');
    } finally {
      setDeleting(false);
    }
  };

  // Handle lead selection
  const handleLeadSelection = (leadId, selected) => {
    if (selected) {
      setSelectedLeads(prev => [...prev, leadId]);
    } else {
      setSelectedLeads(prev => prev.filter(id => id !== leadId));
    }
  };

  // Handle select all
  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedLeads(leads.map(lead => lead._id));
    } else {
      setSelectedLeads([]);
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  // Handle days old change
  const handleDaysOldChange = (newDaysOld) => {
    setDaysOld(newDaysOld);
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get status badge color
  const getStatusBadge = (daysOld) => {
    if (daysOld >= 7) return "destructive";
    if (daysOld >= 5) return "destructive";
    if (daysOld >= 3) return "default";
    return "secondary";
  };

  useEffect(() => {
    fetchOldUnassignedLeads();
  }, [pagination.currentPage, pagination.itemsPerPage, daysOld]);

  return (
    <div className="space-y-6">
      {/* Header */}
      {/* <div className="flex flex-col gap-2">
        <h2 className="text-2xl font-bold tracking-tight">Old Unassigned Leads</h2>
        <p className="text-muted-foreground">
          Manage leads that have been unassigned for more than {daysOld} days
        </p>
      </div> */}

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Old Unassigned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUnassignedOld || 0}</div>
            <p className="text-xs text-muted-foreground">
              Leads older than {daysOld} days
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Age</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageDaysOld || 0}</div>
            <p className="text-xs text-muted-foreground">Days old on average</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Selected for Deletion</CardTitle>
            <Trash2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{selectedLeads.length}</div>
            <p className="text-xs text-muted-foreground">Leads ready to delete</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Threshold</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{daysOld}+</div>
            <p className="text-xs text-muted-foreground">Days old</p>
          </CardContent>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="daysOld">Days Old:</Label>
            <Input
              id="daysOld"
              type="number"
              min="1"
              max="30"
              value={daysOld}
              onChange={(e) => handleDaysOldChange(parseInt(e.target.value) || 3)}
              className="w-20"
            />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchOldUnassignedLeads}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        <div className="flex gap-2">
          {selectedLeads.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setBulkDeleteDialogOpen(true)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Selected ({selectedLeads.length})
            </Button>
          )}
          
          {leads.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteAllDialogOpen(true)}
              disabled={deleting}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete All ({leads.length})
            </Button>
          )}
        </div>
      </div>

      {/* Warning Alert */}
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          These leads have been unassigned for more than {daysOld} days and may be candidates for deletion. 
          Please review carefully before deleting as this action cannot be undone.
        </AlertDescription>
      </Alert>

      {/* Quick Actions */}
      {leads.length > 0 && (
        <div className="flex justify-center">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => setDeleteAllDialogOpen(true)}
            disabled={deleting}
            className="px-8"
          >
            <Trash2 className="h-5 w-5 mr-2" />
            Delete All {leads.length} Old Unassigned Leads
          </Button>
        </div>
      )}

      {/* Leads Table */}
      <Card>
        <CardHeader>
          <CardTitle>Old Unassigned Leads</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin" />
            </div>
          ) : leads.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No unassigned leads found older than {daysOld} days.
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedLeads.length === leads.length && leads.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Days Old</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedLeads.includes(lead._id)}
                          onCheckedChange={(checked) => handleLeadSelection(lead._id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{lead.customerName}</div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {lead.customerPhone}
                          </div>
                          {lead.customerEmail && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {lead.customerEmail}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{lead.service}</div>
                          {lead.selectedSubService && (
                            <div className="text-sm text-muted-foreground">
                              {lead.selectedSubService}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="h-3 w-3" />
                          {lead.address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadge(lead.daysOld)}>
                          {lead.daysOld} days
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground">
                          {formatDate(lead.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setSelectedLeads([lead._id]);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {((pagination.currentPage - 1) * pagination.itemsPerPage) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of{' '}
                    {pagination.totalItems} results
                  </div>
                  <div className="flex gap-2">
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
            </>
          )}
        </CardContent>
      </Card>

      {/* Single Lead Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Lead</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this lead? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteLeads}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Dialog */}
      <Dialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Multiple Leads</DialogTitle>
            <DialogDescription>
              You are about to delete {selectedLeads.length} leads. This action cannot be undone.
              Please provide a reason for deletion (optional).
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deleteReason">Reason for deletion (optional)</Label>
              <Textarea
                id="deleteReason"
                placeholder="e.g., Automatic cleanup of old unassigned leads"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBulkDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteLeads}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : `Delete ${selectedLeads.length} Leads`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete All Dialog */}
      <Dialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Old Unassigned Leads</DialogTitle>
            <DialogDescription>
              <div className="space-y-2">
                <p>
                  <strong>Warning:</strong> You are about to delete ALL {leads.length} leads that are older than {daysOld} days and unassigned.
                </p>
                <p className="text-destructive font-medium">
                  This action cannot be undone and will permanently remove all these leads from the system.
                </p>
                <p>
                  Please provide a reason for this bulk deletion (recommended for audit purposes).
                </p>
              </div>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="deleteAllReason">Reason for deletion (recommended)</Label>
              <Textarea
                id="deleteAllReason"
                placeholder="e.g., Complete cleanup of all old unassigned leads, system maintenance"
                value={deleteReason}
                onChange={(e) => setDeleteReason(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteAllDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAllLeads}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? 'Deleting All...' : `Delete All ${leads.length} Leads`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
