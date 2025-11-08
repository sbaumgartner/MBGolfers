# Golf Playgroups - Project Summary

## Overview

Golf Playgroups is a web application for managing golf groups, scheduling play sessions, and tracking scores. The application supports three user roles with different permissions and provides automated foursome generation for organized play.

## Project Status

**Current Phase**: Phase 1 Complete - Infrastructure Ready

- ✅ AWS Infrastructure designed
- ✅ Terraform configuration complete
- ✅ Lambda functions scaffolded with full business logic
- ✅ API Gateway configured
- ✅ DynamoDB schema designed
- ⏳ Infrastructure deployment pending
- ⏳ Frontend development pending

## Technology Stack

### Backend
- **AWS Cognito** - User authentication and authorization
- **AWS API Gateway** - REST API endpoints
- **AWS Lambda** - Serverless business logic (Node.js 20.x)
- **AWS DynamoDB** - NoSQL database with GSIs
- **Terraform** - Infrastructure as Code

### Frontend (Planned)
- **React 18** - UI framework
- **AWS Amplify** - Frontend integration
- **React Router** - Client-side routing

## User Roles & Permissions

### Player (Default)
- Sign up with email → automatically assigned Player role
- Join playgroups (when added by GroupLeader)
- View playgroups and sessions
- Enter/edit scores for anyone in their foursome
- View session results

### GroupLeader (Promoted by Admin)
- All Player permissions
- Create playgroups
- Add members to playgroups
- Create play sessions
- Edit foursome assignments
- View/edit all scores in their playgroups

### Admin (Promoted by Admin)
- View all users
- Search/filter users
- Update user roles (Player ↔ GroupLeader ↔ Admin)
- Access admin-only screens

## Key Features (V1 MVP)

### 1. User Management
- Email-based sign-up via Cognito
- Automatic "Player" role on registration
- Admin role management interface

### 2. Playgroup Management
- GroupLeaders create and manage playgroups
- Add/remove players from groups
- View member lists

### 3. Play Session Scheduling
- GroupLeaders schedule sessions (date/time/course)
- **Automatic foursome generation** from playgroup members
- Manual foursome editing capability

### 4. Scoring System
- 18-hole scorecard per player
- Any foursome member can enter scores for all players
- GroupLeaders can edit any scores in their playgroups
- Default course: 18 holes, par 4 each (par 72 total)
- Automatic score calculation

### 5. Results & Reporting
- View completed session scores
- See all foursomes and their scores
- Individual player score history

## Architecture Highlights

### AWS Services
- **Cognito User Pool**: Email auth, custom role attribute
- **API Gateway**: 5 REST endpoints with Cognito authorizer
- **Lambda**: 5 functions (users, playgroups, sessions, foursomes, scores)
- **DynamoDB**: 5 tables with optimized GSIs

### Security
- JWT-based authentication on all endpoints
- Role-based authorization in Lambda functions
- CORS enabled for frontend integration
- Input validation and sanitization

### Scalability
- Serverless architecture (auto-scaling)
- DynamoDB on-demand billing
- Stateless Lambda functions
- CloudWatch monitoring

## Data Model

### 5 DynamoDB Tables

1. **Users**: Profile and role management
2. **Playgroups**: Golf group organization
3. **PlaySessions**: Scheduled golf rounds
4. **Foursomes**: Player groupings per session
5. **Scores**: Individual player scores (18 holes)

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed schema.

## API Overview

### 5 Main Endpoints

- `GET/POST /users` - User management
- `GET/POST /playgroups` - Playgroup CRUD
- `GET/POST /sessions` - Session creation
- `GET/PUT /foursomes` - Foursome management
- `GET/PUT /scores` - Score tracking

See [API.md](API.md) for complete documentation.

## Development Roadmap

### Phase 1: Infrastructure ✅
- [x] Terraform configuration
- [x] AWS resource definitions
- [x] Lambda function scaffolding
- [x] Documentation

### Phase 2: Backend (In Progress)
- [ ] Deploy infrastructure
- [ ] Test Lambda functions
- [ ] API integration testing
- [ ] Error handling refinement

### Phase 3: Frontend (Planned)
- [ ] React app setup
- [ ] AWS Amplify configuration
- [ ] Authentication screens
- [ ] User role-specific dashboards
- [ ] Playgroup management UI
- [ ] Session creation & scheduling
- [ ] Scorecard interface
- [ ] Results display

### Phase 4: Testing & Launch (Planned)
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Performance optimization
- [ ] Production deployment
- [ ] User documentation

See [CHECKLIST.md](CHECKLIST.md) for detailed task list.

## Cost Estimate

For small-scale deployment (< 1000 users, < 10,000 API calls/month):

- Cognito: Free tier (50,000 MAU)
- DynamoDB: ~$1-2/month
- Lambda: Free tier (1M requests)
- API Gateway: ~$3.50/million requests
- CloudWatch: ~$0.50/month

**Estimated Total**: $2-5/month

## Quick Start

```bash
# 1. Deploy infrastructure
cd terraform
./setup.sh
terraform apply

# 2. Save outputs
terraform output > ../outputs.txt

# 3. Test API (after deployment)
# Use Postman with Cognito tokens

# 4. Build frontend (when ready)
cd ../frontend
npm install
npm start
```

See [QUICKSTART.md](QUICKSTART.md) for detailed instructions.

## Success Criteria (V1)

A successful V1 launch means:

1. ✅ Users can sign up and log in
2. ✅ GroupLeaders can create playgroups
3. ✅ GroupLeaders can add members
4. ✅ GroupLeaders can create sessions
5. ✅ Foursomes auto-generate correctly
6. ✅ Players can enter scores
7. ✅ Session results display correctly
8. ✅ Admins can manage user roles
9. ✅ All security checks enforced
10. ✅ Application deployed and accessible

## Support & Resources

- **Documentation**: See [INDEX.md](INDEX.md)
- **Terraform**: See [../terraform/README.md](../terraform/README.md)
- **Architecture**: See [ARCHITECTURE.md](ARCHITECTURE.md)
- **API Reference**: See [API.md](API.md)

## Project Team

- **Project Type**: Solo development project
- **Architecture**: Serverless AWS
- **Development Approach**: Infrastructure-first, vertical slices

---

**Version**: 1.0.0
**Last Updated**: 2025-11-08
**Status**: Infrastructure Complete, Ready for Deployment
