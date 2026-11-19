"use client"

import { useState } from "react"
import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ResourceManager } from "@/components/admin/cms/resource-manager"

export default function CustomersAdmin() {
  const [detail, setDetail] = useState(null)
  const view = async (row) => {
    const res = await fetch(`/api/admin/cms/customers/${row._id}`)
    setDetail((await res.json()).data)
  }
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Customers</h1><p className="text-muted-foreground">App customers. Suspend or reinstate accounts, review the deletion queue (filter: pending_deletion), and see consent history.</p></div>
      <ResourceManager resource="customers" title="Customer" canCreate={false} canDelete={false}
        fields={[{ name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "suspended", label: "Suspended" }, { value: "pending_deletion", label: "Pending deletion" }] }]}
        filters={[{ name: "status", label: "Status", options: ["active", "suspended", "pending_deletion", "deleted"] }]}
        columns={[{ key: "name", label: "Name" }, { key: "phone", label: "Phone" }, { key: "status", label: "Status", badge: true }, { label: "Joined", render: (r) => new Date(r.createdAt).toLocaleDateString() }]}
        rowActions={(row) => <Button variant="ghost" size="icon" aria-label="View" onClick={() => view(row)}><Eye className="h-4 w-4" /></Button>} />
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader><DialogTitle>{detail?.name || "Customer"} · {detail?.phone}</DialogTitle></DialogHeader>
          {detail ? (
            <div className="space-y-4 text-sm">
              <div className="flex gap-2"><Badge>{detail.status}</Badge>{detail.deletion?.scheduledFor ? <span>Deletion scheduled {new Date(detail.deletion.scheduledFor).toLocaleDateString()}</span> : null}</div>
              <section><h3 className="mb-1 font-semibold">Addresses ({detail.addresses.length})</h3>{detail.addresses.map((a) => <p key={a._id}>{a.label}: {a.line1}, {a.city} {a.pincode}</p>)}</section>
              <section><h3 className="mb-1 font-semibold">Recent bookings ({detail.bookings.length})</h3>{detail.bookings.map((b) => <p key={b._id}>{b.displayId} · {b.service?.name} · {b.lastProjectedStatus} · {b.pricing?.total?.display}</p>)}</section>
              <section><h3 className="mb-1 font-semibold">Consent history</h3>{detail.consents.length === 0 ? <p className="text-muted-foreground">None recorded</p> : detail.consents.map((c) => <p key={c._id}>{new Date(c.at).toLocaleString()} · {c.type} v{c.version} · {c.granted ? "granted" : "withdrawn"}</p>)}</section>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
