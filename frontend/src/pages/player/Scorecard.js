/**
 * Scorecard Screen
 * 18-hole golf scorecard for entering scores
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import './Scorecard.css';

export const Scorecard = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [scorecard, setScorecard] = useState(null);
  const [scores, setScores] = useState(Array(18).fill(null));
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    loadScorecardData();
  }, [sessionId, user?.userId]);

  const loadScorecardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load session details
      const sessionData = await ApiService.getSessions(null, sessionId);
      setSession(sessionData);

      // Load existing scorecard if it exists
      try {
        const scorecardData = await ApiService.getScorecard(sessionId, user.userId);
        setScorecard(scorecardData);
        setScores(scorecardData.scores || Array(18).fill(null));
      } catch (err) {
        // No existing scorecard, start with empty scores
        setScores(Array(18).fill(null));
      }
    } catch (err) {
      console.error('Error loading scorecard:', err);
      setError(err.message || 'Failed to load scorecard data');
    } finally {
      setLoading(false);
    }
  };

  const handleScoreChange = (holeIndex, value) => {
    const score = value === '' ? null : parseInt(value, 10);
    setScores(prev => {
      const updated = [...prev];
      updated[holeIndex] = score;
      return updated;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      await ApiService.submitScorecard(sessionId, user.userId, scores);
      setSuccessMessage('Scorecard saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error saving scorecard:', err);
      setError(err.message || 'Failed to save scorecard. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    // Validate all holes have scores
    const hasEmptyScores = scores.some(score => score === null || score === '');
    if (hasEmptyScores) {
      setError('Please enter scores for all 18 holes before submitting');
      return;
    }

    if (!window.confirm('Once submitted, you cannot edit your scorecard. Are you sure?')) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      await ApiService.submitScorecard(sessionId, user.userId, scores, true); // true = final submission
      setSuccessMessage('Scorecard submitted successfully!');

      // Navigate back to player dashboard after a short delay
      setTimeout(() => {
        navigate('/player');
      }, 2000);
    } catch (err) {
      console.error('Error submitting scorecard:', err);
      setError(err.message || 'Failed to submit scorecard. Please try again.');
      setSaving(false);
    }
  };

  const calculateTotal = () => {
    return scores.reduce((sum, score) => sum + (score || 0), 0);
  };

  const calculateNineTotal = (startIndex) => {
    return scores
      .slice(startIndex, startIndex + 9)
      .reduce((sum, score) => sum + (score || 0), 0);
  };

  if (loading) {
    return (
      <div className="scorecard-container">
        <div className="loading">Loading scorecard...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="scorecard-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/player')}>Back to Dashboard</button>
      </div>
    );
  }

  const isSubmitted = scorecard?.status === 'submitted';

  return (
    <div className="scorecard-container">
      <div className="scorecard-header">
        <button onClick={() => navigate('/player')} className="back-button">
          ← Back to Dashboard
        </button>
        <div>
          <h1>Scorecard</h1>
          <p className="scorecard-details">
            {session?.courseName} · {session?.date} at {session?.time}
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {isSubmitted && (
        <div className="info-message">
          This scorecard has been submitted and can no longer be edited.
        </div>
      )}

      {/* Front Nine */}
      <div className="scorecard-section">
        <h3>Front Nine (Holes 1-9)</h3>
        <div className="scorecard-grid">
          <div className="scorecard-row header">
            <div className="hole-label">Hole</div>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(hole => (
              <div key={hole} className="hole-number">{hole}</div>
            ))}
            <div className="hole-total">Out</div>
          </div>
          <div className="scorecard-row scores">
            <div className="hole-label">Score</div>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map(index => (
              <div key={index} className="hole-score">
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={scores[index] || ''}
                  onChange={(e) => handleScoreChange(index, e.target.value)}
                  disabled={isSubmitted}
                  className="score-input"
                />
              </div>
            ))}
            <div className="hole-total-value">{calculateNineTotal(0)}</div>
          </div>
        </div>
      </div>

      {/* Back Nine */}
      <div className="scorecard-section">
        <h3>Back Nine (Holes 10-18)</h3>
        <div className="scorecard-grid">
          <div className="scorecard-row header">
            <div className="hole-label">Hole</div>
            {[10, 11, 12, 13, 14, 15, 16, 17, 18].map(hole => (
              <div key={hole} className="hole-number">{hole}</div>
            ))}
            <div className="hole-total">In</div>
          </div>
          <div className="scorecard-row scores">
            <div className="hole-label">Score</div>
            {[9, 10, 11, 12, 13, 14, 15, 16, 17].map(index => (
              <div key={index} className="hole-score">
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={scores[index] || ''}
                  onChange={(e) => handleScoreChange(index, e.target.value)}
                  disabled={isSubmitted}
                  className="score-input"
                />
              </div>
            ))}
            <div className="hole-total-value">{calculateNineTotal(9)}</div>
          </div>
        </div>
      </div>

      {/* Total Score */}
      <div className="scorecard-total">
        <h3>Total Score: {calculateTotal()}</h3>
      </div>

      {/* Actions */}
      {!isSubmitted && (
        <div className="scorecard-actions">
          <button
            onClick={handleSave}
            className="button-secondary"
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Progress'}
          </button>
          <button
            onClick={handleSubmit}
            className="button-primary"
            disabled={saving || scores.some(s => s === null || s === '')}
          >
            Submit Final Scorecard
          </button>
        </div>
      )}

      <div className="scorecard-instructions">
        <h4>Instructions:</h4>
        <ul>
          <li>Enter your score for each hole (number of strokes)</li>
          <li>Click "Save Progress" to save without submitting</li>
          <li>Click "Submit Final Scorecard" when all holes are complete</li>
          <li>Once submitted, your scorecard cannot be edited</li>
        </ul>
      </div>
    </div>
  );
};
