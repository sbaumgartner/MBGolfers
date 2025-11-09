/**
 * Sign Up Page
 * User registration screen
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import './Auth.css';

export const SignUp = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const { signUp, confirmSignUp } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    try {
      await signUp(email, password, name);
      setMessage('Sign up successful! Please check your email for verification code.');
      setNeedsConfirmation(true);
    } catch (err) {
      setError(err.message || 'Failed to sign up');
    }
  };

  const handleConfirmation = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await confirmSignUp(email, confirmationCode);
      setMessage('Email verified! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message || 'Failed to verify email');
    }
  };

  if (needsConfirmation) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Verify Email</h1>
          <p>Please enter the verification code sent to {email}</p>

          {error && <div className="error-message">{error}</div>}
          {message && <div className="success-message">{message}</div>}

          <form onSubmit={handleConfirmation}>
            <div className="form-group">
              <label htmlFor="code">Verification Code</label>
              <input
                type="text"
                id="code"
                value={confirmationCode}
                onChange={(e) => setConfirmationCode(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn-primary">
              Verify Email
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Sign Up</h1>
        <p>Create your Golf Playgroups account</p>

        {error && <div className="error-message">{error}</div>}
        {message && <div className="success-message">{message}</div>}

        <form onSubmit={handleSignUp}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <small>Minimum 8 characters</small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary">
            Sign Up
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <a href="/login">Log in</a>
        </div>
      </div>
    </div>
  );
};
