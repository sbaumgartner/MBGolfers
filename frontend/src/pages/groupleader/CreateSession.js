/**
 * Create Session Screen
 * Form for group leaders to create a new golf session
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import './Playgroup.css';

export const CreateSession = () => {
  const { playgroupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playgroup, setPlaygroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '08:00',
    courseName: ''
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlaygroupData();
  }, [playgroupId]);

  const loadPlaygroupData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load playgroup details
      const playgroupData = await ApiService.getPlaygroups(playgroupId);
      setPlaygroup(playgroupData);

      // Load members
      const membersData = await ApiService.getPlaygroupMembers(playgroupId);
      setMembers(membersData.members || []);

      // Pre-select all members by default
      setSelectedPlayers(membersData.members?.map(m => m.userId) || []);
    } catch (err) {
      console.error('Error loading playgroup:', err);
      setError(err.message || 'Failed to load playgroup data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePlayer = (userId) => {
    setSelectedPlayers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate minimum players
    if (selectedPlayers.length < 4) {
      setError('You need at least 4 players to create a session');
      return;
    }

    setSubmitting(true);

    try {
      const response = await ApiService.createSession(
        playgroupId,
        formData.date,
        formData.time,
        formData.courseName,
        selectedPlayers
      );

      // Navigate to the session detail/foursome edit page
      navigate(`/groupleader/session/${response.sessionId}/foursomes`);
    } catch (err) {
      console.error('Error creating session:', err);
      setError(err.message || 'Failed to create session. Please try again.');
      setSubmitting(false);
    }
  };

  // Get today's date in YYYY-MM-DD format for min date
  const today = new Date().toISOString().split('T')[0];

  if (loading) {
    return (
      <div className="playgroup-container">
        <div className="loading">Loading...</div>
      </div>
    );
  }

  if (error && !playgroup) {
    return (
      <div className="playgroup-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate(`/groupleader/playgroup/${playgroupId}`)}>
          Back to Playgroup
        </button>
      </div>
    );
  }

  return (
    <div className="playgroup-container">
      <div className="playgroup-header">
        <button
          onClick={() => navigate(`/groupleader/playgroup/${playgroupId}`)}
          className="back-button"
        >
          ← Back to {playgroup?.name}
        </button>
        <h1>Create New Session</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="playgroup-form">
        <div className="form-group">
          <label htmlFor="courseName">Golf Course *</label>
          <input
            type="text"
            id="courseName"
            name="courseName"
            value={formData.courseName}
            onChange={handleChange}
            placeholder="e.g., Pebble Beach Golf Links"
            required
            maxLength={200}
          />
        </div>

        <div className="form-group">
          <label htmlFor="date">Date *</label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            min={today}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="time">Tee Time *</label>
          <input
            type="time"
            id="time"
            name="time"
            value={formData.time}
            onChange={handleChange}
            required
          />
        </div>

        <div className="form-group">
          <label>Select Players ({selectedPlayers.length} selected)</label>
          {members.length === 0 ? (
            <div className="info-message">
              No members in this playgroup. Add members first.
            </div>
          ) : (
            <div className="player-selection">
              {members.map((member) => (
                <div
                  key={member.userId}
                  className={`player-item ${selectedPlayers.includes(member.userId) ? 'selected' : ''}`}
                  onClick={() => togglePlayer(member.userId)}
                >
                  <input
                    type="checkbox"
                    checked={selectedPlayers.includes(member.userId)}
                    onChange={() => togglePlayer(member.userId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="player-info">
                    <div className="player-name">{member.name || member.email}</div>
                    <div className="player-email">{member.email}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {selectedPlayers.length < 4 && selectedPlayers.length > 0 && (
            <small style={{ color: '#e74c3c', marginTop: '8px', display: 'block' }}>
              You need at least 4 players (currently {selectedPlayers.length} selected)
            </small>
          )}
        </div>

        <div className="form-info">
          <p>After creating the session:</p>
          <ul>
            <li>Players will be automatically organized into foursomes</li>
            <li>You can edit the foursomes before the session</li>
            <li>Players can enter their scores during the session</li>
          </ul>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate(`/groupleader/playgroup/${playgroupId}`)}
            className="button-secondary"
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button-primary"
            disabled={submitting || selectedPlayers.length < 4 || !formData.courseName.trim() || !formData.date}
          >
            {submitting ? 'Creating...' : 'Create Session'}
          </button>
        </div>
      </form>
    </div>
  );
};
