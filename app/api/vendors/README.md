# Vendor Mobile App API Documentation

This documentation covers all the vendor-related API endpoints for the HomeXpert mobile application.

## Base URL
```
https://your-domain.com/api/vendors
```

## Authentication
All protected endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Authentication Endpoints

### 1. Login
**POST** `/auth/login`

Login vendor with phone and password.

**Request Body:**
```json
{
  "phone": "9876543210",
  "password": "your_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "profileImage": "image_url"
    },
    "vendor": {
      "id": "vendor_id",
      "businessName": "John's Services",
      "services": ["plumbing", "electrical"],
      "status": "active",
      "verified": true,
      "rating": 4.5,
      "totalJobs": 25,
      "address": {...}
    },
    "tokens": {
      "accessToken": "jwt_access_token",
      "refreshToken": "jwt_refresh_token",
      "expiresIn": 86400
    }
  }
}
```

### 2. Register
**POST** `/auth/register`

Register new vendor account.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "phone": "9876543210",
  "password": "secure_password",
  "businessName": "John's Services",
  "services": ["plumbing", "electrical"],
  "address": {
    "street": "123 Main St",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Vendor registration successful",
  "data": {
    "user": {...},
    "vendor": {...},
    "tokens": {...},
    "message": "Registration successful! Your account is pending verification."
  }
}
```

### 3. Refresh Token
**POST** `/auth/refresh-token`

Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "jwt_refresh_token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "new_jwt_access_token",
      "refreshToken": "new_jwt_refresh_token",
      "expiresIn": 86400
    }
  }
}
```

### 4. Reset Password
**POST** `/auth/reset-password`

Reset password without OTP (simplified for now).

**Request Body:**
```json
{
  "phone": "9876543210",
  "newPassword": "new_secure_password"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Password reset successfully. Please login with your new password.",
  "data": {
    "email": "john@example.com",
    "phone": "9876543210"
  }
}
```

---

## Profile Management

### 5. Get Profile
**GET** `/profile`
*Requires Authentication*

