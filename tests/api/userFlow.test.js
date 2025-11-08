/**
 * API Integration Tests - Complete User Flow
 * Tests the entire workflow from playgroup creation to score entry
 */

require('dotenv').config({ path: '.env' });
const { getAllTokens } = require('../utils/auth');
const { ApiClient } = require('../utils/api');
const { validPlaygroup, validSession, validScores } = require('../fixtures/testData');

describe('Complete User Flow', () => {
  let tokens;
  let groupleaderClient, playerClient;
  let playgroupId, sessionId, foursomeId, playerId;

  beforeAll(async () => {
    tokens = await getAllTokens();
    groupleaderClient = new ApiClient(tokens.groupleader.token);
    playerClient = new ApiClient(tokens.player.token);
  });

  test('Step 1: GroupLeader creates a playgroup', async () => {
    const response = await groupleaderClient.createPlaygroup(
      'End-to-End Test Group',
      'Testing complete flow'
    );

    expect(response.status).toBe(201);
    playgroupId = response.data.playgroup.playgroupId;
  });

  test('Step 2: GroupLeader adds players to playgroup', async () => {
    // Get player user
    const usersResponse = await groupleaderClient.listUsers();
    const playerUser = usersResponse.data.users.find(
      u => u.email === tokens.player.email
    );
    playerId = playerUser.userId;

    const response = await groupleaderClient.addMember(
      playgroupId,
      playerId
    );

    expect(response.status).toBe(200);
    expect(response.data.playgroup.memberIds).toContain(playerId);
  });

  test('Step 3: GroupLeader creates a session', async () => {
    const sessionData = validSession(playgroupId);
    const response = await groupleaderClient.createSession(
      sessionData.playgroupId,
      sessionData.date,
      sessionData.time,
      sessionData.courseName
    );

    expect(response.status).toBe(201);
    expect(response.data).toHaveProperty('session');
    expect(response.data).toHaveProperty('foursomes');
    expect(response.data.foursomes.length).toBeGreaterThan(0);

    sessionId = response.data.session.sessionId;
    foursomeId = response.data.foursomes[0].foursomeId;
  });

  test('Step 4: Verify foursomes were auto-generated', async () => {
    const response = await groupleaderClient.getFoursomes(sessionId);

    expect(response.status).toBe(200);
    expect(response.data.foursomes.length).toBeGreaterThan(0);

    const foursome = response.data.foursomes[0];
    expect(foursome.playerIds).toContain(playerId);
  });

  test('Step 5: Player enters scores for their foursome', async () => {
    const response = await playerClient.updateScore(
      foursomeId,
      playerId,
      validScores.par
    );

    expect(response.status).toBe(200);
    expect(response.data.score.totalScore).toBe(72); // Par
    expect(response.data.score.holes).toEqual(validScores.par);
  });

  test('Step 6: Retrieve session scores', async () => {
    const response = await groupleaderClient.getScores({ sessionId });

    expect(response.status).toBe(200);
    expect(response.data.scores.length).toBeGreaterThan(0);

    const playerScore = response.data.scores.find(
      s => s.playerId === playerId
    );
    expect(playerScore.totalScore).toBe(72);
  });

  test('Step 7: GroupLeader can edit foursome assignments', async () => {
    // Get current foursome
    const foursomesResponse = await groupleaderClient.getFoursomes(sessionId);
    const foursome = foursomesResponse.data.foursomes[0];

    // Update with same players (just testing the endpoint)
    const response = await groupleaderClient.updateFoursome(
      foursome.foursomeId,
      foursome.playerIds
    );

    expect(response.status).toBe(200);
  });
});
