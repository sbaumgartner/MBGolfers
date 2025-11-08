# Users Table
resource "aws_dynamodb_table" "users" {
  name           = "${var.project_name}-users-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "userId"

  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "email"
    type = "S"
  }

  attribute {
    name = "role"
    type = "S"
  }

  # Global Secondary Index for email lookups
  global_secondary_index {
    name            = "EmailIndex"
    hash_key        = "email"
    projection_type = "ALL"
  }

  # Global Secondary Index for role-based queries
  global_secondary_index {
    name            = "RoleIndex"
    hash_key        = "role"
    projection_type = "ALL"
  }

  tags = {
    Name = "${var.project_name}-users-${var.environment}"
  }
}

# Playgroups Table
resource "aws_dynamodb_table" "playgroups" {
  name           = "${var.project_name}-playgroups-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "playgroupId"

  attribute {
    name = "playgroupId"
    type = "S"
  }

  attribute {
    name = "leaderId"
    type = "S"
  }

  # Global Secondary Index for leader-based queries
  global_secondary_index {
    name            = "LeaderIndex"
    hash_key        = "leaderId"
    projection_type = "ALL"
  }

  tags = {
    Name = "${var.project_name}-playgroups-${var.environment}"
  }
}

# Play Sessions Table
resource "aws_dynamodb_table" "play_sessions" {
  name           = "${var.project_name}-play-sessions-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "sessionId"

  attribute {
    name = "sessionId"
    type = "S"
  }

  attribute {
    name = "playgroupId"
    type = "S"
  }

  attribute {
    name = "date"
    type = "S"
  }

  # Global Secondary Index for playgroup + date queries
  global_secondary_index {
    name            = "PlaygroupDateIndex"
    hash_key        = "playgroupId"
    range_key       = "date"
    projection_type = "ALL"
  }

  tags = {
    Name = "${var.project_name}-play-sessions-${var.environment}"
  }
}

# Foursomes Table
resource "aws_dynamodb_table" "foursomes" {
  name           = "${var.project_name}-foursomes-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "foursomeId"
  range_key      = "sessionId"

  attribute {
    name = "foursomeId"
    type = "S"
  }

  attribute {
    name = "sessionId"
    type = "S"
  }

  # Global Secondary Index for session-based queries
  global_secondary_index {
    name            = "SessionIndex"
    hash_key        = "sessionId"
    projection_type = "ALL"
  }

  tags = {
    Name = "${var.project_name}-foursomes-${var.environment}"
  }
}

# Scores Table
resource "aws_dynamodb_table" "scores" {
  name           = "${var.project_name}-scores-${var.environment}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "foursomeId"
  range_key      = "playerId"

  attribute {
    name = "foursomeId"
    type = "S"
  }

  attribute {
    name = "playerId"
    type = "S"
  }

  attribute {
    name = "sessionId"
    type = "S"
  }

  # Global Secondary Index for session + player queries
  global_secondary_index {
    name            = "SessionPlayerIndex"
    hash_key        = "sessionId"
    range_key       = "playerId"
    projection_type = "ALL"
  }

  tags = {
    Name = "${var.project_name}-scores-${var.environment}"
  }
}
