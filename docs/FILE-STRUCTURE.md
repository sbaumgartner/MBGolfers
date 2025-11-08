# Golf Playgroups - File Structure

Complete file and directory organization for the project.

## Project Root

```
MBGolfers/
│
├── .git/                    # Git repository
├── .gitignore              # Git ignore rules
├── README.md               # Project overview and quick links
│
├── terraform/              # Infrastructure as Code
├── lambda/                 # Lambda function code
├── frontend/               # React application (to be created)
└── docs/                   # Project documentation
```

---

## Terraform Directory

**Purpose**: AWS infrastructure definitions using Terraform

```
terraform/
│
├── main.tf                 # Terraform and AWS provider configuration
├── variables.tf            # Input variables and defaults
├── outputs.tf              # Output values for frontend config
├── cognito.tf              # User Pool, Identity Pool, IAM roles
├── dynamodb.tf             # All 5 DynamoDB tables with GSIs
├── api-gateway.tf          # REST API, endpoints, CORS, integrations
├── lambda.tf               # 5 Lambda functions, execution roles, CloudWatch
│
├── setup.sh                # Automated setup script (executable)
├── README.md               # Terraform documentation
│
└── .gitignore              # Terraform-specific ignores
    - .terraform/
    - *.tfstate
    - *.zip
```

**Key Files**:

- **main.tf** (20 lines): Provider configuration
- **variables.tf** (25 lines): Configurable values
- **outputs.tf** (75 lines): Values needed by frontend
- **cognito.tf** (200 lines): Authentication setup
- **dynamodb.tf** (175 lines): Database tables
- **api-gateway.tf** (450 lines): API endpoints and CORS
- **lambda.tf** (225 lines): Function definitions
- **setup.sh** (70 lines): Automation script

**Total**: ~1,240 lines of Terraform code

---

## Lambda Directory

**Purpose**: Node.js Lambda function implementations

```
lambda/
│
├── users/
│   ├── index.js            # Users Lambda handler (200 lines)
│   └── package.json        # Dependencies
│
├── playgroups/
│   ├── index.js            # Playgroups Lambda handler (250 lines)
│   └── package.json        # Dependencies
│
├── sessions/
│   ├── index.js            # Sessions Lambda handler (220 lines)
│   └── package.json        # Dependencies
│
├── foursomes/
│   ├── index.js            # Foursomes Lambda handler (180 lines)
│   └── package.json        # Dependencies
│
└── scores/
    ├── index.js            # Scores Lambda handler (200 lines)
    └── package.json        # Dependencies
```

**Dependencies** (all functions):
```json
{
  "@aws-sdk/client-dynamodb": "^3.478.0",
  "@aws-sdk/lib-dynamodb": "^3.478.0"
}
```

**Additional Dependencies**:
- `users/`: `@aws-sdk/client-cognito-identity-provider`
- `playgroups/`, `sessions/`: `uuid`

**Total**: ~1,050 lines of Lambda code

---

## Documentation Directory

**Purpose**: Comprehensive project documentation

```
docs/
│
├── INDEX.md                # Documentation navigation (50 lines)
├── PROJECT-SUMMARY.md      # High-level overview (250 lines)
├── QUICKSTART.md           # Deployment guide (450 lines)
├── ARCHITECTURE.md         # System design (650 lines)
├── API.md                  # API reference (850 lines)
├── CHECKLIST.md            # Development roadmap (450 lines)
└── FILE-STRUCTURE.md       # This file (400 lines)
```

**Total**: ~3,100 lines of documentation

---

## Frontend Directory (To Be Created)

**Purpose**: React web application

