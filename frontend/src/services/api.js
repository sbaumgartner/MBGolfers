/**
 * API Service
 * Centralized API calls to backend
 */

import { get, post, put } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_NAME = 'golf-api';

// Helper to get auth token
async function getAuthToken() {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      console.warn('No auth token found');
    }
    
    return token;
  } catch (error) {
    console.error('Error fetching auth session:', error);
    return null;
  }
}

class ApiService {
  // Users API
  static async getUsers(params = {}) {
    const token = await getAuthToken();
    const queryString = new URLSearchParams(params).toString();
    const path = `/users${queryString ? `?${queryString}` : ''}`;
    const restOperation = get({
      apiName: API_NAME,
      path: path,
      options: {
        headers: {
          Authorization: token
        }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async updateUserRole(userId, role) {
    const token = await getAuthToken();
    const restOperation = post({
      apiName: API_NAME,
      path: '/users',
      options: {
        headers: {
          Authorization: token
        },
        body: { userId, role }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  // Playgroups API
  static async getPlaygroups(playgroupId = null) {
    const token = await getAuthToken();
    const path = playgroupId ? `/playgroups?playgroupId=${playgroupId}` : '/playgroups';
    const restOperation = get({
      apiName: API_NAME,
      path: path,
      options: {
        headers: {
          Authorization: token
        }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async createPlaygroup(name, description = '') {
    const token = await getAuthToken();
    const restOperation = post({
      apiName: API_NAME,
      path: '/playgroups',
      options: {
        headers: {
          Authorization: token
        },
        body: { name, description }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async addMemberToPlaygroup(playgroupId, userId) {
    const token = await getAuthToken();
    const restOperation = post({
      apiName: API_NAME,
      path: '/playgroups',
      options: {
        headers: {
          Authorization: token
        },
        body: {
          action: 'addMember',
          playgroupId,
          userId
        }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  // Sessions API
  static async getSessions(params = {}) {
    const token = await getAuthToken();
    const queryString = new URLSearchParams(params).toString();
    const path = `/sessions${queryString ? `?${queryString}` : ''}`;
    const restOperation = get({
      apiName: API_NAME,
      path: path,
      options: {
        headers: {
          Authorization: token
        }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async createSession(playgroupId, date, time, courseName = 'Default Course') {
    const token = await getAuthToken();
    const restOperation = post({
      apiName: API_NAME,
      path: '/sessions',
      options: {
        headers: {
          Authorization: token
        },
        body: { playgroupId, date, time, courseName }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  // Foursomes API
  static async getFoursomes(sessionId) {
    const token = await getAuthToken();
    const restOperation = get({
      apiName: API_NAME,
      path: `/foursomes?sessionId=${sessionId}`,
      options: {
        headers: {
          Authorization: token
        }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async updateFoursome(foursomeId, playerIds) {
    const token = await getAuthToken();
    const restOperation = put({
      apiName: API_NAME,
      path: '/foursomes',
      options: {
        headers: {
          Authorization: token
        },
        body: { foursomeId, playerIds }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  // Scores API
  static async getScores(params = {}) {
    const token = await getAuthToken();
    const queryString = new URLSearchParams(params).toString();
    const path = `/scores${queryString ? `?${queryString}` : ''}`;
    const restOperation = get({
      apiName: API_NAME,
      path: path,
      options: {
        headers: {
          Authorization: token
        }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async updateScore(foursomeId, playerId, holes) {
    const token = await getAuthToken();
    const restOperation = put({
      apiName: API_NAME,
      path: '/scores',
      options: {
        headers: {
          Authorization: token
        },
        body: { foursomeId, playerId, holes }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  // Convenience method: Get scorecard for a specific player in a session
  static async getScorecard(sessionId, userId) {
    try {
      const result = await this.getScores({ sessionId, playerId: userId });
      // Return the first (and should be only) score for this player in this session
      return result.scores && result.scores.length > 0 ? result.scores[0] : null;
    } catch (error) {
      console.error('Error fetching scorecard:', error);
      // Return null if scorecard doesn't exist yet (player hasn't entered scores)
      if (error.response?.statusCode === 404) {
        return null;
      }
      throw error;
    }
  }

  // Convenience method: Get all scorecards for a session (for leaderboard)
  static async getSessionScorecards(sessionId) {
    const result = await this.getScores({ sessionId });
    return result;
  }

  // Convenience method: Submit scorecard for a player
  // This handles finding the foursome and submitting the score
  static async submitScorecard(sessionId, userId, scores, isFinal = false) {
    try {
      // First, find the foursome this player is in for this session
      const foursomesData = await this.getFoursomes(sessionId);
      const foursomes = foursomesData.foursomes || [];

      // Find which foursome contains this player
      const playerFoursome = foursomes.find(foursome =>
        foursome.playerIds && foursome.playerIds.includes(userId)
      );

      if (!playerFoursome) {
        throw new Error('Player is not assigned to a foursome in this session');
      }

      // Submit the score
      const result = await this.updateScore(playerFoursome.foursomeId, userId, scores);

      // Note: isFinal flag is not currently used in backend
      // Future enhancement: Update session status or score status when isFinal=true

      return result;
    } catch (error) {
      console.error('Error submitting scorecard:', error);
      throw error;
    }
  }

  // Helper methods for playgroup members (called by frontend but not yet implemented)
  static async getPlaygroupMembers(playgroupId) {
    // TODO: Backend needs to implement this endpoint
    // For now, we'll get the playgroup and fetch individual user details
    try {
      const playgroup = await this.getPlaygroups(playgroupId);

      // Get all users and filter to playgroup members
      // This is inefficient but works until backend implements proper endpoint
      const allUsers = await this.getUsers();
      const users = allUsers.users || [];

      // Filter users who are in this playgroup
      // Note: This assumes memberIds are stored in the playgroup object
      const memberIds = playgroup.memberIds || [];
      const leaderId = playgroup.leaderId;

      const members = users.filter(user =>
        memberIds.includes(user.userId) || user.userId === leaderId
      );

      return { members };
    } catch (error) {
      console.error('Error fetching playgroup members:', error);
      throw error;
    }
  }

  static async addPlaygroupMembers(playgroupId, userIds) {
    // Add multiple members by calling addMemberToPlaygroup for each
    const promises = userIds.map(userId =>
      this.addMemberToPlaygroup(playgroupId, userId)
    );
    await Promise.all(promises);
    return { success: true, addedCount: userIds.length };
  }

  static async removePlaygroupMember(playgroupId, userId) {
    // TODO: Backend needs to implement this endpoint
    // For now, throw an error indicating it's not implemented
    throw new Error('Remove member functionality not yet implemented in backend');
  }

  // Helper methods for foursome management
  static async updateFoursomes(sessionId, foursomesArray) {
    // Update multiple foursomes by calling updateFoursome for each
    const promises = foursomesArray.map(foursome =>
      this.updateFoursome(foursome.foursomeId, foursome.playerIds)
    );
    await Promise.all(promises);
    return { success: true, updatedCount: foursomesArray.length };
  }

  static async regenerateFoursomes(sessionId) {
    // TODO: Backend needs to implement this endpoint
    throw new Error('Regenerate foursomes functionality not yet implemented in backend');
  }
}

export default ApiService;
