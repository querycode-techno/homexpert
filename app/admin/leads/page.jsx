import { LeadManagement } from "@/components/admin/lead-management"
import { Suspense } from "react"

function LeadManagementFallback() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Lead Management</h1>
        <p className="text-muted-foreground">Loading lead management...</p>
      </div>
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    </div>
  )
}

export default function LeadsPage() {
  return (
    <Suspense fallback={<LeadManagementFallback />}>
      <LeadManagement />
    </Suspense>
  )
}
