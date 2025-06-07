import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { MoreHorizontal } from "lucide-react"

export function RecentBookings() {
  const bookings = [
    {
      id: "B-1234",
      customer: "Rahul Sharma",
      service: "Plumbing",
      date: "2023-05-12",
      status: "Completed",
      amount: "₹1,200",
    },
    {
      id: "B-1235",
      customer: "Priya Patel",
      service: "Electrical",
      date: "2023-05-12",
      status: "In Progress",
      amount: "₹1,500",
    },
    {
      id: "B-1236",
      customer: "Amit Kumar",
      service: "Cleaning",
      date: "2023-05-11",
      status: "Pending",
      amount: "₹2,000",
    },
    {
      id: "B-1237",
      customer: "Neha Singh",
      service: "Painting",
      date: "2023-05-11",
      status: "Completed",
      amount: "₹5,500",
    },
    {
      id: "B-1238",
      customer: "Vikram Mehta",
      service: "Plumbing",
      date: "2023-05-10",
      status: "Cancelled",
      amount: "₹800",
    },
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "bg-green-500"
      case "In Progress":
        return "bg-blue-500"
      case "Pending":
        return "bg-yellow-500"
      case "Cancelled":
        return "bg-red-500"
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
          <tbody>
            {bookings.map((booking) => (
              <tr key={booking.id} className="border-b">
                <td className="p-2">{booking.id}</td>
                <td className="p-2">{booking.customer}</td>
                <td className="p-2">{booking.service}</td>
                <td className="p-2">
                  <Badge variant="outline" className="font-normal">
                    <span className={`mr-1 h-2 w-2 rounded-full ${getStatusColor(booking.status)}`}></span>
                    {booking.status}
                  </Badge>
                </td>
                <td className="p-2 text-right">{booking.amount}</td>
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
          View all bookings
        </Button>
      </div>
    </div>
  )
}
