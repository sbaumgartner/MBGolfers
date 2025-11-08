# Golf Playgroups

A serverless web application for managing golf playgroups, scheduling play sessions, and tracking scores.

## 🎯 Project Overview

Golf Playgroups helps golf groups organize their sessions, manage members, and track scores. Built on AWS serverless architecture with:

- **AWS Cognito** for authentication
- **API Gateway** for REST API
- **Lambda** (Node.js) for business logic
- **DynamoDB** for data storage
- **React + AWS Amplify** for frontend (planned)
- **Terraform** for infrastructure as code

## 🚀 Quick Start

### Prerequisites

- AWS Account with credentials configured
- Terraform >= 1.0
- Node.js >= 18.x

### Deploy Infrastructure

```bash
# 1. Clone repository
git clone <repository-url>
cd MBGolfers

# 2. Deploy infrastructure
cd terraform
./setup.sh
terraform apply

# 3. Save outputs
terraform output > ../deployment-outputs.txt

# 4. Deploy Lambda functions (optional)
cd ../lambda/users && npm install && zip -r ../../terraform/users.zip .
cd ../playgroups && npm install && zip -r ../../terraform/playgroups.zip .
cd ../sessions && npm install && zip -r ../../terraform/sessions.zip .
cd ../foursomes && npm install && zip -r ../../terraform/foursomes.zip .
cd ../scores && npm install && zip -r ../../terraform/scores.zip .
cd ../../terraform && terraform apply
```

**See [QUICKSTART.md](docs/QUICKSTART.md) for detailed instructions.**

## 📚 Documentation

### Essential Reading

- **[Quick Start Guide](docs/QUICKSTART.md)** - Step-by-step deployment
- **[Project Summary](docs/PROJECT-SUMMARY.md)** - High-level overview
- **[Architecture](docs/ARCHITECTURE.md)** - System design & data models
- **[API Reference](docs/API.md)** - Complete API documentation

### Additional Resources

- **[Documentation Index](docs/INDEX.md)** - Full documentation map
- **[Development Checklist](docs/CHECKLIST.md)** - Progress tracking
- **[File Structure](docs/FILE-STRUCTURE.md)** - Project organization
- **[Terraform README](terraform/README.md)** - Infrastructure docs

## 👥 User Roles

### Player (Default)
- Join playgroups
- View upcoming sessions
- Enter scores for their foursome
- View session results

### GroupLeader (Promoted by Admin)
- All Player permissions
- Create playgroups
- Add members
- Create play sessions
- Edit foursome assignments
- Manage scores

### Admin (Promoted by Admin)
- View all users
- Update user roles
- Full system access

## ✨ Key Features

### V1 MVP

✅ **User Management**
- Email-based sign-up via Cognito
- Role-based permissions
- Admin user management

✅ **Playgroup Management**
- Create and manage golf groups
- Add/remove members
- Group leader controls

✅ **Session Scheduling**
- Schedule play sessions
- **Auto-generate foursomes** (random grouping of players)
- Manual foursome editing

✅ **Scoring**
- 18-hole scorecards
- Any foursome member can enter scores
- Automatic score calculation
- Session results and summaries

## 🏗️ Architecture

```
Browser → Cognito → API Gateway → Lambda → DynamoDB
                         ↓
                    5 Endpoints:
                    - /users
                    - /playgroups
                    - /sessions
                    - /foursomes
                    - /scores
```

### AWS Resources

- **1 Cognito User Pool** - Authentication
- **5 DynamoDB Tables** - Data storage
- **5 Lambda Functions** - Business logic
- **1 API Gateway** - REST API
- **Multiple IAM Roles** - Permissions

**See [ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design.**

## 📊 Data Model

### 5 DynamoDB Tables

1. **Users** - User profiles and roles
2. **Playgroups** - Golf group information
3. **PlaySessions** - Scheduled sessions
4. **Foursomes** - Player groupings
5. **Scores** - Individual scores (18 holes)

Each table includes optimized Global Secondary Indexes for efficient queries.

## 🔌 API Endpoints

### Authentication
All endpoints require JWT token from Cognito:
```
Authorization: Bearer {id_token}
```

### Endpoints

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/users` | GET, POST | User management, role updates |
| `/playgroups` | GET, POST | Playgroup CRUD, add members |
| `/sessions` | GET, POST | Session creation, list |
| `/foursomes` | GET, PUT | Foursome management |
| `/scores` | GET, PUT | Score tracking |

**See [API.md](docs/API.md) for complete reference.**

## 💻 Project Structure

```
MBGolfers/
├── terraform/          # Infrastructure as Code
│   ├── main.tf         # Provider config
│   ├── cognito.tf      # Auth setup
│   ├── dynamodb.tf     # Database tables
│   ├── lambda.tf       # Functions
│   └── api-gateway.tf  # REST API
│
├── lambda/             # Lambda functions
│   ├── users/          # User management
│   ├── playgroups/     # Playgroup CRUD
│   ├── sessions/       # Session creation
│   ├── foursomes/      # Foursome management
│   └── scores/         # Score tracking
│
├── docs/               # Documentation
│   ├── QUICKSTART.md
│   ├── ARCHITECTURE.md
│   ├── API.md
│   └── ...
│
└── frontend/           # React app (to be created)
```

**See [FILE-STRUCTURE.md](docs/FILE-STRUCTURE.md) for details.**

## 🎮 Usage Example

### 1. Create a Playgroup

```bash
curl -X POST "${API_URL}/playgroups" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Thursday Morning Group",
    "description": "Weekly golf"
  }'
