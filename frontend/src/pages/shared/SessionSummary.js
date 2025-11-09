/**
 * Session Summary Screen
 * Display leaderboard and scores for a golf session
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import './SessionSummary.css';

export const SessionSummary = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [scorecards, setScorecards] = useState([]);
  const [foursomes, setFoursomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('leaderboard'); // 'leaderboard' or 'foursomes'

  useEffect(() => {
    loadSessionSummary();
  }, [sessionId]);

  const loadSessionSummary = async () => {
    setLoading(true);
    setError('');

    try {
      // Load session details
      const sessionData = await ApiService.getSessions(null, sessionId);
      setSession(sessionData);

      // Load all scorecards for this session
      const scorecardsData = await ApiService.getSessionScorecards(sessionId);
      setScorecards(scorecardsData.scorecards || []);

      // Load foursomes
      const foursomesData = await ApiService.getFoursomes(sessionId);
      setFoursomes(foursomesData.foursomes || []);
    } catch (err) {
      console.error('Error loading session summary:', err);
      setError(err.message || 'Failed to load session summary');
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = (scores) => {
    return scores.reduce((sum, score) => sum + (score || 0), 0);
  };

  const getSortedLeaderboard = () => {
    return scorecards
      .filter(sc => sc.status === 'submitted')
      .map(sc => ({
        ...sc,
        total: calculateTotal(sc.scores)
      }))
      .sort((a, b) => a.total - b.total);
  };

  const getBackButtonPath = () => {
    if (user.role === 'GroupLeader') {
      return `/groupleader/playgroup/${session?.playgroupId}`;
    }
    return '/player';
  };

  if (loading) {
    return (
      <div className="summary-container">
        <div className="loading">Loading session summary...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="summary-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(getBackButtonPath())}>Back</button>
      </div>
    );
  }

  const leaderboard = getSortedLeaderboard();

  return (
    <div className="summary-container">
      <div className="summary-header">
        <button onClick={() => navigate(getBackButtonPath())} className="back-button">
          ← Back
        </button>
        <div>
          <h1>Session Results</h1>
          <p className="summary-details">
            {session?.courseName} · {session?.date} at {session?.time}
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* View Mode Toggle */}
      <div className="view-toggle">
        <button
          className={`toggle-button ${viewMode === 'leaderboard' ? 'active' : ''}`}
          onClick={() => setViewMode('leaderboard')}
        >
          Leaderboard
        </button>
        <button
          className={`toggle-button ${viewMode === 'foursomes' ? 'active' : ''}`}
          onClick={() => setViewMode('foursomes')}
        >
          By Foursome
        </button>
      </div>

      {/* Leaderboard View */}
      {viewMode === 'leaderboard' && (
        <div className="leaderboard-section">
          {leaderboard.length === 0 ? (
            <div className="empty-state">
              <p>No scorecards have been submitted yet.</p>
            </div>
          ) : (
            <div className="leaderboard-table">
              <div className="leaderboard-header">
                <div className="rank-col">Rank</div>
                <div className="player-col">Player</div>
                <div className="score-col">Front 9</div>
                <div className="score-col">Back 9</div>
                <div className="total-col">Total</div>
              </div>
              {leaderboard.map((scorecard, index) => (
                <div key={scorecard.userId} className="leaderboard-row">
                  <div className="rank-col">
                    <span className={`rank-badge rank-${index + 1}`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="player-col">
                    <div className="player-name">{scorecard.playerName || scorecard.playerEmail}</div>
                    <div className="player-email">{scorecard.playerEmail}</div>
                  </div>
                  <div className="score-col">
                    {scorecard.scores.slice(0, 9).reduce((sum, s) => sum + (s || 0), 0)}
                  </div>
                  <div className="score-col">
                    {scorecard.scores.slice(9, 18).reduce((sum, s) => sum + (s || 0), 0)}
                  </div>
                  <div className="total-col">
                    <strong>{scorecard.total}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Foursomes View */}
      {viewMode === 'foursomes' && (
        <div className="foursomes-section">
          {foursomes.map((foursome, index) => {
            const foursomeScores = scorecards.filter(sc =>
              foursome.players?.some(p => p.userId === sc.userId) && sc.status === 'submitted'
            );

            return (
              <div key={foursome.foursomeId} className="foursome-summary">
                <h3>Foursome {index + 1}</h3>
                {foursomeScores.length === 0 ? (
                  <div className="empty-state">No scorecards submitted</div>
                ) : (
                  <div className="foursome-scores">
                    {foursomeScores.map(scorecard => (
                      <div key={scorecard.userId} className="foursome-player-score">
                        <div className="player-info">
                          <div className="player-name">{scorecard.playerName || scorecard.playerEmail}</div>
                        </div>
                        <div className="score-breakdown">
                          <span>Front 9: {scorecard.scores.slice(0, 9).reduce((sum, s) => sum + (s || 0), 0)}</span>
                          <span>Back 9: {scorecard.scores.slice(9, 18).reduce((sum, s) => sum + (s || 0), 0)}</span>
                          <span className="total">Total: {calculateTotal(scorecard.scores)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Summary Stats */}
      <div className="summary-stats">
        <h3>Session Statistics</h3>
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{leaderboard.length}</div>
            <div className="stat-label">Scorecards Submitted</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{foursomes.length}</div>
            <div className="stat-label">Foursomes</div>
          </div>
          {leaderboard.length > 0 && (
            <>
              <div className="stat-card">
                <div className="stat-value">{leaderboard[0].total}</div>
                <div className="stat-label">Low Score</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">
                  {Math.round(leaderboard.reduce((sum, sc) => sum + sc.total, 0) / leaderboard.length)}
                </div>
                <div className="stat-label">Average Score</div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
