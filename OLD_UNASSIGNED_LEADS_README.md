# Old Unassigned Leads Management

This feature allows administrators to identify and manage leads that have been unassigned for more than 3 days and are candidates for deletion.

## Features

### 1. API Endpoint
- **GET** `/api/leads/old-unassigned` - Fetch unassigned leads older than specified days
- **DELETE** `/api/leads/old-unassigned` - Delete old unassigned leads

### 2. Component
- **OldUnassignedLeads** - Dedicated component for managing old unassigned leads
- **LeadManagementTabs** - Tabbed interface integrating both regular lead management and old unassigned leads

### 3. Service Layer
- **oldUnassignedLeadsService** - Service functions for API interactions

## Usage

### Accessing Old Unassigned Leads

1. **Via Tab Interface**: Navigate to Lead Management and use the "Old Unassigned" tab
2. **Via Button**: Click the "Old Unassigned" button in the main lead management interface
3. **Via Stats Card**: View the count in the "Old Unassigned" stats card

### Delete All Functionality

1. **Main Interface**: Use the "Delete All Old" button for quick bulk deletion
2. **Old Unassigned Tab**: Use the prominent "Delete All" button at the top
3. **Confirmation Required**: All bulk deletions require confirmation
4. **Reason Documentation**: Optional but recommended for audit purposes

### Configuration

- **Default Threshold**: 3 days (configurable via UI)
- **Maximum Threshold**: 30 days
- **Pagination**: 20 leads per page (configurable)

### Actions Available

1. **View Leads**: See all unassigned leads older than the specified threshold
2. **Select Leads**: Choose individual leads or select all for bulk operations
3. **Delete Leads**: Remove selected leads with optional reason documentation
4. **Bulk Operations**: Delete multiple leads at once
5. **Delete All**: Remove all old unassigned leads at once (with confirmation)

## API Parameters

### GET Request
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `daysOld` (optional): Minimum age in days (default: 3)

### DELETE Request
```json
{
  "leadIds": ["leadId1", "leadId2"],
  "reason": "Optional reason for deletion"
}
```

**Delete All Request:**
```json
{
  "leadIds": [],
  "reason": "Optional reason for deletion",
  "deleteAll": true
}
```

## Response Format

### GET Response
```json
{
  "success": true,
  "data": [
    {
      "_id": "leadId",
      "customerName": "John Doe",
      "customerPhone": "1234567890",
      "customerEmail": "john@example.com",
      "service": "Plumbing",
      "selectedService": "Pipe Repair",
      "address": "123 Main St",
      "description": "Leaking pipe",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "daysOld": 5
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 100,
    "itemsPerPage": 20
  },
  "stats": {
    "totalUnassignedOld": 100,
    "averageDaysOld": 4.5,
    "oldestLead": "2024-01-01T00:00:00.000Z",
    "newestLead": "2024-01-05T00:00:00.000Z",
    "dateThreshold": "2024-01-02T00:00:00.000Z"
  }
}
```

### DELETE Response
```json
{
  "success": true,
  "message": "Successfully deleted 5 old unassigned leads",
  "deletedCount": 5,
  "reason": "Automatic cleanup of old unassigned leads"
}
```

## Safety Features

1. **Verification**: API verifies leads are actually old and unassigned before deletion
2. **Confirmation Dialogs**: UI requires confirmation before deletion
3. **Reason Documentation**: Optional reason field for audit trail
4. **Bulk Operations**: Efficient handling of multiple leads

## Integration Points

### Lead Management Page
- Added tabbed interface
- Integrated stats card showing old unassigned count
- Quick access button to old unassigned leads

### Lead Schema
- Leverages existing lead model structure
- Uses `status: 'pending'` and empty `availableToVendors.vendor` array
- Calculates age based on `createdAt` timestamp

## Error Handling

- Graceful fallbacks for API failures
- User-friendly error messages
- Loading states and progress indicators
- Validation of input parameters

## Security Considerations

- Only administrators can access this functionality
- Deletion requires confirmation
- Audit trail maintained through reason field
- Database-level validation of lead eligibility

## Performance Optimizations

- Efficient database queries with proper indexing
- Pagination to handle large datasets
- Lean queries for read operations
- Background processing for non-critical operations

## Future Enhancements

1. **Automated Cleanup**: Scheduled deletion of very old leads
2. **Notification System**: Alert admins when threshold is exceeded
3. **Analytics Dashboard**: Detailed reporting on lead aging
4. **Bulk Assignment**: Option to reassign old leads instead of deletion
5. **Export Functionality**: Download reports of old unassigned leads
