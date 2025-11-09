/**
 * Auth Context
 * Manages authentication state across the application
 */

import React, { createContext, useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if user is already signed in
  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const currentUser = await Auth.currentAuthenticatedUser();
      const attributes = await Auth.userAttributes(currentUser);

      const userInfo = {
        username: currentUser.username,
        email: attributes.find(attr => attr.Name === 'email')?.Value,
        role: attributes.find(attr => attr.Name === 'custom:role')?.Value || 'Player',
        userId: currentUser.attributes.sub
      };

      setUser(userInfo);
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email, password, name) => {
    try {
      setLoading(true);
      setError(null);

      const { user } = await Auth.signUp({
        username: email,
        password,
        attributes: {
          email,
          name
        }
      });

      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email, password) => {
    try {
      setLoading(true);
      setError(null);

      const user = await Auth.signIn(email, password);
      await checkUser();

      return user;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await Auth.signOut();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const confirmSignUp = async (email, code) => {
    try {
      await Auth.confirmSignUp(email, code);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const value = {
    user,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    confirmSignUp,
    checkUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
