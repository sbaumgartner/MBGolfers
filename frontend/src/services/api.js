/**
 * API Service
 * Centralized API calls to backend
 */

import { get, post, put } from 'aws-amplify/api';
import { fetchAuthSession } from 'aws-amplify/auth';

const API_NAME = 'golf-api';

// Helper to get auth headers
async function getAuthHeaders() {
  try {
    const session = await fetchAuthSession();
    const token = session.tokens?.idToken?.toString();
    
    if (!token) {
      console.warn('No auth token found');
      return {};
    }
    
    return {
      Authorization: token
    };
  } catch (error) {
    console.error('Error fetching auth session:', error);
    return {};
  }
}

class ApiService {
  // Users API
  static async getUsers(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const path = `/users${queryString ? `?${queryString}` : ''}`;
    const restOperation = get({
      apiName: API_NAME,
      path: path,
      options: {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async updateUserRole(userId, role) {
    const restOperation = post({
      apiName: API_NAME,
      path: '/users',
      options: {
        body: { userId, role }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  // Playgroups API
  static async getPlaygroups(playgroupId = null) {
    const path = playgroupId ? `/playgroups?playgroupId=${playgroupId}` : '/playgroups';
    const restOperation = get({
      apiName: API_NAME,
      path: path
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async createPlaygroup(name, description = '') {
    const restOperation = post({
      apiName: API_NAME,
      path: '/playgroups',
      options: {
        body: { name, description }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async addMemberToPlaygroup(playgroupId, userId) {
    const restOperation = post({
      apiName: API_NAME,
      path: '/playgroups',
      options: {
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
    try {
      // Check if user is authenticated
      const session = await fetchAuthSession();
      console.log('Auth session:', session);
      console.log('Has tokens?', !!session.tokens);
      console.log('ID Token?', !!session.tokens?.idToken);
      
      if (session.tokens?.idToken) {
        const token = session.tokens.idToken.toString();
        console.log('Token (first 50 chars):', token.substring(0, 50));
      }
      
      const queryString = new URLSearchParams(params).toString();
      const path = `/sessions${queryString ? `?${queryString}` : ''}`;
      
      console.log('Making API call to:', path);
      console.log('API Name:', API_NAME);
      
      const restOperation = get({
        apiName: API_NAME,
        path: path,
        options: {
          headers: {
            Authorization: session.tokens.idToken.toString()
          }
        }
      });
      
      console.log('Rest operation created, awaiting response...');
      
      const response = await restOperation.response;
      console.log('API Response status:', response.statusCode);
      console.log('Response headers:', response.headers);
      
      const { body } = response;
      return await body.json();
    } catch (error) {
      console.error('API Error:', error);
      console.error('Error details:', error.response);
      throw error;
    }
  }

  static async createSession(playgroupId, date, time, courseName = 'Default Course') {
    const restOperation = post({
      apiName: API_NAME,
      path: '/sessions',
      options: {
        body: { playgroupId, date, time, courseName }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  // Foursomes API
  static async getFoursomes(sessionId) {
    const restOperation = get({
      apiName: API_NAME,
      path: `/foursomes?sessionId=${sessionId}`
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async updateFoursome(foursomeId, playerIds) {
    const restOperation = put({
      apiName: API_NAME,
      path: '/foursomes',
      options: {
        body: { foursomeId, playerIds }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  // Scores API
  static async getScores(params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const path = `/scores${queryString ? `?${queryString}` : ''}`;
    const restOperation = get({
      apiName: API_NAME,
      path: path
    });
    const { body } = await restOperation.response;
    return await body.json();
  }

  static async updateScore(foursomeId, playerId, holes) {
    const restOperation = put({
      apiName: API_NAME,
      path: '/scores',
      options: {
        body: { foursomeId, playerId, holes }
      }
    });
    const { body } = await restOperation.response;
    return await body.json();
  }
}

export default ApiService;
