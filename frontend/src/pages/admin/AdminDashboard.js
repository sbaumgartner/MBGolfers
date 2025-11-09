/**
 * Admin Dashboard
 * User management for administrators
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';

export const AdminDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlaygroups: 0,
    totalSessions: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      // Load statistics
      const [usersData, playgroupsData, sessionsData] = await Promise.all([
        ApiService.getUsers().catch(() => ({ users: [] })),
        ApiService.getPlaygroups().catch(() => ({ playgroups: [] })),
        ApiService.getSessions().catch(() => ({ sessions: [] }))
      ]);

      setStats({
        totalUsers: usersData.users?.length || 0,
        totalPlaygroups: playgroupsData.playgroups?.length || 0,
        totalSessions: sessionsData.sessions?.length || 0
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={signOut} style={{ padding: '10px 20px', cursor: 'pointer' }}>
          Sign Out
        </button>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', background: '#f5f5f5', borderRadius: '8px' }}>
        <h2>Welcome, {user?.email}!</h2>
        <p>Role: <strong>{user?.role}</strong></p>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>System Overview</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginTop: '15px' }}>
          <div style={{ padding: '25px', background: '#e3f2fd', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>Total Users</h4>
            <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#1565c0' }}>
              {loading ? '...' : stats.totalUsers}
            </p>
          </div>
          <div style={{ padding: '25px', background: '#e8f5e9', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>Playgroups</h4>
            <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#2e7d32' }}>
              {loading ? '...' : stats.totalPlaygroups}
            </p>
          </div>
          <div style={{ padding: '25px', background: '#fff3e0', borderRadius: '8px', textAlign: 'center' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>Sessions</h4>
            <p style={{ fontSize: '36px', fontWeight: 'bold', margin: 0, color: '#ef6c00' }}>
              {loading ? '...' : stats.totalSessions}
            </p>
          </div>
        </div>
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>Quick Actions</h3>
        <div style={{ display: 'grid', gap: '15px', marginTop: '15px' }}>
          <button
            onClick={() => navigate('/admin/users')}
            style={{
              padding: '20px',
              background: 'white',
              border: '2px solid #3498db',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#3498db';
              e.currentTarget.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'white';
              e.currentTarget.style.color = 'inherit';
            }}
          >
            <h4 style={{ margin: '0 0 8px 0' }}>Manage Users</h4>
            <p style={{ margin: 0, fontSize: '14px', opacity: 0.8 }}>
              View and manage all users, edit roles and permissions
            </p>
          </button>
        </div>
      </div>
    </div>
  );
};
