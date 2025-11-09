/**
 * Playgroup Detail Screen
 * View and manage a specific playgroup
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import { AddMembersModal } from '../../components/AddMembersModal';
import './Playgroup.css';

export const PlaygroupDetail = () => {
  const { playgroupId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [playgroup, setPlaygroup] = useState(null);
  const [members, setMembers] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddMembers, setShowAddMembers] = useState(false);

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

      // Load sessions
      const sessionsData = await ApiService.getSessions(playgroupId);
      setSessions(sessionsData.sessions || []);
    } catch (err) {
      console.error('Error loading playgroup:', err);
      setError(err.message || 'Failed to load playgroup data');
    } finally {
      setLoading(false);
    }
  };

  const handleAddMembers = async (userIds) => {
    try {
      await ApiService.addPlaygroupMembers(playgroupId, userIds);
      await loadPlaygroupData(); // Reload to show new members
      setShowAddMembers(false);
    } catch (err) {
      console.error('Error adding members:', err);
      setError(err.message || 'Failed to add members');
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      await ApiService.removePlaygroupMember(playgroupId, userId);
      await loadPlaygroupData(); // Reload to update members list
    } catch (err) {
      console.error('Error removing member:', err);
      setError(err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="playgroup-container">
        <div className="loading">Loading playgroup...</div>
      </div>
    );
  }

  if (error && !playgroup) {
    return (
      <div className="playgroup-container">
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/groupleader')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div className="playgroup-container">
      <div className="playgroup-header">
        <button onClick={() => navigate('/groupleader')} className="back-button">
          ← Back to Dashboard
        </button>
        <div>
          <h1>{playgroup?.name}</h1>
          {playgroup?.description && (
            <p className="playgroup-description">{playgroup.description}</p>
          )}
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Members Section */}
      <div className="section">
        <div className="section-header">
          <h2>Members ({members.length})</h2>
          <button
            onClick={() => setShowAddMembers(true)}
            className="button-primary"
          >
            + Add Members
          </button>
        </div>

        {members.length === 0 ? (
          <div className="empty-state">
            <p>No members yet. Add members to get started!</p>
          </div>
        ) : (
          <div className="members-list">
            {members.map((member) => (
              <div key={member.userId} className="member-card">
                <div className="member-info">
                  <h3>{member.name || member.email}</h3>
                  <p className="member-email">{member.email}</p>
                  <span className={`role-badge ${member.role?.toLowerCase()}`}>
                    {member.role}
                  </span>
                </div>
                <button
                  onClick={() => handleRemoveMember(member.userId)}
                  className="button-danger-outline"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sessions Section */}
      <div className="section">
        <div className="section-header">
          <h2>Golf Sessions ({sessions.length})</h2>
          <button
            onClick={() => navigate(`/groupleader/playgroup/${playgroupId}/create-session`)}
            className="button-primary"
            disabled={members.length < 4}
            title={members.length < 4 ? 'Need at least 4 members to create a session' : ''}
          >
            + Create Session
          </button>
        </div>

        {members.length < 4 && (
          <div className="info-message">
            You need at least 4 members to create a golf session.
          </div>
        )}

        {sessions.length === 0 ? (
          <div className="empty-state">
            <p>No sessions scheduled yet.</p>
          </div>
        ) : (
          <div className="sessions-list">
            {sessions.map((session) => (
              <div
                key={session.sessionId}
                className="session-card"
                onClick={() => navigate(`/groupleader/session/${session.sessionId}`)}
              >
                <div className="session-info">
                  <h3>{session.courseName}</h3>
                  <p className="session-date">
                    {session.date} at {session.time}
                  </p>
                  <p className="session-players">
                    {session.playerCount} players · {session.foursomeCount} foursomes
                  </p>
                </div>
                <div className={`session-status ${session.status?.toLowerCase()}`}>
                  {session.status || 'Scheduled'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Members Modal */}
      {showAddMembers && (
        <AddMembersModal
          playgroupId={playgroupId}
          currentMembers={members}
          onClose={() => setShowAddMembers(false)}
          onAdd={handleAddMembers}
        />
      )}
    </div>
  );
};
