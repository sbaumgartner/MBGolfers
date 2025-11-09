/**
 * Admin User Management
 * Full user management interface for administrators
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import { EditUserRoleModal } from '../../components/EditUserRoleModal';
import './UserManagement.css';

export const UserManagement = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await ApiService.getUsers();
      setUsers(response.users || []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    // Apply search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        u =>
          u.email.toLowerCase().includes(term) ||
          (u.name && u.name.toLowerCase().includes(term))
      );
    }

    // Apply role filter
    if (roleFilter) {
      filtered = filtered.filter(u => u.role === roleFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleEditRole = (user) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleRoleUpdated = async () => {
    setShowEditModal(false);
    setSelectedUser(null);
    await loadUsers(); // Reload users to get updated data
  };

  const getRoleCount = (role) => {
    return users.filter(u => u.role === role).length;
  };

  return (
    <div className="user-management-container">
      <div className="management-header">
        <div>
          <button onClick={() => navigate('/admin')} className="back-button">
            ← Back to Dashboard
          </button>
          <h1>User Management</h1>
        </div>
        <button onClick={signOut} className="sign-out-button">
          Sign Out
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-row">
        <div className="stat-card total">
          <div className="stat-value">{users.length}</div>
          <div className="stat-label">Total Users</div>
        </div>
        <div className="stat-card players">
          <div className="stat-value">{getRoleCount('Player')}</div>
          <div className="stat-label">Players</div>
        </div>
        <div className="stat-card leaders">
          <div className="stat-value">{getRoleCount('GroupLeader')}</div>
          <div className="stat-label">Group Leaders</div>
        </div>
        <div className="stat-card admins">
          <div className="stat-value">{getRoleCount('Admin')}</div>
          <div className="stat-label">Admins</div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="role-filter"
        >
          <option value="">All Roles</option>
          <option value="Player">Player</option>
          <option value="GroupLeader">GroupLeader</option>
          <option value="Admin">Admin</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="users-section">
        <div className="section-header">
          <h3>Users ({filteredUsers.length})</h3>
        </div>

        {loading ? (
          <div className="loading">Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div className="empty-state">
            <p>No users found matching your criteria.</p>
          </div>
        ) : (
          <div className="users-table">
            <div className="table-header">
              <div className="col-name">Name</div>
              <div className="col-email">Email</div>
              <div className="col-role">Role</div>
              <div className="col-created">Created</div>
              <div className="col-actions">Actions</div>
            </div>
            {filteredUsers.map((u) => (
              <div key={u.userId} className="table-row">
                <div className="col-name">
                  {u.name || <span className="no-name">No name set</span>}
                </div>
                <div className="col-email">{u.email}</div>
                <div className="col-role">
                  <span className={`role-badge ${u.role?.toLowerCase()}`}>
                    {u.role}
                  </span>
                </div>
                <div className="col-created">
                  {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                </div>
                <div className="col-actions">
                  <button
                    onClick={() => handleEditRole(u)}
                    className="edit-button"
                    disabled={u.userId === user.userId}
                    title={u.userId === user.userId ? "Can't edit your own role" : 'Edit user role'}
                  >
                    Edit Role
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Role Modal */}
      {showEditModal && selectedUser && (
        <EditUserRoleModal
          user={selectedUser}
          onClose={() => {
            setShowEditModal(false);
            setSelectedUser(null);
          }}
          onSave={handleRoleUpdated}
        />
      )}
    </div>
  );
};
