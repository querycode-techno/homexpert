# Support Ticket Management System - Complete API Documentation

## 🎯 System Overview

This is a comprehensive support ticket management system with thread messaging, role-based access control, and advanced features like escalation, SLA tracking, and satisfaction ratings.

### ✅ **Key Features**
- **Thread Messaging**: Real-time chat functionality with attachments
- **Role-Based Access**: Flexible role names (vendor, admin, helpline, telecaller, etc.)
- **Advanced Workflow**: Status management, assignment, escalation
- **SLA Tracking**: Response time monitoring and overdue detection
- **Satisfaction Ratings**: 5-star rating system with feedback
- **Bulk Operations**: Admin bulk actions for efficiency
- **Rich Filtering**: Status, category, priority, search functionality
- **Related Context**: Link tickets to leads, subscriptions

---

## 📊 **Database Schema**

### SupportTicket Model
```javascript
{
  // Identification
  ticketId: String (unique, auto-generated),
  
  // Basic Info
  title: String (required, max 200 chars),
  description: String (required),
  category: String (enum: technical_issue, billing_support, etc.),
  priority: String (enum: low, medium, high, urgent),
  status: String (enum: open, in_progress, waiting_for_vendor, etc.),
  
  // Relationships
  createdBy: ObjectId (User),
  createdByType: String (role name),
  vendorId: ObjectId (Vendor),
  assignedTo: ObjectId (User),
  assignedToType: String (role name),
  
  // Thread Messages
  messages: [{
    messageId: String (unique),
    content: String (required),
    sender: ObjectId (User),
    senderType: String (role name),
    messageType: String (text, image, file, system_notification),
    attachments: [{ filename, url, size, mimeType }],
    isInternal: Boolean,
    createdAt: Date,
    readBy: [{ user: ObjectId, readAt: Date }]
  }],
  
  // Advanced Features
  escalation: {
    isEscalated: Boolean,
    level: String,
    escalatedBy: ObjectId,
    escalatedAt: Date,
    reason: String
  },
  
  satisfaction: {
    rating: Number (1-5),
    feedback: String,
    ratedBy: ObjectId,
    ratedAt: Date
  },
  
  // SLA & Tracking
  sla: {
    responseTime: Number (minutes),
    resolutionTime: Number (minutes),
    respondedAt: Date,
    resolvedAt: Date,
    closedAt: Date
  },
  
  unreadCount: {
    vendor: Number,
    admin: Number
  },
  
  // Metadata
  tags: [String],
  relatedTickets: [ObjectId],
  relatedLead: ObjectId,
  relatedSubscription: ObjectId,
  metadata: Object,
  
  // Timestamps
  createdAt: Date,
  lastActivity: Date,
  messageCount: Number
}
```

---

## 🔌 **Vendor APIs**

