/**
 * GroupLeader Dashboard
 * Main screen for group leaders
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';

export const GroupLeaderDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [playgroups, setPlaygroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadPlaygroups();
  }, []);

  const loadPlaygroups = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ApiService.getPlaygroups();
      // Filter to show only playgroups led by this user
      const myPlaygroups = response.playgroups?.filter(
        pg => pg.leaderId === user?.userId
      ) || [];
      setPlaygroups(myPlaygroups);
    } catch (err) {
      console.error('Error loading playgroups:', err);
      setError(err.message || 'Failed to load playgroups');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>GroupLeader Dashboard</h1>
        <button onClick={signOut} style={{ padding: '10px 20px', cursor: 'pointer' }}>
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h3>My Playgroups ({playgroups.length})</h3>
          <button
            onClick={() => navigate('/groupleader/create-playgroup')}
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
            + Create New Playgroup
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', color: '#7f8c8d' }}>
            Loading playgroups...
          </div>
        ) : playgroups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px', background: 'white', borderRadius: '8px' }}>
            <p style={{ color: '#7f8c8d', marginBottom: '20px' }}>
              You haven't created any playgroups yet.
            </p>
            <button
              onClick={() => navigate('/groupleader/create-playgroup')}
              style={{
                padding: '10px 20px',
                background: '#3498db',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Create Your First Playgroup
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {playgroups.map((playgroup) => (
              <div
                key={playgroup.playgroupId}
                onClick={() => navigate(`/groupleader/playgroup/${playgroup.playgroupId}`)}
                style={{
                  padding: '20px',
                  background: 'white',
                  border: '1px solid #ecf0f1',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.1)';
                  e.currentTarget.style.borderColor = '#3498db';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                  e.currentTarget.style.borderColor = '#ecf0f1';
                }}
              >
                <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>{playgroup.name}</h3>
                {playgroup.description && (
                  <p style={{ color: '#7f8c8d', margin: '0 0 10px 0' }}>{playgroup.description}</p>
                )}
                <div style={{ display: 'flex', gap: '20px', fontSize: '14px', color: '#555' }}>
                  <span>{playgroup.memberCount || 0} members</span>
                  <span>{playgroup.sessionCount || 0} sessions</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
          <button
            onClick={() => navigate('/groupleader/create-playgroup')}
            style={{ padding: '10px 20px', cursor: 'pointer' }}
          >
            Create Playgroup
          </button>
          <button
            style={{ padding: '10px 20px', cursor: 'pointer' }}
            disabled
            title="Select a playgroup first"
          >
            Create Session
          </button>
        </div>
      </div>
    </div>
  );
};
