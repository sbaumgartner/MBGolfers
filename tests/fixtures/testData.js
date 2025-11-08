/**
 * Test Data Fixtures
 * Reusable test data
 */

module.exports = {
  // Valid playgroup data
  validPlaygroup: {
    name: 'Test Thursday Group',
    description: 'Automated test playgroup'
  },

  // Valid session data
  validSession: (playgroupId) => ({
    playgroupId,
    date: '2025-11-20',
    time: '08:00',
    courseName: 'Pine Valley Golf Club'
  }),

  // Valid 18-hole scores
  validScores: {
    par: [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4], // 72
    underPar: [3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4, 3, 4], // 63
    overPar: [5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5], // 90
  },

  // Invalid data for negative tests
  invalidScores: {
    tooFewHoles: [4, 4, 4, 4, 4],
    tooManyHoles: Array(20).fill(4),
    negativeScores: [4, -1, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
    nonNumbers: [4, 4, 'bogey', 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4]
  }
};
