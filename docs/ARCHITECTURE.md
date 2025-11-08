# Golf Playgroups - Architecture Documentation

## System Overview

Golf Playgroups is built on a serverless AWS architecture using:
- **AWS Cognito** for authentication
- **API Gateway** for REST API
- **Lambda** for business logic
- **DynamoDB** for data storage
- **Terraform** for infrastructure as code

## Architecture Diagram

```
┌─────────────┐
│   Browser   │
│  (React +   │
│  Amplify)   │
└──────┬──────┘
       │ HTTPS
       ▼
┌─────────────────────────────────────────┐
│         AWS Cognito User Pool            │
│  - Email/Password Authentication         │
│  - JWT Token Generation                  │
│  - Custom Attribute: role                │
└──────┬──────────────────────────────────┘
       │ JWT Token
       ▼
┌─────────────────────────────────────────┐
│          API Gateway (REST)              │
│  - Cognito Authorizer                    │
│  - 5 Resources: /users, /playgroups,     │
│    /sessions, /foursomes, /scores        │
│  - CORS Enabled                          │
└──────┬──────────────────────────────────┘
       │ Invoke
       ▼
┌──────────────────────────────────────────┐
│         Lambda Functions (5)              │
│                                           │
│  ┌───────────┐  ┌──────────────┐        │
│  │   users   │  │  playgroups  │        │
│  └───────────┘  └──────────────┘        │
│                                           │
│  ┌───────────┐  ┌──────────────┐        │
│  │ sessions  │  │  foursomes   │        │
│  └───────────┘  └──────────────┘        │
│                                           │
│  ┌───────────┐                           │
│  │  scores   │                           │
│  └───────────┘                           │
└──────┬───────────────────────────────────┘
       │ DynamoDB API
       ▼
┌──────────────────────────────────────────┐
│        DynamoDB Tables (5)                │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ Users                            │    │
│  │ PK: userId                       │    │
│  │ GSI: EmailIndex, RoleIndex       │    │
│  └─────────────────────────────────┘    │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ Playgroups                       │    │
│  │ PK: playgroupId                  │    │
│  │ GSI: LeaderIndex                 │    │
│  └─────────────────────────────────┘    │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ PlaySessions                     │    │
│  │ PK: sessionId                    │    │
│  │ GSI: PlaygroupDateIndex          │    │
│  └─────────────────────────────────┘    │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ Foursomes                        │    │
│  │ PK: foursomeId, SK: sessionId    │    │
│  │ GSI: SessionIndex                │    │
│  └─────────────────────────────────┘    │
│                                           │
│  ┌─────────────────────────────────┐    │
│  │ Scores                           │    │
│  │ PK: foursomeId, SK: playerId     │    │
│  │ GSI: SessionPlayerIndex          │    │
│  └─────────────────────────────────┘    │
└──────────────────────────────────────────┘
```

## Data Model

### 1. Users Table

**Purpose**: Store user profiles and roles

**Schema**:
```javascript
{
  userId: String (PK),        // Cognito sub
  email: String,              // User email (GSI)
  name: String,               // Display name
  role: String,               // Player | GroupLeader | Admin (GSI)
  createdAt: String,          // ISO 8601 timestamp
  updatedAt: String           // ISO 8601 timestamp
}
```

**Global Secondary Indexes**:
- `EmailIndex`: Hash key = email
  - Use case: Find user by email address
- `RoleIndex`: Hash key = role
  - Use case: List all users with specific role

**Access Patterns**:
1. Get user by ID: `GetItem(userId)`
2. Find user by email: `Query(EmailIndex, email)`
3. List users by role: `Query(RoleIndex, role)`

### 2. Playgroups Table

**Purpose**: Store golf playgroup information

**Schema**:
```javascript
{
  playgroupId: String (PK),   // UUID
  name: String,               // Playgroup name
  description: String,        // Optional description
  leaderId: String,           // User ID of leader (GSI)
  leaderEmail: String,        // Leader's email
  memberIds: Array<String>,   // Array of user IDs
  createdAt: String,          // ISO 8601 timestamp
  updatedAt: String           // ISO 8601 timestamp
}
```

**Global Secondary Indexes**:
- `LeaderIndex`: Hash key = leaderId
  - Use case: Find all playgroups led by a user

**Access Patterns**:
1. Get playgroup by ID: `GetItem(playgroupId)`
2. List user's led groups: `Query(LeaderIndex, userId)`
3. Find groups user is member of: `Scan` + filter (or maintain separate mapping table)

**Design Note**: For production, consider adding a separate `UserPlaygroups` table to efficiently query groups by member.

### 3. PlaySessions Table

**Purpose**: Store scheduled golf sessions

**Schema**:
```javascript
{
  sessionId: String (PK),     // UUID
  playgroupId: String,        // Parent playgroup (GSI)
  date: String,               // YYYY-MM-DD (GSI range key)
  time: String,               // HH:MM
  courseName: String,         // Golf course name
  status: String,             // scheduled | in_progress | completed | cancelled
  createdAt: String,          // ISO 8601 timestamp
  createdBy: String           // User ID who created
}
```

