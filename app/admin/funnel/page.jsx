"use client"

import { useEffect, useState } from "react"
import { toast } from "sonner"
import { BellRing } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ResourceManager } from "@/components/admin/cms/resource-manager"

const LABELS = { service_view: "Viewed a service", add_to_cart: "Added to cart", cart_view: "Opened cart", checkout_start: "Started checkout", checkout_submit: "Submitted booking", booking_confirmed: "Booking confirmed" }

export default function FunnelAdmin() {
  const [data, setData] = useState(null)
  useEffect(() => { fetch("/api/admin/funnel?days=7").then((r) => r.json()).then((j) => setData(j.data)).catch(() => {}) }, [])
  const max = Math.max(1, ...(data?.steps.map((s) => s.sessions) || [1]))
  const recover = async (row) => {
    const res = await fetch(`/api/admin/cms/carts/${row._id}/recover`, { method: "POST" })
    const j = await res.json()
    toast[res.ok && j.data?.sent ? "success" : "message"](res.ok ? (j.data?.sent ? "Reminder sent" : "A reminder was already sent today") : j.error)
  }
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Carts & funnel</h1><p className="text-muted-foreground">Last 7 days, by app session.</p></div>
      <Card>
        <CardHeader><CardTitle>Booking funnel</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {data?.steps.map((s) => (
            <div key={s.step} className="flex items-center gap-3 text-sm"><span className="w-44">{LABELS[s.step]}</span><div className="h-3 flex-1 rounded bg-muted"><div className="h-3 rounded bg-primary" style={{ width: `${(s.sessions / max) * 100}%` }} /></div><span className="w-12 text-right">{s.sessions}</span></div>
          )) || "Loading…"}
        </CardContent>
      </Card>
      <ResourceManager resource="carts" title="Carts" canCreate={false} canEdit={false} canDelete={false}
        filters={[{ name: "status", label: "Status", options: ["active", "converted", "expired"] }]}
        columns={[{ label: "Items", render: (r) => r.lines?.length }, { key: "status", label: "Status", badge: true }, { label: "Last activity", render: (r) => new Date(r.lastActivityAt).toLocaleString() }]}
        rowActions={(row) => (row.lines?.length ? <Button variant="ghost" size="icon" aria-label="Send reminder" onClick={() => recover(row)}><BellRing className="h-4 w-4" /></Button> : null)} />
    </div>
  )
}
