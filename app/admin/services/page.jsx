"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ResourceManager } from "@/components/admin/cms/resource-manager"

const STATUS = [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }, { value: "hidden", label: "Hidden" }]
const TAX = [{ value: "gst18", label: "GST 18%" }, { value: "gst0", label: "GST 0%" }]

const categoryFields = [
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug (unique id)", type: "text" },
  { name: "iconUrl", label: "Icon", type: "image" },
  { name: "imageUrl", label: "Image", type: "image" },
  { name: "sortOrder", label: "Sort order", type: "number", default: 0 },
  { name: "status", label: "Status", type: "select", options: STATUS, default: "published" },
  { name: "taxClass", label: "Tax class", type: "select", options: TAX, default: "gst18" },
]

const serviceFields = [
  { name: "categoryId", label: "Category", type: "ref", ref: { resource: "categories", label: "name" } },
  { name: "name", label: "Name", type: "text" },
  { name: "slug", label: "Slug (unique id)", type: "text" },
  { name: "shortDescription", label: "Short description", type: "text" },
  { name: "description", label: "Description", type: "textarea" },
  { name: "imageUrl", label: "Main image", type: "image" },
  { name: "gallery", label: "Gallery image URLs (one per line)", type: "list" },
  { name: "inclusions", label: "What's included (one per line)", type: "list" },
  { name: "exclusions", label: "What's not included (one per line)", type: "list" },
  { name: "howItWorks", label: "How it works (one per line)", type: "list" },
  { name: "warranty", label: "Warranty", type: "text" },
  { name: "badges", label: "Badges (one per line)", type: "list" },
  { name: "subServices", label: "Options & prices (JSON)", type: "json", default: [], hint: 'Array of { "key": "ac-service", "name": "AC Service", "pricing": { "type": "fixed|from|quote", "amountPaise": 59900 }, "status": "active" }. Prices are in paise (₹599 = 59900). Every price change is recorded in the Activity log.' },
  { name: "faqs", label: "FAQs (JSON)", type: "json", default: [], hint: 'Array of { "question": "…", "answer": "…" }' },
  { name: "popularityScore", label: "Popularity (for ordering)", type: "number", default: 0 },
  { name: "taxClass", label: "Tax class override", type: "select", options: TAX },
  { name: "status", label: "Status", type: "select", options: STATUS, default: "published" },
]

export default function CatalogueAdmin() {
  return (
    <div className="space-y-4">
      <div><h1 className="text-2xl font-bold">Catalogue</h1><p className="text-muted-foreground">Categories, services, options and prices shown in the customer app. Changes go live immediately.</p></div>
      <Tabs defaultValue="services">
        <TabsList><TabsTrigger value="services">Services</TabsTrigger><TabsTrigger value="categories">Categories</TabsTrigger></TabsList>
        <TabsContent value="services">
          <ResourceManager resource="services" title="Service" fields={serviceFields} filters={[{ name: "status", label: "Status", options: ["published", "draft", "hidden"] }]}
            columns={[{ key: "name", label: "Name" }, { key: "slug", label: "Slug" }, { label: "Options", render: (r) => r.subServices?.length ?? 0 }, { key: "status", label: "Status", badge: true }, { label: "Rating", render: (r) => (r.ratingCount ? `${r.ratingAvg} (${r.ratingCount})` : "—") }]} />
        </TabsContent>
        <TabsContent value="categories">
          <ResourceManager resource="categories" title="Category" fields={categoryFields} filters={[{ name: "status", label: "Status", options: ["published", "draft", "hidden"] }]}
            columns={[{ key: "name", label: "Name" }, { key: "slug", label: "Slug" }, { key: "sortOrder", label: "Order" }, { key: "status", label: "Status", badge: true }]} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
