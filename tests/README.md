# Golf Playgroups - Automated Testing

Comprehensive test suite for the Golf Playgroups application.

## Test Structure

```
tests/
├── api/                  # API integration tests
│   ├── users.test.js
│   ├── playgroups.test.js
│   ├── sessions.test.js
│   ├── foursomes.test.js
│   ├── scores.test.js
│   └── userFlow.test.js
├── e2e/                  # Playwright E2E tests
│   └── app.spec.js
├── utils/                # Test utilities
│   ├── auth.js           # Authentication helpers
│   └── api.js            # API client wrapper
├── fixtures/             # Test data
│   └── testData.js
└── package.json
```

## Setup

### 1. Install Dependencies

```bash
cd tests
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

**Get values from Terraform:**
```bash
cd ../terraform
terraform output
```

**Edit `.env` with your values:**
```env
AWS_REGION=us-east-1
API_URL=https://your-api-id.execute-api.us-east-1.amazonaws.com/dev
COGNITO_USER_POOL_ID=us-east-1_XXXXXXXXX
COGNITO_CLIENT_ID=your-client-id-here

# Test user credentials (hard-coded for now)
TEST_ADMIN_EMAIL=admin@test.com
TEST_ADMIN_PASSWORD=TestAdmin123!

TEST_GROUPLEADER_EMAIL=leader@test.com
TEST_GROUPLEADER_PASSWORD=TestLeader123!

TEST_PLAYER_EMAIL=player@test.com
TEST_PLAYER_PASSWORD=TestPlayer123!
```

### 3. Create Test Users

Test users are automatically created when tests run. Or create manually:

```bash
# Run just the auth setup
node -e "require('./utils/auth').setupTestUsers()"
```

## Running Tests

### API Tests

```bash
# Run all API tests
npm test

# Run specific test file
npm test -- users.test.js

# Run in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage

# Run only API tests
npm run test:api
```

### E2E Tests (Playwright)

```bash
# Install Playwright browsers (first time only)
npm run playwright:install

# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npx playwright test --ui

# Run specific browser
npx playwright test --project=chromium
```

## Test Scenarios

### API Integration Tests

#### Users API
- ✅ Admin can list all users
- ✅ Admin can filter by role
- ✅ Non-admin sees only their own info
- ✅ Admin can update user roles
- ✅ Non-admin cannot update roles
- ✅ Cannot set invalid roles

#### Playgroups API
- ✅ GroupLeader can create playgroups
- ✅ Player cannot create playgroups
- ✅ Can list playgroups
- ✅ Can get specific playgroup
- ✅ GroupLeader can add members
- ✅ Cannot add duplicate members
- ✅ Non-leader cannot add members

#### Sessions API
- ✅ GroupLeader can create sessions
- ✅ Foursomes auto-generated on creation
- ✅ Can list sessions by playgroup
- ✅ Player cannot create sessions

#### Foursomes API
- ✅ Can get foursomes for session
- ✅ GroupLeader can update assignments
- ✅ Player cannot update foursomes

#### Scores API
- ✅ Player can enter scores for foursome
- ✅ Scores calculate correctly
- ✅ Can retrieve scores by session
- ✅ Validation for 18 holes
- ✅ Validation for valid scores

#### Complete User Flow
- ✅ End-to-end workflow test
- ✅ Create playgroup → Add members → Create session → Enter scores

### E2E Tests (Playwright)

When frontend is ready:
- [ ] User sign up flow
- [ ] User login flow
- [ ] GroupLeader dashboard
- [ ] Create playgroup workflow
- [ ] Create session workflow
- [ ] Scorecard entry
- [ ] Results viewing
- [ ] Admin user management

## AWS Secrets Manager Integration

### Current: Hard-coded Credentials

Test credentials are in `.env` file (gitignored).

### Future: AWS Secrets Manager

**1. Create Secret in AWS:**

```bash
aws secretsmanager create-secret \
  --name golf-playgroups/test-users \
  --secret-string '{
    "admin": {
      "email": "admin@test.com",
      "password": "TestAdmin123!",
      "role": "Admin"
    },
    "groupleader": {
      "email": "leader@test.com",
      "password": "TestLeader123!",
      "role": "GroupLeader"
    },
    "player": {
      "email": "player@test.com",
      "password": "TestPlayer123!",
      "role": "Player"
    }
  }'
```

**2. Update `.env`:**

```env
USE_SECRETS_MANAGER=true
SECRET_NAME=golf-playgroups/test-users
```

**3. Grant IAM Permissions:**

Ensure your test runner has `secretsmanager:GetSecretValue` permission.

**4. Run Tests:**

Tests will automatically fetch credentials from Secrets Manager!

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests

on: [push, pull_request]

jobs:
  api-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd tests && npm install

      - name: Run API tests
        env:
          AWS_REGION: ${{ secrets.AWS_REGION }}
          API_URL: ${{ secrets.API_URL }}
          COGNITO_USER_POOL_ID: ${{ secrets.COGNITO_USER_POOL_ID }}
          COGNITO_CLIENT_ID: ${{ secrets.COGNITO_CLIENT_ID }}
          USE_SECRETS_MANAGER: true
        run: cd tests && npm test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: cd tests && npm install

      - name: Install Playwright
        run: cd tests && npx playwright install --with-deps

      - name: Run E2E tests
        run: cd tests && npm run test:e2e
```

## Debugging

### View Test Output

```bash
# Verbose output
npm test -- --verbose

# Show all console.log
npm test -- --silent=false
```

### Debug Specific Test

```javascript
// Add .only to run just one test
test.only('This test will run', async () => {
  // ...
});
```

### Check API Responses

```javascript
// In tests, log full response
console.log(JSON.stringify(response.data, null, 2));
```

### Playwright Debug Mode

```bash
# Run with headed browser and debugger
npx playwright test --debug

# Run with UI mode
npx playwright test --ui
```

## Best Practices

1. **Test Independence**: Each test should be independent
2. **Cleanup**: Tests clean up their own data
3. **Assertions**: Use specific assertions
4. **Error Handling**: Tests handle both success and failure cases
5. **Data Fixtures**: Use reusable test data from `fixtures/`

## Troubleshooting

### "Cannot find module 'dotenv'"

```bash
npm install
```

### "Authentication failed"

Check your Cognito credentials in `.env` and verify users exist.

### "API returns 403"

Verify your test users have correct roles in Cognito.

### Tests timeout

Increase timeout in `package.json`:

```json
{
  "jest": {
    "testTimeout": 60000
  }
}
```

---

**Current Status**: API tests ready, E2E tests ready for frontend

**Next Steps**: Deploy infrastructure, run API tests, build frontend, add E2E tests
