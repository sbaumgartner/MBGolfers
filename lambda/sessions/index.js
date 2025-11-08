/**
 * Sessions Lambda Function
 *
 * Handles:
 * - GET /sessions - List sessions (by sessionId or playgroupId)
 * - POST /sessions - Create session with auto-generated foursomes
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, BatchWriteCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const SESSIONS_TABLE = process.env.SESSIONS_TABLE_NAME;
const PLAYGROUPS_TABLE = process.env.PLAYGROUPS_TABLE_NAME;
const FOURSOMES_TABLE = process.env.FOURSOMES_TABLE_NAME;

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
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
 * Auto-generate foursomes from player list
 */
function generateFoursomes(sessionId, playerIds) {
    // Shuffle players for random grouping
    const shuffled = [...playerIds].sort(() => Math.random() - 0.5);
    const foursomes = [];

    for (let i = 0; i < shuffled.length; i += 4) {
        const group = shuffled.slice(i, i + 4);
        const foursomeId = uuidv4();

        foursomes.push({
            foursomeId,
            sessionId,
            playerIds: group,
            foursomeNumber: Math.floor(i / 4) + 1,
            createdAt: new Date().toISOString()
        });
    }

    return foursomes;
}

/**
 * GET /sessions
 * Query parameters:
 * - sessionId: Get specific session
 * - playgroupId: Get all sessions for a playgroup
 */
async function handleGet(event) {
    const currentUser = getUserFromEvent(event);
    const queryParams = event.queryStringParameters || {};

    try {
        if (queryParams.sessionId) {
            // Get specific session
            const result = await ddbDocClient.send(new GetCommand({
                TableName: SESSIONS_TABLE,
                Key: { sessionId: queryParams.sessionId }
            }));

            if (!result.Item) {
                return response(404, { error: 'Session not found' });
            }

            // Verify user has access to this session's playgroup
            const playgroupResult = await ddbDocClient.send(new GetCommand({
                TableName: PLAYGROUPS_TABLE,
                Key: { playgroupId: result.Item.playgroupId }
            }));

            if (!playgroupResult.Item) {
                return response(404, { error: 'Playgroup not found' });
            }

            const playgroup = playgroupResult.Item;
            const isMember = playgroup.memberIds?.includes(currentUser.userId);
            const isLeader = playgroup.leaderId === currentUser.userId;

            if (!isMember && !isLeader && currentUser.role !== 'Admin') {
                return response(403, { error: 'Forbidden: You are not a member of this playgroup' });
            }

            return response(200, { session: result.Item });
        } else if (queryParams.playgroupId) {
            // Get all sessions for a playgroup
            const result = await ddbDocClient.send(new QueryCommand({
                TableName: SESSIONS_TABLE,
                IndexName: 'PlaygroupDateIndex',
                KeyConditionExpression: 'playgroupId = :playgroupId',
                ExpressionAttributeValues: {
                    ':playgroupId': queryParams.playgroupId
                },
                ScanIndexForward: false // Sort by date descending
            }));

            return response(200, { sessions: result.Items || [] });
        } else {
            return response(400, { error: 'sessionId or playgroupId query parameter required' });
        }
    } catch (error) {
        console.error('Error fetching sessions:', error);
        return response(500, { error: 'Failed to fetch sessions' });
    }
}

/**
 * POST /sessions
 * Create a new play session with auto-generated foursomes
 * Body: { playgroupId, date, time, courseName }
 */
async function handlePost(event) {
    const currentUser = getUserFromEvent(event);

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return response(400, { error: 'Invalid JSON in request body' });
    }

    const { playgroupId, date, time, courseName } = body;

    // Validate inputs
    if (!playgroupId || !date || !time) {
        return response(400, { error: 'playgroupId, date, and time are required' });
    }

    try {
        // Get the playgroup
        const playgroupResult = await ddbDocClient.send(new GetCommand({
            TableName: PLAYGROUPS_TABLE,
            Key: { playgroupId }
        }));

        if (!playgroupResult.Item) {
            return response(404, { error: 'Playgroup not found' });
        }

        const playgroup = playgroupResult.Item;

        // Only the leader can create sessions
        if (playgroup.leaderId !== currentUser.userId && currentUser.role !== 'Admin') {
            return response(403, { error: 'Forbidden: Only the playgroup leader can create sessions' });
        }

        // Create session
        const sessionId = uuidv4();
        const createdAt = new Date().toISOString();

        const session = {
            sessionId,
            playgroupId,
            date,
            time,
            courseName: courseName || 'Default Course',
            status: 'scheduled',
            createdAt,
            createdBy: currentUser.userId
        };

        await ddbDocClient.send(new PutCommand({
            TableName: SESSIONS_TABLE,
            Item: session
        }));

        // Generate foursomes from playgroup members
        const allPlayers = [playgroup.leaderId, ...(playgroup.memberIds || [])];
        const foursomes = generateFoursomes(sessionId, allPlayers);

        // Batch write foursomes
        if (foursomes.length > 0) {
            const batchWriteRequests = foursomes.map(foursome => ({
                PutRequest: {
                    Item: foursome
                }
            }));

            // DynamoDB batch write has a limit of 25 items
            for (let i = 0; i < batchWriteRequests.length; i += 25) {
                const batch = batchWriteRequests.slice(i, i + 25);
                await ddbDocClient.send(new BatchWriteCommand({
                    RequestItems: {
                        [FOURSOMES_TABLE]: batch
                    }
                }));
            }
        }

        return response(201, {
            session,
            foursomes
        });
    } catch (error) {
        console.error('Error creating session:', error);
        return response(500, { error: 'Failed to create session' });
    }
}

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
