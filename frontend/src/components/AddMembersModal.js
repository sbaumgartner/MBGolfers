/**
 * Add Members Modal
 * Search and select users to add to a playgroup
 */

import React, { useState, useEffect } from 'react';
import ApiService from '../services/api';
import './Modal.css';

export const AddMembersModal = ({ playgroupId, currentMembers, onClose, onAdd }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    // Filter users based on search term
    if (searchTerm.trim()) {
      const filtered = allUsers.filter(user =>
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(allUsers);
    }
  }, [searchTerm, allUsers]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');

    try {
      // Get all users from the system
      const response = await ApiService.getUsers();

      // Filter out users who are already members
      const currentMemberIds = currentMembers.map(m => m.userId);
      const availableUsers = response.users.filter(
        user => !currentMemberIds.includes(user.userId)
      );

      setAllUsers(availableUsers);
      setFilteredUsers(availableUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleAdd = () => {
    if (selectedUsers.length === 0) {
      return;
    }
    onAdd(selectedUsers);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Add Members</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          {error && <div className="error-message">{error}</div>}

          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {loading ? (
            <div className="loading">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="empty-state">
              {searchTerm ? 'No users found matching your search' : 'No available users to add'}
            </div>
          ) : (
            <div className="users-list">
              {filteredUsers.map((user) => (
                <div
                  key={user.userId}
                  className={`user-item ${selectedUsers.includes(user.userId) ? 'selected' : ''}`}
                  onClick={() => toggleUserSelection(user.userId)}
                >
                  <div className="user-info">
                    <div className="user-name">{user.name || user.email}</div>
                    <div className="user-email">{user.email}</div>
                  </div>
                  <div className="user-role">{user.role}</div>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.userId)}
                    onChange={() => toggleUserSelection(user.userId)}
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              ))}
            </div>
          )}

          {selectedUsers.length > 0 && (
            <div className="selection-info">
              {selectedUsers.length} user{selectedUsers.length !== 1 ? 's' : ''} selected
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button-secondary">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            className="button-primary"
            disabled={selectedUsers.length === 0}
          >
            Add {selectedUsers.length > 0 && `(${selectedUsers.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};
