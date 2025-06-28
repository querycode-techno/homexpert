"use client"

import { useState } from "react"
import { Bell, Search, Settings, LogOut, User } from "lucide-react"
import { useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useLogout } from "@/hooks/useLogout"

export function AdminHeader() {
  const { data: session } = useSession()
  const { logout, isLoggingOut } = useLogout()
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New vendor registration",
      description: "A new vendor has registered on the platform",
      time: "5 minutes ago",
      read: false,
    },
    {
      id: 2,
      title: "Subscription payment",
      description: "Vendor #1234 has purchased a 3-month subscription",
      time: "1 hour ago",
      read: false,
    },
    {
      id: 3,
      title: "Support request",
      description: "A vendor has requested support for booking issues",
      time: "3 hours ago",
      read: true,
    },
  ])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="hidden md:block flex-1">
        <div className="relative max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full bg-background pl-8 md:w-[300px] lg:w-[400px]"
          />
        </div>
      </div>
      <div className="flex flex-1 items-center justify-end gap-4 md:gap-2 md:flex-none">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <Badge
                  className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 flex items-center justify-center"
                  variant="destructive"
                >
                  {unreadCount}
                </Badge>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length > 0 ? (
              notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="cursor-pointer p-0">
                  <div className={`flex w-full flex-col gap-1 p-2 ${!notification.read ? "bg-muted/50" : ""}`}>
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium">{notification.title}</p>
                      <p className="text-xs text-muted-foreground">{notification.time}</p>
                    </div>
                    <p className="text-xs text-muted-foreground">{notification.description}</p>
                  </div>
                </DropdownMenuItem>
              ))
            ) : (
              <div className="p-4 text-center text-sm text-muted-foreground">No new notifications</div>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer justify-center">
              <span className="text-sm font-medium">View all notifications</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold">
                  {session?.user?.name?.charAt(0)?.toUpperCase() || 'A'}
                </span>
              </div>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end"  forceMount>
        
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {session?.user?.name || 'Admin User'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {session?.user?.email || 'admin@homexpert.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={logout}
              disabled={isLoggingOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>{isLoggingOut ? 'Logging out...' : 'Log out'}</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
