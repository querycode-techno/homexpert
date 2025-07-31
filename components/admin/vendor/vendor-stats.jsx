"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  TrendingUp
} from "lucide-react"

export function VendorStats({ stats = {} }) {
  const {
    pending = 0,
    active = 0,
    suspended = 0,
    inactive = 0,
    incomplete = 0
  } = stats

  const total = pending + active + suspended + inactive + incomplete

  const statCards = [
    {
      title: "Total Vendors",
      value: total,
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Active",
      value: active,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Pending",
      value: pending,
      icon: Clock,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50"
    },
    {
      title: "Suspended",
      value: suspended,
      icon: XCircle,
      color: "text-red-600",
      bgColor: "bg-red-50"
    },
    {
      title: "Incomplete",
      value: incomplete,
      icon: AlertCircle,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon
        const percentage = total > 0 ? Math.round((stat.value / total) * 100) : 0
        
        return (
          <Card key={index}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {percentage > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        {percentage}%
                      </Badge>
                    )}
                  </div>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
} 