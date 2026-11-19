"use client"

import { ResourceManager } from "@/components/admin/cms/resource-manager"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const HINT = "Known keys: version_policy ({android:{min,latest,storeUrl},ios:{…},message}), maintenance ({enabled,message,until}), flags ({name:true}), support ({phone,whatsapp,hours,open:{start,end,days}}), legal (termsUrl,privacyUrl,refundUrl,termsVersion,privacyVersion), limits, cancellation ({freeWindowMinutes,lateFeePaise}), payment ({autoConfirmHours,toleranceBps}), tax, support_topics ({items}), faqs ({items})."

export default function AppConfigAdmin() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">App configuration</h1><p className="text-muted-foreground">Version policy, maintenance mode, flags, support hours, legal versions, cancellation and payment rules, FAQs. Cached for up to a minute.</p></div>
      <Tabs defaultValue="config">
        <TabsList><TabsTrigger value="config">Settings</TabsTrigger><TabsTrigger value="promos">Promo codes</TabsTrigger><TabsTrigger value="fees">Fees</TabsTrigger></TabsList>
        <TabsContent value="config">
          <ResourceManager resource="app-config" title="Setting" canDelete
            fields={[{ name: "key", label: "Key", type: "text", hint: HINT }, { name: "value", label: "Value (JSON)", type: "json", default: {} }]}
            columns={[{ key: "key", label: "Key" }, { label: "Value", render: (r) => <code className="text-xs">{JSON.stringify(r.value).slice(0, 90)}</code> }]} />
        </TabsContent>
        <TabsContent value="promos">
          <ResourceManager resource="promos" title="Promo code" filters={[{ name: "status", label: "Status", options: ["active", "paused"] }]}
            fields={[
              { name: "code", label: "Code", type: "text", hint: "Upper-case letters and digits, up to 24." },
              { name: "title", label: "Title shown in Offers", type: "text" },
              { name: "description", label: "Description", type: "textarea" },
              { name: "type", label: "Type", type: "select", options: [{ value: "flat", label: "Flat amount off" }, { value: "pct", label: "Percentage off" }], default: "flat" },
              { name: "valuePaise", label: "Flat amount (paise)", type: "number" },
              { name: "pct", label: "Percentage", type: "number" },
              { name: "maxDiscountPaise", label: "Maximum discount (paise)", type: "number" },
              { name: "minSubtotalPaise", label: "Minimum cart value (paise)", type: "number", default: 0 },
              { name: "validFrom", label: "Starts", type: "date" },
              { name: "validUntil", label: "Ends", type: "date" },
              { name: "totalLimit", label: "Total uses (budget cap)", type: "number" },
              { name: "perCustomerLimit", label: "Uses per customer", type: "number", default: 1 },
              { name: "showInOffers", label: "Show in the Offers list", type: "switch", default: true },
              { name: "status", label: "Status", type: "select", options: [{ value: "active", label: "Active" }, { value: "paused", label: "Paused" }], default: "active" },
            ]}
            columns={[{ key: "code", label: "Code" }, { key: "title", label: "Title" }, { label: "Discount", render: (r) => (r.type === "pct" ? `${r.pct}%` : `₹${(r.valuePaise || 0) / 100}`) }, { label: "Used", render: (r) => `${r.usedCount}${r.totalLimit ? ` / ${r.totalLimit}` : ""}` }, { key: "status", label: "Status", badge: true }]} />
        </TabsContent>
        <TabsContent value="fees">
          <ResourceManager resource="fee-rules" title="Fee rule"
            fields={[{ name: "code", label: "Code", type: "text" }, { name: "label", label: "Label shown to customers", type: "text" }, { name: "type", label: "Type", type: "select", options: [{ value: "flat", label: "Flat amount" }, { value: "pct", label: "Percentage of subtotal" }], default: "flat" }, { name: "amountPaise", label: "Flat amount (paise)", type: "number" }, { name: "pct", label: "Percentage", type: "number" }, { name: "active", label: "Active", type: "switch", default: true }]}
            columns={[{ key: "code", label: "Code" }, { key: "label", label: "Label" }, { key: "type", label: "Type", badge: true }, { label: "Value", render: (r) => (r.type === "pct" ? `${r.pct}%` : `₹${(r.amountPaise || 0) / 100}`) }, { label: "Active", render: (r) => (r.active ? "Yes" : "No") }]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
