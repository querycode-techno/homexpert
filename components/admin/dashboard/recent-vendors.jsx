import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

export function RecentVendors() {
  const vendors = [
    {
      id: "V-1234",
      name: "Rajesh Plumbing Services",
      service: "Plumbing",
      joinDate: "2023-05-10",
      status: "Active",
      subscription: "3 Month",
    },
    {
      id: "V-1235",
      name: "Kumar Electricals",
      service: "Electrical",
      joinDate: "2023-05-09",
      status: "Active",
      subscription: "1 Month",
    },
    {
      id: "V-1236",
      name: "Clean Home Services",
      service: "Cleaning",
      joinDate: "2023-05-08",
      status: "Inactive",
      subscription: "Expired",
    },
    {
      id: "V-1237",
      name: "Perfect Painters",
      service: "Painting",
      joinDate: "2023-05-07",
      status: "Active",
      subscription: "3 Month",
    },
    {
      id: "V-1238",
      name: "Fix It All",
      service: "Multiple",
      joinDate: "2023-05-06",
      status: "Pending",
      subscription: "None",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "Active":
        return "bg-green-500"
      case "Inactive":
        return "bg-red-500"
      case "Pending":
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
              <th className="text-right font-medium p-2">Subscription</th>
              <th className="text-right font-medium p-2"></th>
            </tr>
          </thead>
          <tbody>
            {vendors.map((vendor) => (
              <tr key={vendor.id} className="border-b">
                <td className="p-2">{vendor.id}</td>
                <td className="p-2">{vendor.name}</td>
                <td className="p-2">{vendor.service}</td>
                <td className="p-2">
                  <Badge variant="outline" className="font-normal">
                    <span className={`mr-1 h-2 w-2 rounded-full ${getStatusColor(vendor.status)}`}></span>
                    {vendor.status}
                  </Badge>
                </td>
                <td className="p-2 text-right">{vendor.subscription}</td>
                <td className="p-2 text-right">
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
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
