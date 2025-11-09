/**
 * Player Dashboard
 * Main screen for players
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';

export const PlayerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState([]);
  const [playgroups, setPlaygroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, [user?.userId]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');

    try {
      // Load all sessions (will be filtered by backend to show only user's sessions)
      const sessionsData = await ApiService.getSessions();
      setSessions(sessionsData.sessions || []);

      // Load playgroups the user is a member of
      const playgroupsData = await ApiService.getPlaygroups();
      setPlaygroups(playgroupsData.playgroups || []);
    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Player Dashboard</h1>
        <button onClick={signOut} style={{  padding: '10px 20px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Welcome, {user?.email}!</h2>
        <p>Role: <strong>{user?.role}</strong></p>
      </div>

      {error && (
        <div style={{ marginTop: '20px', padding: '15px', background: '#fee', color: '#c33', borderRadius: '8px' }}>
          {error}
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h3>My Playgroups ({playgroups.length})</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            Loading...
          </div>
        ) : playgroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px' }}>
            <p style={{ color: '#7f8c8d' }}>You are not a member of any playgroups yet.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
            {playgroups.map((playgroup) => (
              <div
                key={playgroup.playgroupId}
                style={{
                  padding: '20px',
                  background: 'white',
                  border: '1px solid #ecf0f1',
                  borderRadius: '8px'
                }}
              >
                <h4 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{playgroup.name}</h4>
                {playgroup.description && (
                  <p style={{ color: '#7f8c8d', margin: '0' }}>{playgroup.description}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Upcoming Sessions ({sessions.length})</h3>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            Loading...
          </div>
        ) : sessions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px' }}>
            <p style={{ color: '#7f8c8d' }}>No upcoming sessions scheduled.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                style={{
                  padding: '20px',
                  background: 'white',
                  border: '1px solid #ecf0f1',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <h4 style={{ margin: '0 0 8px 0', color: '#2c3e50' }}>{session.courseName}</h4>
                  <p style={{ color: '#7f8c8d', margin: '0 0 5px 0' }}>
                    {session.date} at {session.time}
                  </p>
                  <p style={{ color: '#555', margin: '0', fontSize: '14px' }}>
                    {session.playerCount} players · {session.foursomeCount} foursomes
                  </p>
                </div>
                <button
                  onClick={() => navigate(`/player/session/${session.sessionId}/scorecard`)}
                  style={{
                    padding: '10px 20px',
                    background: '#3498db',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: '600'
                  }}
                >
                  Enter Scores
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