### 1. **GET** `/api/vendors/support` - List Vendor's Tickets

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 10)
status: string (all, open, in_progress, waiting_for_vendor, waiting_for_admin, resolved, closed)
category: string (all, technical_issue, billing_support, etc.)
priority: string (all, low, medium, high, urgent)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "_id": "ticket_id",
        "ticketId": "TKT-2024-001",
        "title": "Unable to access leads",
        "description": "I cannot see my leads in the dashboard",
        "category": "technical_issue",
        "priority": "high",
        "status": "open",
        "createdAt": "2024-01-15T10:30:00Z",
        "lastActivity": "2024-01-15T14:22:00Z",
        "messageCount": 3,
        "unreadCount": { "vendor": 1, "admin": 0 },
        "isOverdue": false,
        "assignedTo": {
          "name": "John Support",
          "email": "john@company.com"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 47,
      "itemsPerPage": 10,
      "hasNextPage": true,
      "hasPrevPage": false
    },
    "stats": {
      "open": 5,
      "in_progress": 3,
      "waiting_for_vendor": 2,
      "waiting_for_admin": 1,
      "resolved": 8,
      "closed": 28
    }
  }
}
```

### 2. **POST** `/api/vendors/support` - Create New Ticket

**Request Body:**
```json
{
  "title": "Unable to access leads dashboard",
  "description": "When I try to access the leads section, I get a 404 error. This started happening after the recent update.",
  "category": "technical_issue",
  "priority": "high",
  "tags": ["dashboard", "leads", "404"],
  "relatedLead": "lead_id_optional",
  "relatedSubscription": "subscription_id_optional"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Support ticket created successfully",
  "data": {
    "ticket": {
      "_id": "ticket_id",
      "ticketId": "TKT-2024-002",
      "title": "Unable to access leads dashboard",
      "status": "open",
      "createdAt": "2024-01-15T15:30:00Z"
    }
  }
}
```

### 3. **GET** `/api/vendors/support/[id]` - Get Ticket Details

**Response:**
```json
{
  "success": true,
  "data": {
    "ticket": {
      "_id": "ticket_id",
      "ticketId": "TKT-2024-001",
      "title": "Unable to access leads",
      "description": "I cannot see my leads in the dashboard",
      "category": "technical_issue",
      "priority": "high",
      "status": "in_progress",
      "createdAt": "2024-01-15T10:30:00Z",
      "lastActivity": "2024-01-15T14:22:00Z",
      "messageCount": 5,
      "unreadCount": { "vendor": 0, "admin": 1 },
      "messages": [
        {
          "_id": "msg_id",
          "messageId": "MSG-001",
          "content": "I cannot see my leads in the dashboard",
          "sender": {
            "name": "Vendor Name",
            "email": "vendor@example.com"
          },
          "senderType": "vendor",
          "messageType": "text",
          "createdAt": "2024-01-15T10:30:00Z",
          "attachments": []
        },
        {
          "_id": "msg_id_2",
          "messageId": "MSG-002", 
          "content": "Thank you for reporting this issue. I'm looking into it now.",
          "sender": {
            "name": "Support Agent",
            "email": "support@company.com"
          },
          "senderType": "helpline",
          "messageType": "text",
          "createdAt": "2024-01-15T11:15:00Z",
          "attachments": []
        }
      ],
      "assignedTo": {
        "name": "Support Agent",
        "email": "support@company.com"
      },
      "relatedLead": {
        "customerName": "John Doe",
        "service": "Plumbing",
        "status": "active"
      }
    }
  }
}
```

### 4. **POST** `/api/vendors/support/[id]` - Add Message

**Request Body:**
```json
{
  "content": "I tried clearing my browser cache but the issue persists. Can you please check from your end?",
  "messageType": "text",
  "attachments": [
    {
      "filename": "screenshot.png",
      "url": "https://example.com/files/screenshot.png",
      "size": 245760,
      "mimeType": "image/png"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message added successfully",
  "data": {
    "message": {
      "_id": "msg_id",
      "messageId": "MSG-003",
      "content": "I tried clearing my browser cache...",
      "sender": {
        "name": "Vendor Name",
        "email": "vendor@example.com"
      },
      "senderType": "vendor",
      "createdAt": "2024-01-15T14:30:00Z"
    },
    "ticket": {
      "_id": "ticket_id",
      "status": "waiting_for_admin",
      "lastActivity": "2024-01-15T14:30:00Z",
      "messageCount": 6
    }
  }
}
```

### 5. **PUT** `/api/vendors/support/[id]` - Vendor Actions

**Available Actions:**

#### Rate Satisfaction
```json
{
  "action": "rate_satisfaction",
  "satisfactionRating": 5,
  "satisfactionFeedback": "Excellent support! Issue was resolved quickly."
}
```

#### Reopen Ticket
```json
{
  "action": "reopen"
}
```

---

## 🛠️ **Admin APIs**

### 1. **GET** `/api/admin/support` - List All Tickets (Admin)

**Query Parameters:**
```
page: number (default: 1)
limit: number (default: 20)
status: string
category: string  
priority: string
assignedTo: string (user_id)
search: string (searches title, description, ticketId, messages)
sortBy: string (lastActivity, createdAt, priority, status)
sortOrder: string (desc, asc)
```

**Response:**
```json
{
  "success": true,
  "data": {
    "tickets": [
      {
        "_id": "ticket_id",
        "ticketId": "TKT-2024-001",
        "title": "Unable to access leads",
        "category": "technical_issue",
        "priority": "high",
        "status": "in_progress",
        "createdBy": {
          "name": "Vendor Name",
          "email": "vendor@example.com"
        },
        "vendorId": {
          "businessName": "ABC Services"
        },
        "assignedTo": {
          "name": "Support Agent",
          "email": "support@company.com"
        },
        "lastActivity": "2024-01-15T14:22:00Z",
        "messageCount": 5,
        "isOverdue": false
      }
    ],
    "pagination": { ... },
    "stats": {
      "statusBreakdown": {
        "open": 15,
        "in_progress": 8,
        "waiting_for_vendor": 5,
        "waiting_for_admin": 12,
        "resolved": 25,
        "closed": 140
      },
      "priorityBreakdown": {
        "urgent": 3,
        "high": 12,
        "medium": 35,
        "low": 15
      },
      "totalTickets": 205,
      "overdueTickets": 8
    }
  }
}
```

### 2. **POST** `/api/admin/support` - Create Ticket (Admin)

**Request Body:**
```json
{
  "title": "Billing issue for vendor",
  "description": "Vendor is experiencing billing discrepancies",
  "category": "billing_support",
  "priority": "high",
  "vendorId": "vendor_object_id",
  "assignedTo": "support_agent_id",
  "tags": ["billing", "urgent"],
  "relatedLead": "lead_id_optional",
  "relatedSubscription": "subscription_id_optional"
}
```

### 3. **PUT** `/api/admin/support` - Bulk Operations

**Bulk Assignment:**
```json
{
  "ticketIds": ["ticket_id_1", "ticket_id_2"],
  "action": "assign",
  "assignedTo": "support_agent_id"
}
```

**Bulk Status Update:**
```json
{
  "ticketIds": ["ticket_id_1", "ticket_id_2"],
  "action": "update_status",
  "status": "resolved"
}
```

**Bulk Priority Update:**
```json
{
  "ticketIds": ["ticket_id_1", "ticket_id_2"],
  "action": "update_priority", 
  "priority": "urgent"
}
```

### 4. **GET** `/api/admin/support/[id]` - Get Ticket (Admin)

**Response includes additional context:**
```json
{
  "success": true,
  "data": {
    "ticket": { 
      // Full ticket details with all populated references
    },
    "context": {
      "vendorOtherTickets": [
        // Other tickets from same vendor
      ],
      "relatedTickets": [
        // Linked tickets
      ]
    }
  }
}
```

### 5. **POST** `/api/admin/support/[id]` - Add Admin Message

**Request Body:**
```json
{
  "content": "I've identified the issue and pushed a fix. Please test and let me know if it's resolved.",
  "messageType": "text",
  "attachments": [],
  "isInternal": false
}
```

### 6. **PUT** `/api/admin/support/[id]` - Admin Actions

**Available Actions:**

#### Assign Ticket
```json
{
  "action": "assign",
  "assignedTo": "support_agent_id"
}
```

#### Update Status
```json
{
  "action": "update_status",
  "status": "resolved"
}
```

#### Update Priority
```json
{
  "action": "update_priority",
  "priority": "urgent"
}
```

#### Escalate Ticket
```json
{
  "action": "escalate",
  "escalationReason": "Complex technical issue requiring senior developer",
  "escalationLevel": "level_2"
}
```

#### Resolve Ticket
```json
{
  "action": "resolve",
  "resolutionNote": "Issue has been fixed in the latest deployment"
}
```

#### Close Ticket
```json
{
  "action": "close",
  "closingNote": "Ticket closed as per vendor confirmation"
}
```

#### Reopen Ticket
```json
{
  "action": "reopen"
}
```

#### Update Tags
```json
{
  "action": "update_tags",
  "tags": ["technical", "dashboard", "resolved"]
}
```

#### Link Related Tickets
```json
{
  "action": "link_tickets",
  "relatedTickets": ["ticket_id_1", "ticket_id_2"]
}
```

### 7. **DELETE** `/api/admin/support/[id]` - Delete Ticket

**Response:**
```json
{
  "success": true,
  "message": "Support ticket deleted successfully",
  "data": {
    "deletedTicketId": "ticket_id",
    "ticketId": "TKT-2024-001"
  }
}
```

---

## 📋 **Error Responses**

### Common Error Format:
```json
{
  "success": false,
  "error": "Error message description"
}
```

### HTTP Status Codes:
- **400** - Bad Request (validation errors, missing fields)
- **401** - Unauthorized (invalid/missing authentication)
- **403** - Forbidden (insufficient permissions)
- **404** - Not Found (ticket/resource not found)
- **500** - Internal Server Error

### Common Error Examples:

**Missing Required Fields:**
```json
{
  "success": false,
  "error": "Title, description, and category are required"
}
```

**Invalid Ticket ID:**
```json
{
  "success": false,
  "error": "Invalid ticket ID"
}
```

**Permission Denied:**
```json
{
  "success": false,
  "error": "Admin access required"
}
```

**Ticket Not Found:**
```json
{
  "success": false,
  "error": "Support ticket not found"
}
```

---

## 🚀 **Implementation Guidelines**

### Authentication
- **Vendor APIs**: Use JWT token authentication via `verifyVendorToken()`
- **Admin APIs**: Use session-based authentication via `requireAdmin()`

### Role Management
- Store actual role names (not enums) for flexibility
- Support any role: `vendor`, `admin`, `helpline`, `telecaller`, `manager`, etc.
- Role names are fetched from your existing Role model

### Real-time Updates
- Implement WebSocket/Socket.io for live chat
- Update `lastActivity` on every message/action
- Track unread counts per user type

### File Uploads
- Support attachments in messages
- Store files securely with proper validation
- Include file metadata (size, type, etc.)

### Performance Optimization
- Use pagination for large ticket lists
- Index commonly queried fields
- Implement caching for stats/metrics

### Security Considerations
- Validate all inputs thoroughly
- Ensure vendors can only access their tickets
- Sanitize message content
- Rate limit API calls

---

## 📱 **Frontend Integration**

### Vendor App Usage:
```javascript
// List tickets
const tickets = await fetch('/api/vendors/support?status=open&page=1')

// Create ticket
const newTicket = await fetch('/api/vendors/support', {
  method: 'POST',
  body: JSON.stringify({
    title: 'Cannot access dashboard',
    description: 'Getting 404 errors',
    category: 'technical_issue',
    priority: 'high'
  })
})

// Send message
const message = await fetch(`/api/vendors/support/${ticketId}`, {
  method: 'POST', 
  body: JSON.stringify({
    content: 'Still having the same issue',
    messageType: 'text'
  })
})
```

### Admin Panel Usage:
```javascript
// Get all tickets with filters
const tickets = await fetch('/api/admin/support?status=open&priority=urgent&search=billing')

// Assign tickets
const assign = await fetch('/api/admin/support', {
  method: 'PUT',
  body: JSON.stringify({
    ticketIds: ['id1', 'id2'],
    action: 'assign',
    assignedTo: 'support_agent_id'
  })
})

// Resolve ticket
const resolve = await fetch(`/api/admin/support/${ticketId}`, {
  method: 'PUT',
  body: JSON.stringify({
    action: 'resolve',
    resolutionNote: 'Issue has been fixed'
  })
})
```

---

## 📊 **System Benefits**

### For Vendors:
- ✅ Easy ticket creation and tracking
- ✅ Real-time chat with support team  
- ✅ Status updates and notifications
- ✅ Satisfaction rating system
- ✅ Mobile-friendly interface

### For Admins:
- ✅ Centralized ticket management
- ✅ Advanced filtering and search
- ✅ Bulk operations for efficiency
- ✅ SLA tracking and metrics
- ✅ Role-based assignment
- ✅ Escalation workflows

### Technical Advantages:
- ✅ Scalable MongoDB schema
- ✅ Flexible role-based system
- ✅ RESTful API design
- ✅ Comprehensive error handling
- ✅ Security best practices
- ✅ Performance optimized

This system provides enterprise-grade support ticket management with all the features needed for efficient customer support operations. 