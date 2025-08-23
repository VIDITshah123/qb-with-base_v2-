# Question Status API Documentation

## Overview
The Question Status API provides endpoints for managing question statuses and their transitions in the question bank system. This includes creating, reading, updating, and deleting statuses, as well as managing the workflow of questions through different statuses.

## Base URL
```
/api
```

## Authentication
All endpoints require authentication using a Bearer token in the Authorization header.

```
Authorization: Bearer <your_access_token>
```

## Models

### QuestionStatus
| Field | Type | Description |
|-------|------|-------------|
| status_id | integer | Unique identifier for the status |
| name | string | Unique name for the status (lowercase, underscores) |
| display_name | string | Human-readable name for the status |
| description | string | Optional description of the status |
| is_active | boolean | Whether the status is active |
| is_default | boolean | Whether this is the default status |
| created_at | string | Timestamp when the status was created |
| updated_at | string | Timestamp when the status was last updated |

### StatusHistory
| Field | Type | Description |
|-------|------|-------------|
| history_id | integer | Unique identifier for the history record |
| question_id | integer | ID of the question |
| from_status_id | integer | Previous status ID (null for initial status) |
| to_status_id | integer | New status ID |
| changed_by | integer | ID of the user who made the change |
| comments | string | Optional comments about the status change |
| created_at | string | Timestamp when the change was made |
| from_status_name | string | Name of the previous status |
| from_display_name | string | Display name of the previous status |
| to_status_name | string | Name of the new status |
| to_display_name | string | Display name of the new status |
| user_email | string | Email of the user who made the change |
| first_name | string | First name of the user who made the change |
| last_name | string | Last name of the user who made the change |

### StatusTransition
| Field | Type | Description |
|-------|------|-------------|
| transition_id | integer | Unique identifier for the transition |
| from_status_id | integer | Source status ID |
| to_status_id | integer | Target status ID |
| role_id | integer | Role ID that can perform this transition |
| is_active | boolean | Whether the transition is active |
| created_at | string | Timestamp when the transition was created |
| to_status_name | string | Name of the target status |
| to_display_name | string | Display name of the target status |

## Endpoints

### Get All Statuses
```
GET /question-status
```

**Query Parameters:**
- `includeInactive` (boolean, optional): Include inactive statuses (default: false)
- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Number of items per page (default: 20, max: 100)

**Response:**
```json
[
  {
    "status_id": 1,
    "name": "draft",
    "display_name": "Draft",
    "description": "Initial draft of the question",
    "is_active": true,
    "is_default": true,
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-01T00:00:00.000Z"
  }
]
```

### Get Status by ID
```
GET /question-status/:statusId
```

**Path Parameters:**
- `statusId` (required): ID of the status to retrieve

**Response:**
```json
{
  "status_id": 1,
  "name": "draft",
  "display_name": "Draft",
  "description": "Initial draft of the question",
  "is_active": true,
  "is_default": true,
  "created_at": "2023-01-01T00:00:00.000Z",
  "updated_at": "2023-01-01T00:00:00.000Z"
}
```

### Create Status (Admin Only)
```
POST /question-status
```

**Request Body:**
```json
{
  "name": "in_review",
  "display_name": "In Review",
  "description": "Question is under review",
  "is_active": true,
  "is_default": false
}
```

**Response (201 Created):**
```json
{
  "status_id": 2,
  "name": "in_review",
  "display_name": "In Review",
  "description": "Question is under review",
  "is_active": true,
  "is_default": false,
  "created_at": "2023-01-01T00:00:00.000Z",
  "updated_at": "2023-01-01T00:00:00.000Z"
}
```

### Update Status (Admin Only)
```
PUT /question-status/:statusId
```

**Path Parameters:**
- `statusId` (required): ID of the status to update

**Request Body:**
```json
{
  "display_name": "In Review (Updated)",
  "description": "Question is currently being reviewed"
}
```

