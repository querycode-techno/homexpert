import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowUpRight, Users, Calendar, CreditCard, Briefcase } from "lucide-react"

export function DashboardStats() {
  const stats = [
    {
      title: "Total Bookings",
      value: "1,234",
      change: "+12%",
      icon: <Calendar className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: "Active Vendors",
      value: "342",
      change: "+5%",
      icon: <Users className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: "Total Revenue",
      value: "₹89,204",
      change: "+18%",
      icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
    },
    {
      title: "Active Leads",
      value: "573",
      change: "+7%",
      icon: <Briefcase className="h-5 w-5 text-muted-foreground" />,
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            {stat.icon}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="flex items-center text-xs text-green-500">
              {stat.change}
              <ArrowUpRight className="ml-1 h-3 w-3" />
              <span className="text-muted-foreground ml-1">from last month</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
