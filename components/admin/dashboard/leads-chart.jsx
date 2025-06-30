"use client"

import { useEffect, useState } from "react"
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import dashboardService from "@/lib/services/dashboardService"

export function LeadsChart() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState([])

  useEffect(() => {
    setLoading(true)
    const fetchData = async () => {
      const response = await dashboardService.getChartData()
      console.log(response.data)
      setData(response.data)
    }
    fetchData()
    setLoading(false)
  }, [])

  // const data = [
  //   { name: "Jan 1", bookings: 12, completed: 10 },
  //   { name: "Jan 2", bookings: 18, completed: 15 },
  //   { name: "Jan 3", bookings: 15, completed: 13 },
  //   { name: "Jan 4", bookings: 25, completed: 20 },
  //   { name: "Jan 5", bookings: 30, completed: 25 },
  //   { name: "Jan 6", bookings: 18, completed: 15 },
  //   { name: "Jan 7", bookings: 20, completed: 18 },
  //   { name: "Jan 8", bookings: 25, completed: 22 },
  //   { name: "Jan 9", bookings: 30, completed: 28 },
  //   { name: "Jan 10", bookings: 35, completed: 30 },
  //   { name: "Jan 11", bookings: 25, completed: 22 },
  //   { name: "Jan 12", bookings: 20, completed: 18 },
  //   { name: "Jan 13", bookings: 15, completed: 12 },
  //   { name: "Jan 14", bookings: 25, completed: 20 },
  //   { name: "Jan 15", bookings: 25, completed: 20 },
  // ]

  if (loading) {
    return (
      <div className="h-[300px] flex items-center justify-center">
        <p className="text-muted-foreground">Loading chart...</p>
      </div>
    )
  }

  return (
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip />
          <Bar dataKey="bookings" fill="#0959AF" radius={[4, 4, 0, 0]} />
          <Bar dataKey="completed" fill="#43B02A" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
