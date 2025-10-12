import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  // Responsive kontrolü
  useEffect(() => {
    const mediaQuery = window.matchMedia('(max-width: 768px)');
    
    const checkIsMobile = () => {
      setIsMobile(mediaQuery.matches);
    };
    
    checkIsMobile();
    mediaQuery.addEventListener('change', checkIsMobile);
    window.addEventListener('resize', checkIsMobile);
    
    return () => {
      mediaQuery.removeEventListener('change', checkIsMobile);
      window.removeEventListener('resize', checkIsMobile);
    };
  }, []);

  useEffect(() => {
    // Enter tuşu ile giriş yapma
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleSubmit();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [email, password]);

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/admin');
      } else {
        setError('E-posta veya şifre hatalı');
      }
    } catch (error) {
      setError('Giriş yapılırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Background Image */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: 0.05
      }}>
      </div>

      {/* Login Container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '40px',
        width: '100%',
        maxWidth: '436px',
        padding: '20px'
      }}>
        {/* Logo */}
        <div style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '8px'
        }}>
          <img 
            src="/logo.png" 
            alt="Logo" 
            style={{ width: '272px', height: '56px' }}
          />
        </div>

        {/* Login Form */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          width: '100%'
        }}>
          <h1 style={{
            color: 'black',
            fontSize: '33px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 600,
            lineHeight: '43px',
            textAlign: 'center',
            margin: 0
          }}>
            Hoş Geldiniz
          </h1>
          <p style={{
            color: '#8A92A6',
            fontSize: '16px',
            fontFamily: 'Poppins, sans-serif',
            fontWeight: 400,
            lineHeight: '28px',
            textAlign: 'center',
            margin: 0
          }}>
            Devam etmek için lütfen giriş yapın
          </p>

          {/* Email Input */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: '8px',
            width: '100%'
          }}>
            <label htmlFor="email" style={{
              color: 'black',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              lineHeight: '20px'
            }}>
              E-posta
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '12px 16px',
                backgroundColor: 'white',
                border: '1px solid #E9ECEF',
                borderRadius: '8px',
                color: 'black',
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                lineHeight: '24px',
                outline: 'none'
              }}
              placeholder="E-posta adresinizi girin"
            />
          </div>

          {/* Password Input */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            alignItems: 'flex-start',
            gap: '8px',
            width: '100%'
          }}>
            <label htmlFor="password" style={{
              color: 'black',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              lineHeight: '20px'
            }}>
              Şifre
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: '100%',
                height: '48px',
                padding: '12px 16px',
                backgroundColor: 'white',
                border: '1px solid #E9ECEF',
                borderRadius: '8px',
                color: 'black',
                fontSize: '16px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                lineHeight: '24px',
                outline: 'none'
              }}
              placeholder="Şifrenizi girin"
            />
          </div>

          {/* Remember Me & Forgot Password */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <input
                type="checkbox"
                id="remember"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                style={{
                  width: '16px',
                  height: '16px',
                  accentColor: '#3B82F6'
                }}
              />
              <label htmlFor="remember" style={{
                color: 'black',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 400,
                lineHeight: '20px'
              }}>
                Beni Hatırla
              </label>
            </div>
            <a href="#" style={{
              color: '#8A92A6',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              lineHeight: '20px',
              textDecoration: 'none'
            }}>
              Şifremi Unuttum
            </a>
          </div>

          {/* Error Alert */}
          {error && (
            <div style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '8px',
              color: '#DC2626',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              lineHeight: '20px'
            }}>
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            style={{
              width: '100%',
              height: '48px',
              padding: '12px 16px',
              backgroundColor: isLoading ? '#9CA3AF' : '#3B82F6',
              color: 'white',
              fontSize: '16px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 500,
              lineHeight: '24px',
              borderRadius: '8px',
              border: 'none',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#2563EB';
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading) {
                e.currentTarget.style.backgroundColor = '#3B82F6';
              }
            }}
          >
            {isLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{
                  width: '20px',
                  height: '20px',
                  border: '2px solid white',
                  borderTop: '2px solid transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite',
                  marginRight: '8px'
                }}></div>
                Giriş yapılıyor...
              </div>
            ) : (
              'Giriş Yap'
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)'
      }}>
        <p style={{
          color: '#8A92A6',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          lineHeight: '20px',
          margin: 0
        }}>
          © 2024 Tüm Hakları Saklıdır
        </p>
      </div>

      {/* CSS Animation */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
