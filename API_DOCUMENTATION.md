# Wastewise API Documentation

## Overview

The Wastewise API is a RESTful API built with Express.js that provides comprehensive waste management functionality. This document provides detailed information about all available endpoints, authentication, and usage examples.

## Base URL

- **Development**: `http://localhost:5000`
- **Production**: `https://api.wastewise.com`

## Interactive Documentation

Access the interactive Swagger UI documentation at:
- **Swagger UI**: http://localhost:5000/api-docs
- **OpenAPI JSON**: http://localhost:5000/api-docs.json

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer YOUR_JWT_TOKEN
```

### Obtaining a Token

**Register:**
```bash
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "resident"
}
```

**Login:**
```bash
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "_id": "user_id",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "resident"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

## API Endpoints

### Authentication

#### Register User
```http
POST /api/auth/register
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "role": "resident",
  "address": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "coordinates": {
      "lat": 40.7128,
      "lng": -74.0060
    }
  }
}
```

#### Login
```http
POST /api/auth/login
```

#### Get Current User
```http
GET /api/auth/me
Authorization: Bearer TOKEN
```

#### Refresh Token
```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your_refresh_token"
}
```

#### Logout
```http
POST /api/auth/logout
Authorization: Bearer TOKEN
```

#### Forgot Password
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

#### Reset Password
```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset_token",
  "password": "newpassword123"
}
```

### Waste Reports

#### Create Waste Report
```http
POST /api/reports
Authorization: Bearer TOKEN
Content-Type: multipart/form-data

type: household
description: Large pile of household waste
location[address]: 123 Main St, City
location[coordinates][lat]: 40.7128
location[coordinates][lng]: -74.0060
estimatedVolume: 5.5
priority: medium
images: [file1.jpg, file2.jpg]
```

#### Get All Reports
```http
GET /api/reports?page=1&limit=10&status=pending&type=household
Authorization: Bearer TOKEN
```

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `status` (optional): Filter by status (pending, in_progress, completed, cancelled)
- `type` (optional): Filter by waste type
- `priority` (optional): Filter by priority

#### Get Single Report
```http
GET /api/reports/:id
Authorization: Bearer TOKEN
```

#### Update Report
```http
PATCH /api/reports/:id
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "description": "Updated description",
  "notes": "Additional notes"
}
```

#### Delete Report
```http
DELETE /api/reports/:id
Authorization: Bearer TOKEN
```

#### Get Nearby Reports
```http
GET /api/reports/nearby?lat=40.7128&lng=-74.0060&radius=5
Authorization: Bearer TOKEN
```

### Pickup Tasks

#### Create Pickup Task (Admin Only)
```http
POST /api/pickups/tasks
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "reportId": "report_id",
  "collectorId": "collector_id",
  "scheduledDate": "2024-12-01T10:00:00Z",
  "estimatedDuration": 30,
  "notes": "Handle with care"
}
```

#### Get All Pickup Tasks (Admin)
```http
GET /api/pickups/tasks?page=1&limit=10&status=scheduled
Authorization: Bearer ADMIN_TOKEN
```

#### Get Collector's Tasks
```http
GET /api/pickups/my-tasks?page=1&limit=10
Authorization: Bearer COLLECTOR_TOKEN
```

#### Get Task Details
```http
GET /api/pickups/tasks/:id
Authorization: Bearer TOKEN
```

#### Start Pickup Task
```http
POST /api/pickups/tasks/:id/start
Authorization: Bearer COLLECTOR_TOKEN
```

#### Complete Pickup Task
```http
POST /api/pickups/tasks/:id/complete
Authorization: Bearer COLLECTOR_TOKEN
Content-Type: application/json

{
  "notes": "Task completed successfully",
  "images": ["image_url1", "image_url2"]
}
```

#### Cancel Pickup Task
```http
POST /api/pickups/tasks/:id/cancel
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "reason": "Weather conditions"
}
```

#### Reschedule Pickup Task
```http
POST /api/pickups/tasks/:id/reschedule
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "scheduledDate": "2024-12-02T10:00:00Z"
}
```

#### Update Collector Location
```http
POST /api/pickups/tasks/:id/update-location
Authorization: Bearer COLLECTOR_TOKEN
Content-Type: application/json

{
  "latitude": 40.7128,
  "longitude": -74.0060
}
```

#### Get Collector Statistics
```http
GET /api/pickups/collector/stats
Authorization: Bearer COLLECTOR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 50,
    "completed": 45,
    "inProgress": 2,
    "scheduled": 3,
    "cancelled": 0,
    "completionRate": 90,
    "today": {
      "total": 5,
      "completed": 3,
      "inProgress": 1,
      "scheduled": 1,
      "totalDuration": 150,
      "highPriority": 2
    },
    "thisWeek": {
      "total": 20,
      "completed": 18,
      "completionRate": 90
    }
  }
}
```

