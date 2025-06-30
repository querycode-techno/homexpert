"use client"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"
import { use } from "react";
import { useState , useEffect} from "react";
import dashboardService from "@/lib/services/dashboardService";
import { LoadingTableSkeleton } from "@/components/loading-skeleton/loading-skeleton";

export function RecentVendors() {

  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const fetchVendors = async () => {
      const response = await dashboardService.getRecentVendors();
      setVendors(response.data);
      console.log(response.data)
    };

    fetchVendors();
    setLoading(false);
  }, []);

  
  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return "bg-green-500"
      case "inactive":
        return "bg-red-500"
      case "pending":
        return "bg-yellow-500"
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
              <th className="text-left font-medium p-2">Name</th>
              <th className="text-left font-medium p-2">Service</th>
              <th className="text-left font-medium p-2">Status</th>
              <th className="text-right font-medium p-2"></th>
            </tr>
          </thead>
          {loading ? (
            <LoadingTableSkeleton row={5} col={5}/>
          ) : (
            <tbody>
              {vendors.length > 0 ? vendors.map((vendor) => (
                <tr key={vendor._id} className="border-b">
                  <td className="p-2">{vendor._id.slice(0,10)}...</td>
                  <td className="p-2">{vendor.businessName}</td>
                  <td className="p-2">{vendor.services.length > 0 ? "Multiple":  vendor.services[0]}</td>
                  <td className="p-2 text-right">
                    <Badge variant="outline" className="font-normal">
                      <span className={`mr-1 h-2 w-2 rounded-full ${getStatusColor(vendor.status)}`}></span>
                      {vendor.status}
                    </Badge>
                  </td>
                  <td className="p-2 text-right">
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
                )
              ) : (
                <tr>
                  <td colSpan={5} className="text-center">No vendors found</td>
                </tr>
              )}
            </tbody>
          )}
        </table>
      </div>
      <div className="flex justify-center">
        <Button variant="outline" size="sm">
          View all vendors
        </Button>
      </div>
    </div>
  )
}
