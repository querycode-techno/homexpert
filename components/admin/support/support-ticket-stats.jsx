import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, Clock, CheckCircle, TrendingUp } from "lucide-react"

export default function SupportTicketStats({ stats }) {
  if (!stats) return null

  const statCards = [
    {
      title: "Open",
      value: stats.statusBreakdown?.open || 0,
      color: "text-blue-600",
      icon: AlertCircle,
      bgColor: "bg-blue-50"
    },
    {
      title: "In Progress", 
      value: stats.statusBreakdown?.in_progress || 0,
      color: "text-yellow-600",
      icon: Clock,
      bgColor: "bg-yellow-50"
    },
    {
      title: "Waiting for Admin",
      value: stats.statusBreakdown?.waiting_for_admin || 0,
      color: "text-orange-600", 
      icon: Clock,
      bgColor: "bg-orange-50"
    },
    {
      title: "Resolved",
      value: stats.statusBreakdown?.resolved || 0,
      color: "text-green-600",
      icon: CheckCircle,
      bgColor: "bg-green-50"
    },
    {
      title: "Overdue",
      value: stats.overdueTickets || 0,
      color: "text-red-600",
      icon: TrendingUp,
      bgColor: "bg-red-50"
    },
    {
      title: "Total",
      value: stats.totalTickets || 0,
      color: "text-gray-600",
      icon: TrendingUp,
      bgColor: "bg-gray-50"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        return (
          <Card key={index} className={stat.bgColor}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className={`text-2xl font-bold ${stat.color}`}>
                    {stat.value}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {stat.title}
                  </p>
                </div>
                <Icon className={`h-8 w-8 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 