#### Get Collector Performance
```http
GET /api/pickups/collector/performance?period=month
Authorization: Bearer COLLECTOR_TOKEN
```

**Query Parameters:**
- `period`: week, month, or year

### Notifications

#### Get Notifications
```http
GET /api/notifications?page=1&limit=20&isRead=false
Authorization: Bearer TOKEN
```

#### Mark Notification as Read
```http
PATCH /api/notifications/:id/read
Authorization: Bearer TOKEN
```

#### Mark All as Read
```http
PATCH /api/notifications/mark-all-read
Authorization: Bearer TOKEN
```

#### Delete Notification
```http
DELETE /api/notifications/:id
Authorization: Bearer TOKEN
```

#### Send Notification (Admin Only)
```http
POST /api/notifications/send
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "userId": "user_id",
  "type": "info",
  "title": "System Update",
  "message": "The system will be under maintenance"
}
```

### Admin Endpoints

#### Get Pending Reports
```http
GET /api/admin/pending-reports?page=1&limit=10
Authorization: Bearer ADMIN_TOKEN
```

#### Assign Collector
```http
POST /api/admin/assign-collector
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "reportId": "report_id",
  "collectorId": "collector_id",
  "scheduledDate": "2024-12-01T10:00:00Z",
  "estimatedDuration": 30
}
```

#### Get All Reports (Admin)
```http
GET /api/admin/reports?page=1&limit=10&status=pending&priority=high
Authorization: Bearer ADMIN_TOKEN
```

#### Update Report Status
```http
PATCH /api/admin/reports/:id/status
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "status": "in_progress",
  "notes": "Collector assigned"
}
```

#### Get All Users
```http
GET /api/admin/users?page=1&limit=10&role=collector&status=active
Authorization: Bearer ADMIN_TOKEN
```

#### Update User Status
```http
PATCH /api/admin/users/:id/status
Authorization: Bearer ADMIN_TOKEN
Content-Type: application/json

{
  "isActive": false
}
```

#### Get Report Analytics
```http
GET /api/admin/analytics/reports?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer ADMIN_TOKEN
```

#### Get User Analytics
```http
GET /api/admin/analytics/users?startDate=2024-01-01&endDate=2024-12-31
Authorization: Bearer ADMIN_TOKEN
```

#### Export Reports
```http
GET /api/admin/export/reports?format=csv&status=completed
Authorization: Bearer ADMIN_TOKEN
```

**Query Parameters:**
- `format`: csv or excel
- Other filters: status, type, priority, startDate, endDate

#### Export Users
```http
GET /api/admin/export/users?format=excel
Authorization: Bearer ADMIN_TOKEN
```

### Messaging

#### Get Room Messages
```http
GET /api/messages/rooms/:room/messages?page=1&limit=50
Authorization: Bearer TOKEN
```

#### Send Message
```http
POST /api/messages/send
Authorization: Bearer TOKEN
Content-Type: application/json

{
  "room": "room_id",
  "message": "Hello!",
  "type": "text"
}
```

### Statistics

#### Get Dashboard Statistics
```http
GET /api/statistics/dashboard
Authorization: Bearer TOKEN
```

#### Get Report Statistics (Admin)
```http
GET /api/statistics/reports?period=month
Authorization: Bearer ADMIN_TOKEN
```

#### Get Collector Statistics (Admin)
```http
GET /api/statistics/collectors
Authorization: Bearer ADMIN_TOKEN
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "errors": {
    "field": ["Validation error message"]
  }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

## Error Codes

| Status Code | Description |
|-------------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |

## Rate Limiting

- **Development**: No rate limiting
- **Production**: 100 requests per 15 minutes per IP

## WebSocket Events

The API also supports real-time communication via Socket.io:

### Client Events
- `join_room` - Join a chat room
- `leave_room` - Leave a chat room
- `send_message` - Send a message
- `typing` - User is typing

### Server Events
- `new_message` - New message received
- `task_assigned` - New task assigned to collector
- `task_update` - Task status updated
- `report_update` - Report status updated
- `emergency_alert` - Emergency notification
- `system_notification` - System notification

## Testing

Use the Swagger UI for interactive testing:
1. Navigate to http://localhost:5000/api-docs
2. Click "Authorize" and enter your JWT token
3. Expand any endpoint and click "Try it out"
4. Fill in the parameters and click "Execute"

## Support

For API support and questions:
- **Documentation**: http://localhost:5000/api-docs
- **Email**: api-support@wastewise.com
- **GitHub Issues**: https://github.com/your-username/wastewise/issues

---

**Last Updated**: November 2024
**API Version**: 1.0.0
