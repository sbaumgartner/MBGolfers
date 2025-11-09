/**
 * Authentication Utilities
 * Handles Cognito authentication for tests
 */

const { CognitoIdentityProviderClient, InitiateAuthCommand, AdminCreateUserCommand, AdminSetUserPasswordCommand, AdminUpdateUserAttributesCommand, AdminGetUserCommand } = require('@aws-sdk/client-cognito-identity-provider');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const USE_SECRETS_MANAGER = process.env.USE_SECRETS_MANAGER === 'true';
const SECRET_NAME = process.env.SECRET_NAME || 'golf-playgroups/test-users';

const cognitoClient = new CognitoIdentityProviderClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const secretsClient = new SecretsManagerClient({
  region: process.env.AWS_REGION || 'us-east-1'
});

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1'
});
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient);

/**
 * Get test user credentials
 * - If USE_SECRETS_MANAGER=true, fetch from AWS Secrets Manager
 * - Otherwise, use hard-coded .env values
 */
async function getTestCredentials() {
  if (USE_SECRETS_MANAGER) {
    try {
      const response = await secretsClient.send(
        new GetSecretValueCommand({ SecretId: SECRET_NAME })
      );
      return JSON.parse(response.SecretString);
    } catch (error) {
      console.error('Failed to fetch credentials from Secrets Manager:', error.message);
      throw error;
    }
  }

  // Use hard-coded credentials from .env
  return {
    admin: {
      email: process.env.TEST_ADMIN_EMAIL,
      password: process.env.TEST_ADMIN_PASSWORD,
      role: 'Admin'
    },
    groupleader: {
      email: process.env.TEST_GROUPLEADER_EMAIL,
      password: process.env.TEST_GROUPLEADER_PASSWORD,
      role: 'GroupLeader'
    },
    player: {
      email: process.env.TEST_PLAYER_EMAIL,
      password: process.env.TEST_PLAYER_PASSWORD,
      role: 'Player'
    }
  };
}

/**
 * Authenticate a user and get ID token
 */
async function authenticateUser(email, password) {
  const command = new InitiateAuthCommand({
    AuthFlow: 'USER_PASSWORD_AUTH',
    ClientId: process.env.COGNITO_CLIENT_ID,
    AuthParameters: {
      USERNAME: email,
      PASSWORD: password
    }
  });

  try {
    const response = await cognitoClient.send(command);
    return response.AuthenticationResult.IdToken;
  } catch (error) {
    console.error(`Authentication failed for ${email}:`, error.message);
    throw error;
  }
}

/**
 * Create a test user in Cognito
 */
async function createTestUser(email, password, role = 'Player') {
  const userPoolId = process.env.COGNITO_USER_POOL_ID;

  try {
    // Try to create user
    await cognitoClient.send(
      new AdminCreateUserCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'email', Value: email },
          { Name: 'email_verified', Value: 'true' }
        ],
        MessageAction: 'SUPPRESS'
      })
    );

    console.log(`Created test user: ${email}`);
  } catch (error) {
    if (error.name === 'UsernameExistsException') {
      console.log(`User ${email} already exists, updating...`);
    } else {
      throw error;
    }
  }

  // Always set password and role (for both new and existing users)
  try {
    // Set permanent password
    await cognitoClient.send(
      new AdminSetUserPasswordCommand({
        UserPoolId: userPoolId,
        Username: email,
        Password: password,
        Permanent: true
      })
    );

    // Set role
    await cognitoClient.send(
      new AdminUpdateUserAttributesCommand({
        UserPoolId: userPoolId,
        Username: email,
        UserAttributes: [
          { Name: 'custom:role', Value: role }
        ]
      })
    );

    console.log(`Configured ${email} with role: ${role}`);
    
    // Also add user to DynamoDB
    const userInfo = await cognitoClient.send(
      new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: email
      })
    );
    
    const userId = userInfo.UserAttributes.find(attr => attr.Name === 'sub')?.Value;
    
    await ddbDocClient.send(
      new PutCommand({
        TableName: process.env.USERS_TABLE_NAME,
        Item: {
          userId,
          email,
          role,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      })
    );
  } catch (error) {
    console.error(`Failed to configure user ${email}:`, error.message);
    throw error;
  }
}

/**
 * Setup all test users
 */
async function setupTestUsers() {
  const credentials = await getTestCredentials();

  await createTestUser(
    credentials.admin.email,
    credentials.admin.password,
    'Admin'
  );

  await createTestUser(
    credentials.groupleader.email,
    credentials.groupleader.password,
    'GroupLeader'
  );

  await createTestUser(
    credentials.player.email,
    credentials.player.password,
    'Player'
  );
}

/**
 * Get authentication tokens for all test users
 */
async function getAllTokens() {
  const credentials = await getTestCredentials();

  const [adminToken, groupleaderToken, playerToken] = await Promise.all([
    authenticateUser(credentials.admin.email, credentials.admin.password),
    authenticateUser(credentials.groupleader.email, credentials.groupleader.password),
    authenticateUser(credentials.player.email, credentials.player.password)
  ]);

  return {
    admin: { token: adminToken, email: credentials.admin.email },
    groupleader: { token: groupleaderToken, email: credentials.groupleader.email },
    player: { token: playerToken, email: credentials.player.email }
  };
}

module.exports = {
  getTestCredentials,
  authenticateUser,
  createTestUser,
  setupTestUsers,
  getAllTokens
};
