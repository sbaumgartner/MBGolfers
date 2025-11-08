# Golf Playgroups - API Reference

Complete API documentation for the Golf Playgroups REST API.

## Base URL

```
https://{api-id}.execute-api.{region}.amazonaws.com/dev
```

Get your API URL from Terraform outputs:
```bash
terraform output api_gateway_url
```

## Authentication

All endpoints require JWT authentication via AWS Cognito.

### Authorization Header

```
Authorization: Bearer {id_token}
```

### Getting an ID Token

1. Sign in via Cognito
2. Extract `IdToken` from authentication response
3. Include in all API requests

### Token Claims

The following claims are available in Lambda functions:

```javascript
{
  sub: "user-id",                    // Cognito user ID
  email: "user@example.com",         // User email
  "custom:role": "Player"            // User role
}
```

## Common Response Formats

### Success Response

```json
{
  "user": { ... },
  "playgroup": { ... },
  "session": { ... }
}
```

### Error Response

```json
{
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200 OK` - Request successful
- `201 Created` - Resource created
- `400 Bad Request` - Invalid input
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `405 Method Not Allowed` - Wrong HTTP method
- `500 Internal Server Error` - Server error

---

## Endpoints

## 1. Users API

### GET /users

List users (admin only, or current user info).

**Authorization**: Authenticated (Admins can list all, others see only themselves)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `role` | string | No | Filter by role (Player, GroupLeader, Admin) |
| `email` | string | No | Search by email address |

**Example Request**:

