# IAM Role for Lambda functions
resource "aws_iam_role" "lambda_exec" {
  name = "${var.project_name}-lambda-exec-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-lambda-exec-${var.environment}"
  }
}

# IAM Policy for Lambda functions
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_name}-lambda-policy-${var.environment}"
  role = aws_iam_role.lambda_exec.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          aws_dynamodb_table.users.arn,
          "${aws_dynamodb_table.users.arn}/index/*",
          aws_dynamodb_table.playgroups.arn,
          "${aws_dynamodb_table.playgroups.arn}/index/*",
          aws_dynamodb_table.play_sessions.arn,
          "${aws_dynamodb_table.play_sessions.arn}/index/*",
          aws_dynamodb_table.foursomes.arn,
          "${aws_dynamodb_table.foursomes.arn}/index/*",
          aws_dynamodb_table.scores.arn,
          "${aws_dynamodb_table.scores.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "cognito-idp:AdminGetUser",
          "cognito-idp:AdminUpdateUserAttributes",
          "cognito-idp:ListUsers"
        ]
        Resource = aws_cognito_user_pool.main.arn
      }
    ]
  })
}

# Users Lambda Function
resource "aws_lambda_function" "users" {
  filename         = "${path.module}/users.zip"
  function_name    = "${var.project_name}-users-${var.environment}"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/users.zip")
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      USERS_TABLE_NAME      = aws_dynamodb_table.users.name
      USER_POOL_ID          = aws_cognito_user_pool.main.id
      REGION                = var.aws_region
    }
  }

  tags = {
    Name = "${var.project_name}-users-${var.environment}"
  }
}

# Playgroups Lambda Function
resource "aws_lambda_function" "playgroups" {
  filename         = "${path.module}/playgroups.zip"
  function_name    = "${var.project_name}-playgroups-${var.environment}"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/playgroups.zip")
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      PLAYGROUPS_TABLE_NAME = aws_dynamodb_table.playgroups.name
      USERS_TABLE_NAME      = aws_dynamodb_table.users.name
      REGION                = var.aws_region
    }
  }

  tags = {
    Name = "${var.project_name}-playgroups-${var.environment}"
  }
}

# Sessions Lambda Function
resource "aws_lambda_function" "sessions" {
  filename         = "${path.module}/sessions.zip"
  function_name    = "${var.project_name}-sessions-${var.environment}"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/sessions.zip")
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      SESSIONS_TABLE_NAME   = aws_dynamodb_table.play_sessions.name
      PLAYGROUPS_TABLE_NAME = aws_dynamodb_table.playgroups.name
      FOURSOMES_TABLE_NAME  = aws_dynamodb_table.foursomes.name
      REGION                = var.aws_region
    }
  }

  tags = {
    Name = "${var.project_name}-sessions-${var.environment}"
  }
}

# Foursomes Lambda Function
resource "aws_lambda_function" "foursomes" {
  filename         = "${path.module}/foursomes.zip"
  function_name    = "${var.project_name}-foursomes-${var.environment}"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/foursomes.zip")
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      FOURSOMES_TABLE_NAME = aws_dynamodb_table.foursomes.name
      USERS_TABLE_NAME     = aws_dynamodb_table.users.name
      REGION               = var.aws_region
    }
  }

  tags = {
    Name = "${var.project_name}-foursomes-${var.environment}"
  }
}

# Scores Lambda Function
resource "aws_lambda_function" "scores" {
  filename         = "${path.module}/scores.zip"
  function_name    = "${var.project_name}-scores-${var.environment}"
  role            = aws_iam_role.lambda_exec.arn
  handler         = "index.handler"
  source_code_hash = filebase64sha256("${path.module}/scores.zip")
  runtime         = "nodejs20.x"
  timeout         = 30

  environment {
    variables = {
      SCORES_TABLE_NAME    = aws_dynamodb_table.scores.name
      FOURSOMES_TABLE_NAME = aws_dynamodb_table.foursomes.name
      REGION               = var.aws_region
    }
  }

  tags = {
    Name = "${var.project_name}-scores-${var.environment}"
  }
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "users" {
  name              = "/aws/lambda/${aws_lambda_function.users.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "playgroups" {
  name              = "/aws/lambda/${aws_lambda_function.playgroups.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "sessions" {
  name              = "/aws/lambda/${aws_lambda_function.sessions.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "foursomes" {
  name              = "/aws/lambda/${aws_lambda_function.foursomes.function_name}"
  retention_in_days = 7
}

resource "aws_cloudwatch_log_group" "scores" {
  name              = "/aws/lambda/${aws_lambda_function.scores.function_name}"
  retention_in_days = 7
}
