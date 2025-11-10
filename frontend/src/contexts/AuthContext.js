/**
 * Auth Context
 * Manages authentication state across the application
 */

import React, { createContext, useState, useEffect } from 'react';
import { signUp as amplifySignUp, signIn as amplifySignIn, signOut as amplifySignOut, confirmSignUp as amplifyConfirmSignUp, fetchAuthSession, fetchUserAttributes, getCurrentUser } from 'aws-amplify/auth';

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
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();

      const userInfo = {
        username: currentUser.username,
        email: attributes.email,
        role: attributes['custom:role'] || 'Player',
        userId: attributes.sub
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

      const { userId } = await amplifySignUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            name
          }
        }
      });

      return { userId };
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

      const { isSignedIn } = await amplifySignIn({
        username: email,
        password
      });
      
      if (isSignedIn) {
        await checkUser();
      }

      return { isSignedIn };
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      await amplifySignOut();
      setUser(null);
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const confirmSignUp = async (email, code) => {
    try {
      await amplifyConfirmSignUp({
        username: email,
        confirmationCode: code
      });
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
