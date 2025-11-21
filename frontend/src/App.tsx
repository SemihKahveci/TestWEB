import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import Layout from './components/Layout';

// Pages
import LoginPage from './pages/LoginPage';
import AdminPanel from './pages/AdminPanel';
import AuthorizationPage from './pages/AuthorizationPage';
import GameManagement from './pages/GameManagement';
import CompetencySettings from './pages/CompetencySettings';
import Organization from './pages/Organization';
import Grouping from './pages/Grouping';
import GameSendPage from './pages/GameSendPage';
import ResultsPage from './pages/ResultsPage';
import CompanyIdentification from './pages/CompanyIdentification';
import DefineCompanyAdmin from './pages/DefineCompanyAdmin';
import SubscriptionSettings from './pages/SubscriptionSettings';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login';

  const appStyle: React.CSSProperties = {
    minHeight: '100vh',
    width: '100%',
    position: 'relative',
    ...(isLoginPage
      ? {
          backgroundImage: `url('/background.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed'
        }
      : {
          backgroundColor: '#f3f4f6'
        })
  };

  return (
    <div className="App" style={appStyle}>
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
            <SuperAdminRoute>
              <Layout>
                <GameManagement />
              </Layout>
            </SuperAdminRoute>
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
            
        <Route path="/game-send" element={
          <ProtectedRoute>
            <Layout>
              <GameSendPage />
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
            
            <Route path="/define-company-admin" element={
              <ProtectedRoute>
                <SuperAdminRoute>
                  <Layout>
                    <DefineCompanyAdmin />
                  </Layout>
                </SuperAdminRoute>
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
            
      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  );
}

export default App;
