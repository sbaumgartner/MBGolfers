# Golf Playgroups - Automated Testing

Comprehensive test suite for the Golf Playgroups application.

## Quick Start

### After Deploying Infrastructure

1. **Save Terraform Outputs:**
   ```bash
   cd terraform
   terraform output > ../deployment-outputs.txt
   ```

2. **Auto-configure Tests:**
   ```bash
   cd ../tests
   npm install
   npm run configure
   ```

3. **Verify Configuration:**
   ```bash
   npm run check
   ```

4. **Run Tests:**
   ```bash
   npm test
   ```

That's it! The `configure` script automatically populates your `.env` file from the terraform outputs.

---

## Test Structure

```
tests/
├── api/                  # API integration tests
│   ├── users.test.js
│   ├── playgroups.test.js
│   └── userFlow.test.js
├── e2e/                  # Playwright E2E tests
│   └── app.spec.js
├── utils/                # Test utilities
│   ├── auth.js           # Authentication helpers
│   └── api.js            # API client wrapper
├── fixtures/             # Test data
│   └── testData.js
├── configure-from-outputs.js  # Auto-configuration script
└── setup-check.js        # Validation script
```

## Available Scripts

- `npm run configure` - Auto-populate .env from terraform outputs
- `npm run check` - Validate configuration
- `npm test` - Run all API tests
- `npm run test:api` - Run only API tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:e2e` - Run Playwright E2E tests

## Manual Configuration

If you prefer to configure manually:

```bash
cp .env.example .env
# Edit .env with your values
```

Required values:
- `AWS_REGION` - From terraform output: `region`
- `API_URL` - From terraform output: `api_gateway_url`
- `COGNITO_USER_POOL_ID` - From terraform output: `cognito_user_pool_id`
- `COGNITO_CLIENT_ID` - From terraform output: `cognito_user_pool_client_id`

## Test Scenarios

### API Integration Tests

✅ **Users API**
- Admin can list all users
- Admin can filter by role
- Non-admin sees only their own info
- Admin can update user roles
- Non-admin cannot update roles

✅ **Playgroups API**
- GroupLeader can create playgroups
- Player cannot create playgroups
- Can add members to playgroups
- Cannot add duplicate members

✅ **Complete User Flow**
- Create playgroup → Add members → Create session → Enter scores

### E2E Tests (Playwright)

When frontend is ready:
- User sign up and login
- GroupLeader dashboard
- Create playgroup workflow
- Create session workflow
- Scorecard entry

## AWS Secrets Manager Integration

### Current: Hard-coded Credentials

Test credentials are in `.env` file (gitignored).

### Future: AWS Secrets Manager

1. Create secret:
   ```bash
   aws secretsmanager create-secret \
     --name golf-playgroups/test-users \
     --secret-string '{...}'
   ```

2. Update `.env`:
   ```env
   USE_SECRETS_MANAGER=true
   ```

Tests will automatically fetch credentials from Secrets Manager!

## Troubleshooting

### "Terraform outputs file not found"

```bash
cd terraform
terraform output > ../deployment-outputs.txt
cd ../tests
npm run configure
```

### "Configuration incomplete"

Run validation:
```bash
npm run check
```

### Tests timeout or fail

1. Verify infrastructure is deployed: `cd ../terraform && terraform show`
2. Check AWS credentials: `aws sts get-caller-identity`
3. Verify .env values are correct: `npm run check`

## CI/CD Integration

```yaml
# GitHub Actions example
- name: Configure tests
  run: |
    cd terraform
    terraform output > ../deployment-outputs.txt
    cd ../tests
    npm install
    npm run configure
    npm test
```

---

**Current Status**: Tests ready, awaiting infrastructure deployment

**Next Steps**:
1. Deploy infrastructure
2. Run `npm run configure`
3. Run `npm test`
