"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCw, Clock, Database, User } from "lucide-react"
import { usePermissions } from "@/hooks/usePermissions"
import { getPermissionCacheStats, refreshUserPermissions } from "@/lib/refreshPermissions"
import { PERMISSIONS } from "@/lib/permissions"

export function PermissionDebug() {
  const { 
    permissions, 
    isLoading, 
    hasPermission, 
    user, 
    isAuthenticated,
    refreshPermissions 
  } = usePermissions()
  
  const [cacheStats, setCacheStats] = useState(null)
  const [testResults, setTestResults] = useState({})
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Update cache stats
  const updateCacheStats = () => {
    try {
      const stats = getPermissionCacheStats()
      setCacheStats(stats)
    } catch (error) {
      console.error('Error getting cache stats:', error)
    }
  }

  useEffect(() => {
    updateCacheStats()
    const interval = setInterval(updateCacheStats, 2000) // Update every 2 seconds
    return () => clearInterval(interval)
  }, [])

  // Test permission checking performance
  const runPerformanceTest = () => {
    const start = performance.now()
    
    // Test multiple permission checks
    const results = {
      dashboard: hasPermission(PERMISSIONS.DASHBOARD.VIEW),
      employees: hasPermission(PERMISSIONS.EMPLOYEES.VIEW),
      bookings: hasPermission(PERMISSIONS.BOOKINGS.VIEW),
      vendors: hasPermission(PERMISSIONS.VENDORS.VIEW),
      system: hasPermission(PERMISSIONS.SYSTEM.ROLE_MANAGEMENT)
    }
    
    const end = performance.now()
    const duration = end - start
    
    setTestResults({
      ...results,
      duration: duration.toFixed(2),
      timestamp: new Date().toLocaleTimeString()
    })
  }

  // Test refresh functionality
  const testRefresh = async () => {
    setIsRefreshing(true)
    try {
      await refreshPermissions()
      updateCacheStats()
    } catch (error) {
      console.error('Error testing refresh:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground">Please log in to view permission debug information.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* User Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">Email:</span>
            <span>{user?.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Role:</span>
            <Badge>{user?.role?.name || 'Unknown'}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Permissions Count:</span>
            <Badge variant="outline">{permissions?.length || 0}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium">Loading:</span>
            <Badge variant={isLoading ? "destructive" : "secondary"}>
              {isLoading ? "Yes" : "No"}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Cache Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Cache Statistics
          </CardTitle>
          <CardDescription>
            Performance metrics for permission caching
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {cacheStats ? (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium">Cache Size:</span>
                <Badge variant="outline">{cacheStats.size} users</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Cache Duration:</span>
                <Badge variant="outline">{Math.round(cacheStats.duration / 1000 / 60)} minutes</Badge>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Last Updated:</span>
                <span className="text-sm text-muted-foreground">{cacheStats.lastCleanup}</span>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Unable to load cache stats</p>
          )}
        </CardContent>
      </Card>

      {/* Performance Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Permission Check Performance
          </CardTitle>
          <CardDescription>
            Test how fast permission checks are executed
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={runPerformanceTest} size="sm">
            Run Performance Test
          </Button>
          
          {testResults.duration && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">Test Duration:</span>
                <Badge variant="secondary">{testResults.duration}ms</Badge>
                <span className="text-sm text-muted-foreground">
                  (checked 5 permissions at {testResults.timestamp})
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Dashboard:</span>
                  <Badge variant={testResults.dashboard ? "default" : "outline"}>
                    {testResults.dashboard ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Employees:</span>
                  <Badge variant={testResults.employees ? "default" : "outline"}>
                    {testResults.employees ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Bookings:</span>
                  <Badge variant={testResults.bookings ? "default" : "outline"}>
                    {testResults.bookings ? "✓" : "✗"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">Vendors:</span>
                  <Badge variant={testResults.vendors ? "default" : "outline"}>
                    {testResults.vendors ? "✓" : "✗"}
                  </Badge>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refresh Test */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Permission Refresh
          </CardTitle>
          <CardDescription>
            Test permission refresh functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={testRefresh} 
            disabled={isRefreshing}
            size="sm"
          >
            {isRefreshing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Test Refresh
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default PermissionDebug 