```
frontend/
│
├── public/
│   ├── index.html
│   ├── favicon.ico
│   └── manifest.json
│
├── src/
│   │
│   ├── components/              # Reusable UI components
│   │   ├── Navigation.jsx       # Top navigation bar
│   │   ├── Sidebar.jsx          # Side menu
│   │   ├── UserMenu.jsx         # User profile dropdown
│   │   ├── LoadingSpinner.jsx   # Loading indicator
│   │   ├── ErrorBoundary.jsx    # Error handling
│   │   ├── Toast.jsx            # Notifications
│   │   └── ConfirmDialog.jsx    # Confirmation modals
│   │
│   ├── pages/                   # Route-level pages
│   │   │
│   │   ├── auth/                # Authentication screens
│   │   │   ├── SignUp.jsx       # Sign up page
│   │   │   └── Login.jsx        # Login page
│   │   │
│   │   ├── player/              # Player role screens
│   │   │   ├── Dashboard.jsx    # Player dashboard
│   │   │   ├── Scorecard.jsx    # Score entry
│   │   │   └── Summary.jsx      # Session results
│   │   │
│   │   ├── groupleader/         # GroupLeader screens
│   │   │   ├── Dashboard.jsx    # GroupLeader dashboard
│   │   │   ├── CreateGroup.jsx  # Create playgroup form
│   │   │   ├── GroupDetail.jsx  # Playgroup detail page
│   │   │   ├── AddMembers.jsx   # Add members modal
│   │   │   ├── CreateSession.jsx # Create session form
│   │   │   └── EditFoursomes.jsx # Edit foursome assignments
│   │   │
│   │   └── admin/               # Admin screens
│   │       ├── UserManagement.jsx # User list & search
│   │       └── EditUserRole.jsx   # Role update modal
│   │
│   ├── services/                # API and auth services
│   │   ├── api.js               # API call wrapper
│   │   └── auth.js              # Cognito auth wrapper
│   │
│   ├── utils/                   # Utility functions
│   │   ├── validators.js        # Input validation
│   │   ├── formatters.js        # Data formatting
│   │   └── constants.js         # App constants
│   │
│   ├── contexts/                # React contexts
│   │   ├── AuthContext.jsx      # User authentication state
│   │   └── AppContext.jsx       # Global app state
│   │
│   ├── hooks/                   # Custom React hooks
│   │   ├── useAuth.js           # Authentication hook
│   │   ├── useApi.js            # API call hook
│   │   └── useToast.js          # Toast notification hook
│   │
│   ├── aws-exports.js           # AWS Amplify configuration
│   ├── App.jsx                  # Main app component
│   ├── index.js                 # App entry point
│   └── index.css                # Global styles
│
├── package.json                 # Dependencies
├── package-lock.json            # Lock file
└── README.md                    # Frontend documentation
```

**Expected Dependencies**:
```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "react-router-dom": "^6.x",
  "aws-amplify": "^6.x",
  "@aws-amplify/ui-react": "^6.x"
}
```

**Estimated**: 13 pages × 200 lines = ~2,600 lines + components

---

## Complete File Inventory

### Configuration Files (6)
1. `/.gitignore` - Git ignore rules
2. `/README.md` - Project overview
3. `/terraform/.gitignore` - Terraform ignores
4. `/terraform/README.md` - Terraform docs
5. `/terraform/setup.sh` - Setup script
6. `/terraform/variables.tf` - Config variables

### Infrastructure Files (6)
1. `/terraform/main.tf` - Provider config
2. `/terraform/outputs.tf` - Outputs
3. `/terraform/cognito.tf` - Auth
4. `/terraform/dynamodb.tf` - Database
5. `/terraform/api-gateway.tf` - API
6. `/terraform/lambda.tf` - Functions

### Lambda Functions (10)
1. `/lambda/users/index.js` - Users handler
2. `/lambda/users/package.json` - Users deps
3. `/lambda/playgroups/index.js` - Playgroups handler
4. `/lambda/playgroups/package.json` - Playgroups deps
5. `/lambda/sessions/index.js` - Sessions handler
6. `/lambda/sessions/package.json` - Sessions deps
7. `/lambda/foursomes/index.js` - Foursomes handler
8. `/lambda/foursomes/package.json` - Foursomes deps
9. `/lambda/scores/index.js` - Scores handler
10. `/lambda/scores/package.json` - Scores deps

### Documentation (8)
1. `/docs/INDEX.md` - Doc navigation
2. `/docs/PROJECT-SUMMARY.md` - Overview
3. `/docs/QUICKSTART.md` - Deployment
4. `/docs/ARCHITECTURE.md` - Design
5. `/docs/API.md` - API reference
6. `/docs/CHECKLIST.md` - Roadmap
7. `/docs/FILE-STRUCTURE.md` - This file
8. `/terraform/README.md` - Terraform docs

**Total Files (Current)**: 30 files
**Total Lines of Code**: ~5,400 lines
**Total Lines of Documentation**: ~3,500 lines

---

## File Naming Conventions

### Terraform Files
- **Format**: `lowercase-with-hyphens.tf`
- **Examples**: `main.tf`, `api-gateway.tf`, `dynamodb.tf`

### Lambda Files
- **Format**: `index.js` (handler), `package.json` (config)
- **Directory**: Function name matches Lambda name

### Documentation
- **Format**: `UPPERCASE-WITH-HYPHENS.md`
- **Examples**: `README.md`, `API.md`, `QUICKSTART.md`

### Frontend (Planned)
- **Components**: `PascalCase.jsx`
- **Services/Utils**: `camelCase.js`
- **Examples**: `Dashboard.jsx`, `api.js`, `useAuth.js`

---

## Directory Ownership

### `/terraform` - Infrastructure Team
**Responsibilities**:
- Infrastructure changes
- Resource provisioning
- Cost optimization
- Security policies