```

### 2. Create a Session

```bash
curl -X POST "${API_URL}/sessions" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "playgroupId": "pg-123",
    "date": "2025-11-15",
    "time": "08:00"
  }'
```

Foursomes are automatically generated!

### 3. Enter Scores

```bash
curl -X PUT "${API_URL}/scores" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "foursomeId": "four-789",
    "playerId": "user-abc",
    "holes": [4,3,5,4,4,3,5,4,4,4,3,5,4,4,3,5,4,4]
  }'
```

Total score calculated automatically!

## 📈 Project Status

### Phase 1: Infrastructure ✅ COMPLETE

- [x] Terraform configuration (7 files, ~1,240 lines)
- [x] Lambda functions (5 functions, ~1,050 lines)
- [x] Documentation (8 files, ~3,500 lines)
- [x] Project setup complete

### Phase 2: Deployment ⏳ NEXT

- [ ] Deploy AWS infrastructure
- [ ] Test all API endpoints
- [ ] Verify Lambda functions

### Phase 3: Frontend ⏳ PLANNED

- [ ] React application setup
- [ ] 13 screens (auth, admin, groupleader, player)
- [ ] AWS Amplify integration

**See [CHECKLIST.md](docs/CHECKLIST.md) for complete roadmap.**

## 💰 Cost Estimate

For small-scale usage (< 1000 users, < 10,000 API calls/month):

- **Cognito**: Free tier (50,000 MAU)
- **DynamoDB**: ~$1-2/month (on-demand)
- **Lambda**: Free tier (1M requests)
- **API Gateway**: ~$3.50/million requests
- **CloudWatch**: ~$0.50/month

**Total**: $2-5/month

## 🔒 Security

- JWT authentication on all endpoints
- Role-based authorization in Lambda
- Input validation and sanitization
- CORS enabled for frontend
- Cognito password policy enforced
- IAM least-privilege policies

## 🛠️ Development

### Local Testing

```bash
# View Terraform plan
cd terraform
terraform plan

# View Lambda logs
aws logs tail /aws/lambda/golf-playgroups-users-dev --follow

# Test API endpoint
curl -X GET "${API_URL}/users" \
  -H "Authorization: Bearer ${TOKEN}"
```

### Contributing

1. Follow file naming conventions (see [FILE-STRUCTURE.md](docs/FILE-STRUCTURE.md))
2. Update documentation when making changes
3. Test thoroughly before deploying
4. Use descriptive commit messages

## 📝 Next Steps

After cloning this repository:

1. **Read** [QUICKSTART.md](docs/QUICKSTART.md) for deployment steps
2. **Review** [ARCHITECTURE.md](docs/ARCHITECTURE.md) to understand the system
3. **Deploy** infrastructure using Terraform
4. **Test** API endpoints with Postman or cURL
5. **Build** frontend application (see [CHECKLIST.md](docs/CHECKLIST.md))

## 🚧 Future Enhancements

### Short-term (V1.1)
- Email notifications
- Profile pictures
- Export scores to PDF

### Medium-term (V2.0)
- Multiple courses support
- Handicap calculations
- Leaderboards and statistics

### Long-term (V3.0+)
- Mobile app
- Real-time updates
- Social features
- Course booking integration

## 📞 Support

- **Documentation**: See [docs/INDEX.md](docs/INDEX.md)
- **API Issues**: Check [docs/API.md](docs/API.md)
- **Infrastructure**: See [terraform/README.md](terraform/README.md)
- **Deployment**: See [docs/QUICKSTART.md](docs/QUICKSTART.md)

## 📄 License

MIT

## 🏌️ About

Golf Playgroups is designed to make organizing golf outings simple and fun. Whether you're a weekly group or occasional players, this app handles scheduling, scoring, and organization so you can focus on your game.

**Built with**: AWS, Terraform, Node.js, React
**Status**: Infrastructure Complete, Ready for Deployment
**Version**: 1.0.0

---

**Ready to get started?** → [Quick Start Guide](docs/QUICKSTART.md)

**Need help?** → [Documentation Index](docs/INDEX.md)
