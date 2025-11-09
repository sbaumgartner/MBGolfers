/**
 * Edit User Role Modal
 * Modal for administrators to change a user's role
 */

import React, { useState } from 'react';
import ApiService from '../services/api';
import './Modal.css';

export const EditUserRoleModal = ({ user, onClose, onSave }) => {
  const [selectedRole, setSelectedRole] = useState(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const roles = [
    { value: 'Player', label: 'Player', description: 'Can view playgroups and enter scores' },
    { value: 'GroupLeader', label: 'Group Leader', description: 'Can create and manage playgroups' },
    { value: 'Admin', label: 'Admin', description: 'Full access to manage users and system' }
  ];

  const handleSave = async () => {
    if (selectedRole === user.role) {
      onClose();
      return;
    }

    setSaving(true);
    setError('');

    try {
      await ApiService.updateUserRole(user.userId, selectedRole);
      onSave();
    } catch (err) {
      console.error('Error updating user role:', err);
      setError(err.message || 'Failed to update user role. Please try again.');
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Edit User Role</h2>
          <button onClick={onClose} className="modal-close">×</button>
        </div>

        <div className="modal-body">
          <div className="user-info-display">
            <div className="info-row">
              <span className="info-label">Name:</span>
              <span className="info-value">{user.name || 'No name set'}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{user.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Current Role:</span>
              <span className={`role-badge ${user.role?.toLowerCase()}`}>
                {user.role}
              </span>
            </div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <div className="role-selection">
            <h3>Select New Role:</h3>
            {roles.map((role) => (
              <div
                key={role.value}
                className={`role-option ${selectedRole === role.value ? 'selected' : ''}`}
                onClick={() => setSelectedRole(role.value)}
              >
                <input
                  type="radio"
                  name="role"
                  value={role.value}
                  checked={selectedRole === role.value}
                  onChange={() => setSelectedRole(role.value)}
                  className="role-radio"
                />
                <div className="role-details">
                  <div className="role-name">{role.label}</div>
                  <div className="role-description">{role.description}</div>
                </div>
              </div>
            ))}
          </div>

          {selectedRole !== user.role && (
            <div className="warning-message">
              <strong>Warning:</strong> Changing this user's role will immediately affect their access and permissions.
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button onClick={onClose} className="button-secondary" disabled={saving}>
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="button-primary"
            disabled={saving || selectedRole === user.role}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
