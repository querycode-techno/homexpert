"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceManager } from "@/components/admin/cms/resource-manager"

export default function CoverageAdmin() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Coverage & slots</h1><p className="text-muted-foreground">Which cities and pincodes are served, and the time windows customers can book.</p></div>
      <Tabs defaultValue="areas">
        <TabsList><TabsTrigger value="areas">Pincodes</TabsTrigger><TabsTrigger value="cities">Cities</TabsTrigger><TabsTrigger value="slots">Slot windows</TabsTrigger></TabsList>
        <TabsContent value="areas">
          <ResourceManager resource="service-areas" title="Pincode" filters={[{ name: "status", label: "Status", options: ["live", "waitlist", "closed"] }]}
            fields={[{ name: "pincode", label: "Pincode", type: "text" }, { name: "cityId", label: "City", type: "ref", ref: { resource: "cities", label: "name" } }, { name: "status", label: "Status", type: "select", options: [{ value: "live", label: "Live (bookable)" }, { value: "waitlist", label: "Coming soon (waitlist)" }, { value: "closed", label: "Closed" }], default: "live" }]}
            columns={[{ key: "pincode", label: "Pincode" }, { key: "status", label: "Status", badge: true }]} />
        </TabsContent>
        <TabsContent value="cities">
          <ResourceManager resource="cities" title="City" fields={[{ name: "name", label: "Name", type: "text" }, { name: "state", label: "State", type: "text" }, { name: "isActive", label: "Active", type: "switch", default: true }]}
            columns={[{ key: "name", label: "City" }, { key: "state", label: "State" }, { label: "Active", render: (r) => (r.isActive ? "Yes" : "No") }]} />
        </TabsContent>
        <TabsContent value="slots">
          <ResourceManager resource="slot-templates" title="Slot template"
            fields={[
              { name: "cityId", label: "City (blank = default for all cities)", type: "ref", ref: { resource: "cities", label: "name" } },
              { name: "windows", label: "Windows (JSON)", type: "json", default: [{ start: "09:00", end: "11:00", label: "9 AM – 11 AM" }], hint: "IST times, 24-hour." },
              { name: "leadTimeMinutes", label: "Lead time (minutes before a window)", type: "number", default: 120 },
              { name: "maxPerWindow", label: "Capacity per window", type: "number", default: 20 },
              { name: "daysAhead", label: "Days ahead", type: "number", default: 14 },
              { name: "holidays", label: "Holidays YYYY-MM-DD (one per line)", type: "list" },
            ]}
            columns={[{ label: "Scope", render: (r) => (r.cityId ? "City" : "Default") }, { label: "Windows", render: (r) => r.windows?.length }, { key: "leadTimeMinutes", label: "Lead (min)" }, { key: "maxPerWindow", label: "Capacity" }]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