**Workflow**:
1. Update `.tf` files
2. Run `terraform plan`
3. Review changes
4. Run `terraform apply`

### `/lambda` - Backend Team
**Responsibilities**:
- Business logic
- API implementation
- Data validation
- Error handling

**Workflow**:
1. Update `index.js`
2. Run `npm install` if deps changed
3. Test locally
4. Create ZIP: `zip -r ../../terraform/{name}.zip .`
5. Deploy: `terraform apply`

### `/docs` - Documentation Team
**Responsibilities**:
- Keep docs updated
- Document new features
- API reference accuracy
- User guides

**Workflow**:
1. Update relevant `.md` files
2. Update `INDEX.md` if new docs added
3. Commit changes

### `/frontend` - Frontend Team
**Responsibilities**:
- User interface
- User experience
- Client-side state
- API integration

**Workflow**:
1. Create/update components
2. Test locally: `npm start`
3. Build: `npm run build`
4. Deploy to hosting

---

## Generated Files (Not in Git)

### Terraform Generated
- `/.terraform/` - Terraform plugins and state
- `.terraform.lock.hcl` - Provider version lock
- `*.tfstate` - Infrastructure state
- `*.tfstate.backup` - State backups
- `*.zip` - Lambda deployment packages

### Lambda Generated
- `/lambda/*/node_modules/` - Installed dependencies
- `/lambda/*/*.zip` - Deployment packages
- `/lambda/*/package-lock.json` - Lock files

### Frontend Generated
- `/frontend/node_modules/` - Dependencies
- `/frontend/build/` - Production build
- `/frontend/.env*` - Environment variables

### AWS Outputs
- `deployment-outputs.txt` - Terraform outputs (plain text)
- `deployment-outputs.json` - Terraform outputs (JSON)

---

## File Size Estimates

### Terraform Files
- Total: ~1,240 lines
- Size: ~45 KB

### Lambda Functions
- Total: ~1,050 lines
- Size: ~40 KB
- With dependencies: ~15 MB (zipped)

### Documentation
- Total: ~3,500 lines
- Size: ~200 KB

### Frontend (Estimated)
- Total: ~3,000-5,000 lines
- Size: ~150-250 KB
- With dependencies: ~2 MB (build)

**Total Project Size**: ~20 MB (with node_modules)

---

## Git Strategy

### Branches
- `main` - Production-ready code
- `develop` - Integration branch
- `feature/*` - Feature branches
- `hotfix/*` - Emergency fixes

### Commits
- Atomic commits (one logical change)
- Descriptive messages
- Reference issue numbers

### Example Commits
```
feat: Add users Lambda implementation
fix: Correct foursome generation algorithm
docs: Update API.md with score endpoints
chore: Update dependencies
```

---

## Deployment Artifacts

### Local Development
```
MBGolfers/
├── terraform/*.zip          # Lambda ZIPs
├── node_modules/            # Local dependencies
└── deployment-outputs.json  # Terraform outputs
```

### AWS Resources
```
Cognito:
- User Pool: golf-playgroups-user-pool-dev
- Identity Pool: golf-playgroups-identity-pool-dev

DynamoDB:
- golf-playgroups-users-dev
- golf-playgroups-playgroups-dev
- golf-playgroups-play-sessions-dev
- golf-playgroups-foursomes-dev
- golf-playgroups-scores-dev

Lambda:
- golf-playgroups-users-dev
- golf-playgroups-playgroups-dev
- golf-playgroups-sessions-dev
- golf-playgroups-foursomes-dev
- golf-playgroups-scores-dev

API Gateway:
- golf-playgroups-api-dev
  - Stage: dev
```

---

## Quick Navigation

### Start Here
1. `/README.md` - Project overview
2. `/docs/INDEX.md` - Documentation map
3. `/docs/QUICKSTART.md` - Get started

### Infrastructure
1. `/terraform/README.md` - Terraform guide
2. `/terraform/setup.sh` - Run this first
3. `/terraform/outputs.tf` - Frontend needs these

### Backend
1. `/lambda/users/index.js` - User management
2. `/lambda/playgroups/index.js` - Playgroup CRUD
3. `/lambda/sessions/index.js` - Session creation
4. `/lambda/foursomes/index.js` - Foursome management
5. `/lambda/scores/index.js` - Score tracking

### Documentation
1. `/docs/ARCHITECTURE.md` - System design
2. `/docs/API.md` - API endpoints
3. `/docs/CHECKLIST.md` - Development tasks

---

**File Structure Version**: 1.0
**Last Updated**: 2025-11-08
**Total Files**: 30
**Total Size**: ~285 KB (code + docs)
