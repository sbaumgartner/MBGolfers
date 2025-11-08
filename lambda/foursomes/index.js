/**
 * Foursomes Lambda Function
 *
 * Handles:
 * - GET /foursomes - Get foursomes for a session
 * - PUT /foursomes - Update foursome player assignments (GroupLeader only)
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, QueryCommand, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const FOURSOMES_TABLE = process.env.FOURSOMES_TABLE_NAME;
const USERS_TABLE = process.env.USERS_TABLE_NAME;

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS'
        },
        body: JSON.stringify(body)
    };
}

function getUserFromEvent(event) {
    const claims = event.requestContext.authorizer.claims;
    return {
        userId: claims.sub,
        email: claims.email,
        role: claims['custom:role'] || 'Player'
    };
}

/**
 * GET /foursomes?sessionId=xxx
 * Get all foursomes for a session
 */
async function handleGet(event) {
    const currentUser = getUserFromEvent(event);
    const queryParams = event.queryStringParameters || {};

    if (!queryParams.sessionId) {
        return response(400, { error: 'sessionId query parameter is required' });
    }

    try {
        const result = await ddbDocClient.send(new QueryCommand({
            TableName: FOURSOMES_TABLE,
            IndexName: 'SessionIndex',
            KeyConditionExpression: 'sessionId = :sessionId',
            ExpressionAttributeValues: {
                ':sessionId': queryParams.sessionId
            }
        }));

        const foursomes = result.Items || [];

        // Sort by foursome number
        foursomes.sort((a, b) => (a.foursomeNumber || 0) - (b.foursomeNumber || 0));

        return response(200, { foursomes });
    } catch (error) {
        console.error('Error fetching foursomes:', error);
        return response(500, { error: 'Failed to fetch foursomes' });
    }
}

/**
 * PUT /foursomes
 * Update foursome player assignments
 * Body: { foursomeId, playerIds }
 */
async function handlePut(event) {
    const currentUser = getUserFromEvent(event);

    // Only GroupLeaders and Admins can update foursomes
    if (currentUser.role !== 'GroupLeader' && currentUser.role !== 'Admin') {
        return response(403, { error: 'Forbidden: GroupLeader role required' });
    }

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return response(400, { error: 'Invalid JSON in request body' });
    }

    const { foursomeId, playerIds } = body;

    // Validate inputs
    if (!foursomeId || !playerIds) {
        return response(400, { error: 'foursomeId and playerIds are required' });
    }

    if (!Array.isArray(playerIds)) {
        return response(400, { error: 'playerIds must be an array' });
    }

    if (playerIds.length < 1 || playerIds.length > 4) {
        return response(400, { error: 'playerIds must contain 1-4 players' });
    }

    try {
        // Verify all players exist
        for (const playerId of playerIds) {
            const userResult = await ddbDocClient.send(new GetCommand({
                TableName: USERS_TABLE,
                Key: { userId: playerId }
            }));

            if (!userResult.Item) {
                return response(404, { error: `User ${playerId} not found` });
            }
        }

        // Update foursome
        const updatedAt = new Date().toISOString();

        // Note: We need to know the sessionId to update since it's part of the composite key
        // First, get the existing foursome to retrieve the sessionId
        const existingResult = await ddbDocClient.send(new QueryCommand({
            TableName: FOURSOMES_TABLE,
            KeyConditionExpression: 'foursomeId = :foursomeId',
            ExpressionAttributeValues: {
                ':foursomeId': foursomeId
            }
        }));

        if (!existingResult.Items || existingResult.Items.length === 0) {
            return response(404, { error: 'Foursome not found' });
        }

        const existingFoursome = existingResult.Items[0];

        // Update the foursome
        const updateResult = await ddbDocClient.send(new UpdateCommand({
            TableName: FOURSOMES_TABLE,
            Key: {
                foursomeId: foursomeId,
                sessionId: existingFoursome.sessionId
            },
            UpdateExpression: 'SET playerIds = :playerIds, updatedAt = :updatedAt, updatedBy = :updatedBy',
            ExpressionAttributeValues: {
                ':playerIds': playerIds,
                ':updatedAt': updatedAt,
                ':updatedBy': currentUser.userId
            },
            ReturnValues: 'ALL_NEW'
        }));

        return response(200, { foursome: updateResult.Attributes });
    } catch (error) {
        console.error('Error updating foursome:', error);
        return response(500, { error: 'Failed to update foursome' });
    }
}

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));

    try {
        const httpMethod = event.httpMethod;

        switch (httpMethod) {
            case 'GET':
                return await handleGet(event);
            case 'PUT':
                return await handlePut(event);
            default:
                return response(405, { error: `Method ${httpMethod} not allowed` });
        }
    } catch (error) {
        console.error('Unexpected error:', error);
        return response(500, { error: 'Internal server error' });
    }
};
