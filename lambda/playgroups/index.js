/**
 * Playgroups Lambda Function
 *
 * Handles:
 * - GET /playgroups - List playgroups (user's groups or specific group)
 * - POST /playgroups - Create playgroup or add member
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, ScanCommand, UpdateCommand } = require('@aws-sdk/lib-dynamodb');
const { v4: uuidv4 } = require('uuid');

const client = new DynamoDBClient({ region: process.env.REGION });
const ddbDocClient = DynamoDBDocumentClient.from(client);

const PLAYGROUPS_TABLE = process.env.PLAYGROUPS_TABLE_NAME;
const USERS_TABLE = process.env.USERS_TABLE_NAME;

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

function getUserFromEvent(event) {
    const claims = event.requestContext.authorizer.claims;
    return {
        userId: claims.sub,
        email: claims.email,
        role: claims['custom:role'] || 'Player'
    };
}

/**
 * GET /playgroups
 * Query parameters:
 * - playgroupId: Get specific playgroup
 */
async function handleGet(event) {
    const currentUser = getUserFromEvent(event);
    const queryParams = event.queryStringParameters || {};

    try {
        if (queryParams.playgroupId) {
            // Get specific playgroup
            const result = await ddbDocClient.send(new GetCommand({
                TableName: PLAYGROUPS_TABLE,
                Key: { playgroupId: queryParams.playgroupId }
            }));

            if (!result.Item) {
                return response(404, { error: 'Playgroup not found' });
            }

            // Check if user is a member or leader
            const playgroup = result.Item;
            const isMember = playgroup.memberIds?.includes(currentUser.userId);
            const isLeader = playgroup.leaderId === currentUser.userId;

            if (!isMember && !isLeader && currentUser.role !== 'Admin') {
                return response(403, { error: 'Forbidden: You are not a member of this playgroup' });
            }

            return response(200, { playgroup: result.Item });
        } else {
            // Get user's playgroups
            // First, get all playgroups where user is the leader
            const leaderGroups = await ddbDocClient.send(new QueryCommand({
                TableName: PLAYGROUPS_TABLE,
                IndexName: 'LeaderIndex',
                KeyConditionExpression: 'leaderId = :leaderId',
                ExpressionAttributeValues: {
                    ':leaderId': currentUser.userId
                }
            }));

            // Then scan for playgroups where user is a member
            // Note: In production, consider maintaining a user-to-playgroup mapping table
            const allGroups = await ddbDocClient.send(new ScanCommand({
                TableName: PLAYGROUPS_TABLE
            }));

            const memberGroups = (allGroups.Items || []).filter(group =>
                group.memberIds?.includes(currentUser.userId)
            );

            // Combine and deduplicate
            const playgroupMap = new Map();
            [...(leaderGroups.Items || []), ...memberGroups].forEach(group => {
                playgroupMap.set(group.playgroupId, group);
            });

            const playgroups = Array.from(playgroupMap.values());

            return response(200, { playgroups });
        }
    } catch (error) {
        console.error('Error fetching playgroups:', error);
        return response(500, { error: 'Failed to fetch playgroups' });
    }
}

/**
 * POST /playgroups
 * Actions:
 * 1. Create playgroup: { name, description }
 * 2. Add member: { action: "addMember", playgroupId, userId }
 */
async function handlePost(event) {
    const currentUser = getUserFromEvent(event);

    let body;
    try {
        body = JSON.parse(event.body);
    } catch (error) {
        return response(400, { error: 'Invalid JSON in request body' });
    }

    // Add member action
    if (body.action === 'addMember') {
        return await handleAddMember(body, currentUser);
    }

    // Create playgroup action
    return await handleCreatePlaygroup(body, currentUser);
}

/**
 * Create a new playgroup
 */
async function handleCreatePlaygroup(body, currentUser) {
    // Only GroupLeaders and Admins can create playgroups
    if (currentUser.role !== 'GroupLeader' && currentUser.role !== 'Admin') {
        return response(403, { error: 'Forbidden: GroupLeader role required' });
    }

    const { name, description } = body;

    if (!name) {
        return response(400, { error: 'name is required' });
    }

    try {
        const playgroupId = uuidv4();
        const createdAt = new Date().toISOString();

        const playgroup = {
            playgroupId,
            name,
            description: description || '',
            leaderId: currentUser.userId,
            leaderEmail: currentUser.email,
            memberIds: [],
            createdAt
        };

        await ddbDocClient.send(new PutCommand({
            TableName: PLAYGROUPS_TABLE,
            Item: playgroup
        }));

        return response(201, { playgroup });
    } catch (error) {
        console.error('Error creating playgroup:', error);
        return response(500, { error: 'Failed to create playgroup' });
    }
}

/**
 * Add a member to a playgroup
 */
async function handleAddMember(body, currentUser) {
    const { playgroupId, userId } = body;

    if (!playgroupId || !userId) {
        return response(400, { error: 'playgroupId and userId are required' });
    }

    try {
        // Get the playgroup
        const result = await ddbDocClient.send(new GetCommand({
            TableName: PLAYGROUPS_TABLE,
            Key: { playgroupId }
        }));

        if (!result.Item) {
            return response(404, { error: 'Playgroup not found' });
        }

        const playgroup = result.Item;

        // Only the leader can add members
        if (playgroup.leaderId !== currentUser.userId && currentUser.role !== 'Admin') {
            return response(403, { error: 'Forbidden: Only the playgroup leader can add members' });
        }

        // Check if user already a member
        if (playgroup.memberIds?.includes(userId)) {
            return response(400, { error: 'User is already a member of this playgroup' });
        }

        // Verify user exists
        const userResult = await ddbDocClient.send(new GetCommand({
            TableName: USERS_TABLE,
            Key: { userId }
        }));

        if (!userResult.Item) {
            return response(404, { error: 'User not found' });
        }

        // Add member to playgroup
        const updatedMemberIds = [...(playgroup.memberIds || []), userId];

        await ddbDocClient.send(new UpdateCommand({
            TableName: PLAYGROUPS_TABLE,
            Key: { playgroupId },
            UpdateExpression: 'SET memberIds = :memberIds, updatedAt = :updatedAt',
            ExpressionAttributeValues: {
                ':memberIds': updatedMemberIds,
                ':updatedAt': new Date().toISOString()
            },
            ReturnValues: 'ALL_NEW'
        }));

        // Fetch updated playgroup
        const updatedResult = await ddbDocClient.send(new GetCommand({
            TableName: PLAYGROUPS_TABLE,
            Key: { playgroupId }
        }));

        return response(200, { playgroup: updatedResult.Item });
    } catch (error) {
        console.error('Error adding member:', error);
        return response(500, { error: 'Failed to add member' });
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
