"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import dashboardService from "@/lib/services/dashboardService";
import { MoreHorizontal } from "lucide-react"
import { useEffect } from "react";
import { useState } from "react";
import { LoadingTableSkeleton } from "@/components/loading-skeleton/loading-skeleton";

export function RecentLeads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchLeads = async () => {
      const response = await dashboardService.getRecentLeads();
      setLeads(response.data);
      console.log(response.data)
    };
    fetchLeads();
    setLoading(false);
  }, []);

  

  const getStatusColor = (status) => {
    switch (status) {
      case "available":
        return "bg-green-500"
      case "assigned":
        return "bg-blue-500"
      case "unassigned":
        return "bg-yellow-500"
      case "taken":
        return "bg-red-500"
      case "contacted":
        return "bg-purple-500"
      case "interested":
        return "bg-orange-500"
      case "not_interested":
        return "bg-pink-500"
      case "scheduled":
        return "bg-gray-500"
      case "completed":
        return "bg-green-500"
      case "cancelled":
        return "bg-gray-500"
      default:
        return "bg-gray-500"
    }
  }

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left font-medium p-2">ID</th>
              <th className="text-left font-medium p-2">Customer</th>
              <th className="text-left font-medium p-2">Service</th>
              <th className="text-left font-medium p-2">Status</th>
              <th className="text-right font-medium p-2">Amount</th>
              <th className="text-right font-medium p-2"></th>
            </tr>
          </thead>
          {loading ? (
            <LoadingTableSkeleton row={5} col={6}/>
          ) : leads.length > 0 ? (
            <tbody>
              {leads.map((lead) => ( 
                <tr key={lead._id} className="border-b">
                  <td className="p-2">{lead._id.slice(0,10)}...</td>
                  <td className="p-2">{lead.customerName}</td>
                  <td className="p-2">{lead.service}</td>
                  <td className="p-2">
                    <Badge variant="outline" className="font-normal">
                      <span className={`mr-1 h-2 w-2 rounded-full ${getStatusColor(lead.status)}`}></span>
                      {lead.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-right">{lead.price}</td>
                  <td className="p-2 text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          ) : (
            <tbody>
              <tr>
                <td colSpan={6} className="text-center">No leads found</td>
              </tr>
            </tbody>
          )}
        </table>
      </div>
      <div className="flex justify-center">

        <Button variant="outline" size="sm" >
          View all leads
        </Button>
      </div>
    </div>
  )
}
