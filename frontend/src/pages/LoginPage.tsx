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
  
  // Şifremi Unuttum states
  const [forgotPasswordStep, setForgotPasswordStep] = useState<'login' | 'email' | 'code' | 'reset'>('login');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
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

  // Şifremi Unuttum fonksiyonları
  const handleForgotPassword = () => {
    setForgotPasswordStep('email');
    setError('');
    setSuccessMessage('');
  };

  const handleSendResetCode = async () => {
    if (!email) {
      setError('Lütfen e-posta adresinizi girin');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Şifre sıfırlama kodu e-posta adresinize gönderildi');
        setForgotPasswordStep('code');
      } else {
        setError(result.message || 'Kod gönderilirken bir hata oluştu');
      }
    } catch (error) {
      setError('Kod gönderilirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode) {
      setError('Lütfen doğrulama kodunu girin');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: resetCode }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Kod doğrulandı. Yeni şifrenizi belirleyin');
        setForgotPasswordStep('reset');
      } else {
        setError(result.message || 'Doğrulama kodu hatalı');
      }
    } catch (error) {
      setError('Kod doğrulanırken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    // Şifre kriterleri kontrolü
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      setError(passwordValidation.message);
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, code: resetCode, newPassword }),
      });

      const result = await response.json();

      if (result.success) {
        setSuccessMessage('Şifreniz başarıyla güncellendi. Giriş yapabilirsiniz');
        // Reset form
        setForgotPasswordStep('login');
        setEmail('');
        setPassword('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message || 'Şifre güncellenirken bir hata oluştu');
      }
    } catch (error) {
      setError('Şifre güncellenirken bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    setForgotPasswordStep('login');
    setError('');
    setSuccessMessage('');
    setResetCode('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Şifre validasyon fonksiyonu
  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSymbols = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

    if (password.length < minLength) {
      return {
        isValid: false,
        message: `Şifre en az ${minLength} karakter olmalıdır`
      };
    }

    if (!hasUpperCase) {
      return {
        isValid: false,
        message: 'Şifre en az 1 büyük harf içermelidir'
      };
    }

    if (!hasLowerCase) {
      return {
        isValid: false,
        message: 'Şifre en az 1 küçük harf içermelidir'
      };
    }

    if (!hasNumbers) {
      return {
        isValid: false,
        message: 'Şifre en az 1 sayı içermelidir'
      };
    }

    if (!hasSymbols) {
      return {
        isValid: false,
        message: 'Şifre en az 1 özel karakter (!@#$%^&* vb.) içermelidir'
      };
    }

    return {
      isValid: true,
      message: 'Şifre geçerli'
    };
  };

  return (
    <div style={{
      minHeight: '100vh',
      height: isMobile ? '100vh' : 'auto',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'Inter, sans-serif',
      width: '100%',
      padding: isMobile ? '20px' : '0'
    }}>

      {/* Login Container */}
      <div style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        gap: isMobile ? '24px' : '40px',
        width: '100%',
        maxWidth: '436px',
        padding: isMobile ? '16px' : '20px',
        marginTop: isMobile ? 'auto' : '0',
        marginBottom: isMobile ? 'auto' : '0'
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
            style={{ 
              width: isMobile ? '240px' : '272px', 
              height: isMobile ? '50px' : '56px',
              maxWidth: '100%'
            }}
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
            {forgotPasswordStep === 'login' && 'Hoş Geldiniz'}
            {forgotPasswordStep === 'email' && 'Şifremi Unuttum'}
            {forgotPasswordStep === 'code' && 'Kod Doğrulama'}
            {forgotPasswordStep === 'reset' && 'Şifre Belirleme'}
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
            {forgotPasswordStep === 'login' && 'Devam etmek için lütfen giriş yapın'}
            {forgotPasswordStep === 'email' && 'E-posta adresinizi girin, size şifre sıfırlama kodu gönderelim'}
            {forgotPasswordStep === 'code' && 'E-posta adresinize gönderilen doğrulama kodunu girin'}
            {forgotPasswordStep === 'reset' && 'Yeni şifrenizi belirleyin'}
          </p>

          {/* Email Input - Her aşamada göster */}
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
              disabled={forgotPasswordStep === 'code' || forgotPasswordStep === 'reset'}
              style={{
                width: '100%',
                height: '48px',
                padding: '12px 16px',
                backgroundColor: (forgotPasswordStep === 'code' || forgotPasswordStep === 'reset') ? '#F9FAFB' : 'white',
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

          {/* Password Input - Sadece login aşamasında göster */}
          {forgotPasswordStep === 'login' && (
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
              <div style={{ position: 'relative', width: '100%' }}>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    height: '48px',
                    padding: '12px 50px 12px 16px',
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
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '16px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    color: '#6B7280',
                    fontSize: '18px',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <i className={`fas fa-eye${showPassword ? '-slash' : ''}`}></i>
                </button>
              </div>
            </div>
          )}

          {/* Reset Code Input - Sadece code aşamasında göster */}
          {forgotPasswordStep === 'code' && (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'flex-start',
              alignItems: 'flex-start',
              gap: '8px',
              width: '100%'
            }}>
              <label htmlFor="resetCode" style={{
                color: 'black',
                fontSize: '14px',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 500,
                lineHeight: '20px'
              }}>
                Doğrulama Kodu
              </label>
              <input
                id="resetCode"
                type="text"
                value={resetCode}
                onChange={(e) => setResetCode(e.target.value)}
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
                placeholder="6 haneli doğrulama kodunu girin"
                maxLength={6}
              />
            </div>
          )}

          {/* New Password Input - Sadece reset aşamasında göster */}
          {forgotPasswordStep === 'reset' && (
            <>
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: '8px',
                width: '100%'
              }}>
                <label htmlFor="newPassword" style={{
                  color: 'black',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  lineHeight: '20px'
                }}>
                  Yeni Şifre
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    id="newPassword"
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '12px 50px 12px 16px',
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
                    placeholder="Yeni şifrenizi girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6B7280',
                      fontSize: '18px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className={`fas fa-eye${showNewPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
                {/* Şifre Kriterleri */}
                <div style={{
                  marginTop: '8px',
                  padding: '12px',
                  backgroundColor: '#F8F9FA',
                  border: '1px solid #E9ECEF',
                  borderRadius: '6px',
                  fontSize: '12px',
                  color: '#6B7280',
                  fontFamily: 'Inter, sans-serif'
                }}>
                  <div style={{ fontWeight: 600, marginBottom: '6px', color: '#374151' }}>
                    Şifre Kriterleri:
                  </div>
                  <div style={{ lineHeight: '1.4' }}>
                    • En az 8 karakter<br/>
                    • En az 1 büyük harf (A-Z)<br/>
                    • En az 1 küçük harf (a-z)<br/>
                    • En az 1 sayı (0-9)<br/>
                    • En az 1 özel karakter (!@#$%^&* vb.)
                  </div>
                </div>
              </div>

              <div style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
                gap: '8px',
                width: '100%'
              }}>
                <label htmlFor="confirmPassword" style={{
                  color: 'black',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 500,
                  lineHeight: '20px'
                }}>
                  Şifre Tekrar
                </label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    style={{
                      width: '100%',
                      height: '48px',
                      padding: '12px 50px 12px 16px',
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
                    placeholder="Şifrenizi tekrar girin"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#6B7280',
                      fontSize: '18px',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <i className={`fas fa-eye${showConfirmPassword ? '-slash' : ''}`}></i>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* Remember Me & Forgot Password - Sadece login aşamasında göster */}
          {forgotPasswordStep === 'login' && (
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
              <button 
                onClick={handleForgotPassword}
                style={{
                  color: '#8A92A6',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  lineHeight: '20px',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0
                }}
              >
                Şifremi Unuttum
              </button>
            </div>
          )}

          {/* Back to Login Button - Şifremi unuttum aşamalarında göster */}
          {forgotPasswordStep !== 'login' && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'center',
              width: '100%'
            }}>
              <button 
                onClick={handleBackToLogin}
                style={{
                  color: '#8A92A6',
                  fontSize: '14px',
                  fontFamily: 'Inter, sans-serif',
                  fontWeight: 400,
                  lineHeight: '20px',
                  textDecoration: 'none',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                ← Giriş sayfasına dön
              </button>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #86EFAC',
              borderRadius: '8px',
              color: '#166534',
              fontSize: '14px',
              fontFamily: 'Inter, sans-serif',
              fontWeight: 400,
              lineHeight: '20px'
            }}>
              {successMessage}
            </div>
          )}

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

          {/* Dynamic Button */}
          <button
            onClick={
              forgotPasswordStep === 'login' ? handleSubmit :
              forgotPasswordStep === 'email' ? handleSendResetCode :
              forgotPasswordStep === 'code' ? handleVerifyCode :
              handleResetPassword
            }
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
                {forgotPasswordStep === 'login' && 'Giriş yapılıyor...'}
                {forgotPasswordStep === 'email' && 'Kod gönderiliyor...'}
                {forgotPasswordStep === 'code' && 'Kod doğrulanıyor...'}
                {forgotPasswordStep === 'reset' && 'Şifre güncelleniyor...'}
              </div>
            ) : (
              <>
                {forgotPasswordStep === 'login' && 'Giriş Yap'}
                {forgotPasswordStep === 'email' && 'Kod Gönder'}
                {forgotPasswordStep === 'code' && 'Kodu Doğrula'}
                {forgotPasswordStep === 'reset' && 'Şifreyi Güncelle'}
              </>
            )}
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        position: isMobile ? 'relative' : 'absolute',
        bottom: isMobile ? '0' : '20px',
        left: isMobile ? 'auto' : '50%',
        transform: isMobile ? 'none' : 'translateX(-50%)',
        marginTop: isMobile ? 'auto' : '0',
        padding: isMobile ? '16px' : '0'
      }}>
        <p style={{
          color: '#8A92A6',
          fontSize: '14px',
          fontFamily: 'Inter, sans-serif',
          fontWeight: 400,
          lineHeight: '20px',
          margin: 0
        }}>
          © 2025 Tüm Hakları Saklıdır
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
