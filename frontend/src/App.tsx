import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import SuperAdminRoute from './components/SuperAdminRoute';
import Layout from './components/Layout';
// import backgroundImage from './assets/background.png';

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

function App() {
  // Production'da /admin base path'i kullan
  const basename = process.env.NODE_ENV === 'production' ? '/admin' : '';
  
  return (
    <AuthProvider>
      <Router basename={basename}>
        <div className="App" style={{
          backgroundImage: `url('/background.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
          width: '100%',
          position: 'relative'
        }}>
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
            
            <Route path="/company-identification" element={
              <ProtectedRoute>
                <SuperAdminRoute>
                  <Layout>
                    <CompanyIdentification />
                  </Layout>
                </SuperAdminRoute>
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
      </Router>
    </AuthProvider>
  );
}

export default App;
