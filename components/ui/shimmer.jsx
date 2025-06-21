import { cn } from "@/lib/utils"

export function Shimmer({ className, ...props }) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-muted",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite] before:bg-gradient-to-r before:from-transparent before:via-white/60 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export function MenuItemShimmer({ collapsed = false }) {
  return (
    <div className="flex items-center gap-3 rounded-md px-3 py-2 animate-pulse">
      {/* Icon shimmer */}
      <Shimmer className="h-5 w-5 rounded-sm" />
      {/* Text shimmer - only show when not collapsed */}
      {!collapsed && <Shimmer className="h-4 flex-1 max-w-24" />}
    </div>
  )
}

export function SidebarMenuShimmer({ collapsed = false, itemCount = 6 }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: itemCount }).map((_, index) => (
        <MenuItemShimmer key={index} collapsed={collapsed} />
      ))}
    </div>
  )
}

export function UserProfileShimmer({ collapsed = false }) {
  return (
    <div className="border-t p-4 animate-pulse">
      <div className="flex items-center gap-3">
        {/* Avatar shimmer */}
        <Shimmer className="h-9 w-9 rounded-full flex-shrink-0" />
        {/* User info shimmer - only show when not collapsed */}
        {!collapsed && (
          <div className="flex flex-col gap-2 flex-1">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-3 w-32" />
          </div>
        )}
      </div>
      {/* Logout button shimmer */}
      <Shimmer className="mt-4 h-8 w-full" />
    </div>
  )
}

export function TableShimmer({ rows = 5, columns = 4 }) {
  return (
    <div className="w-full">
      {/* Header shimmer */}
      <div className="flex gap-4 p-4 border-b">
        {Array.from({ length: columns }).map((_, index) => (
          <Shimmer key={`header-${index}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows shimmer */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={`row-${rowIndex}`} className="flex gap-4 p-4 border-b">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Shimmer key={`cell-${rowIndex}-${colIndex}`} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export function CardShimmer({ className }) {
  return (
    <div className={cn("p-6 border rounded-lg", className)}>
      <div className="space-y-4">
        <Shimmer className="h-6 w-3/4" />
        <Shimmer className="h-4 w-full" />
        <Shimmer className="h-4 w-2/3" />
        <div className="flex gap-2 mt-4">
          <Shimmer className="h-8 w-20" />
          <Shimmer className="h-8 w-16" />
        </div>
      </div>
    </div>
  )
}

export function PermissionMatrixShimmer({ roleCount = 4 }) {
  return (
    <div className="w-full">
      {/* Header shimmer */}
      <div className="flex gap-4 p-4 border-b bg-muted/50">
        <Shimmer className="h-4 w-60 flex-shrink-0" />
        {Array.from({ length: roleCount }).map((_, index) => (
          <div key={`role-header-${index}`} className="flex flex-col items-center gap-2 min-w-[120px]">
            <Shimmer className="h-5 w-16" />
            <Shimmer className="h-3 w-12" />
          </div>
        ))}
      </div>
      
      {/* Module groups shimmer */}
      {Array.from({ length: 4 }).map((_, moduleIndex) => (
        <div key={`module-${moduleIndex}`}>
          {/* Module header */}
          <div className="flex gap-4 p-3 bg-muted/30 border-b">
            <Shimmer className="h-4 w-32" />
            <Shimmer className="h-4 w-20" />
          </div>
          
          {/* Module permissions */}
          {Array.from({ length: 3 }).map((_, permIndex) => (
            <div key={`perm-${moduleIndex}-${permIndex}`} className="flex gap-4 p-3 border-b hover:bg-muted/20">
              <div className="flex flex-col gap-1 pl-3 w-60 flex-shrink-0">
                <Shimmer className="h-4 w-40" />
                <Shimmer className="h-3 w-24" />
              </div>
              {Array.from({ length: roleCount }).map((_, roleIndex) => (
                <div key={`check-${moduleIndex}-${permIndex}-${roleIndex}`} className="flex justify-center min-w-[120px]">
                  <Shimmer className="h-5 w-5 rounded-full" />
                </div>
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export function RolesTableShimmer() {
  return (
    <div className="w-full">
      {/* Header shimmer */}
      <div className="flex gap-4 p-3 border-b bg-muted/50">
        <Shimmer className="h-4 w-20" />
        <Shimmer className="h-4 w-32" />
        <Shimmer className="h-4 w-16" />
        <Shimmer className="h-4 w-16" />
        <Shimmer className="h-4 w-20" />
      </div>
      
      {/* Rows shimmer */}
      {Array.from({ length: 5 }).map((_, rowIndex) => (
        <div key={`role-row-${rowIndex}`} className="flex gap-4 p-3 border-b">
          {/* Role name with badge */}
          <div className="w-20">
            <Shimmer className="h-6 w-16 rounded-full" />
          </div>
          
          {/* Description */}
          <div className="w-32">
            <Shimmer className="h-4 w-28" />
          </div>
          
          {/* User count */}
          <div className="w-16 flex items-center gap-1">
            <Shimmer className="h-4 w-4 rounded" />
            <Shimmer className="h-4 w-6" />
          </div>
          
          {/* Type badge */}
          <div className="w-16">
            <Shimmer className="h-5 w-12 rounded-full" />
          </div>
          
          {/* Actions */}
          <div className="w-20 flex justify-end">
            <Shimmer className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  )
}

export default Shimmer 