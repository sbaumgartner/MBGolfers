/**
 * Users Lambda Function
 *
 * Handles:
 * - GET /users - List users (with optional filtering by role or email)
 * - POST /users - Update user role (admin only)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { CognitoIdentityProviderClient, AdminUpdateUserAttributesCommand, ListUsersCommand } = require('@aws-sdk/client-cognito-identity-provider');

const client = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);
const cognitoClient = new CognitoIdentityProviderClient({ region: process.env.REGION });

const USERS_TABLE = process.env.USERS_TABLE_NAME;
const USER_POOL_ID = process.env.USER_POOL_ID;

/**
 * Standard API response helper
 */
function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            'Access-Control-Allow-Credentials': 'true'
        },
        body: JSON.stringify(body)
    };
}

/**
 * Extract user info from Cognito authorizer
 */
function getUserFromEvent(event) {
    const claims = event.requestContext.authorizer.claims;
    return {
        userId: claims.sub,
        email: claims.email,
        role: claims['custom:role'] || 'Player'
    };
}

/**
 * GET /users
 * Query parameters:
 * - role: Filter by role
 * - email: Search by email
 */
async function handleGet(event) {
    const currentUser = getUserFromEvent(event);
    const queryParams = event.queryStringParameters || {};

    // Non-admins can query by email (to find users to add to playgroups) or view their own info
    if (currentUser.role !== 'Admin') {
        // If querying by email, allow it (for GroupLeaders to find players)
        if (queryParams.email) {
            try {
                const result = await ddbDocClient.send(new QueryCommand({
                    TableName: USERS_TABLE,
                    IndexName: 'EmailIndex',
                    KeyConditionExpression: 'email = :email',
                    ExpressionAttributeValues: {
                        ':email': queryParams.email
                    }
                }));

                return response(200, { users: result.Items || [] });
            } catch (error) {
                console.error('Error querying user by email:', error);
                return response(500, { error: 'Failed to query user' });
            }
        }
        
        // Otherwise, non-admins can only view their own info
        try {
            const result = await ddbDocClient.send(new GetCommand({
                TableName: USERS_TABLE,
                Key: { userId: currentUser.userId }
            }));

            return response(200, { users: result.Item ? [result.Item] : [] });
        } catch (error) {
            console.error('Error fetching user:', error);
            return response(500, { error: 'Failed to fetch user data' });
        }
    }

    // Admin can list users with filters
    try {
        let result;

        if (queryParams.email) {
            // Query by email using EmailIndex
            result = await ddbDocClient.send(new QueryCommand({
                TableName: USERS_TABLE,
                IndexName: 'EmailIndex',
                KeyConditionExpression: 'email = :email',
                ExpressionAttributeValues: {
                    ':email': queryParams.email
                }
            }));
        } else if (queryParams.role) {
            // Query by role using RoleIndex
            result = await ddbDocClient.send(new QueryCommand({
                TableName: USERS_TABLE,
                IndexName: 'RoleIndex',
                KeyConditionExpression: '#role = :role',
                ExpressionAttributeNames: {
                    '#role': 'role'
                },
                ExpressionAttributeValues: {
                    ':role': queryParams.role
                }
            }));
        } else {
            // Scan all users
            result = await ddbDocClient.send(new ScanCommand({
                TableName: USERS_TABLE
            }));
        }

        return response(200, { users: result.Items || [] });
    } catch (error) {
        console.error('Error listing users:', error);
        return response(500, { error: 'Failed to list users' });
    }
}

/**
 * POST /users
 * Update user role (admin only)
 * Body: { userId, role }
 */
async function handlePost(event) {
    const currentUser = getUserFromEvent(event);

    // Only admins can update roles
    if (currentUser.role !== 'Admin') {
        return response(403, { error: 'Forbidden: Admin role required' });
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return response(400, { error: 'Invalid JSON in request body' });
    }

    const { userId, role } = body;

    // Validate inputs
    if (!userId || !role) {
        return response(400, { error: 'userId and role are required' });
    }

    if (!['Player', 'GroupLeader', 'Admin'].includes(role)) {
        return response(400, { error: 'Invalid role. Must be Player, GroupLeader, or Admin' });
    }

    try {
        // Update role in Cognito
        await cognitoClient.send(new AdminUpdateUserAttributesCommand({
            UserPoolId: USER_POOL_ID,
            Username: userId,
            UserAttributes: [
                {
                    Name: 'custom:role',
                    Value: role
                }
            ]
        }));

        // Update role in DynamoDB
        const updateTime = new Date().toISOString();
        await ddbDocClient.send(new UpdateCommand({
            TableName: USERS_TABLE,
            Key: { userId },
            UpdateExpression: 'SET #role = :role, updatedAt = :updatedAt',
            ExpressionAttributeNames: {
                '#role': 'role'
            },
            ExpressionAttributeValues: {
                ':role': role,
                ':updatedAt': updateTime
            }
        }));

        // Fetch updated user
        const result = await ddbDocClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId }
        }));

        return response(200, { user: result.Item });
    } catch (error) {
        console.error('Error updating user role:', error);
        return response(500, { error: 'Failed to update user role' });
    }
}

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        const httpMethod = event.httpMethod;

        switch (httpMethod) {
            case 'GET':
                return await handleGet(event);
            case 'POST':
                return await handlePost(event);
            default:
                return response(405, { error: `Method ${httpMethod} not allowed` });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return response(500, { error: 'Internal server error' });
    }
};