**Response:**
```json
{
  "status_id": 2,
  "name": "in_review",
  "display_name": "In Review (Updated)",
  "description": "Question is currently being reviewed",
  "is_active": true,
  "is_default": false,
  "created_at": "2023-01-01T00:00:00.000Z",
  "updated_at": "2023-01-02T00:00:00.000Z"
}
```

### Delete Status (Admin Only)
```
DELETE /question-status/:statusId
```

**Path Parameters:**
- `statusId` (required): ID of the status to delete

**Response:**
```
204 No Content
```

### Get Question Status History
```
GET /questions/:questionId/status/history
```

**Path Parameters:**
- `questionId` (required): ID of the question

**Query Parameters:**
- `page` (integer, optional): Page number for pagination (default: 1)
- `limit` (integer, optional): Number of items per page (default: 20, max: 100)

**Response:**
```json
{
  "data": [
    {
      "history_id": 1,
      "question_id": 123,
      "from_status_id": null,
      "to_status_id": 1,
      "changed_by": 456,
      "comments": "Initial status",
      "created_at": "2023-01-01T00:00:00.000Z",
      "from_status_name": null,
      "from_display_name": null,
      "to_status_name": "draft",
      "to_display_name": "Draft",
      "user_email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe"
    }
  ],
  "pagination": {
    "total": 1,
    "totalPages": 1,
    "currentPage": 1,
    "pageSize": 20
  }
}
```

### Get Valid Status Transitions
```
GET /status/:statusId/transitions
```

**Path Parameters:**
- `statusId` (required): Current status ID

**Response:**
```json
[
  {
    "transition_id": 1,
    "from_status_id": 1,
    "to_status_id": 2,
    "role_id": 3,
    "is_active": true,
    "created_at": "2023-01-01T00:00:00.000Z",
    "to_status_name": "in_review",
    "to_display_name": "In Review"
  }
]
```

### Update Question Status
```
PUT /questions/:questionId/status
```

**Path Parameters:**
- `questionId` (required): ID of the question to update

**Request Body:**
```json
{
  "to_status_id": 2,
  "comments": "Ready for review"
}
```

**Response:**
```json
{
  "success": true,
  "question": {
    "question_id": 123,
    "status_id": 2,
    "status_name": "in_review",
    "status_display_name": "In Review",
    "title": "Sample Question",
    "content": "What is the capital of France?",
    "created_at": "2023-01-01T00:00:00.000Z",
    "updated_at": "2023-01-02T00:00:00.000Z"
  },
  "history": {
    "history_id": 2,
    "question_id": 123,
    "from_status_id": 1,
    "to_status_id": 2,
    "changed_by": 456,
    "comments": "Ready for review",
    "created_at": "2023-01-02T00:00:00.000Z",
    "from_status_name": "draft",
    "from_display_name": "Draft",
    "to_status_name": "in_review",
    "to_display_name": "In Review",
    "user_email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe"
  }
}
```

## Error Responses

### 400 Bad Request
```json
{
  "errors": [
    {
      "msg": "Name must be between 2 and 50 characters",
      "param": "name",
      "location": "body"
    }
  ]
}
```

### 401 Unauthorized
```json
{
  "message": "No authorization token was found"
}
```

### 403 Forbidden
```json
{
  "message": "Invalid status transition for your role"
}
```

### 404 Not Found
```json
{
  "message": "Status not found"
}
```

## Example Workflow

1. **Create a new question (Draft status)**
   - Question is created with default status "Draft"

2. **Submit for review**
   - Author changes status from "Draft" to "In Review"
   - System records the status change in history

3. **Review the question**
   - Reviewer can see the question in the review queue
   - Reviewer can change status to "Approved" or "Rejected"
   - System notifies the author of the review outcome

4. **Publish the question**
   - Admin changes status from "Approved" to "Published"
   - Question becomes available in the question bank

5. **Archive the question**
   - Admin changes status to "Archived"
   - Question is no longer available for new quizzes but remains in history
