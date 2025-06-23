"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { 
  Users, 
  UserCheck, 
  UserX, 
  TrendingUp
} from "lucide-react"

export function LeadStats({ summary = {} }) {
  const stats = useMemo(() => {
    const total = summary.total || 0
    const assigned = summary.assigned || 0
    const unassigned = summary.unassigned || 0
    const statusBreakdown = summary.statusBreakdown || {}

    // Calculate percentages
    const assignedPercentage = total > 0 ? Math.round((assigned / total) * 100) : 0
    const unassignedPercentage = total > 0 ? Math.round((unassigned / total) * 100) : 0

    // Average lead age
    const avgAge = Object.values(statusBreakdown).reduce((sum, status) => {
      return sum + (status.avgAge || 0)
    }, 0) / Object.keys(statusBreakdown).length || 0

    return {
      total,
      assigned,
      unassigned,
      assignedPercentage,
      unassignedPercentage,
      avgAge: Math.round(avgAge)
    }
  }, [summary])



  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Leads</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.total}</div>
          <p className="text-xs text-muted-foreground">
            All leads in the system
          </p>
        </CardContent>
      </Card>

      {/* Assigned Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Assigned Leads</CardTitle>
          <UserCheck className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.assigned}</div>
          <div className="flex items-center space-x-2">
            <Progress value={stats.assignedPercentage} className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {stats.assignedPercentage}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Unassigned Leads */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unassigned Leads</CardTitle>
          <UserX className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.unassigned}</div>
          <div className="flex items-center space-x-2">
            <Progress value={stats.unassignedPercentage} className="flex-1" />
            <span className="text-xs text-muted-foreground">
              {stats.unassignedPercentage}%
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Average Lead Age */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Lead Age</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.avgAge}</div>
          <p className="text-xs text-muted-foreground">
            Days since creation
          </p>
        </CardContent>
      </Card>


    </div>
  )
} 