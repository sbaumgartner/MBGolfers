# Golf Playgroups - Quick Start Guide

This guide will walk you through deploying the Golf Playgroups infrastructure and getting the application running.

## Prerequisites

Before you begin, ensure you have:

### Required Tools
- **AWS Account** with administrative access
- **AWS CLI** configured with credentials ([Install Guide](https://aws.amazon.com/cli/))
- **Terraform** >= 1.0 ([Install Guide](https://www.terraform.io/downloads))
- **Node.js** >= 18.x (for Lambda development)
- **Git** (for version control)

### AWS Permissions Required
Your AWS user/role needs permissions to create:
- Cognito User Pools
- DynamoDB tables
- Lambda functions
- API Gateway APIs
- IAM roles and policies
- CloudWatch log groups

### Verify Prerequisites

```bash
# Check AWS CLI
aws --version
aws sts get-caller-identity

# Check Terraform
terraform version

# Check Node.js
node --version
npm --version
```

## Step 1: Clone the Repository

```bash
git clone <repository-url>
cd MBGolfers
```

## Step 2: Deploy Infrastructure

### 2.1 Navigate to Terraform Directory

```bash
cd terraform
```

### 2.2 Run Setup Script

The setup script creates placeholder Lambda ZIP files:

```bash
./setup.sh
```

This will:
- Create placeholder Lambda functions
- Initialize Terraform
- Download required providers

### 2.3 Review the Plan

Preview what Terraform will create:

```bash
terraform plan
```

You should see:
- 1 Cognito User Pool
- 1 Cognito Identity Pool
- 5 DynamoDB tables
- 5 Lambda functions
- 1 API Gateway
- Multiple IAM roles and policies

### 2.4 Deploy Infrastructure

```bash
terraform apply
```

Type `yes` when prompted.

**Deployment time**: Approximately 5-10 minutes

### 2.5 Save Outputs

After deployment, save the outputs:

```bash
terraform output > ../deployment-outputs.txt
terraform output -json > ../deployment-outputs.json
```

**Important**: Save these values - you'll need them for frontend configuration!

Key outputs:
- `cognito_user_pool_id`
- `cognito_user_pool_client_id`
- `cognito_identity_pool_id`
- `api_gateway_url`
- `region`

## Step 3: Verify Deployment

### 3.1 Check AWS Console

Verify resources were created:

```bash
# List DynamoDB tables
aws dynamodb list-tables --region us-east-1

# List Lambda functions
aws lambda list-functions --region us-east-1 --query 'Functions[?contains(FunctionName, `golf-playgroups`)].FunctionName'

# Get API Gateway URL
terraform output api_gateway_url
```

### 3.2 Test API Health

The Lambda functions are deployed with placeholder code. They'll return 501 (Not Implemented) until you deploy the actual code.

## Step 4: Deploy Lambda Functions (Optional)

To deploy the full Lambda implementations:

### 4.1 Build Lambda Packages

For each Lambda function:

```bash
# Example: users function
cd ../lambda/users
npm install
zip -r ../../terraform/users.zip .

# Repeat for other functions
cd ../playgroups && npm install && zip -r ../../terraform/playgroups.zip .
cd ../sessions && npm install && zip -r ../../terraform/sessions.zip .
cd ../foursomes && npm install && zip -r ../../terraform/foursomes.zip .
cd ../scores && npm install && zip -r ../../terraform/scores.zip .
```

### 4.2 Redeploy with Updated Functions

```bash
cd ../../terraform
terraform apply
```

## Step 5: Create Your First User

### 5.1 Sign Up via AWS Console

1. Go to AWS Console → Cognito → User Pools
2. Select your pool: `golf-playgroups-user-pool-dev`
3. Go to "Users" tab
4. Click "Create user"
5. Enter email and temporary password
6. User will receive email to verify and set permanent password

### 5.2 Set User Role

Users default to "Player" role. To create an Admin:

1. In Cognito console, select the user
2. Go to "User attributes" tab
3. Click "Edit"
4. Add custom attribute:
   - Name: `custom:role`
   - Value: `Admin`
5. Save changes

### 5.3 Test Authentication

Use AWS Cognito SDK or Amplify to test sign-in:

```javascript
// Example with AWS SDK
import { CognitoIdentityProviderClient, InitiateAuthCommand } from "@aws-sdk/client-cognito-identity-provider";

const client = new CognitoIdentityProviderClient({ region: "us-east-1" });
const command = new InitiateAuthCommand({
  AuthFlow: "USER_PASSWORD_AUTH",
  ClientId: "YOUR_CLIENT_ID",
  AuthParameters: {
    USERNAME: "user@example.com",
    PASSWORD: "Password123!"
  }
});

const response = await client.send(command);
const idToken = response.AuthenticationResult.IdToken;
```

## Step 6: Test API Endpoints

### 6.1 Get ID Token

After signing in, extract the ID token from the authentication response.

### 6.2 Test with cURL

```bash
# Set variables
API_URL="YOUR_API_GATEWAY_URL"
TOKEN="YOUR_ID_TOKEN"

# Test GET /users (as admin)
curl -X GET "${API_URL}/users" \
  -H "Authorization: Bearer ${TOKEN}"

# Test POST /playgroups (as GroupLeader)
curl -X POST "${API_URL}/playgroups" \
  -H "Authorization: Bearer ${TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{"name":"Thursday Morning Group","description":"Weekly golf"}'
```

### 6.3 Test with Postman

1. Import API from `docs/API.md`
2. Set environment variables:
   - `api_url`: Your API Gateway URL
   - `id_token`: Your Cognito ID token
3. Test each endpoint

## Step 7: Frontend Setup (When Ready)

### 7.1 Create React App

```bash
cd ../frontend
npx create-react-app .
npm install aws-amplify @aws-amplify/ui-react react-router-dom
```

### 7.2 Configure AWS Amplify

Create `src/aws-exports.js`:

```javascript
const awsconfig = {
  Auth: {
    region: 'us-east-1',
    userPoolId: 'YOUR_USER_POOL_ID',
    userPoolWebClientId: 'YOUR_CLIENT_ID',
    identityPoolId: 'YOUR_IDENTITY_POOL_ID'
  },
  API: {
    endpoints: [
      {
        name: 'golf-api',
        endpoint: 'YOUR_API_GATEWAY_URL',
        region: 'us-east-1'
      }
    ]
  }
};

export default awsconfig;
```

### 7.3 Configure Amplify in App

```javascript
// src/index.js
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';

Amplify.configure(awsconfig);
```

### 7.4 Start Development Server

```bash
npm start
```

## Common Issues & Solutions

### Issue: `terraform apply` fails with "no such file: users.zip"

**Solution**: Run `./setup.sh` first to create placeholder Lambda files.

```bash
cd terraform
./setup.sh
terraform apply
```

### Issue: API returns 403 Forbidden

**Solutions**:
1. Verify you're including the JWT token in Authorization header
2. Check user role in Cognito matches required permissions
3. Review Lambda function logs in CloudWatch

```bash
# View Lambda logs
aws logs tail /aws/lambda/golf-playgroups-users-dev --follow
```

### Issue: CORS errors in browser

**Solution**: CORS is pre-configured. If issues persist:
1. Verify API Gateway CORS settings
2. Check Lambda functions return CORS headers
3. Ensure request includes proper headers

### Issue: Cognito "User does not exist"

**Solution**: Create user manually in Cognito console or implement sign-up flow in frontend.

### Issue: DynamoDB access denied

**Solution**: Verify Lambda execution role has DynamoDB permissions:

```bash
aws iam get-role-policy \
  --role-name golf-playgroups-lambda-exec-dev \
  --policy-name golf-playgroups-lambda-policy-dev
```

## Monitoring & Debugging

### View Lambda Logs

```bash
# Users function
aws logs tail /aws/lambda/golf-playgroups-users-dev --follow

# Playgroups function
aws logs tail /aws/lambda/golf-playgroups-playgroups-dev --follow
```

### View API Gateway Logs

Enable in API Gateway console:
1. Go to API Gateway → Your API → Stages → dev
2. Enable CloudWatch Logs
3. Set log level to INFO or ERROR

### View DynamoDB Items

```bash
# Scan users table
aws dynamodb scan --table-name golf-playgroups-users-dev --region us-east-1

# Query specific item
aws dynamodb get-item \
  --table-name golf-playgroups-users-dev \
  --key '{"userId":{"S":"USER_ID_HERE"}}' \
  --region us-east-1
```

## Next Steps

After successful deployment:

1. **Test All Endpoints**: Use Postman or cURL to test each API endpoint
2. **Build Frontend**: Create React components for each user role
3. **Implement Screens**: Follow [CHECKLIST.md](CHECKLIST.md) for development roadmap
4. **Add Monitoring**: Set up CloudWatch alarms for errors and costs
5. **Security Review**: Audit IAM permissions and API authorization

## Cleanup

To destroy all resources:

```bash
cd terraform
terraform destroy
```

**Warning**: This permanently deletes all data!

## Cost Management

### Set Up Billing Alerts

1. Go to AWS Console → Billing → Budgets
2. Create budget with $10 threshold
3. Set email alerts

### Monitor Costs

```bash
# View current month costs
aws ce get-cost-and-usage \
  --time-period Start=$(date +%Y-%m-01),End=$(date +%Y-%m-%d) \
  --granularity MONTHLY \
  --metrics BlendedCost
```

## Support

For issues or questions:
- Review [API.md](API.md) for endpoint documentation
- Check [ARCHITECTURE.md](ARCHITECTURE.md) for system design
- See [CHECKLIST.md](CHECKLIST.md) for development tasks
- Review CloudWatch logs for errors

---

**Deployment Time**: ~15 minutes
**Estimated Cost**: $2-5/month (low usage)
**Next Document**: [ARCHITECTURE.md](ARCHITECTURE.md)
