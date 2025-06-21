"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RolesTable } from "@/components/roles-permissions/roles-table"
import { PermissionsTable } from "@/components/roles-permissions/permissions-table"

export function RolesPermissions() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Roles & Permissions</h1>
        <p className="text-muted-foreground">Manage user roles and their permissions.</p>
      </div>

      <Tabs defaultValue="roles" className="space-y-6">
        <TabsList>
          <TabsTrigger value="roles">Roles</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
        </TabsList>

        <TabsContent value="roles">
          <RolesTable />
        </TabsContent>

        <TabsContent value="permissions">
          <PermissionsTable />
        </TabsContent>
      </Tabs>
    </div>
  )
}
