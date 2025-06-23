"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Star,
  MapPin,
  Phone,
  Mail
} from "lucide-react"

const statusConfig = {
  pending: {
    label: "Pending",
    variant: "secondary",
    icon: Clock,
    color: "text-yellow-500"
  },
  active: {
    label: "Active",
    variant: "success",
    icon: CheckCircle,
    color: "text-green-500"
  },
  suspended: {
    label: "Suspended",
    variant: "destructive",
    icon: XCircle,
    color: "text-red-500"
  },
  inactive: {
    label: "Inactive",
    variant: "secondary",
    icon: AlertCircle,
    color: "text-gray-500"
  }
}

export function VendorCard({
  vendor,
  onView,
  onEdit,
  onDelete,
  onVerify
}) {
  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'V'
  }

  const renderStatus = (status) => {
    const config = statusConfig[status] || statusConfig.pending
    const Icon = config.icon
    
    return (
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${config.color}`} />
        <Badge variant={config.variant}>{config.label}</Badge>
      </div>
    )
  }

  const renderRating = (rating) => {
    return (
      <div className="flex items-center gap-1">
        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
        <span className="text-sm font-medium">{rating || 0}</span>
      </div>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="h-12 w-12">
              <AvatarImage src={vendor.userData?.profileImage} />
              <AvatarFallback>
                {getInitials(vendor.userData?.name)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold text-lg">{vendor.userData?.name}</h3>
              <p className="text-sm text-muted-foreground">{vendor.businessName}</p>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onView?.(vendor)}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit?.(vendor)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              {!vendor.verified?.isVerified && (
                <DropdownMenuItem onClick={() => onVerify?.(vendor)}>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Verify
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onDelete?.(vendor)}
                className="text-red-600"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Contact Info */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.userData?.email}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.userData?.phone}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{vendor.address?.city}, {vendor.address?.state}</span>
          </div>
        </div>

        {/* Services */}
        <div>
          <p className="text-sm font-medium mb-2">Services:</p>
          <div className="flex flex-wrap gap-1">
            {vendor.services?.slice(0, 3).map((service, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {service}
              </Badge>
            ))}
            {vendor.services?.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{vendor.services.length - 3} more
              </Badge>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-4">
            {renderRating(vendor.rating)}
            <div className="text-sm">
              <span className="font-medium">{vendor.totalJobs || 0}</span>
              <span className="text-muted-foreground ml-1">jobs</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {vendor.verified?.isVerified ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-red-500" />
            )}
            {renderStatus(vendor.status)}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 