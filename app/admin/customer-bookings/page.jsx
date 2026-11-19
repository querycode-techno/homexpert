"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { toast } from "sonner"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

const STATUSES = ["pending", "available", "assigned", "taken", "contacted", "interested", "not_interested", "scheduled", "in_progress", "completed", "cancelled", "expired"]
const age = (d) => { const m = Math.floor((Date.now() - new Date(d)) / 60000); return m < 60 ? `${m}m` : m < 1440 ? `${Math.floor(m / 60)}h` : `${Math.floor(m / 1440)}d` }

export default function CustomerBookingsAdmin() {
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({ page: 1, total: 0, limit: 25 })
  const [q, setQ] = useState("")
  const [status, setStatus] = useState("")
  const [detail, setDetail] = useState(null)
  const [override, setOverride] = useState({ leadStatus: "", reason: "" })

  const load = useCallback(async (page = 1) => {
    const sp = new URLSearchParams({ page: String(page) })
    if (q) sp.set("q", q)
    if (status) sp.set("leadStatus", status)
    const j = await (await fetch(`/api/admin/requests?${sp}`)).json()
    if (j.success) { setRows(j.data); setMeta(j.meta) }
  }, [q, status])
  useEffect(() => { load(1) }, [load])

  const open = async (row) => { setOverride({ leadStatus: "", reason: "" }); setDetail((await (await fetch(`/api/admin/requests/${row._id}`)).json()).data) }
  const apply = async () => {
    const res = await fetch(`/api/admin/requests/${detail.request._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(override) })
    const j = await res.json()
    if (!res.ok) return toast.error(j.error)
    toast.success("Status updated"); setDetail(null); load(meta.page)
  }

  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Customer bookings</h1><p className="text-muted-foreground">Requests from the customer app and the lead each one created. Assign or re-assign vendors in <Link href="/admin/leads" className="text-primary underline">Lead Management</Link>.</p></div>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3"><CardTitle>Bookings</CardTitle>
          <div className="flex gap-2"><Input className="w-56" placeholder="Search id, service, name, phone" value={q} onChange={(e) => setQ(e.target.value)} />
            <select className="h-10 rounded-md border bg-background px-3 text-sm" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">Lead status: all</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>ID</TableHead><TableHead>Service</TableHead><TableHead>Customer</TableHead><TableHead>Slot</TableHead><TableHead>Lead status</TableHead><TableHead>Vendor</TableHead><TableHead>Waiting</TableHead><TableHead /></TableRow></TableHeader>
            <TableBody>
              {rows.map((r) => (
                <TableRow key={r._id}>
                  <TableCell className="font-mono text-xs">{r.displayId}</TableCell><TableCell>{r.service?.name}</TableCell>
                  <TableCell>{r.customer?.name}<div className="text-xs text-muted-foreground">{r.customer?.phone}</div></TableCell>
                  <TableCell>{r.slot?.label}<div className="text-xs text-muted-foreground">{r.slot?.start ? new Date(r.slot.start).toLocaleDateString() : ""}</div></TableCell>
                  <TableCell><Badge variant="secondary">{r.leadStatus}</Badge>{r.quotePending ? <Badge className="ml-1" variant="destructive">quote pending</Badge> : null}</TableCell>
                  <TableCell>{r.vendor?.name || "—"}</TableCell>
                  <TableCell className={r.leadStatus === "pending" && Date.now() - new Date(r.createdAt) > 10 * 60000 ? "font-semibold text-red-600" : ""}>{["pending", "available"].includes(r.leadStatus) ? age(r.createdAt) : "—"}</TableCell>
                  <TableCell><Button size="sm" variant="outline" onClick={() => open(r)}>Open</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-4 flex justify-between text-sm text-muted-foreground"><span>{meta.total} total · bookings waiting over 10 min are highlighted</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={meta.page <= 1} onClick={() => load(meta.page - 1)}>Previous</Button><Button size="sm" variant="outline" disabled={meta.page * meta.limit >= meta.total} onClick={() => load(meta.page + 1)}>Next</Button></div></div>
        </CardContent>
      </Card>
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{detail?.request.displayId} · {detail?.request.service?.name}</DialogTitle></DialogHeader>
          {detail ? (
            <div className="space-y-4 text-sm">
              <p>Lead status: <Badge>{detail.lead?.status}</Badge> · Customer-facing: {detail.request.lastProjectedStatus}</p>
              <p>{detail.request.addressSnapshot?.line1}, {detail.request.addressSnapshot?.city} {detail.request.addressSnapshot?.pincode} · {detail.request.addressSnapshot?.contactName} {detail.request.addressSnapshot?.contactPhone}</p>
              <p>Estimate {detail.request.pricing?.total?.display}{detail.lead?.finalAmountPaise != null ? ` · Final ₹${detail.lead.finalAmountPaise / 100}` : ""} · Payment {detail.lead?.appPaymentStatus || detail.request.payment?.status}</p>
              {detail.request.notes ? <p>Customer note: {detail.request.notes}</p> : null}
              <section><h3 className="mb-1 font-semibold">Timeline</h3>{detail.events.map((e) => <p key={e._id}>{new Date(e.at).toLocaleString()} · {e.type}{e.to ? ` → ${e.to}` : ""}{e.meta?.reason ? ` (${e.meta.reason})` : ""}</p>)}</section>
              <section className="space-y-2 rounded border p-3"><h3 className="font-semibold">Override status</h3>
                <select className="h-10 w-full rounded-md border bg-background px-3" value={override.leadStatus} onChange={(e) => setOverride((o) => ({ ...o, leadStatus: e.target.value }))}><option value="">Choose new lead status…</option>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select>
                <Textarea placeholder="Reason (required, recorded in the activity log)" value={override.reason} onChange={(e) => setOverride((o) => ({ ...o, reason: e.target.value }))} /></section>
            </div>
          ) : null}
          <DialogFooter><Button variant="outline" onClick={() => setDetail(null)}>Close</Button><Button disabled={!override.leadStatus || !override.reason.trim()} onClick={apply}>Apply override</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
