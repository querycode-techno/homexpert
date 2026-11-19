"use client"

import { ResourceManager } from "@/components/admin/cms/resource-manager"

export default function ActivityAdmin() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Activity log</h1><p className="text-muted-foreground">Immutable record of every admin change to customer-app data.</p></div>
      <ResourceManager resource="audit-logs" title="Activity" canCreate={false} canEdit={false} canDelete={false}
        columns={[{ label: "When", render: (r) => new Date(r.at).toLocaleString() }, { label: "Who", render: (r) => `${r.actor?.name || "—"} (${r.actor?.role || ""})` }, { key: "action", label: "Action", badge: true }, { key: "entity", label: "Section" }, { key: "entityId", label: "Item" }, { key: "reason", label: "Reason" }]} />
    </div>
  )
}
