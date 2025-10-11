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
import GameManagement from './pages/GameManagement';
import CompetencySettings from './pages/CompetencySettings';
import Organization from './pages/Organization';
import Grouping from './pages/Grouping';
import ResultsPage from './pages/ResultsPage';
import CompanyIdentification from './pages/CompanyIdentification';
import DefineCompanyAdmin from './pages/DefineCompanyAdmin';
import SubscriptionSettings from './pages/SubscriptionSettings';
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
              <Organization />
            </Layout>
          </ProtectedRoute>
        } />
            
            <Route path="/competency-settings" element={
              <ProtectedRoute>
                <Layout>
                  <CompetencySettings />
                </Layout>
              </ProtectedRoute>
            } />
            
        <Route path="/game-management" element={
          <ProtectedRoute>
            <Layout>
              <GameManagement />
            </Layout>
          </ProtectedRoute>
        } />
        <Route path="/competency-settings" element={
          <ProtectedRoute>
            <Layout>
              <CompetencySettings />
            </Layout>
          </ProtectedRoute>
        } />
            
        <Route path="/grouping" element={
          <ProtectedRoute>
            <Layout>
              <Grouping />
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
                  <CompanyIdentification />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/define-company-admin" element={
              <ProtectedRoute>
                <Layout>
                  <DefineCompanyAdmin />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/subscription-settings" element={
              <ProtectedRoute>
                <Layout>
                  <SubscriptionSettings />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/company-identification" element={
              <ProtectedRoute>
                <Layout>
                  <CompanyIdentification />
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
