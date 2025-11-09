/**
 * Edit Foursomes Screen
 * View and rearrange foursomes for a golf session
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import './Session.css';

export const EditFoursomes = () => {
  const { sessionId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [foursomes, setFoursomes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // For drag and drop
  const [draggedPlayer, setDraggedPlayer] = useState(null);

  useEffect(() => {
    loadSessionData();
  }, [sessionId]);

  const loadSessionData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load session details
      const sessionData = await ApiService.getSessions(null, sessionId);
      setSession(sessionData);

      // Load foursomes
      const foursomesData = await ApiService.getFoursomes(sessionId);
      setFoursomes(foursomesData.foursomes || []);
    } catch (err) {
      console.error('Error loading session:', err);
      setError(err.message || 'Failed to load session data');
    } finally {
      setLoading(false);
    }
  };

  const handleDragStart = (player, foursomeId) => {
    setDraggedPlayer({ player, fromFoursomeId: foursomeId });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (toFoursomeId) => {
    if (!draggedPlayer) return;

    const { player, fromFoursomeId } = draggedPlayer;

    // Don't do anything if dropping in the same foursome
    if (fromFoursomeId === toFoursomeId) {
      setDraggedPlayer(null);
      return;
    }

    // Update foursomes locally
    setFoursomes(prev => {
      const updated = prev.map(foursome => {
        if (foursome.foursomeId === fromFoursomeId) {
          // Remove player from source foursome
          return {
            ...foursome,
            players: foursome.players.filter(p => p.userId !== player.userId)
          };
        } else if (foursome.foursomeId === toFoursomeId) {
          // Add player to target foursome
          return {
            ...foursome,
            players: [...foursome.players, player]
          };
        }
        return foursome;
      });
      return updated;
    });

    setDraggedPlayer(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');

    try {
      // Format foursomes data for API
      const updatedFoursomes = foursomes.map(foursome => ({
        foursomeId: foursome.foursomeId,
        playerIds: foursome.players.map(p => p.userId)
      }));

      await ApiService.updateFoursomes(sessionId, updatedFoursomes);
      setSuccessMessage('Foursomes updated successfully!');

      // Navigate back to playgroup detail after a short delay
      setTimeout(() => {
        navigate(`/groupleader/playgroup/${session.playgroupId}`);
      }, 1500);
    } catch (err) {
      console.error('Error saving foursomes:', err);
      setError(err.message || 'Failed to save foursomes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleRegenerateFoursomes = async () => {
    if (!window.confirm('This will randomly regenerate all foursomes. Are you sure?')) {
      return;
    }

    setSaving(true);
    setError('');

    try {
      const response = await ApiService.regenerateFoursomes(sessionId);
      setFoursomes(response.foursomes || []);
      setSuccessMessage('Foursomes regenerated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error regenerating foursomes:', err);
      setError(err.message || 'Failed to regenerate foursomes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="session-container">
        <div className="loading">Loading session...</div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="session-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/groupleader')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="session-container">
      <div className="session-header">
        <button
          onClick={() => navigate(`/groupleader/playgroup/${session.playgroupId}`)}
          className="back-button"
        >
          ← Back to Playgroup
        </button>
        <div>
          <h1>Edit Foursomes</h1>
          <p className="session-details">
            {session?.courseName} · {session?.date} at {session?.time}
          </p>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      <div className="foursomes-actions">
        <button
          onClick={handleRegenerateFoursomes}
          className="button-secondary"
          disabled={saving}
        >
          🔄 Regenerate Random
        </button>
        <button
          onClick={handleSave}
          className="button-primary"
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div className="foursomes-grid">
        {foursomes.map((foursome, index) => (
          <div
            key={foursome.foursomeId}
            className="foursome-card"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(foursome.foursomeId)}
          >
            <div className="foursome-header">
              <h3>Foursome {index + 1}</h3>
              <span className="player-count">{foursome.players?.length || 0} players</span>
            </div>

            <div className="foursome-players">
              {foursome.players?.length === 0 ? (
                <div className="empty-foursome">No players assigned</div>
              ) : (
                foursome.players?.map((player) => (
                  <div
                    key={player.userId}
                    className="player-card"
                    draggable
                    onDragStart={() => handleDragStart(player, foursome.foursomeId)}
                  >
                    <div className="player-avatar">{player.name?.[0]?.toUpperCase() || player.email[0].toUpperCase()}</div>
                    <div className="player-details">
                      <div className="player-name">{player.name || player.email}</div>
                      <div className="player-email">{player.email}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="foursomes-instructions">
        <h4>How to rearrange players:</h4>
        <ul>
          <li>Drag and drop players between foursomes</li>
          <li>Click "Regenerate Random" to create new random groupings</li>
          <li>Click "Save Changes" when you're satisfied with the foursomes</li>
        </ul>
      </div>
    </div>
  );
};