```bash
curl -X GET "${API_URL}/users?role=GroupLeader" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Response 200**:

```json
{
  "users": [
    {
      "userId": "abc123",
      "email": "john@example.com",
      "name": "John Doe",
      "role": "GroupLeader",
      "createdAt": "2025-11-08T10:00:00Z",
      "updatedAt": "2025-11-08T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `403` - Non-admin trying to list all users

---

### POST /users

Update user role (admin only).

**Authorization**: Admin only

**Request Body**:

```json
{
  "userId": "abc123",
  "role": "GroupLeader"
}
```

**Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | Yes | Cognito user ID |
| `role` | string | Yes | New role (Player, GroupLeader, Admin) |

**Example Request**:

```bash
curl -X POST "${API_URL}/users" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "abc123",
    "role": "GroupLeader"
  }'
```

**Response 200**:

```json
{
  "user": {
    "userId": "abc123",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "GroupLeader",
    "updatedAt": "2025-11-08T10:30:00Z"
  }
}
```

**Error Responses**:
- `400` - Invalid role or missing fields
- `403` - Non-admin attempting update
- `404` - User not found

---

## 2. Playgroups API

### GET /playgroups

Get user's playgroups or a specific playgroup.

**Authorization**: Authenticated

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `playgroupId` | string | No | Get specific playgroup by ID |

**Example Request (list user's groups)**:

```bash
curl -X GET "${API_URL}/playgroups" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Response 200**:

```json
{
  "playgroups": [
    {
      "playgroupId": "pg-123",
      "name": "Thursday Morning Group",
      "description": "Weekly golf at Pebble Beach",
      "leaderId": "user-abc",
      "leaderEmail": "leader@example.com",
      "memberIds": ["user-def", "user-ghi"],
      "createdAt": "2025-11-01T08:00:00Z"
    }
  ]
}
```

**Example Request (specific group)**:

```bash
curl -X GET "${API_URL}/playgroups?playgroupId=pg-123" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Response 200**:

```json
{
  "playgroup": {
    "playgroupId": "pg-123",
    "name": "Thursday Morning Group",
    "description": "Weekly golf at Pebble Beach",
    "leaderId": "user-abc",
    "leaderEmail": "leader@example.com",
    "memberIds": ["user-def", "user-ghi"],
    "createdAt": "2025-11-01T08:00:00Z"
  }
}
```

**Error Responses**:
- `403` - User not a member of requested playgroup
- `404` - Playgroup not found

---

### POST /playgroups

Create a playgroup or add a member.

**Authorization**: GroupLeader or Admin (for creation)

#### Action 1: Create Playgroup

**Request Body**:

```json
{
  "name": "Thursday Morning Group",
  "description": "Weekly golf at Pebble Beach"
}
```

**Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | Playgroup name |
| `description` | string | No | Playgroup description |

**Example Request**:

```bash
curl -X POST "${API_URL}/playgroups" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thursday Morning Group",
    "description": "Weekly golf"
  }'
```

**Response 201**:

```json
{
  "playgroup": {
    "playgroupId": "pg-123",
    "name": "Thursday Morning Group",
    "description": "Weekly golf",
    "leaderId": "user-abc",
    "leaderEmail": "leader@example.com",
    "memberIds": [],
    "createdAt": "2025-11-08T10:00:00Z"
  }
}
```

#### Action 2: Add Member

**Request Body**:

```json
{
  "action": "addMember",
  "playgroupId": "pg-123",
  "userId": "user-def"
}
```

**Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `action` | string | Yes | Must be "addMember" |
| `playgroupId` | string | Yes | Playgroup ID |
| `userId` | string | Yes | User ID to add |

**Example Request**:

```bash
curl -X POST "${API_URL}/playgroups" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "addMember",
    "playgroupId": "pg-123",
    "userId": "user-def"
  }'
```

**Response 200**:

```json
{
  "playgroup": {
    "playgroupId": "pg-123",
    "name": "Thursday Morning Group",
    "memberIds": ["user-def"],
    "updatedAt": "2025-11-08T10:30:00Z"
  }
}
```

**Error Responses**:
- `400` - Invalid input or user already a member
- `403` - Non-GroupLeader attempting creation, or non-leader adding members
- `404` - Playgroup or user not found

---

## 3. Sessions API

### GET /sessions

Get sessions by ID or playgroup.

**Authorization**: Authenticated (must be playgroup member)

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | No | Get specific session |
| `playgroupId` | string | No | Get all sessions for playgroup |

**Example Request**:

```bash
curl -X GET "${API_URL}/sessions?playgroupId=pg-123" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Response 200**:

```json
{
  "sessions": [
    {
      "sessionId": "sess-456",
      "playgroupId": "pg-123",
      "date": "2025-11-15",
      "time": "08:00",
      "courseName": "Pebble Beach",
      "status": "scheduled",
      "createdAt": "2025-11-08T10:00:00Z",
      "createdBy": "user-abc"
    }
  ]
}
```

**Error Responses**:
- `400` - Missing required query parameter
- `403` - User not a member of playgroup
- `404` - Session not found

---

### POST /sessions

Create a new play session with auto-generated foursomes.

**Authorization**: GroupLeader or Admin (must be playgroup leader)

**Request Body**:

```json
{
  "playgroupId": "pg-123",
  "date": "2025-11-15",
  "time": "08:00",
  "courseName": "Pebble Beach Golf Links"
}
```

**Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `playgroupId` | string | Yes | Playgroup ID |
| `date` | string | Yes | Session date (YYYY-MM-DD) |
| `time` | string | Yes | Tee time (HH:MM) |
| `courseName` | string | No | Golf course name (default: "Default Course") |

**Example Request**:

```bash
curl -X POST "${API_URL}/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "playgroupId": "pg-123",
    "date": "2025-11-15",
    "time": "08:00",
    "courseName": "Pebble Beach"
  }'
```

**Response 201**:

```json
{
  "session": {
    "sessionId": "sess-456",
    "playgroupId": "pg-123",
    "date": "2025-11-15",
    "time": "08:00",
    "courseName": "Pebble Beach",
    "status": "scheduled",
    "createdAt": "2025-11-08T10:00:00Z",
    "createdBy": "user-abc"
  },
  "foursomes": [
    {
      "foursomeId": "four-789",
      "sessionId": "sess-456",
      "playerIds": ["user-abc", "user-def", "user-ghi", "user-jkl"],
      "foursomeNumber": 1,
      "createdAt": "2025-11-08T10:00:00Z"
    }
  ]
}
```

**Algorithm**: Foursomes are auto-generated by:
1. Getting all playgroup members (leader + memberIds)
2. Shuffling players randomly
3. Grouping into sets of 4
4. Creating foursome records

**Error Responses**:
- `400` - Missing required fields
- `403` - Non-leader attempting creation
- `404` - Playgroup not found

---

## 4. Foursomes API

### GET /foursomes

Get foursomes for a session.

**Authorization**: Authenticated

**Query Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `sessionId` | string | Yes | Session ID |

**Example Request**:

```bash
curl -X GET "${API_URL}/foursomes?sessionId=sess-456" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Response 200**:

```json
{
  "foursomes": [
    {
      "foursomeId": "four-789",
      "sessionId": "sess-456",
      "playerIds": ["user-abc", "user-def", "user-ghi", "user-jkl"],
      "foursomeNumber": 1,
      "createdAt": "2025-11-08T10:00:00Z"
    },
    {
      "foursomeId": "four-790",
      "sessionId": "sess-456",
      "playerIds": ["user-mno", "user-pqr"],
      "foursomeNumber": 2,
      "createdAt": "2025-11-08T10:00:00Z"
    }
  ]
}
```

**Error Responses**:
- `400` - Missing sessionId parameter

---

### PUT /foursomes

Update foursome player assignments.

**Authorization**: GroupLeader or Admin

**Request Body**:

```json
{
  "foursomeId": "four-789",
  "playerIds": ["user-abc", "user-def", "user-ghi", "user-xyz"]
}
```

**Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `foursomeId` | string | Yes | Foursome ID |
| `playerIds` | array | Yes | Array of 1-4 player user IDs |

**Example Request**:

```bash
curl -X PUT "${API_URL}/foursomes" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "foursomeId": "four-789",
    "playerIds": ["user-abc", "user-def", "user-ghi", "user-xyz"]
  }'
```

**Response 200**:

```json
{
  "foursome": {
    "foursomeId": "four-789",
    "sessionId": "sess-456",
    "playerIds": ["user-abc", "user-def", "user-ghi", "user-xyz"],
    "foursomeNumber": 1,
    "updatedAt": "2025-11-08T11:00:00Z",
    "updatedBy": "user-abc"
  }
}
```

**Error Responses**:
- `400` - Invalid input (must be 1-4 players)
- `403` - Non-GroupLeader attempting update
- `404` - Foursome or player not found

---

## 5. Scores API

### GET /scores

Get scores by foursome, session, or player.

**Authorization**: Authenticated

**Query Parameters** (one required):

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `foursomeId` | string | No | Get scores for a foursome |
| `sessionId` | string | No | Get all scores for a session |
| `playerId` | string | No | Get scores for a player |

**Example Request (by session)**:

```bash
curl -X GET "${API_URL}/scores?sessionId=sess-456" \
  -H "Authorization: Bearer ${TOKEN}"
```

**Response 200**:

```json
{
  "scores": [
    {
      "foursomeId": "four-789",
      "playerId": "user-abc",
      "sessionId": "sess-456",
      "holes": [4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4],
      "totalScore": 74,
      "updatedAt": "2025-11-15T12:30:00Z",
      "updatedBy": "user-def"
    }
  ]
}
```

**Error Responses**:
- `400` - No query parameter provided

---

### PUT /scores

Update player scores for a session.

**Authorization**: Player in foursome, or GroupLeader

**Request Body**:

```json
{
  "foursomeId": "four-789",
  "playerId": "user-abc",
  "holes": [4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4]
}
```

**Body Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `foursomeId` | string | Yes | Foursome ID |
| `playerId` | string | Yes | Player user ID |
| `holes` | array | Yes | Array of exactly 18 scores (numbers >= 0) |

**Example Request**:

```bash
curl -X PUT "${API_URL}/scores" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "foursomeId": "four-789",
    "playerId": "user-abc",
    "holes": [4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4]
  }'
```

**Response 200**:

```json
{
  "score": {
    "foursomeId": "four-789",
    "playerId": "user-abc",
    "sessionId": "sess-456",
    "holes": [4, 3, 5, 4, 4, 3, 5, 4, 4, 4, 3, 5, 4, 4, 3, 5, 4, 4],
    "totalScore": 74,
    "updatedAt": "2025-11-15T12:30:00Z",
    "updatedBy": "user-def"
  }
}
```

**Validation**:
- Exactly 18 hole scores
- All scores must be non-negative numbers
- Player must be in the foursome
- Requester must be in foursome or be GroupLeader

**Error Responses**:
- `400` - Invalid holes array (not 18, or invalid scores)
- `403` - User not authorized to enter scores
- `404` - Foursome or player not found

---

## Error Reference

### 400 Bad Request

Invalid input data or malformed request.

**Common causes**:
- Missing required fields
- Invalid data types
- Array length violations (e.g., not 18 holes)
- Invalid enum values (e.g., invalid role)

**Example**:

```json
{
  "error": "holes must be an array of exactly 18 scores"
}
```

### 403 Forbidden

User lacks permissions for the requested operation.

**Common causes**:
- Non-admin updating user roles
- Non-GroupLeader creating playgroups
- Non-leader adding members
- Non-foursome-member entering scores

**Example**:

```json
{
  "error": "Forbidden: GroupLeader role required"
}
```

### 404 Not Found

Requested resource doesn't exist.

**Common causes**:
- Invalid ID
- Resource deleted
- Typo in ID

**Example**:

```json
{
  "error": "Playgroup not found"
}
```

### 500 Internal Server Error

Server-side error occurred.

**Common causes**:
- DynamoDB issues
- Lambda timeout
- Unexpected exceptions

**Example**:

```json
{
  "error": "Internal server error"
}
```

**Action**: Check CloudWatch logs for details.

---

## Testing with cURL

### Get API URL

```bash
cd terraform
API_URL=$(terraform output -raw api_gateway_url)
```

### Get ID Token

Use Cognito SDK or AWS CLI to authenticate and get token.

### Test Endpoints

```bash
# List users (as admin)
curl -X GET "${API_URL}/users" \
  -H "Authorization: Bearer ${TOKEN}"

# Create playgroup
curl -X POST "${API_URL}/playgroups" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Group"}'

# Create session
curl -X POST "${API_URL}/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "playgroupId":"pg-123",
    "date":"2025-11-15",
    "time":"08:00"
  }'

# Enter scores
curl -X PUT "${API_URL}/scores" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "foursomeId":"four-789",
    "playerId":"user-abc",
    "holes":[4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4]
  }'
```

---

**API Version**: 1.0
**Last Updated**: 2025-11-08
**Base Path**: `/dev` (development stage)
