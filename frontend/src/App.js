/**
 * Main Application Component
 * Handles routing and Amplify configuration
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Amplify } from 'aws-amplify';
import awsconfig from './aws-exports';
import { AuthProvider } from './contexts/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

// Auth Pages
import { SignUp } from './pages/auth/SignUp';
import { Login } from './pages/auth/Login';

// Role-based Dashboards
import { PlayerDashboard } from './pages/player/PlayerDashboard';
import { Scorecard } from './pages/player/Scorecard';
import { GroupLeaderDashboard } from './pages/groupleader/GroupLeaderDashboard';
import { CreatePlaygroup } from './pages/groupleader/CreatePlaygroup';
import { PlaygroupDetail } from './pages/groupleader/PlaygroupDetail';
import { CreateSession } from './pages/groupleader/CreateSession';
import { EditFoursomes } from './pages/groupleader/EditFoursomes';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { SessionSummary } from './pages/shared/SessionSummary';

import './App.css';

// Configure Amplify
Amplify.configure(awsconfig);

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="App">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/signup" element={<SignUp />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Player */}
            <Route
              path="/player"
              element={
                <PrivateRoute>
                  <PlayerDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/player/session/:sessionId/scorecard"
              element={
                <PrivateRoute>
                  <Scorecard />
                </PrivateRoute>
              }
            />
            <Route
              path="/player/session/:sessionId/summary"
              element={
                <PrivateRoute>
                  <SessionSummary />
                </PrivateRoute>
              }
            />

            {/* Protected Routes - GroupLeader */}
            <Route
              path="/groupleader"
              element={
                <PrivateRoute requiredRole="GroupLeader">
                  <GroupLeaderDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/groupleader/create-playgroup"
              element={
                <PrivateRoute requiredRole="GroupLeader">
                  <CreatePlaygroup />
                </PrivateRoute>
              }
            />
            <Route
              path="/groupleader/playgroup/:playgroupId"
              element={
                <PrivateRoute requiredRole="GroupLeader">
                  <PlaygroupDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/groupleader/playgroup/:playgroupId/create-session"
              element={
                <PrivateRoute requiredRole="GroupLeader">
                  <CreateSession />
                </PrivateRoute>
              }
            />
            <Route
              path="/groupleader/session/:sessionId/foursomes"
              element={
                <PrivateRoute requiredRole="GroupLeader">
                  <EditFoursomes />
                </PrivateRoute>
              }
            />
            <Route
              path="/groupleader/session/:sessionId/summary"
              element={
                <PrivateRoute requiredRole="GroupLeader">
                  <SessionSummary />
                </PrivateRoute>
              }
            />

            {/* Protected Routes - Admin */}
            <Route
              path="/admin"
              element={
                <PrivateRoute requiredRole="Admin">
                  <AdminDashboard />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <PrivateRoute requiredRole="Admin">
                  <UserManagement />
                </PrivateRoute>
              }
            />

            {/* Catch all - redirect to login */}
            <Route path="*" element={<Navigate to="/login" />} />
          </Routes>
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
