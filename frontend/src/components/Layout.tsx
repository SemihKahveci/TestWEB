import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/admin', label: 'Genel Takip Sistemi', icon: '🏠' },
    { path: '/results', label: 'Kişi Sonuçları Sayfası', icon: '📈' },
    { path: '/authorization', label: 'Yetkilendirme', icon: '👥' },
    { path: '/organization', label: 'Organizasyon', icon: '🏢' },
    { path: '/competency-settings', label: 'Yetkinlik Ayarları', icon: '⚙️' },
    { path: '/game-management', label: 'Oyun Yönetimi', icon: '🎮' },
    { path: '/grouping', label: 'Gruplama', icon: '📊' },
    { path: '/company-identification', label: 'Şirket Tanımlama', icon: '🏭' },
    { path: '/define-company-admin', label: 'Şirket Admin Tanımla', icon: '👤' },
    { path: '/subscription-settings', label: 'Abonelik Ayarları', icon: '💳' },
    { path: '/admin-management', label: 'Admin Yönetimi', icon: '🔧' },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div style={{
      fontFamily: 'Inter, sans-serif',
      background: '#F8F9FA',
      minHeight: '100vh',
      display: 'flex'
    }}>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 40
          }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: '256px',
        backgroundColor: 'white',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
        zIndex: 50,
        transform: 'translateX(0)',
        transition: 'transform 0.3s ease-in-out'
      }}>
        {/* Logo */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '64px',
          padding: '0 24px',
          borderBottom: '1px solid #E9ECEF'
        }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <img 
              src="/logo.png" 
              alt="Logo" 
              style={{ 
                height: '40px', 
                width: 'auto',
                maxWidth: '100%',
                objectFit: 'contain'
              }} 
            />
          </div>
        </div>

        {/* Navigation */}
        <nav style={{ marginTop: '24px' }}>
          {menuItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                color: isActive(item.path) ? '#3B82F6' : '#6B7280',
                backgroundColor: isActive(item.path) ? '#EFF6FF' : 'transparent',
                borderRight: isActive(item.path) ? '3px solid #3B82F6' : '3px solid transparent',
                textDecoration: 'none',
                transition: 'all 0.2s',
                fontFamily: 'Inter'
              }}
              onMouseEnter={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = '#F9FAFB';
                  e.currentTarget.style.color = '#374151';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive(item.path)) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#6B7280';
                }
              }}
              onClick={() => setSidebarOpen(false)}
            >
              <span style={{ marginRight: '12px', fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>

        {/* User info and logout */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          padding: '24px',
          borderTop: '1px solid #E9ECEF',
          backgroundColor: 'white'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              backgroundColor: '#3B82F6',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <span style={{
                color: 'white',
                fontSize: '14px',
                fontWeight: 500,
                fontFamily: 'Inter'
              }}>
                {user?.name?.charAt(0).toUpperCase() || 'A'}
              </span>
            </div>
            <div style={{ marginLeft: '12px' }}>
              <p style={{
                fontSize: '14px',
                fontWeight: 500,
                color: '#111827',
                margin: 0,
                fontFamily: 'Inter'
              }}>
                {user?.name || 'Admin'}
              </p>
              <p style={{
                fontSize: '12px',
                color: '#6B7280',
                margin: 0,
                fontFamily: 'Inter'
              }}>
                {user?.role || 'admin'}
              </p>
            </div>
          </div>
          <button
            onClick={logout}
            style={{
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              fontSize: '14px',
              color: '#6B7280',
              background: 'none',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontFamily: 'Inter',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F9FAFB';
              e.currentTarget.style.color = '#374151';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#6B7280';
            }}
          >
            Çıkış Yap
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{
        marginLeft: '256px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh'
      }}>
    
        {/* Page content */}
        <main style={{ flex: 1, padding: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
