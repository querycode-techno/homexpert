"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeadManagement } from "./index";
import { OldUnassignedLeads } from "./old-unassigned-leads";
import { AlertTriangle, Users, Clock } from "lucide-react";

export function LeadManagementTabs() {
  const [activeTab, setActiveTab] = useState("all-leads");

  // Listen for custom event to switch to old unassigned tab
  useEffect(() => {
    const handleSwitchToOldUnassigned = () => {
      setActiveTab("old-unassigned");
    };

    window.addEventListener('switchToOldUnassigned', handleSwitchToOldUnassigned);
    
    return () => {
      window.removeEventListener('switchToOldUnassigned', handleSwitchToOldUnassigned);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
        <p className="text-muted-foreground">
          Manage all leads, assignments, and cleanup old unassigned leads
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all-leads" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            All Leads
          </TabsTrigger>
          <TabsTrigger value="old-unassigned" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Old Unassigned
            <AlertTriangle className="h-4 w-4 text-destructive" />
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all-leads" className="mt-6">
          <LeadManagement />
        </TabsContent>

        <TabsContent value="old-unassigned" className="mt-6">
          <OldUnassignedLeads />
        </TabsContent>
      </Tabs>
    </div>
  );
}
