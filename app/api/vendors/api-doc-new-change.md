# Vendor Logs API Documentation

## POST /api/vendors/logs

Creates a new vendor log entry and optionally sends notifications to all admin users.

### Authentication
- **Required**: Vendor authentication token
- **Header**: `Authorization: Bearer <vendor_token>`

### Request Body
```json
{
  "type": "lead" | "subscription",
  "leadId": "string (required if type is 'lead')",
  "subscriptionId": "string (required if type is 'subscription')",
  "notificationTitle": "string (optional)",
  "notificationMessage": "string (optional)"
}
```

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `type` | string | Yes | Log type: "lead" or "subscription" |
| `leadId` | string | Yes* | Lead ID (required when type is "lead") |
| `subscriptionId` | string | Yes* | Subscription ID (required when type is "subscription") |
| `notificationTitle` | string | No | Notification title to send to admins |
| `notificationMessage` | string | No | Notification message to send to admins |

*Required based on the `type` value

### Response

#### Success Response (201)
```json
{
  "success": true,
  "message": "Log entry created successfully",
  "logId": "string"
}
```

#### Error Responses

**400 - Bad Request**
```json
{
  "error": "Invalid log type. Must be either 'lead' or 'subscription'"
}
```

**400 - Missing Required Field**
```json
{
  "error": "leadId is required when type is 'lead'"
}
```

**401 - Unauthorized**
```json
{
  "error": "Invalid or missing authentication token"
}
```

**500 - Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

### Features
- Creates vendor log entries in the database
- Automatically sends notifications to all admin users with FCM tokens (if title and message provided)
- Handles invalid FCM tokens by removing them from the database
- Non-blocking notification sending (doesn't affect log creation response time)

---

# Vendor Online Status API Documentation

## POST /api/vendors/online

Updates vendor's online status and last online timestamp.

### Authentication
- **Required**: Vendor authentication token
- **Header**: `Authorization: Bearer <vendor_token>`

### Request Body
```json
{
  "online": true | false
}
```

### Request Parameters
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `online` | boolean | Yes | Online status: true for online, false for offline |

### Response

#### Success Response (200)
```json
{
  "success": true,
  "message": "Vendor status updated to online",
  "data": {
    "vendorId": "string",
    "online": true,
    "lastOnline": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

**400 - Bad Request**
```json
{
  "success": false,
  "error": "Online status must be a boolean value (true or false)"
}
```

**404 - Vendor Not Found**
```json
{
  "success": false,
  "error": "Vendor not found"
}
```

**401 - Unauthorized**
```json
{
  "error": "Invalid or missing authentication token"
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to update online status"
}
```

---

## GET /api/vendors/online

Retrieves vendor's current online status and last online timestamp.

### Authentication
- **Required**: Vendor authentication token
- **Header**: `Authorization: Bearer <vendor_token>`

### Request
No request body required.

### Response

#### Success Response (200)
```json
{
  "success": true,
  "data": {
    "vendorId": "string",
    "businessName": "string",
    "online": true,
    "lastOnline": "2024-01-01T00:00:00.000Z"
  }
}
```

#### Error Responses

**404 - Vendor Not Found**
```json
{
  "success": false,
  "error": "Vendor not found"
}
```

**401 - Unauthorized**
```json
{
  "error": "Invalid or missing authentication token"
}
```

**500 - Internal Server Error**
```json
{
  "success": false,
  "error": "Failed to get online status"
}
```

### Features
- Updates vendor online status in real-time
- Automatically updates lastOnline timestamp
- Returns vendor business name along with status
- Handles vendor existence validation





