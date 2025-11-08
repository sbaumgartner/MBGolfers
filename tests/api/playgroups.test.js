/**
 * API Integration Tests - Playgroups Endpoint
 */

require('dotenv').config({ path: '.env' });
const { getAllTokens } = require('../utils/auth');
const { ApiClient } = require('../utils/api');
const { validPlaygroup } = require('../fixtures/testData');

describe('Playgroups API', () => {
  let tokens;
  let adminClient, groupleaderClient, playerClient;
  let testPlaygroupId;

  beforeAll(async () => {
    tokens = await getAllTokens();
    adminClient = new ApiClient(tokens.admin.token);
    groupleaderClient = new ApiClient(tokens.groupleader.token);
    playerClient = new ApiClient(tokens.player.token);
  });

  describe('POST /playgroups - Create', () => {
    test('GroupLeader can create a playgroup', async () => {
      const response = await groupleaderClient.createPlaygroup(
        validPlaygroup.name,
        validPlaygroup.description
      );

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('playgroup');
      expect(response.data.playgroup.name).toBe(validPlaygroup.name);
      expect(response.data.playgroup.leaderId).toBeDefined();

      // Save for other tests
      testPlaygroupId = response.data.playgroup.playgroupId;
    });

    test('Player cannot create a playgroup', async () => {
      const response = await playerClient.createPlaygroup(
        'Player Test Group',
        'Should fail'
      );

      expect(response.status).toBe(403);
    });

    test('Cannot create playgroup without name', async () => {
      const response = await groupleaderClient.createPlaygroup('', 'No name');

      expect(response.status).toBe(400);
    });
  });

  describe('GET /playgroups', () => {
    test('GroupLeader can list their playgroups', async () => {
      const response = await groupleaderClient.listPlaygroups();

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('playgroups');
      expect(Array.isArray(response.data.playgroups)).toBe(true);
    });

    test('Can get specific playgroup by ID', async () => {
      const response = await groupleaderClient.listPlaygroups(testPlaygroupId);

      expect(response.status).toBe(200);
      expect(response.data.playgroup.playgroupId).toBe(testPlaygroupId);
    });
  });

  describe('POST /playgroups - Add Member', () => {
    test('GroupLeader can add member to their playgroup', async () => {
      // Get player user ID
      const usersResponse = await adminClient.listUsers({
        email: tokens.player.email
      });
      const playerId = usersResponse.data.users[0].userId;

      // Add player to playgroup
      const response = await groupleaderClient.addMember(
        testPlaygroupId,
        playerId
      );

      expect(response.status).toBe(200);
      expect(response.data.playgroup.memberIds).toContain(playerId);
    });

    test('Cannot add same member twice', async () => {
      const usersResponse = await adminClient.listUsers({
        email: tokens.player.email
      });
      const playerId = usersResponse.data.users[0].userId;

      // Try to add again
      const response = await groupleaderClient.addMember(
        testPlaygroupId,
        playerId
      );

      expect(response.status).toBe(400);
    });

    test('Non-leader cannot add members', async () => {
      const usersResponse = await adminClient.listUsers({
        email: tokens.admin.email
      });
      const adminId = usersResponse.data.users[0].userId;

      const response = await playerClient.addMember(
        testPlaygroupId,
        adminId
      );

      expect(response.status).toBe(403);
    });
  });
});
