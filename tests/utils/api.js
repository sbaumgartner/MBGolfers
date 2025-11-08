/**
 * API Client Utilities
 * Wrapper around axios for API calls
 */

const axios = require('axios');

const API_URL = process.env.API_URL;

/**
 * Create an API client with authentication
 */
function createApiClient(token) {
  return axios.create({
    baseURL: API_URL,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    validateStatus: () => true // Don't throw on any status code
  });
}

/**
 * API helper methods
 */
class ApiClient {
  constructor(token) {
    this.client = createApiClient(token);
  }

  // Users API
  async listUsers(params = {}) {
    return this.client.get('/users', { params });
  }

  async updateUserRole(userId, role) {
    return this.client.post('/users', { userId, role });
  }

  // Playgroups API
  async listPlaygroups(playgroupId = null) {
    const params = playgroupId ? { playgroupId } : {};
    return this.client.get('/playgroups', { params });
  }

  async createPlaygroup(name, description = '') {
    return this.client.post('/playgroups', { name, description });
  }

  async addMember(playgroupId, userId) {
    return this.client.post('/playgroups', {
      action: 'addMember',
      playgroupId,
      userId
    });
  }

  // Sessions API
  async listSessions(params = {}) {
    return this.client.get('/sessions', { params });
  }

  async createSession(playgroupId, date, time, courseName = 'Test Course') {
    return this.client.post('/sessions', {
      playgroupId,
      date,
      time,
      courseName
    });
  }

  // Foursomes API
  async getFoursomes(sessionId) {
    return this.client.get('/foursomes', { params: { sessionId } });
  }

  async updateFoursome(foursomeId, playerIds) {
    return this.client.put('/foursomes', { foursomeId, playerIds });
  }

  // Scores API
  async getScores(params = {}) {
    return this.client.get('/scores', { params });
  }

  async updateScore(foursomeId, playerId, holes) {
    return this.client.put('/scores', { foursomeId, playerId, holes });
  }
}

module.exports = { ApiClient, createApiClient };
