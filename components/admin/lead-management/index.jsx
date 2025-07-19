"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { LeadFilters } from "./lead-filters";
import { LeadTable } from "./lead-table";
import { LeadStats } from "./lead-stats";
import { LeadActions } from "./lead-actions";
import { AssignmentDialog } from "./assignment-dialog";
import { LeadDetailsDialog } from "./lead-details-dialog";
import { BulkActionsDialog } from "./bulk-actions-dialog";
import { DeleteConfirmationDialog } from "./delete-confirmation-dialog";
import { EditLeadDialog } from "./edit-lead-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { RefreshCw, Plus, Upload, Download, ChevronDown } from "lucide-react";
import CreateLeadDialog from "./create-lead-dialog";
import leadService from "@/lib/services/leadService";

export function LeadManagement() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get URL parameters
  const currentPage = parseInt(searchParams.get('page')) || 1;
  const currentSearch = searchParams.get('search') || "";
  const currentStatus = searchParams.get('status') || "";
  const currentService = searchParams.get('service') || "";
  const currentCity = searchParams.get('city') || "";
  const currentAssignedStatus = searchParams.get('assignedStatus') || "";
  const currentDateFrom = searchParams.get('dateFrom') || "";
  const currentDateTo = searchParams.get('dateTo') || "";
  const currentSortBy = searchParams.get('sortBy') || "createdAt";
  const currentSortOrder = searchParams.get('sortOrder') || "desc";

  // State management
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10,
  });
  const [summary, setSummary] = useState({});
  
  // Local state synced with URL parameters
  const [filters, setFilters] = useState({
    search: currentSearch,
    status: currentStatus,
    service: currentService,
    city: currentCity,
    assignedStatus: currentAssignedStatus,
    dateFrom: currentDateFrom,
    dateTo: currentDateTo,
    sortBy: currentSortBy,
    sortOrder: currentSortOrder,
  });

  // Dialog states
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [leadDetailsDialogOpen, setLeadDetailsDialogOpen] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);
  const [editLeadDialogOpen, setEditLeadDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [bulkAction, setBulkAction] = useState("");
  const [isLeadsCreationOpen, setIsLeadsCreationOpen] = useState(false);
  const [leadsToDelete, setLeadsToDelete] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [leadToEdit, setLeadToEdit] = useState(null);

  // File input ref for import
  const leadFileInputRef = useRef(null);

  // Update URL with new parameters
  const updateURL = (newParams) => {
    console.log('🔄 updateURL called with:', newParams);
    console.log('📍 Current URL params:', Object.fromEntries(searchParams.entries()));
    
    const params = new URLSearchParams(searchParams.toString());
    
    // Update or remove parameters
    Object.keys(newParams).forEach(key => {
      const value = newParams[key];
      
      // If value is explicitly undefined, delete the parameter
      if (value === undefined) {
        params.delete(key);
      }
      // If value exists and is not empty/all, set it
      else if (value && value !== '' && value !== 'all') {
        params.set(key, value.toString());
      }
      // If value is empty/falsy, delete the parameter
      else {
        params.delete(key);
      }
    });

    const newURL = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    console.log('➡️ Navigating to:', newURL);
    router.push(newURL, { scroll: false });
  };

  // Load leads when URL parameters change
  useEffect(() => {
    fetchLeads();
  }, [currentPage, currentSearch, currentStatus, currentService, currentCity, currentAssignedStatus, currentDateFrom, currentDateTo, currentSortBy, currentSortOrder]);

  // Sync local state with URL parameters
  useEffect(() => {
    setFilters({
      search: currentSearch,
      status: currentStatus,
      service: currentService,
      city: currentCity,
      assignedStatus: currentAssignedStatus,
      dateFrom: currentDateFrom,
      dateTo: currentDateTo,
      sortBy: currentSortBy,
      sortOrder: currentSortOrder,
    });
  }, [currentSearch, currentStatus, currentService, currentCity, currentAssignedStatus, currentDateFrom, currentDateTo, currentSortBy, currentSortOrder]);

  // Fetch leads using lead service
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = {
        page: currentPage,
        limit: pagination.itemsPerPage,
        search: currentSearch,
        status: currentStatus,
        service: currentService,
        city: currentCity,
        assignedStatus: currentAssignedStatus,
        dateFrom: currentDateFrom,
        dateTo: currentDateTo,
        sortBy: currentSortBy,
        sortOrder: currentSortOrder,
      };

      const result = await leadService.getLeads(params);

      if (result.success) {
        setLeads(result.leads);
        setPagination(result.pagination);
        setSummary(result.summary);
      } else {
        toast.error(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast.error('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  };

  // Optimistic updates for better UX
  const optimisticUpdate = (leadId, updateFn) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => (lead._id === leadId ? updateFn(lead) : lead))
    );
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    console.log('🔧 handleFilterChange called with:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
    
    // Always update URL when filters change
    const hasChanges = Object.keys(newFilters).some(key => 
      newFilters[key] !== filters[key]
    );
    
    if (hasChanges) {
      console.log('🔄 Filters changed, updating URL');
      updateURL({
        ...newFilters,
        page: undefined // Reset to page 1
      });
    }
    
    setSelectedLeads([]);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    console.log('📄 handlePageChange called with:', page);
    const validatedPage = Math.max(1, page);
    updateURL({ page: validatedPage });
    setSelectedLeads([]);
  };

  // Handle lead selection
  const handleLeadSelection = (leadId, selected) => {
    if (selected) {
      setSelectedLeads((prev) => [...prev, leadId]);
    } else {
      setSelectedLeads((prev) => prev.filter((id) => id !== leadId));
    }
  };

  const handleSelectAll = (selected) => {
    if (selected) {
      setSelectedLeads(leads.map((lead) => lead._id));
    } else {
      setSelectedLeads([]);
    }
  };

  // Handle individual lead actions
  const handleLeadAction = async (action, leadId, data = {}) => {
    try {
      // Handle UI actions first
      if (action === "openAssignment") {
        setSelectedLeads([leadId]);
        setAssignmentDialogOpen(true);
        return;
      }

      if (action === "delete") {
        // Find the lead to delete
        const leadToDelete = leads.find(lead => lead._id === leadId);
        if (leadToDelete) {
          setLeadsToDelete([leadToDelete]);
          setDeleteConfirmationOpen(true);
        }
        return;
      }

      if (action === "editBasicInfo") {
        // Set the lead to edit and open edit dialog
        setLeadToEdit(leadId);
        setEditLeadDialogOpen(true);
        return;
      }

      // Optimistic update for other actions
      switch (action) {
        case "updateStatus":
          optimisticUpdate(leadId, (lead) => ({
            ...lead,
            status: data.status,
          }));
          break;
        case "assignVendors":
          optimisticUpdate(leadId, (lead) => ({
            ...lead,
            status: "available",
            assignedVendors: data.vendors || [],
            isAssigned: true,
          }));
          break;
      }

      const response = await fetch(`/api/admin/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, data }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        // Refresh to get accurate data
        fetchLeads();
      } else {
        toast.error(result.error);
        // Revert optimistic update
        fetchLeads();
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
      fetchLeads();
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action, data = {}) => {
    if (selectedLeads.length === 0) {
      toast.error("No leads selected");
      return;
    }

    try {
      if (action === "delete") {
        // Get full lead objects for deletion confirmation
        const leadsToDeleteList = leads.filter(lead => selectedLeads.includes(lead._id));
        setLeadsToDelete(leadsToDeleteList);
        setDeleteConfirmationOpen(true);
        return;
      }

      let endpoint = "/api/admin/leads";
      let method = "PATCH";
      let body = { action, leadIds: selectedLeads, data };

      if (action === "assign") {
        endpoint = "/api/admin/leads/assign";
        method = "POST";
        body = {
          leadIds: selectedLeads,
          vendorIds: data.vendorIds,
          assignmentType: data.assignmentType || "manual",
          criteria: data.criteria || {},
          assignedBy: data.assignedBy,
        };
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setSelectedLeads([]);
        setBulkActionsDialogOpen(false);
        fetchLeads();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  // Handle confirmed deletion
  const handleConfirmedDeletion = async ({ reason, leadIds }) => {
    try {
      setIsDeleting(true);
      
      let result;
      if (leadIds.length === 1) {
        // Single lead deletion
        result = await leadService.deleteLead(leadIds[0], reason);
      } else {
        // Bulk deletion
        result = await leadService.deleteLeads(leadIds, reason);
      }

      if (result.success) {
        toast.success(result.message);
        setSelectedLeads([]);
        setBulkActionsDialogOpen(false);
        setDeleteConfirmationOpen(false);
        fetchLeads();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error deleting leads:", error);
      toast.error("Failed to delete leads");
    } finally {
      setIsDeleting(false);
      setLeadsToDelete([]);
    }
  };

  // Handle lead details view
  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setLeadDetailsDialogOpen(true);
  };

  // Handle edit lead success
  const handleEditLeadSuccess = (updatedLead) => {
    // Update the lead in the list
    optimisticUpdate(updatedLead._id, () => updatedLead);
    fetchLeads();
  };

  // Export functionality using lead service
  const handleLeadExport = async () => {
    try {
      const result = await leadService.exportLeads();
      if (result.success) {
        toast.success("Lead data has been exported to CSV.");
      } else {
        toast.error(`Export Error: ${result.error}`);
      }
    } catch (err) {
      toast.error(`Export Error: ${err.message}`);
    }
  };

  // Import functionality using lead service
  const handleLeadImport = () => {
    leadFileInputRef.current?.click();
  };

  // Download template functionality
  const handleDownloadTemplate = () => {
    try {
      const result = leadService.downloadTemplate();
      if (result.success) {
        toast.success("CSV template downloaded successfully.");
      } else {
        toast.error("Failed to download template.");
      }
    } catch (err) {
      toast.error(`Download Error: ${err.message}`);
    }
  };

  const handleLeadFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setLoading(true);
        const result = await leadService.importLeads(file);
        
        if (result.success) {
          toast.success(result.message);
          if (result.results) {
            const { successful, failed, errors } = result.results;
            console.log('Import results:', { successful, failed, errors });
            
            if (failed > 0) {
              toast.warning(`${failed} leads failed to import. Check console for details.`);
              console.warn('Import errors:', errors);
            }
          }
          // Refresh lead list after import
          fetchLeads();
        } else {
          toast.error(`Import Error: ${result.error}`);
        }
      } catch (err) {
        toast.error(`Import Error: ${err.message}`);
      } finally {
        setLoading(false);
        // Reset file input
        e.target.value = '';
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Lead Management</h1>
          <p className="text-muted-foreground">
            Manage and assign customer leads to vendors
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => fetchLeads()}
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>

          {/* Import/Export Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={loading}>
                <Upload className="h-4 w-4 mr-2" />
                Import
                <ChevronDown className="h-4 w-4 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={handleLeadImport}>
                <Upload className="h-4 w-4 mr-2" />
                Import CSV
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDownloadTemplate}>
                <Download className="h-4 w-4 mr-2" />
                Download Template
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" onClick={handleLeadExport} disabled={loading}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button
            size="sm"
            className="h-8 gap-1"
            onClick={() => setIsLeadsCreationOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span>Create Lead</span>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <LeadStats summary={summary} />

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Leads</CardTitle>
            <div className="flex gap-2">
              {selectedLeads.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setAssignmentDialogOpen(true)}
                >
                  Assign Selected ({selectedLeads.length})
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filters */}
          <LeadFilters
            filters={filters}
            onFilterChange={handleFilterChange}
            loading={loading}
          />

          {/* Bulk Actions */}
          {selectedLeads.length > 0 && (
            <LeadActions
              selectedCount={selectedLeads.length}
              onAssign={() => setAssignmentDialogOpen(true)}
              onBulkAction={(action) => {
                setBulkAction(action);
                setBulkActionsDialogOpen(true);
              }}
            />
          )}

          {/* Table */}
          <LeadTable
            leads={leads}
            loading={loading}
            selectedLeads={selectedLeads}
            onLeadSelection={handleLeadSelection}
            onSelectAll={handleSelectAll}
            onViewLead={handleViewLead}
            onLeadAction={handleLeadAction}
            pagination={pagination}
            onPageChange={handlePageChange}
          />
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AssignmentDialog
        open={assignmentDialogOpen}
        onOpenChange={setAssignmentDialogOpen}
        selectedLeads={selectedLeads}
        onAssign={handleBulkAction}
      />

      <LeadDetailsDialog
        open={leadDetailsDialogOpen}
        onOpenChange={setLeadDetailsDialogOpen}
        leadId={selectedLead?._id}
        onUpdate={(updatedLead) => {
          // Update the lead in the list
          optimisticUpdate(updatedLead._id, () => updatedLead);
          fetchLeads();
        }}
      />

      <BulkActionsDialog
        open={bulkActionsDialogOpen}
        onOpenChange={setBulkActionsDialogOpen}
        action={bulkAction}
        selectedLeads={selectedLeads}
        onExecute={handleBulkAction}
      />

      <DeleteConfirmationDialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        leads={leadsToDelete}
        onConfirm={handleConfirmedDeletion}
        loading={isDeleting}
      />

      <EditLeadDialog
        open={editLeadDialogOpen}
        onOpenChange={setEditLeadDialogOpen}
        leadId={leadToEdit}
        onSuccess={handleEditLeadSuccess}
      />

      <CreateLeadDialog
        isOpen={isLeadsCreationOpen}
        onClose={() => setIsLeadsCreationOpen(false)}
        onSuccess={() => {
          setIsLeadsCreationOpen(false);
          fetchLeads();
        }}
      />

      {/* Hidden file input */}
      <input 
        type="file" 
        ref={leadFileInputRef} 
        onChange={handleLeadFileChange} 
        accept=".csv" 
        className="hidden" 
      />
    </div>
  );
}
