import { Suspense } from "react"
import { CityManagement } from "@/components/admin/city-management"

export default function CitiesPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CityManagement />
    </Suspense>
  )
}
