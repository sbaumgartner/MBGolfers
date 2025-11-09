/**
 * Create Playgroup Screen
 * Form for group leaders to create a new playgroup
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import ApiService from '../../services/api';
import './Playgroup.css';

export const CreatePlaygroup = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await ApiService.createPlaygroup(
        formData.name,
        formData.description
      );

      // Navigate to the playgroup detail page
      navigate(`/groupleader/playgroup/${response.playgroupId}`);
    } catch (err) {
      console.error('Error creating playgroup:', err);
      setError(err.message || 'Failed to create playgroup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="playgroup-container">
      <div className="playgroup-header">
        <button onClick={() => navigate('/groupleader')} className="back-button">
          ← Back to Dashboard
        </button>
        <h1>Create New Playgroup</h1>
      </div>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="playgroup-form">
        <div className="form-group">
          <label htmlFor="name">Playgroup Name *</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Sunday Morning Regulars"
            required
            maxLength={100}
          />
        </div>

        <div className="form-group">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Optional description of your playgroup..."
            rows={4}
            maxLength={500}
          />
          <small>{formData.description.length}/500 characters</small>
        </div>

        <div className="form-info">
          <p>After creating your playgroup, you can:</p>
          <ul>
            <li>Add members to the group</li>
            <li>Create golf sessions</li>
            <li>Manage foursomes and scoring</li>
          </ul>
        </div>

        <div className="form-actions">
          <button
            type="button"
            onClick={() => navigate('/groupleader')}
            className="button-secondary"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="button-primary"
            disabled={loading || !formData.name.trim()}
          >
            {loading ? 'Creating...' : 'Create Playgroup'}
          </button>
        </div>
      </form>
    </div>
  );
};
