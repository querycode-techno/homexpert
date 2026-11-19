"use client"

import { ResourceManager } from "@/components/admin/cms/resource-manager"

export default function ReviewsAdmin() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Review moderation</h1><p className="text-muted-foreground">Reviews are published on submission. Reject abusive or fake ones; service ratings are recalculated automatically.</p></div>
      <ResourceManager resource="reviews" title="Review" canCreate={false} canDelete={false}
        fields={[{ name: "status", label: "Status", type: "select", options: [{ value: "published", label: "Published" }, { value: "rejected", label: "Rejected" }, { value: "pending", label: "Pending" }] }]}
        filters={[{ name: "status", label: "Status", options: ["published", "rejected", "pending"] }]}
        columns={[{ label: "Rating", render: (r) => "★".repeat(r.rating) }, { key: "authorName", label: "Author" }, { key: "text", label: "Review" }, { key: "status", label: "Status", badge: true }, { label: "Date", render: (r) => new Date(r.createdAt).toLocaleDateString() }]} />
    </div>
  )
}
