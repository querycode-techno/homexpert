import PermissionDebug from "@/components/debug/PermissionDebug"

export default function PermissionDebugPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Permission Debug</h1>
        <p className="text-muted-foreground">
          Test and monitor permission system performance after optimization.
        </p>
      </div>
      
      <PermissionDebug />
    </div>
  )
} 