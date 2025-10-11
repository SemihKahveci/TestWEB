import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import AuthorizationPage from './pages/AuthorizationPage';
import OrganizationPage from './pages/OrganizationPage';
import CompetencySettingsPage from './pages/CompetencySettingsPage';
import GameManagementPage from './pages/GameManagementPage';
import GroupingPage from './pages/GroupingPage';
import ResultsPage from './pages/ResultsPage';
import CompanyIdentificationPage from './pages/CompanyIdentificationPage';
import DefineCompanyAdminPage from './pages/DefineCompanyAdminPage';
import SubscriptionSettingsPage from './pages/SubscriptionSettingsPage';
import AdminManagementPage from './pages/AdminManagementPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected routes */}
            <Route path="/admin" element={
              <ProtectedRoute>
                <Layout>
                  <AdminPanel />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/authorization" element={
              <ProtectedRoute>
                <Layout>
                  <AuthorizationPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/organization" element={
              <ProtectedRoute>
                <Layout>
                  <OrganizationPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/competency-settings" element={
              <ProtectedRoute>
                <Layout>
                  <CompetencySettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/game-management" element={
              <ProtectedRoute>
                <Layout>
                  <GameManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/grouping" element={
              <ProtectedRoute>
                <Layout>
                  <GroupingPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/results" element={
              <ProtectedRoute>
                <Layout>
                  <ResultsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/company-identification" element={
              <ProtectedRoute>
                <Layout>
                  <CompanyIdentificationPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/define-company-admin" element={
              <ProtectedRoute>
                <Layout>
                  <DefineCompanyAdminPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/subscription-settings" element={
              <ProtectedRoute>
                <Layout>
                  <SubscriptionSettingsPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin-management" element={
              <ProtectedRoute>
                <Layout>
                  <AdminManagementPage />
                </Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