Get vendor profile information.

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "phone": "9876543210",
      "profileImage": "image_url",
      "address": {...}
    },
    "vendor": {
      "id": "vendor_id",
      "businessName": "John's Services",
      "services": ["plumbing", "electrical"],
      "address": {...},
      "documents": {...},
      "verified": {...},
      "status": "active",
      "rating": 4.5,
      "totalJobs": 25,
      "createdAt": "2024-01-01T00:00:00.000Z"
    }
  }
}
```

### 6. Update Profile
**PUT** `/profile`
*Requires Authentication*

Update vendor profile information.

**Request Body:**
```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "businessName": "Updated Business Name",
  "services": ["plumbing", "electrical", "painting"],
  "vendorAddress": {
    "street": "456 New St",
    "city": "Delhi",
    "state": "Delhi",
    "pincode": "110001"
  }
}
```

### 7. Update Password
**PATCH** `/profile`
*Requires Authentication*

Change vendor password.

**Request Body:**
```json
{
  "currentPassword": "current_password",
  "newPassword": "new_secure_password"
}
```

---

## Verification & Documents

### 8. Get Verification Status
**GET** `/verification-status`
*Requires Authentication*

Get detailed verification status and document requirements.

**Response:**
```json
{
  "success": true,
  "data": {
    "overall": {
      "isVerified": false,
      "status": "pending",
      "verificationNotes": "Documents under review",
      "completionPercentage": 75,
      "verificationPercentage": 25
    },
    "documents": {
      "aadharCard": {
        "status": "verified",
        "hasDocument": true,
        "verified": true
      },
      "panCard": {
        "status": "pending",
        "hasDocument": true,
        "verified": false
      },
      "businessLicense": {
        "status": "missing",
        "hasDocument": false,
        "verified": false
      },
      "bankDetails": {
        "status": "pending",
        "hasDetails": true,
        "verified": false
      }
    },
    "history": [...],
    "nextSteps": [
      "Upload business license",
      "Wait for admin verification (24-48 hours)"
    ],
    "requirements": {
      "documents": [...]
    }
  }
}
```

### 9. Request Re-verification
**POST** `/verification-status`
*Requires Authentication*

Request re-verification if previously rejected.

**Request Body:**
```json
{
  "reason": "Documents updated as per feedback"
}
```

### 10. Upload Documents
**POST** `/documents/upload`
*Requires Authentication*

Upload verification documents (multipart/form-data).

**Form Data:**
- `documentType`: "aadharCard" | "panCard" | "businessLicense"
- `file`: Image file (JPEG, PNG, WebP, max 5MB)
- `documentNumber`: Document number (optional)

**Response:**
```json
{
  "success": true,
  "message": "Document uploaded successfully",
  "data": {
    "documentType": "aadharCard",
    "documentUrl": "/vendor-documents/filename.jpg",
    "uploadedAt": "2024-01-01T00:00:00.000Z",
    "documentStatus": {...},
    "completionPercentage": 75,
    "nextStep": "Continue uploading remaining documents."
  }
}
```

### 11. Update Bank Details
**PUT** `/documents/upload`
*Requires Authentication*

Update bank account details.

**Request Body:**
```json
{
  "bankDetails": {
    "accountNumber": "1234567890123456",
    "ifscCode": "SBIN0001234",
    "accountHolderName": "John Doe"
  }
}
```

---

## Dashboard & Analytics

### 12. Get Dashboard Data
**GET** `/dashboard`
*Requires Authentication*

Get vendor dashboard statistics and recent activity.

**Response:**
```json
{
  "success": true,
  "data": {
    "vendor": {
      "id": "vendor_id",
      "businessName": "John's Services",
      "services": ["plumbing"],
      "status": "active",
      "verified": true,
      "rating": 4.5,
      "totalJobs": 25,
      "daysSinceJoining": 45,
      "accountCompletionPercentage": 100
    },
    "statistics": {
      "leads": {
        "total": 50,
        "today": 2,
        "thisWeek": 8,
        "thisMonth": 25,
        "accepted": 40,
        "rejected": 5,
        "pending": 5,
        "acceptanceRate": 80
      },
      "performance": {
        "rating": 4.5,
        "totalJobs": 25,
        "acceptanceRate": 80
      }
    },
    "recentActivity": {
      "leads": [...]
    },
    "accountStatus": {
      "message": "Your account is verified and active. You can receive leads!",
      "type": "success",
      "isVerified": true,
      "status": "active"
    },
    "quickActions": [...]
  }
}
```

---

## Error Responses

All endpoints return error responses in this format:

```json
{
  "success": false,
  "error": "Error message description"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid input)
- `401` - Unauthorized (invalid/expired token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not Found (resource not found)
- `409` - Conflict (duplicate data)
- `500` - Internal Server Error

---

## Rate Limiting & Performance

- **Authentication endpoints**: 5 requests per minute per IP
- **Protected endpoints**: 100 requests per minute per user
- **File uploads**: 10 uploads per hour per user
- **Response time**: < 500ms for most endpoints
- **File size limit**: 5MB for document uploads

---

## Mobile App Integration Tips

### 1. Token Management
- Store access token securely (Keychain/KeyStore)
- Implement automatic token refresh
- Handle token expiration gracefully

### 2. Offline Support
- Cache profile data for offline viewing
- Queue actions when offline
- Sync when connection restored

### 3. Error Handling
- Show user-friendly error messages
- Retry failed requests with exponential backoff
- Validate input before sending requests

### 4. Performance Optimization
- Use appropriate image compression for uploads
- Implement pagination for large datasets
- Cache frequently accessed data

### 5. Security Best Practices
- Never log sensitive data
- Validate all user inputs
- Use HTTPS for all requests
- Implement certificate pinning

---

## Testing

### Sample API Calls

**Login:**
```bash
curl -X POST https://your-domain.com/api/vendors/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210", "password": "password123"}'
```

**Get Profile:**
```bash
curl -X GET https://your-domain.com/api/vendors/profile \
  -H "Authorization: Bearer your_access_token"
```

**Upload Document:**
```bash
curl -X POST https://your-domain.com/api/vendors/documents/upload \
  -H "Authorization: Bearer your_access_token" \
  -F "documentType=aadharCard" \
  -F "file=@/path/to/document.jpg" \
  -F "documentNumber=1234-5678-9012"
```

---

## Changelog

**v1.0.0** (Current)
- Initial vendor mobile app API release
- JWT-based authentication
- Profile management
- Document upload and verification
- Dashboard analytics
- Optimized for mobile performance 