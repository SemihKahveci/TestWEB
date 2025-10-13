import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [companySettingsExpanded, setCompanySettingsExpanded] = useState(false);

  // Responsive kontrolü - zoom değişimlerini de algılar
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const checkIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };
    
    // İlk kontrol
    checkIsMobile();
    
    // Media query değişimlerini dinle
    mediaQuery.addEventListener('change', checkIsMobile);
    
    // Fallback olarak resize event'i de dinle
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      mediaQuery.removeEventListener('change', checkIsMobile);
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  // Super admin kontrolü
  useEffect(() => {
    const checkSuperAdmin = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/check-superadmin', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        setIsSuperAdmin(data.isSuperAdmin || false);
      } catch (error) {
        console.error('Rol kontrolü hatası:', error);
        setIsSuperAdmin(false);
      }
    };

    checkSuperAdmin();
  }, []);

  const mainMenuItems = [
    { path: '/admin', label: 'Genel Takip Sistemi', icon: '🏠' },
    { path: '/results', label: 'Kişi Skorları Sayfası', icon: '📈' },
    { path: '/game-send', label: 'Oyun Gönder', icon: '📤' },
    { path: '/subscription-settings', label: 'Oyun Kullanım Özeti', icon: '💳' },
  ];

  const companySettingsItems = [
    { path: '/company-identification', label: 'Firma Tanımlama', icon: '🏭', superAdminOnly: true },
    { path: '/define-company-admin', label: 'Firma Admini Tanımlama', icon: '👤', superAdminOnly: true },
    { path: '/game-management', label: 'Oyun Tanımlama', icon: '🎮', superAdminOnly: true },
  ].filter(item => isSuperAdmin || !item.superAdminOnly);

  const otherSettingsItems = [
    { path: '/organization', label: 'Organizasyon', icon: '🏢' },
    { path: '/competency-settings', label: 'Yetkinlik Ayarları', icon: '⚙️' },
  ];

  const isActive = (path: string) => {
    if (path === '/organization') {
      return location.pathname === '/organization' || 
             location.pathname === '/grouping' || 
             location.pathname === '/authorization';
    }
    return location.pathname === path;
  };

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
        transform: !isMobile ? 'translateX(0)' : (sidebarOpen ? 'translateX(0)' : 'translateX(-100%)'),
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
          {/* Ana Menü */}
          <div style={{ marginBottom: '20px' }}>
            <div style={{
              padding: '0 24px',
              color: '#8A92A6',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'Inter'
            }}>
              Ana Menü
            </div>
            {mainMenuItems.map((item) => (
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
          </div>

          {/* Ayarlar */}
          <div>
            <div style={{
              padding: '0 24px',
              color: '#8A92A6',
              fontSize: '12px',
              fontWeight: 600,
              textTransform: 'uppercase',
              marginBottom: '8px',
              fontFamily: 'Inter'
            }}>
              Ayarlar
            </div>
            
            {/* Firma Ayarları - Expandable */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 500,
                color: '#6B7280',
                backgroundColor: 'transparent',
                cursor: 'pointer',
                transition: 'all 0.2s',
                fontFamily: 'Inter'
              }}
              onClick={() => setCompanySettingsExpanded(!companySettingsExpanded)}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#F9FAFB';
                e.currentTarget.style.color = '#374151';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#6B7280';
              }}
            >
              <span style={{ marginRight: '12px', fontSize: '16px' }}>🏢</span>
              <span style={{ flex: 1 }}>Firma Ayarları</span>
              <span style={{ 
                fontSize: '12px', 
                transform: companySettingsExpanded ? 'rotate(45deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s'
              }}>+</span>
            </div>

            {/* Firma Ayarları Submenu */}
            {companySettingsExpanded && (
              <div style={{
                backgroundColor: '#F8F9FA',
                borderLeft: '3px solid #3B82F6'
              }}>
                {companySettingsItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px 24px 10px 48px',
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
                        e.currentTarget.style.backgroundColor = '#E9ECEF';
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
              </div>
            )}

            {/* Diğer Ayarlar */}
            {otherSettingsItems.map((item) => (
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
          </div>
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
        marginLeft: !isMobile ? '256px' : '0',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        transition: 'margin-left 0.3s ease'
      }}>
        {/* Mobile header with hamburger menu */}
        {isMobile && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            padding: '16px',
            backgroundColor: 'white',
            borderBottom: '1px solid #E5E7EB',
            position: 'sticky',
            top: 0,
            zIndex: 30
          }}>
            <button
              onClick={() => setSidebarOpen(true)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '8px',
                borderRadius: '6px',
                color: '#374151',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              ☰
            </button>
            <h1 style={{
              margin: 0,
              marginLeft: '16px',
              fontSize: '18px',
              fontWeight: 600,
              color: '#111827',
              fontFamily: 'Inter'
            }}>
              Admin Panel
            </h1>
          </div>
        )}
    
        {/* Page content */}
        <main style={{ flex: 1, padding: 0 }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
