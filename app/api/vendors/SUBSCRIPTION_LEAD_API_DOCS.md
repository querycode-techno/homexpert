# Vendor Subscription & Lead Management API Documentation

This documentation covers all vendor subscription and lead management endpoints for the HomeXpert mobile application.

## Base URL
```
https://homesxpert.in/api/vendors
```

## Authentication
All endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## 📋 Table of Contents

1. [Subscription Management APIs](#subscription-management-apis)
2. [Lead Management APIs](#lead-management-apis)
3. [Error Handling](#error-handling)
4. [Response Format](#response-format)
5. [Mobile Integration Tips](#mobile-integration-tips)

---

## Subscription Management APIs

### 1. Get Available Subscription Plans
**GET** `/subscriptions`

Get all available subscription plans with current subscription details and recommendations.

**Headers:**
```
Authorization: Bearer <access_token>
Content-Type: application/json
```

**Response:**
```json
{
  "success": true,
  "data": {
    "currentSubscription": {
      "id": "subscription_id",
      "planName": "Premium Plan",
      "status": "active",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-04-01T00:00:00.000Z",
      "daysRemaining": 45,
      "usage": {
        "leadsConsumed": 25,
        "leadsRemaining": 75,
        "usagePercentage": 25
      }
    },
    "plans": [
      {
        "id": "plan_id",
        "planName": "Basic Plan",
        "description": "Perfect for getting started",
        "duration": "1-month",
        "durationInDays": 30,
        "totalLeads": 50,
        "leadsPerMonth": 50,
        "price": 2999,
        "discountedPrice": 2499,
        "effectivePrice": 2499,
        "currency": "INR",
        "discountPercentage": 17,
        "pricePerLead": 50,
        "isDiscounted": true,
        "features": [
          {
            "name": "Lead Access",
            "description": "Access to verified leads",
            "isIncluded": true
          }
        ],
        "limitations": {
          "maxActiveLeads": 10,
          "supportLevel": "basic"
        },
        "isCurrentPlan": false,
        "canUpgradeTo": true
      }
    ],
    "plansByDuration": {
      "1-month": [...],
      "3-month": [...],
      "6-month": [...],
      "12-month": [...]
    },
    "recommendations": {
      "mostPopular": { /* plan object */ },
      "bestValue": { /* plan object */ },
      "longestDuration": { /* plan object */ }
    }
  }
}
```

### 2. Purchase Subscription
**POST** `/subscriptions`

Purchase a new subscription plan.

**Request Body:**
```json
{
  "planId": "plan_id",
  "paymentMethod": "online",
  "discountCode": "SAVE20"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Subscription purchased successfully!",
  "data": {
    "subscription": {
      "id": "subscription_id",
      "planName": "Premium Plan",
      "status": "active",
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-04-01T00:00:00.000Z",
      "totalLeads": 100,
      "leadsRemaining": 100,
      "daysRemaining": 90,
      "payment": {
        "amount": 4999,
        "currency": "INR",
        "status": "completed",
        "transactionId": "TXN1234567890"
      }
    },
    "message": "Your subscription is now active! You can start receiving leads.",
    "nextSteps": [
      "Complete your profile verification for better lead matching",
      "Set up your service preferences",
      "Start browsing available leads"
    ]
  }
}
```

### 3. Get Subscription History
**GET** `/subscriptions/history`

Get vendor's subscription history with pagination and filtering.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (active, expired, cancelled)

**Response:**
```json
{
  "success": true,
  "data": {
    "subscriptions": [
      {
        "id": "subscription_id",
        "planName": "Premium Plan",
        "description": "Best for growing businesses",
        "duration": "3-month",
        "status": "active",
        "isActive": true,
        "startDate": "2024-01-01T00:00:00.000Z",
        "endDate": "2024-04-01T00:00:00.000Z",
        "daysRemaining": 45,
        "isExpired": false,
        "isExpiringSoon": false,
        "totalLeads": 150,
        "leadsPerMonth": 50,
        "usage": {
          "leadsConsumed": 25,
          "leadsRemaining": 125,
          "usagePercentage": 17,
          "lastLeadConsumedAt": "2024-01-15T10:30:00.000Z",
          "totalJobsCompleted": 5,
          "conversionRate": 20
        },
        "payment": {
          "amount": 7499,
          "currency": "INR",
          "paymentMethod": "online",
          "paymentStatus": "completed",
          "paymentDate": "2024-01-01T00:00:00.000Z",
          "transactionId": "TXN1234567890",
          "refundAmount": 0
        },
        "performance": {
          "leadAcceptanceRate": 85,
          "jobCompletionRate": 100,
          "customerSatisfactionScore": 4.5,
          "averageJobValue": 3500,
          "totalRevenue": 17500
        },
        "recentHistory": [
          {
            "action": "activated",
            "date": "2024-01-01T00:00:00.000Z",
            "reason": "Payment completed successfully"
          }
        ],
        "features": [...],
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "activeSubscription": { /* active subscription object */ },
    "summary": {
      "totalSubscriptions": 3,
      "totalSpent": 15000,
      "totalLeadsConsumed": 75,
      "averageUsageRate": 65,
      "activeSubscription": true
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 3,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 4. Get Specific Subscription Details
**GET** `/subscriptions/{id}`

Get detailed information about a specific subscription.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "subscription_id",
    "planName": "Premium Plan",
    "description": "Best for growing businesses",
    "duration": "3-month",
    "status": "active",
    "isActive": true,
    "startDate": "2024-01-01T00:00:00.000Z",
    "endDate": "2024-04-01T00:00:00.000Z",
    "daysRemaining": 45,
    "daysActive": 45,
    "isExpired": false,
    "isExpiringSoon": false,
    "totalLeads": 150,
    "leadsPerMonth": 50,
    "features": [...],
    "usage": {
      "leadsConsumed": 25,
      "leadsRemaining": 125,
      "usagePercentage": 17,
      "lastLeadConsumedAt": "2024-01-15T10:30:00.000Z",
      "monthlyUsage": [
        {
          "month": "2024-01",
          "year": 2024,
          "monthNumber": 1,
          "leadsUsed": 25,
          "leadsAllocated": 50,
          "usagePercentage": 50
        }
      ],
      "averageLeadsPerMonth": 25,
      "totalJobsCompleted": 5,
      "conversionRate": 20
    },
    "payment": { /* payment details */ },
    "performance": { /* performance metrics */ },
    "leadAssignments": [...],
    "history": [...],
    "adminNotes": [...],
    "discountsApplied": [...],
    "renewalInfo": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### 5. Upgrade/Downgrade Subscription
**PUT** `/subscriptions/{id}`

Upgrade or downgrade a subscription plan.

**Request Body:**
```json
{
  "newPlanId": "new_plan_id",
  "upgradeType": "upgrade"
}
```

**Response (Immediate Upgrade):**
```json
{
  "success": true,
  "message": "Upgrade completed successfully!",
  "data": {
    "subscription": {
      "id": "new_subscription_id",
      "planName": "Premium Plus Plan",
      "status": "active",
      "startDate": "2024-01-15T00:00:00.000Z",
      "endDate": "2024-04-15T00:00:00.000Z",
      "totalLeads": 200,
      "leadsRemaining": 175,
      "daysRemaining": 90,
      "upgradeType": "upgrade",
      "priceDifference": 2000,
      "bonusLeads": 25
    }
  }
}
```

### 6. Cancel Subscription
**DELETE** `/subscriptions/{id}`

Cancel an active subscription.

**Response:**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully",
  "data": {
    "subscriptionId": "subscription_id",
    "cancelledAt": "2024-01-15T00:00:00.000Z",
    "refundEligible": false,
    "accessUntil": "2024-04-01T00:00:00.000Z"
  }
}
```

---

## Lead Management APIs

### 7. Get Available Leads
**GET** `/available-leads`

Get leads available to the vendor based on their active subscription.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `service` (optional): Filter by service type
- `location` (optional): Filter by location
- `maxPrice` (optional): Maximum price filter
- `urgency` (optional): Filter by urgency (urgent, normal)
- `sortBy` (optional): Sort by (createdAt, price, distance)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "lead_id",
        "customerName": "John Doe",
        "customerPhone": "9876543210",
        "customerEmail": "john@example.com",
        "service": "plumbing",
        "selectedService": "Pipe Repair",
        "selectedSubService": "Leak Fixing",
        "description": "Kitchen sink is leaking badly",
        "address": "123 Main St, Mumbai",
        "price": 2500,
        "getQuote": false,
        "preferredDate": "2024-01-20T00:00:00.000Z",
        "preferredTime": "10:00 AM",
        "status": "available",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "hoursAgo": 6,
        "isUrgent": false,
        "urgency": "normal",
        "assignedAt": "2024-01-15T11:00:00.000Z",
        "vendorCount": 3,
        "isExclusive": false,
        "additionalNotes": "Customer available after 9 AM",
        "estimatedValue": 2500,
        "hasExactPrice": true,
        "requiresQuote": false,
        "competitionLevel": "medium"
      }
    ],
    "subscription": {
      "id": "subscription_id",
      "planName": "Premium Plan",
      "leadsRemaining": 75,
      "totalLeads": 100,
      "usagePercentage": 25,
      "daysRemaining": 45
    },
    "statistics": {
      "available": 15,
      "taken": 25,
      "totalValue": 62500,
      "conversionRate": 65
    },
    "filters": {
      "services": ["plumbing", "electrical"],
      "appliedFilters": {
        "service": null,
        "location": null,
        "maxPrice": null,
        "urgency": null
      }
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalCount": 15,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

### 8. Get Vendor's Taken Leads
**GET** `/leads`

Get all leads taken by the vendor with detailed status tracking.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status
- `service` (optional): Filter by service
- `dateFrom` (optional): Date range filter from
- `dateTo` (optional): Date range filter to
- `sortBy` (optional): Sort by field (default: takenAt)
- `sortOrder` (optional): Sort order (asc, desc)

**Response:**
```json
{
  "success": true,
  "data": {
    "leads": [
      {
        "id": "lead_id",
        "customerName": "John Doe",
        "customerPhone": "9876543210",
        "customerEmail": "john@example.com",
        "service": "plumbing",
        "selectedService": "Pipe Repair",
        "selectedSubService": "Leak Fixing",
        "description": "Kitchen sink is leaking badly",
        "address": "123 Main St, Mumbai",
        "price": 2500,
        "getQuote": false,
        "conversionValue": 3000,
        "actualServiceCost": 2800,
        "preferredDate": "2024-01-20T00:00:00.000Z",
        "preferredTime": "10:00 AM",
        "scheduledDate": "2024-01-20T00:00:00.000Z",
        "scheduledTime": "10:00 AM",
        "status": "scheduled",
        "createdAt": "2024-01-15T10:30:00.000Z",
        "takenAt": "2024-01-15T11:00:00.000Z",
        "daysSinceTaken": 5,
        "isOverdue": false,
        "contactedAt": "2024-01-15T11:30:00.000Z",
        "interestedAt": "2024-01-15T12:00:00.000Z",
        "scheduledAt": "2024-01-15T14:00:00.000Z",
        "notes": [
          {
            "id": "note_id",
            "note": "Customer confirmed the appointment",
            "createdBy": "vendor_id",
            "date": "2024-01-15T14:00:00.000Z"
          }
        ],
        "followUps": [
          {
            "id": "followup_id",
            "followUp": "Call before reaching",
            "date": "2024-01-20T09:30:00.000Z",
            "createdBy": "vendor_id"
          }
        ],
        "latestNote": { /* latest note object */ },
        "latestFollowUp": { /* latest follow-up object */ },
        "leadProgressHistory": [...],
        "additionalNotes": "Customer available after 9 AM",
        "estimatedValue": 2500,
        "isCompleted": false,
        "canRefund": true,
        "refundRequest": {
          "isRequested": false
        },
        "needsAction": false,
        "urgentAction": false,
        "nextSteps": [
          "Confirm appointment 1 day before",
          "Prepare all necessary materials",
          "Plan your route and timing"
        ]
      }
    ],
    "summary": {
      "total": 25,
      "byStatus": {
        "taken": { "count": 5, "value": 12500 },
        "contacted": { "count": 8, "value": 20000 },
        "scheduled": { "count": 6, "value": 15000 },
        "completed": { "count": 6, "value": 18000 }
      },
      "totalValue": 65500,
      "conversionRate": 75
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 2,
      "totalCount": 25,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "filters": {
      "appliedFilters": {
        "status": null,
        "service": null,
        "dateFrom": null,
        "dateTo": null
      }
    }
  }
}
```

### 9. Take a Lead
**POST** `/leads`

Take an available lead and consume from subscription.

**Request Body:**
```json
{
  "leadId": "lead_id"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead taken successfully!",
  "data": {
    "lead": {
      "id": "lead_id",
      "customerName": "John Doe",
      "service": "plumbing",
      "address": "123 Main St, Mumbai",
      "price": 2500,
      "status": "taken",
      "takenAt": "2024-01-15T11:00:00.000Z",
      "description": "Kitchen sink is leaking badly"
    },
    "subscription": {
      "leadsRemaining": 74,
      "totalLeads": 100,
      "usagePercentage": 26
    },
    "nextSteps": [
      "Contact the customer immediately",
      "Understand their requirements",
      "Provide a quote if needed",
      "Schedule a visit if required"
    ]
  }
}
```

### 10. Get Lead Details
**GET** `/leads/{id}`

Get detailed information about a specific lead.

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "lead_id",
    "customer": {
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com"
    },
    "service": {
      "category": "plumbing",
      "selectedService": "Pipe Repair",
      "selectedSubService": "Leak Fixing",
      "description": "Kitchen sink is leaking badly",
      "additionalNotes": "Customer available after 9 AM"
    },
    "location": {
      "address": "123 Main St, Mumbai"
    },
    "pricing": {
      "estimatedPrice": 2500,
      "getQuote": false,
      "conversionValue": 3000,
      "actualServiceCost": 2800,
      "finalAmount": 3000
    },
    "scheduling": {
      "preferredDate": "2024-01-20T00:00:00.000Z",
      "preferredTime": "10:00 AM",
      "scheduledDate": "2024-01-20T00:00:00.000Z",
      "scheduledTime": "10:00 AM",
      "hasSchedule": true
    },
    "status": {
      "current": "scheduled",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "takenAt": "2024-01-15T11:00:00.000Z",
      "contactedAt": "2024-01-15T11:30:00.000Z",
      "interestedAt": "2024-01-15T12:00:00.000Z",
      "scheduledAt": "2024-01-15T14:00:00.000Z",
      "daysSinceTaken": 5,
      "hoursSinceTaken": 120,
      "isOverdue": false,
      "needsUrgentAction": false,
      "canContact": false,
      "canSchedule": false,
      "canComplete": true,
      "canCancel": true,
      "isCompleted": false,
      "isClosed": false
    },
    "communication": {
      "notes": [...],
      "followUps": [...],
      "totalNotes": 3,
      "totalFollowUps": 2,
      "lastNote": { /* latest note */ },
      "lastFollowUp": { /* latest follow-up */ },
      "lastCommunication": { /* latest communication */ }
    },
    "progress": {
      "history": [...],
      "milestones": [
        {
          "status": "taken",
          "label": "Lead Taken",
          "completed": true,
          "date": "2024-01-15T11:00:00.000Z"
        },
        {
          "status": "contacted",
          "label": "Customer Contacted",
          "completed": true,
          "date": "2024-01-15T11:30:00.000Z"
        },
        {
          "status": "scheduled",
          "label": "Service Scheduled",
          "completed": true,
          "date": "2024-01-15T14:00:00.000Z"
        }
      ],
      "completion": 60,
      "nextSteps": [
        "Confirm appointment 1 day before",
        "Prepare all necessary materials",
        "Plan your route and timing"
      ]
    },
    "business": {
      "estimatedValue": 2500,
      "actualValue": 3000,
      "profitMargin": 7,
      "canRefund": true,
      "refundRequest": {
        "isRequested": false
      }
    },
    "assignment": {
      "assignedAt": "2024-01-15T10:45:00.000Z",
      "takenAt": "2024-01-15T11:00:00.000Z",
      "vendorCount": 3,
      "wasExclusive": false
    }
  }
}
```

### 11. Update Lead Status
**PUT** `/leads/{id}`

Update lead status, schedule appointments, or add conversion values.

**Request Body:**
```json
{
  "status": "completed",
  "scheduledDate": "2024-01-20T00:00:00.000Z",
  "scheduledTime": "10:00 AM",
  "conversionValue": 3000,
  "actualServiceCost": 2800,
  "reason": "Service completed successfully",
  "customerFeedback": "Very satisfied with the service",
  "note": "Customer was happy with the work done"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Lead status updated successfully",
  "data": {
    "lead": {
      "id": "lead_id",
      "status": "completed",
      "customerName": "John Doe",
      "service": "plumbing",
      "scheduledDate": "2024-01-20T00:00:00.000Z",
      "scheduledTime": "10:00 AM",
      "conversionValue": 3000,
      "actualServiceCost": 2800,
      "updatedAt": "2024-01-20T16:00:00.000Z"
    },
    "nextSteps": [
      "Request payment if not received",
      "Get customer feedback and rating",
      "Ask for testimonial or review"
    ]
  }
}
```

### 12. Get Lead Notes
**GET** `/leads/{id}/notes`

Get all notes for a specific lead.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": {
    "leadInfo": {
      "id": "lead_id",
      "customerName": "John Doe",
      "service": "plumbing"
    },
    "notes": [
      {
        "id": "note_id",
        "note": "Customer confirmed the appointment",
        "createdBy": "vendor_id",
        "date": "2024-01-15T14:00:00.000Z",
        "timeAgo": "5 days ago"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 3,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 13. Add Lead Note
**POST** `/leads/{id}/notes`

Add a note to a lead for communication tracking.

**Request Body:**
```json
{
  "note": "Customer confirmed the appointment and will be available",
  "type": "general"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Note added successfully",
  "data": {
    "note": {
      "id": "note_id",
      "note": "Customer confirmed the appointment and will be available",
      "type": "general",
      "createdBy": "vendor_id",
      "date": "2024-01-15T14:00:00.000Z",
      "timeAgo": "just now"
    },
    "leadInfo": {
      "id": "lead_id",
      "customerName": "John Doe",
      "service": "plumbing"
    }
  }
}
```

### 14. Get Lead Follow-ups
**GET** `/leads/{id}/follow-ups`

Get all follow-ups for a specific lead.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `status` (optional): Filter by status (pending, completed, overdue)

**Response:**
```json
{
  "success": true,
  "data": {
    "leadInfo": {
      "id": "lead_id",
      "customerName": "John Doe",
      "service": "plumbing",
      "status": "scheduled"
    },
    "followUps": [
      {
        "id": "followup_id",
        "followUp": "Call before reaching the location",
        "date": "2024-01-20T09:30:00.000Z",
        "createdBy": "vendor_id",
        "completed": false,
        "status": "pending",
        "isOverdue": false,
        "isPending": true,
        "timeAgo": "in 5 days",
        "daysFromNow": 5,
        "priority": "high"
      }
    ],
    "summary": {
      "total": 2,
      "pending": 1,
      "overdue": 0,
      "completed": 1
    },
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalCount": 2,
      "hasNextPage": false,
      "hasPrevPage": false
    }
  }
}
```

### 15. Add Lead Follow-up
**POST** `/leads/{id}/follow-ups`

Schedule a follow-up for a lead.

**Request Body:**
```json
{
  "followUp": "Call before reaching the location",
  "date": "2024-01-20T09:30:00.000Z",
  "priority": "high",
  "type": "reminder"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Follow-up scheduled successfully",
  "data": {
    "followUp": {
      "id": "followup_id",
      "followUp": "Call before reaching the location",
      "date": "2024-01-20T09:30:00.000Z",
      "priority": "high",
      "type": "reminder",
      "createdBy": "vendor_id",
      "createdAt": "2024-01-15T14:00:00.000Z",
      "completed": false,
      "status": "pending",
      "isOverdue": false,
      "isPending": true,
      "daysFromNow": 5,
      "timeAgo": "in 5 days"
    },
    "leadInfo": {
      "id": "lead_id",
      "customerName": "John Doe",
      "service": "plumbing"
    }
  }
}
```

### 16. Update Follow-up Status
**PUT** `/leads/{id}/follow-ups`

Mark a follow-up as completed or reopen it.

**Request Body:**
```json
{
  "followUpId": "followup_id",
  "completed": true,
  "completionNote": "Successfully called and confirmed"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Follow-up completed successfully",
  "data": {
    "followUpId": "followup_id",
    "completed": true,
    "completedAt": "2024-01-20T09:30:00.000Z",
    "leadInfo": {
      "id": "lead_id",
      "customerName": "John Doe",
      "service": "plumbing"
    }
  }
}
```

### 17. Get Vendor Dashboard
**GET** `/dashboard`

Get comprehensive dashboard data including subscription status, lead analytics, performance metrics, and business insights.

**Response:**
```json
{
  "success": true,
  "data": {
    "profile": {
      "id": "vendor_id",
      "userId": "user_id",
      "businessName": "ABC Plumbing Services",
      "name": "John Smith",
      "email": "john@abcplumbing.com",
      "phone": "9876543210",
      "services": ["plumbing", "electrical"],
      "rating": 4.5,
      "totalJobs": 45,
      "status": "active",
      "isVerified": true,
      "accountCompletion": 85,
      "joinedDate": "2023-01-15T00:00:00.000Z",
      "daysSinceJoining": 365
    },
    "subscription": {
      "id": "subscription_id",
      "planName": "Premium Plan",
      "status": "active",
      "isActive": true,
      "startDate": "2024-01-01T00:00:00.000Z",
      "endDate": "2024-04-01T00:00:00.000Z",
      "daysRemaining": 45,
      "isExpiringSoon": false,
      "usage": {
        "leadsConsumed": 25,
        "leadsRemaining": 75,
        "totalLeads": 100,
        "usagePercentage": 25,
        "monthlyUsage": [
          {
            "month": "2024-01",
            "leadsUsed": 25,
            "leadsAllocated": 50
          }
        ]
      },
      "features": [...],
      "performance": {...}
    },
    "leads": {
      "available": {
        "count": 15,
        "hasAccess": true
      },
      "taken": {
        "total": 45,
        "today": 2,
        "week": 8,
        "month": 25,
        "growth": {
          "today": 100,
          "week": 14,
          "month": 25
        }
      },
      "status": {
        "taken": { "count": 5, "value": 12500 },
        "contacted": { "count": 8, "value": 20000 },
        "scheduled": { "count": 10, "value": 25000 },
        "completed": { "count": 15, "value": 37500 },
        "converted": { "count": 7, "value": 21000 }
      },
      "overdue": 2,
      "actionRequired": 3
    },
    "performance": {
      "revenue": {
        "total": 125000,
        "estimated": 150000,
        "average": 3500
      },
      "conversion": {
        "rate": 65,
        "completed": 22,
        "total": 45
      },
      "rating": 4.5,
      "totalJobs": 45
    },
    "recent": {
      "takenLeads": [
        {
          "id": "lead_id",
          "customerName": "Jane Doe",
          "service": "plumbing",
          "status": "scheduled",
          "takenAt": "2024-01-15T11:00:00.000Z",
          "value": 2500,
          "address": "123 Main St, Mumbai",
          "nextDate": "2024-01-20T10:00:00.000Z"
        }
      ],
      "availableLeads": [
        {
          "id": "lead_id",
          "customerName": "Bob Smith",
          "service": "electrical",
          "price": 3000,
          "address": "456 Oak Ave, Delhi",
          "createdAt": "2024-01-16T09:00:00.000Z",
          "urgency": "normal"
        }
      ]
    },
    "notifications": [
      {
        "type": "urgent",
        "title": "Overdue Leads",
        "message": "2 leads need immediate attention",
        "action": "view_overdue",
        "count": 2
      },
      {
        "type": "action",
        "title": "Action Required",
        "message": "3 leads waiting for response",
        "action": "view_action_required",
        "count": 3
      },
      {
        "type": "info",
        "title": "New Leads Available",
        "message": "5 new leads match your services",
        "action": "view_available",
        "count": 5
      }
    ],
    "alerts": [
      {
        "type": "info",
        "title": "Running Low on Leads",
        "message": "Only 5 leads remaining",
        "action": "upgrade",
        "priority": "medium"
      }
    ],
    "quickActions": [
      {
        "title": "Browse Available Leads",
        "description": "15 leads available",
        "action": "browse_leads",
        "icon": "search",
        "color": "primary",
        "badge": 15
      },
      {
        "title": "Action Required",
        "description": "3 leads need response",
        "action": "action_required",
        "icon": "alert-circle",
        "color": "warning",
        "badge": 3
      },
      {
        "title": "My Leads",
        "description": "45 total leads",
        "action": "my_leads",
        "icon": "list",
        "color": "secondary"
      }
    ],
    "todaySummary": {
      "leadsReceived": 2,
      "revenue": 0,
      "completedJobs": 1,
      "scheduledJobs": 3
    }
  }
}
```

---

## Error Handling

All endpoints return error responses in this format:

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message description"
}
```

### Subscription-specific Errors
```json
{
  "success": false,
  "error": "No active subscription found. Please purchase a subscription to view leads.",
  "requiresSubscription": true
}
```

```json
{
  "success": false,
  "error": "No leads remaining in your subscription. Please upgrade your plan.",
  "needsUpgrade": true,
  "subscription": {
    "id": "subscription_id",
    "planName": "Basic Plan",
    "leadsConsumed": 50,
    "totalLeads": 50
  }
}
```

### Lead-specific Errors
```json
{
  "success": false,
  "error": "Lead was just taken by another vendor or is no longer available",
  "alreadyTaken": true
}
```

### Common HTTP Status Codes
- `200` - Success
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (no subscription/leads remaining)
- `404` - Not Found (resource not found)
- `409` - Conflict (lead already taken)
- `500` - Internal Server Error

---

## Response Format

All successful responses follow this format:

```json
{
  "success": true,
  "message": "Optional success message",
  "data": {
    // Response data object
  }
}
```

Paginated responses include:
```json
{
  "success": true,
  "data": {
    // Main data
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalCount": 100,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

---

## Mobile Integration Tips

### 1. Authentication Flow
```javascript
// Store token securely
const token = await SecureStore.getItemAsync('access_token');

// Add to all requests
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### 2. Subscription Management
```javascript
// Check subscription status before showing leads
const subscriptionResponse = await fetch('/api/vendors/subscriptions');
const { data } = await subscriptionResponse.json();

if (!data.currentSubscription) {
  // Show subscription purchase screen
  showSubscriptionScreen();
} else if (data.currentSubscription.usage.leadsRemaining <= 0) {
  // Show upgrade screen
  showUpgradeScreen();
} else {
  // Show available leads
  loadAvailableLeads();
}
```

### 3. Optimistic Updates
```javascript
// Optimistically update UI when taking a lead
const takeLeadOptimistic = (leadId) => {
  // Update UI immediately
  updateLeadInList(leadId, { status: 'taking...' });
  
  // Make API call
  fetch('/api/vendors/leads', {
    method: 'POST',
    body: JSON.stringify({ leadId }),
    headers
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      updateLeadInList(leadId, { status: 'taken' });
      updateSubscriptionUsage(data.data.subscription);
    } else {
      // Revert optimistic update
      revertLeadUpdate(leadId);
      showError(data.error);
    }
  })
  .catch(error => {
    revertLeadUpdate(leadId);
    showError('Failed to take lead');
  });
};
```

### 4. Real-time Updates
```javascript
// Poll for new leads every 30 seconds
const pollForNewLeads = () => {
  setInterval(async () => {
    const response = await fetch('/api/vendors/available-leads?page=1&limit=5');
    const data = await response.json();
    
    if (data.success) {
      updateLeadsList(data.data.leads);
    }
  }, 30000);
};
```

### 5. Offline Support
```javascript
// Cache essential data
const cacheEssentialData = async () => {
  const subscription = await fetch('/api/vendors/subscriptions');
  const takenLeads = await fetch('/api/vendors/leads');
  
  await AsyncStorage.setItem('cached_subscription', JSON.stringify(subscription));
  await AsyncStorage.setItem('cached_leads', JSON.stringify(takenLeads));
};

// Use cached data when offline
const loadDataOffline = async () => {
  const cachedSubscription = await AsyncStorage.getItem('cached_subscription');
  const cachedLeads = await AsyncStorage.getItem('cached_leads');
  
  if (cachedSubscription) {
    setSubscriptionData(JSON.parse(cachedSubscription));
  }
  if (cachedLeads) {
    setLeadsData(JSON.parse(cachedLeads));
  }
};
```

### 6. Performance Optimization
```javascript
// Implement lazy loading for lead lists
const loadMoreLeads = async (page) => {
  const response = await fetch(`/api/vendors/leads?page=${page}&limit=20`);
  const data = await response.json();
  
  if (data.success) {
    setLeads(prevLeads => [...prevLeads, ...data.data.leads]);
  }
};

// Use debouncing for search
const debouncedSearch = useCallback(
  debounce((searchTerm) => {
    searchLeads(searchTerm);
  }, 300),
  []
);
```

### 7. Error Handling
```javascript
const handleApiError = (error, response) => {
  if (error.requiresSubscription) {
    navigateToSubscription();
  } else if (error.needsUpgrade) {
    showUpgradeDialog(error.subscription);
  } else if (error.alreadyTaken) {
    showLeadTakenMessage();
    refreshLeadsList();
  } else {
    showGenericError(error.error);
  }
};
```

### 8. State Management
```javascript
// Redux/Context state structure
const initialState = {
  subscription: {
    current: null,
    history: [],
    loading: false
  },
  leads: {
    available: [],
    taken: [],
    loading: false,
    filters: {}
  },
  communication: {
    notes: {},
    followUps: {}
  }
};
```

This comprehensive API documentation provides everything needed to implement subscription and lead management features in your vendor mobile app with proper error handling, optimization, and mobile-specific considerations. 