"use client"

import { useEffect, useState } from "react"
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts"

export function PaymentOverview() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const data = [
    { name: "Plumbing", value: 35, color: "#0959AF" },
    { name: "Electrical", value: 25, color: "#43B02A" },
    { name: "Cleaning", value: 20, color: "#FF6B6B" },
    { name: "Painting", value: 15, color: "#FFD166" },
    { name: "Other", value: 5, color: "#06D6A0" },
  ]

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
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => `${value}%`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