**Global Secondary Indexes**:
- `PlaygroupDateIndex`: Hash key = playgroupId, Range key = date
  - Use case: List sessions for a playgroup, sorted by date

**Access Patterns**:
1. Get session by ID: `GetItem(sessionId)`
2. List playgroup sessions: `Query(PlaygroupDateIndex, playgroupId)`
3. Get upcoming sessions: `Query(PlaygroupDateIndex, playgroupId, date >= today)`

### 4. Foursomes Table

**Purpose**: Store player groupings for each session

**Schema**:
```javascript
{
  foursomeId: String (PK),    // UUID
  sessionId: String (SK),     // Session ID (GSI)
  playerIds: Array<String>,   // 1-4 player user IDs
  foursomeNumber: Number,     // 1, 2, 3, etc.
  createdAt: String,          // ISO 8601 timestamp
  updatedAt: String,          // ISO 8601 timestamp
  updatedBy: String           // User ID who last updated
}
```

**Global Secondary Indexes**:
- `SessionIndex`: Hash key = sessionId
  - Use case: Get all foursomes for a session

**Access Patterns**:
1. Get foursome by ID: `Query(foursomeId)`
2. List session foursomes: `Query(SessionIndex, sessionId)`

**Design Note**: Composite key (foursomeId + sessionId) allows for potential reuse of foursome configurations across sessions.

### 5. Scores Table

**Purpose**: Store individual player scores

**Schema**:
```javascript
{
  foursomeId: String (PK),    // Which foursome
  playerId: String (SK),      // Which player
  sessionId: String,          // Which session (GSI)
  holes: Array<Number>,       // 18 scores (one per hole)
  totalScore: Number,         // Sum of all holes
  updatedAt: String,          // ISO 8601 timestamp
  updatedBy: String           // User ID who entered/updated
}
```

**Global Secondary Indexes**:
- `SessionPlayerIndex`: Hash key = sessionId, Range key = playerId
  - Use case: Get all scores for a session, or a specific player's score

**Access Patterns**:
1. Get player score in foursome: `GetItem(foursomeId, playerId)`
2. List all scores in foursome: `Query(foursomeId)`
3. Get all scores for session: `Query(SessionPlayerIndex, sessionId)`
4. Get player's score in session: `Query(SessionPlayerIndex, sessionId, playerId)`

## Authentication & Authorization

### Authentication Flow

```
1. User signs up → Cognito User Pool
2. Email verification
3. User logs in → Cognito returns JWT tokens
4. Frontend stores ID token
5. API requests include: Authorization: Bearer {id_token}
6. API Gateway validates token with Cognito Authorizer
7. Lambda receives validated claims in event.requestContext.authorizer.claims
```

### Authorization Patterns

#### In Lambda Functions

```javascript
function getUserFromEvent(event) {
  const claims = event.requestContext.authorizer.claims;
  return {
    userId: claims.sub,
    email: claims.email,
    role: claims['custom:role'] || 'Player'
  };
}

// Example: Only admins can update roles
if (currentUser.role !== 'Admin') {
  return response(403, { error: 'Forbidden' });
}

// Example: Only playgroup leaders can add members
const playgroup = await getPlaygroup(playgroupId);
if (playgroup.leaderId !== currentUser.userId && currentUser.role !== 'Admin') {
  return response(403, { error: 'Forbidden' });
}

// Example: Only foursome members can enter scores
const foursome = await getFoursome(foursomeId);
if (!foursome.playerIds.includes(currentUser.userId) && currentUser.role !== 'GroupLeader') {
  return response(403, { error: 'Forbidden' });
}
```

### Role Hierarchy

```
Admin
  - All permissions
  - Can update any user's role
  - Can view all users

GroupLeader
  - All Player permissions
  - Can create playgroups
  - Can add members to their playgroups
  - Can create sessions for their playgroups
  - Can edit foursomes in their sessions
  - Can edit any scores in their sessions

Player
  - Can view their playgroups
  - Can view upcoming sessions
  - Can enter/edit scores for players in their foursome
  - Can view session results
```

## Lambda Functions

### 1. Users Lambda

**Responsibilities**:
- List users (admin only, or current user)
- Update user roles (admin only)

**Endpoints**:
- `GET /users`
- `POST /users`

**Key Logic**:
- Validate admin role for listing all users
- Update both Cognito and DynamoDB when changing roles
- Support filtering by email and role

### 2. Playgroups Lambda

