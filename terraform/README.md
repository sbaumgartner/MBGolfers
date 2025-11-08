# Golf Playgroups - Terraform Infrastructure

This directory contains the Infrastructure as Code (IaC) for the Golf Playgroups application using Terraform.

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) >= 1.0
- [AWS CLI](https://aws.amazon.com/cli/) configured with appropriate credentials
- An AWS account with permissions to create:
  - Cognito User Pools
  - DynamoDB tables
  - Lambda functions
  - API Gateway
  - IAM roles and policies
  - CloudWatch log groups

## Quick Start

### 1. Initial Setup

Run the setup script to create placeholder Lambda functions and initialize Terraform:

```bash
cd terraform
./setup.sh
```

This script will:
- Create placeholder ZIP files for all 5 Lambda functions
- Initialize Terraform and download required providers

### 2. Review the Plan

Before deploying, review what Terraform will create:

```bash
terraform plan
```

### 3. Deploy Infrastructure

Deploy all resources to AWS:

```bash
terraform apply
```

Type `yes` when prompted to confirm the deployment.

**Note:** Initial deployment takes approximately 5-10 minutes.

### 4. Save Outputs

After deployment, save the outputs for your frontend configuration:

```bash
terraform output
```

You'll need these values:
- `cognito_user_pool_id`
- `cognito_user_pool_client_id`
- `cognito_identity_pool_id`
- `api_gateway_url`
- `region`

## File Structure

```
terraform/
├── main.tf              # Terraform and AWS provider configuration
├── variables.tf         # Input variables and defaults
├── outputs.tf           # Output values for frontend
├── cognito.tf           # Cognito User Pool and Identity Pool
├── dynamodb.tf          # All 5 DynamoDB tables with indexes
├── api-gateway.tf       # REST API with 5 endpoints
├── lambda.tf            # 5 Lambda functions and IAM roles
├── setup.sh             # Automated setup script
└── README.md            # This file
```

## Resources Created

### Cognito
- **User Pool**: Email-based authentication with custom role attribute
- **User Pool Client**: OAuth configuration for frontend
- **Identity Pool**: Federated identity for AWS resource access

### DynamoDB Tables (5)
1. **Users** - User profiles with email and role
2. **Playgroups** - Golf groups with members
3. **Play Sessions** - Scheduled golf sessions
4. **Foursomes** - Player groupings for sessions
5. **Scores** - Player scores per session

All tables use on-demand billing (pay-per-request).

### Lambda Functions (5)
1. **users** - User management and role updates
2. **playgroups** - Playgroup CRUD and member management
3. **sessions** - Session creation with auto-foursome generation
4. **foursomes** - Foursome viewing and editing
5. **scores** - Score entry and retrieval

### API Gateway
- **REST API** with Cognito authorization
- **5 Resources**: /users, /playgroups, /sessions, /foursomes, /scores
- **CORS enabled** for all endpoints
- **Stage**: Uses environment variable (default: dev)

### IAM Roles
- Lambda execution role with DynamoDB and Cognito permissions
- Cognito authenticated user role with API Gateway invoke permissions

## Configuration

### Variables

You can customize the deployment by creating a `terraform.tfvars` file:

```hcl
aws_region   = "us-west-2"
project_name = "golf-playgroups"
environment  = "prod"
```

See `variables.tf` for all available options.

### Environments

To deploy multiple environments (dev, staging, prod):

```bash
terraform workspace new staging
terraform workspace select staging
terraform apply -var="environment=staging"
```

## Updating Lambda Functions

After implementing your Lambda functions:

1. Navigate to the Lambda directory:
   ```bash
   cd ../lambda/users
   npm install
   ```

2. Create the deployment package:
   ```bash
   zip -r ../../terraform/users.zip .
   ```

3. Redeploy with Terraform:
   ```bash
   cd ../../terraform
   terraform apply
   ```

Repeat for each Lambda function (users, playgroups, sessions, foursomes, scores).

## Outputs Reference

| Output | Description | Usage |
|--------|-------------|-------|
| `cognito_user_pool_id` | User Pool ID | Frontend Auth config |
| `cognito_user_pool_client_id` | App Client ID | Frontend Auth config |
| `cognito_identity_pool_id` | Identity Pool ID | Frontend Auth config |
| `api_gateway_url` | API Base URL | Frontend API calls |
| `region` | AWS Region | Frontend config |
| `*_table_name` | DynamoDB table names | Lambda environment vars |
| `*_lambda_name` | Lambda function names | Deployment reference |

## Cost Estimate

For a small-scale deployment (< 1000 users, < 10,000 API calls/month):

- **Cognito**: Free tier (50,000 MAU)
- **DynamoDB**: ~$1-2/month (on-demand, low usage)
- **Lambda**: Free tier (1M requests/month)
- **API Gateway**: ~$3.50/million requests
- **CloudWatch Logs**: ~$0.50/month (7-day retention)

**Estimated Total**: $2-5/month for development/testing

## Cleanup

To destroy all resources:

```bash
terraform destroy
```

**Warning:** This will permanently delete all data in DynamoDB tables.

## Troubleshooting

### Issue: `terraform apply` fails with "no such file: users.zip"

**Solution:** Run `./setup.sh` first to create placeholder Lambda files.

### Issue: API returns 403 Forbidden

**Solution:** Ensure you're including the JWT token in the Authorization header.

### Issue: CORS errors in browser

**Solution:** CORS is pre-configured. If issues persist, check that Lambda functions return CORS headers in responses.

### Issue: Cognito User Pool deletion protection

**Solution:** If you need to destroy and recreate:
```bash
# Temporarily disable deletion protection
aws cognito-idp update-user-pool \
  --user-pool-id <pool-id> \
  --deletion-protection INACTIVE

terraform destroy
```

## Security Notes

1. **IAM Permissions**: Lambda functions have full access to all DynamoDB tables. Consider implementing least-privilege policies for production.

2. **Cognito**: Deletion protection is enabled by default to prevent accidental data loss.

3. **API Gateway**: All endpoints require Cognito authentication. Always validate user permissions in Lambda functions.

4. **CORS**: Currently allows all origins (`*`). Update for production with specific domains.

5. **Secrets**: Never commit `terraform.tfvars` or `.tfstate` files to version control.

## Next Steps

After deploying infrastructure:

1. **Implement Lambda functions** - See `../lambda/` directory
2. **Test with Postman** - Use Cognito tokens for authentication
3. **Build frontend** - Configure AWS Amplify with Terraform outputs
4. **Set up CI/CD** - Automate Lambda deployments
5. **Configure CloudWatch alarms** - Monitor errors and costs

## Support

For issues or questions:
- Check `../docs/` for detailed documentation
- Review CloudWatch logs for Lambda errors
- Verify AWS credentials and permissions

---

**Terraform Version**: 1.0+
**AWS Provider Version**: ~> 5.0
**Last Updated**: 2025-11-08
