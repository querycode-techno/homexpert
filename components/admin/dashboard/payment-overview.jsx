"use client"

import dashboardService from "@/lib/services/dashboardService"
import { set } from "mongoose"
import { useEffect, useState } from "react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export function PaymentOverview() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      const response = await dashboardService.getRevenueChartData()
      if (response.data && response.data.revenueByService) {
        // Transform the data to match the chart format
        let chartData = response.data.revenueByService.map((item, index) => ({
          name: item.service,
          value: parseFloat(item.percentage),
          revenue: item.revenue,
          count: item.count
        }))

        // If more than 4 services, show top 4 and group rest as "Other"
        if (chartData.length > 4) {
          // Sort by percentage (descending)
          chartData.sort((a, b) => b.value - a.value)
          
          // Get top 4
          const top4 = chartData.slice(0, 4)
          
          // Calculate sum of remaining percentages
          const otherPercentage = chartData.slice(4).reduce((sum, item) => sum + item.value, 0)
          
          // Create "Other" entry if there are remaining items
          if (otherPercentage > 0) {
            const otherEntry = {
              name: "Other",
              value: parseFloat(otherPercentage.toFixed(2)),
              revenue: chartData.slice(4).reduce((sum, item) => sum + item.revenue, 0),
              count: chartData.slice(4).reduce((sum, item) => sum + item.count, 0)
            }
            chartData = [...top4, otherEntry]
          } else {
            chartData = top4
          }
        }
        
        setData(chartData)
      }
      console.log(response.data)
    }
    fetchData()
    setLoading(false)
    setMounted(true)
  }, [])

  const color = ["#0959AF", "#43B02A", "#FF6B6B", "#FFD166", "#06D6A0"]

  if (!mounted) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={color[index % color.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