**Responsibilities**:
- Create playgroups
- List playgroups (user's groups)
- Add members to playgroups

**Endpoints**:
- `GET /playgroups`
- `POST /playgroups`

**Key Logic**:
- Verify GroupLeader role for creation
- Only leader can add members
- Track both leader and members

### 3. Sessions Lambda

**Responsibilities**:
- Create play sessions
- Auto-generate foursomes
- List sessions by playgroup

**Endpoints**:
- `GET /sessions`
- `POST /sessions`

**Key Logic**:
```javascript
// Foursome generation algorithm
function generateFoursomes(sessionId, playerIds) {
  const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
  const foursomes = [];

  for (let i = 0; i < shuffled.length; i += 4) {
    const group = shuffled.slice(i, i + 4);
    foursomes.push({
      foursomeId: uuidv4(),
      sessionId,
      playerIds: group,
      foursomeNumber: Math.floor(i / 4) + 1
    });
  }

  return foursomes;
}
```

### 4. Foursomes Lambda

**Responsibilities**:
- Get foursomes for a session
- Update foursome player assignments

**Endpoints**:
- `GET /foursomes`
- `PUT /foursomes`

**Key Logic**:
- GroupLeaders can rearrange players
- Validate 1-4 players per foursome
- Track who made changes

### 5. Scores Lambda

**Responsibilities**:
- Get scores (by foursome, session, or player)
- Update player scores
- Calculate total scores

**Endpoints**:
- `GET /scores`
- `PUT /scores`

**Key Logic**:
```javascript
// Score calculation
function calculateTotalScore(holes) {
  return holes.reduce((sum, score) => sum + score, 0);
}

// Validation
- Must be 18 holes
- All scores must be numbers >= 0
- Player must be in foursome
- Requester must be in foursome or be GroupLeader
```

## API Gateway Configuration

### Resources & Methods

```
/users
  GET    - List users
  POST   - Update user role
  OPTIONS - CORS preflight

/playgroups
  GET    - List playgroups
  POST   - Create or add member
  OPTIONS - CORS preflight

/sessions
  GET    - List sessions
  POST   - Create session
  OPTIONS - CORS preflight

/foursomes
  GET    - List foursomes
  PUT    - Update foursome
  OPTIONS - CORS preflight

/scores
  GET    - List scores
  PUT    - Update score
  OPTIONS - CORS preflight
```

### Cognito Authorizer

All endpoints use Cognito User Pool authorizer:
- Type: `COGNITO_USER_POOLS`
- Token source: `Authorization` header
- Validation: JWT signature and expiration

### CORS Configuration

Headers returned by Lambda:
```javascript
{
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
}
```

## Error Handling

### Standard Response Format

```javascript
// Success
{
  statusCode: 200,
  headers: { /* CORS headers */ },
  body: JSON.stringify({ data })
}

// Error
{
  statusCode: 400 | 403 | 404 | 500,
  headers: { /* CORS headers */ },
  body: JSON.stringify({ error: 'Error message' })
}
```

### HTTP Status Codes

- `200 OK` - Successful GET/PUT
- `201 Created` - Successful POST (creation)
- `400 Bad Request` - Invalid input
- `403 Forbidden` - Authorization failure
- `404 Not Found` - Resource doesn't exist
- `405 Method Not Allowed` - Wrong HTTP method
- `500 Internal Server Error` - Server-side error
- `501 Not Implemented` - Placeholder Lambda

## Security Considerations

### Input Validation

All Lambda functions validate:
- Required fields present
- Data types correct
- Array lengths appropriate
- No SQL/NoSQL injection
- No XSS attacks

### Authorization Checks

Every endpoint verifies:
1. User is authenticated (JWT valid)
2. User has required role
3. User has access to requested resource
4. Operations are within user's permissions

### Secrets Management

- No secrets in code
- Use AWS Secrets Manager for production credentials
- Environment variables for non-sensitive config

### Cognito Security

- Password policy: 8+ chars, upper, lower, numbers
- Email verification required
- Deletion protection enabled on User Pool
- JWT expiration: 60 minutes

## Scalability & Performance

### Serverless Benefits

- Auto-scaling Lambda functions
- On-demand DynamoDB capacity
- No server management
- Pay-per-use pricing

### DynamoDB Optimization

- Use GSIs for query patterns
- Partition keys distribute load
- Batch operations for multiple items
- Eventually consistent reads where acceptable

### Lambda Optimization

- Keep functions warm (consider provisioned concurrency)
- Minimize cold start time (small dependencies)
- Reuse connections (DynamoDB client)
- Efficient memory allocation (currently 128 MB)

## Monitoring & Logging

### CloudWatch Logs

All Lambda functions log to CloudWatch:
- Log group: `/aws/lambda/{function-name}`
- Retention: 7 days
- Log level: INFO (can be adjusted)

### Metrics to Monitor

- Lambda invocations
- Lambda errors
- Lambda duration
- API Gateway 4xx/5xx errors
- DynamoDB throttles
- Cognito sign-ins

### Recommended Alarms

- Lambda error rate > 5%
- API Gateway 5xx errors
- DynamoDB throttling events
- Estimated costs > budget

## Future Enhancements

### Short-term
- Add email notifications (SES)
- Implement search functionality
- Add profile pictures (S3)
- Export scores to PDF

### Medium-term
- Multiple courses support
- Handicap calculations
- Leaderboards
- Statistics and analytics

### Long-term
- Mobile app (React Native)
- Real-time updates (WebSockets)
- Social features
- Integration with golf course booking systems

---

**Version**: 1.0
**Last Updated**: 2025-11-08
**Status**: Production Ready
