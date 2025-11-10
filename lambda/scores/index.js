/**
 * Scores Lambda Function
 *
 * Handles:
 * - GET /scores - Get scores (by foursomeId, sessionId, or playerId)
 * - PUT /scores - Update player scores
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const SCORES_TABLE = process.env.SCORES_TABLE_NAME;
const FOURSOMES_TABLE = process.env.FOURSOMES_TABLE_NAME;

function response(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': 'http://localhost:3000',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,PUT,OPTIONS',
            'Access-Control-Allow-Credentials': 'true'
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
 * Calculate total score from holes array
 */
function calculateTotalScore(holes) {
    return holes.reduce((sum, score) => sum + score, 0);
}

/**
 * GET /scores
 * Query parameters:
 * - foursomeId: Get scores for a foursome
 * - sessionId: Get all scores for a session
 * - playerId: Get scores for a specific player
 */
async function handleGet(event) {
    const currentUser = getUserFromEvent(event);
    const queryParams = event.queryStringParameters || {};

    try {
        if (queryParams.foursomeId) {
            // Get scores for a specific foursome
            const result = await ddbDocClient.send(new QueryCommand({
                TableName: SCORES_TABLE,
                KeyConditionExpression: 'foursomeId = :foursomeId',
                ExpressionAttributeValues: {
                    ':foursomeId': queryParams.foursomeId
                }
            }));

            return response(200, { scores: result.Items || [] });
        } else if (queryParams.sessionId) {
            // Get all scores for a session
            const result = await ddbDocClient.send(new QueryCommand({
                TableName: SCORES_TABLE,
                IndexName: 'SessionPlayerIndex',
                KeyConditionExpression: 'sessionId = :sessionId',
                ExpressionAttributeValues: {
                    ':sessionId': queryParams.sessionId
                }
            }));

            return response(200, { scores: result.Items || [] });
        } else if (queryParams.playerId) {
            // Get scores for a specific player (across sessions)
            // This is less efficient - consider adding a PlayerIndex if this becomes common
            const result = await ddbDocClient.send(new QueryCommand({
                TableName: SCORES_TABLE,
                IndexName: 'SessionPlayerIndex',
                KeyConditionExpression: 'playerId = :playerId',
                ExpressionAttributeValues: {
                    ':playerId': queryParams.playerId
                }
            }));

            return response(200, { scores: result.Items || [] });
        } else {
            return response(400, { error: 'foursomeId, sessionId, or playerId query parameter required' });
        }
    } catch (error) {
        console.error('Error fetching scores:', error);
        return response(500, { error: 'Failed to fetch scores' });
    }
}

/**
 * PUT /scores
 * Update scores for a player
 * Body: { foursomeId, playerId, holes }
 */
async function handlePut(event) {
    const currentUser = getUserFromEvent(event);

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return response(400, { error: 'Invalid JSON in request body' });
    }

    const { foursomeId, playerId, holes } = body;

    // Validate inputs
    if (!foursomeId || !playerId || !holes) {
        return response(400, { error: 'foursomeId, playerId, and holes are required' });
    }

    if (!Array.isArray(holes) || holes.length !== 18) {
        return response(400, { error: 'holes must be an array of exactly 18 scores' });
    }

    // Validate all hole scores are numbers
    if (!holes.every(score => typeof score === 'number' && score >= 0)) {
        return response(400, { error: 'All hole scores must be non-negative numbers' });
    }

    try {
        // Get the foursome to verify authorization and get sessionId
        const foursomeResult = await ddbDocClient.send(new QueryCommand({
            TableName: FOURSOMES_TABLE,
            KeyConditionExpression: 'foursomeId = :foursomeId',
            ExpressionAttributeValues: {
                ':foursomeId': foursomeId
            }
        }));

        if (!foursomeResult.Items || foursomeResult.Items.length === 0) {
            return response(404, { error: 'Foursome not found' });
        }

        const foursome = foursomeResult.Items[0];

        // Verify player is in the foursome (unless user is GroupLeader)
        const isInFoursome = foursome.playerIds.includes(currentUser.userId);
        const isGroupLeader = currentUser.role === 'GroupLeader';
        const isAdmin = currentUser.role === 'Admin';

        if (!isInFoursome && !isGroupLeader && !isAdmin) {
            return response(403, { error: 'Forbidden: You must be in the foursome to enter scores' });
        }

        // Verify the playerId is in the foursome
        if (!foursome.playerIds.includes(playerId)) {
            return response(400, { error: 'Player is not in this foursome' });
        }

        // Calculate total score
        const totalScore = calculateTotalScore(holes);
        const updatedAt = new Date().toISOString();

        // Save score
        const scoreRecord = {
            foursomeId,
            playerId,
            sessionId: foursome.sessionId,
            holes,
            totalScore,
            updatedAt,
            updatedBy: currentUser.userId
        };

        await ddbDocClient.send(new PutCommand({
            TableName: SCORES_TABLE,
            Item: scoreRecord
        }));

        return response(200, { score: scoreRecord });
    } catch (error) {
        console.error('Error updating score:', error);
        return response(500, { error: 'Failed to update score' });
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
