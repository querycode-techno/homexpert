"use client";

import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import { LeadFilters } from "./lead-filters";
import { LeadTable } from "./lead-table";
import { LeadStats } from "./lead-stats";
import { LeadActions } from "./lead-actions";
import { AssignmentDialog } from "./assignment-dialog";
import { LeadDetailsDialog } from "./lead-details-dialog";
import { BulkActionsDialog } from "./bulk-actions-dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Plus, Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { set } from "mongoose";
import CreateLeadDialog from "./create-lead-dialog";

export function LeadManagement() {
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
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    service: "",
    city: "",
    assignedStatus: "",
    dateFrom: "",
    dateTo: "",
    sortBy: "createdAt",
    sortOrder: "desc",
  });

  // Dialog states
  const [assignmentDialogOpen, setAssignmentDialogOpen] = useState(false);
  const [leadDetailsDialogOpen, setLeadDetailsDialogOpen] = useState(false);
  const [bulkActionsDialogOpen, setBulkActionsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [bulkAction, setBulkAction] = useState("");
  const [isLeadsCreationOpen, setIsLeadsCreationOpen] = useState(false);

  // Fetch leads with optimistic caching
  const fetchLeads = useCallback(
    async (showLoader = true) => {
      if (showLoader) setLoading(true);

      try {
        const queryParams = new URLSearchParams({
          page: pagination.currentPage,
          limit: pagination.itemsPerPage,
          ...filters,
        });

        const response = await fetch(`/api/admin/leads?${queryParams}`);
        const result = await response.json();

        if (result.success) {
          setLeads(result.data.leads);
          setPagination(result.data.pagination);
          setSummary(result.data.summary);
        } else {
          toast.error(result.error || "Failed to fetch leads");
        }
      } catch (error) {
        console.error("Error fetching leads:", error);
        toast.error("Failed to fetch leads");
      } finally {
        setLoading(false);
      }
    },
    [pagination.currentPage, pagination.itemsPerPage, filters]
  );

  // Initial load and filter changes
  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Optimistic updates for better UX
  const optimisticUpdate = (leadId, updateFn) => {
    setLeads((prevLeads) =>
      prevLeads.map((lead) => (lead._id === leadId ? updateFn(lead) : lead))
    );
  };

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((prev) => ({ ...prev, currentPage: 1 }));
    setSelectedLeads([]);
  };

  // Handle pagination
  const handlePageChange = (page) => {
    setPagination((prev) => ({ ...prev, currentPage: page }));
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

      // Optimistic update
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
        fetchLeads(false);
      } else {
        toast.error(result.error);
        // Revert optimistic update
        fetchLeads(false);
      }
    } catch (error) {
      console.error("Error updating lead:", error);
      toast.error("Failed to update lead");
      fetchLeads(false);
    }
  };

  // Handle bulk actions
  const handleBulkAction = async (action, data = {}) => {
    if (selectedLeads.length === 0) {
      toast.error("No leads selected");
      return;
    }

    try {
      let endpoint = "/api/admin/leads";
      let method = "PATCH";
      let body = { action, leadIds: selectedLeads, data };

      if (action === "delete") {
        method = "DELETE";
        body = { leadIds: selectedLeads, reason: data.reason };
      } else if (action === "assign") {
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
        fetchLeads(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error performing bulk action:", error);
      toast.error("Failed to perform bulk action");
    }
  };

  // Handle lead details view
  const handleViewLead = (lead) => {
    setSelectedLead(lead);
    setLeadDetailsDialogOpen(true);
  };

  const handleLeadCreation = () => {
    setIsLeadsCreationOpen(false);
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

          <Dialog
            open={isLeadsCreationOpen}
            onOpenChange={setIsLeadsCreationOpen}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 gap-1">
                <Plus className="h-4 w-4" />
                <span>Create Lead</span>
              </Button>
            </DialogTrigger>

            <CreateLeadDialog
                isOpen={isLeadsCreationOpen}
                onClose={() => setIsLeadsCreationOpen(false)}
              />
          </Dialog>

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
          fetchLeads(false);
        }}
      />

      <BulkActionsDialog
        open={bulkActionsDialogOpen}
        onOpenChange={setBulkActionsDialogOpen}
        action={bulkAction}
        selectedLeads={selectedLeads}
        onExecute={handleBulkAction}
      />
    </div>
  );
}
