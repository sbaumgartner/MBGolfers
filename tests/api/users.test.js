/**
 * API Integration Tests - Users Endpoint
 */

require('dotenv').config({ path: '.env' });
const { setupTestUsers, getAllTokens } = require('../utils/auth');
const { ApiClient } = require('../utils/api');

describe('Users API', () => {
  let tokens;
  let adminClient, groupleaderClient, playerClient;

  beforeAll(async () => {
    // Setup test users if they don't exist
    await setupTestUsers();

    // Get authentication tokens
    tokens = await getAllTokens();

    // Create API clients for each role
    adminClient = new ApiClient(tokens.admin.token);
    groupleaderClient = new ApiClient(tokens.groupleader.token);
    playerClient = new ApiClient(tokens.player.token);
  });

  describe('GET /users', () => {
    test('Admin can list all users', async () => {
      const response = await adminClient.listUsers();

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('users');
      expect(Array.isArray(response.data.users)).toBe(true);
    });

    test('Admin can filter users by role', async () => {
      const response = await adminClient.listUsers({ role: 'Admin' });

      expect(response.status).toBe(200);
      expect(response.data.users.length).toBeGreaterThan(0);
      // All returned users should be admins
      response.data.users.forEach(user => {
        expect(user.role).toBe('Admin');
      });
    });

    test('Non-admin can only see their own info', async () => {
      const response = await playerClient.listUsers();

      expect(response.status).toBe(200);
      expect(response.data.users.length).toBe(1);
      expect(response.data.users[0].email).toBe(tokens.player.email);
    });
  });

  describe('POST /users', () => {
    test('Admin can update user role', async () => {
      // Get a player user ID first
      const listResponse = await adminClient.listUsers({ role: 'Player' });
      const playerId = listResponse.data.users[0].userId;

      // Update role to GroupLeader
      const response = await adminClient.updateUserRole(playerId, 'GroupLeader');

      expect(response.status).toBe(200);
      expect(response.data.user.role).toBe('GroupLeader');

      // Change it back
      await adminClient.updateUserRole(playerId, 'Player');
    });

    test('Non-admin cannot update user roles', async () => {
      const listResponse = await adminClient.listUsers({ role: 'Player' });
      const playerId = listResponse.data.users[0].userId;

      const response = await playerClient.updateUserRole(playerId, 'Admin');

      expect(response.status).toBe(403);
      expect(response.data).toHaveProperty('error');
    });

    test('Cannot set invalid role', async () => {
      const listResponse = await adminClient.listUsers({ role: 'Player' });
      const playerId = listResponse.data.users[0].userId;

      const response = await adminClient.updateUserRole(playerId, 'SuperUser');

      expect(response.status).toBe(400);
    });
  });
});
