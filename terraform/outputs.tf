output "region" {
  description = "AWS region"
  value       = var.aws_region
}

output "cognito_user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "cognito_user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.main.id
}

output "cognito_identity_pool_id" {
  description = "Cognito Identity Pool ID"
  value       = aws_cognito_identity_pool.main.id
}

output "api_gateway_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.main.invoke_url
}

output "user_pool_domain" {
  description = "Cognito User Pool domain"
  value       = aws_cognito_user_pool.main.domain
}

# DynamoDB Table Names
output "users_table_name" {
  description = "Users DynamoDB table name"
  value       = aws_dynamodb_table.users.name
}

output "playgroups_table_name" {
  description = "Playgroups DynamoDB table name"
  value       = aws_dynamodb_table.playgroups.name
}

output "sessions_table_name" {
  description = "Play Sessions DynamoDB table name"
  value       = aws_dynamodb_table.play_sessions.name
}

output "foursomes_table_name" {
  description = "Foursomes DynamoDB table name"
  value       = aws_dynamodb_table.foursomes.name
}

output "scores_table_name" {
  description = "Scores DynamoDB table name"
  value       = aws_dynamodb_table.scores.name
}

# Lambda Function Names
output "users_lambda_name" {
  description = "Users Lambda function name"
  value       = aws_lambda_function.users.function_name
}

output "playgroups_lambda_name" {
  description = "Playgroups Lambda function name"
  value       = aws_lambda_function.playgroups.function_name
}

output "sessions_lambda_name" {
  description = "Sessions Lambda function name"
  value       = aws_lambda_function.sessions.function_name
}

output "foursomes_lambda_name" {
  description = "Foursomes Lambda function name"
  value       = aws_lambda_function.foursomes.function_name
}

output "scores_lambda_name" {
  description = "Scores Lambda function name"
  value       = aws_lambda_function.scores.function_name
}
