/**
 * API Service
 * Centralized API calls to backend
 */

import { API } from 'aws-amplify';

const API_NAME = 'golf-api';

class ApiService {
  // Users API
  static async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const path = `/users${queryString ? `?${queryString}` : ''}`;
    return await API.get(API_NAME, path);
  }

  static async updateUserRole(userId, role) {
    return await API.post(API_NAME, '/users', {
      body: { userId, role }
    });
  }

  // Playgroups API
  static async getPlaygroups(playgroupId = null) {
    const path = playgroupId ? `/playgroups?playgroupId=${playgroupId}` : '/playgroups';
    return await API.get(API_NAME, path);
  }

  static async createPlaygroup(name, description = '') {
    return await API.post(API_NAME, '/playgroups', {
      body: { name, description }
    });
  }

  static async addMemberToPlaygroup(playgroupId, userId) {
    return await API.post(API_NAME, '/playgroups', {
      body: {
        action: 'addMember',
        playgroupId,
        userId
      }
    });
  }

  // Sessions API
  static async getSessions(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const path = `/sessions${queryString ? `?${queryString}` : ''}`;
    return await API.get(API_NAME, path);
  }

  static async createSession(playgroupId, date, time, courseName = 'Default Course') {
    return await API.post(API_NAME, '/sessions', {
      body: { playgroupId, date, time, courseName }
    });
  }

  // Foursomes API
  static async getFoursomes(sessionId) {
    return await API.get(API_NAME, `/foursomes?sessionId=${sessionId}`);
  }

  static async updateFoursome(foursomeId, playerIds) {
    return await API.put(API_NAME, '/foursomes', {
      body: { foursomeId, playerIds }
    });
  }

  // Scores API
  static async getScores(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const path = `/scores${queryString ? `?${queryString}` : ''}`;
    return await API.get(API_NAME, path);
  }

  static async updateScore(foursomeId, playerId, holes) {
    return await API.put(API_NAME, '/scores', {
      body: { foursomeId, playerId, holes }
    });
  }
}

export default ApiService;
