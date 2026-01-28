import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';

const LoginPage: React.FC = () => {
  const { t, language, toggleLanguage } = useLanguage();
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
      setError(t('errors.fillAllFields'));
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (success) {
        navigate('/dashboard');
      }
    } catch (error: any) {
      // Rate limit hatası (429) veya diğer hatalar için backend'den gelen mesajı göster
      if (error?.response?.status === 429) {
        // Rate limit hatası - backend'den gelen mesajı kullan
        const rateLimitMessage = error?.response?.data?.message || t('errors.tooManyLoginAttempts');
        setError(rateLimitMessage);
      } else if (error?.response?.status === 401) {
        // Yetkilendirme hatası - email veya şifre hatalı
        setError(t('errors.invalidEmailPassword'));
      } else if (error?.response?.data?.message) {
        // Backend'den gelen diğer hata mesajları
        setError(error.response.data.message);
      } else {
        // Genel hata mesajı
        setError(t('errors.loginFailed'));
      }
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
      setError(t('errors.emailRequired'));
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
        setSuccessMessage(t('messages.resetCodeSent'));
        setForgotPasswordStep('code');
      } else {
        setError(result.message || t('errors.resetCodeSendFailed'));
      }
    } catch (error) {
      setError(t('errors.resetCodeSendFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!resetCode) {
      setError(t('errors.resetCodeRequired'));
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
        setSuccessMessage(t('messages.resetCodeVerified'));
        setForgotPasswordStep('reset');
      } else {
        setError(result.message || t('errors.resetCodeInvalid'));
      }
    } catch (error) {
      setError(t('errors.resetCodeVerifyFailed'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError(t('errors.fillAllFields'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t('errors.passwordMismatch'));
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
        setSuccessMessage(t('messages.passwordUpdated'));
        // Reset form
        setForgotPasswordStep('login');
        setEmail('');
        setPassword('');
        setResetCode('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setError(result.message || t('errors.passwordUpdateFailed'));
      }
    } catch (error) {
      setError(t('errors.passwordUpdateFailed'));
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

  const stepTitle = {
    login: t('login.welcome'),
    email: t('login.forgotPassword'),
    code: t('login.codeVerification'),
    reset: t('login.resetPassword')
  }[forgotPasswordStep];

  const stepSubtitle = {
    login: t('login.loginSubtitle'),
    email: t('login.emailSubtitle'),
    code: t('login.codeSubtitle'),
    reset: t('login.resetSubtitle')
  }[forgotPasswordStep];

  const stepLoadingText = {
    login: t('login.signingIn'),
    email: t('login.sendingCode'),
    code: t('login.verifyingCode'),
    reset: t('login.updatingPassword')
  }[forgotPasswordStep];

  const stepButtonText = {
    login: t('login.signIn'),
    email: t('login.sendCode'),
    code: t('login.verifyCode'),
    reset: t('login.updatePassword')
  }[forgotPasswordStep];

  const formatTemplate = (template: string, params: Record<string, string | number>) =>
    Object.entries(params).reduce(
      (text, [key, value]) => text.replace(new RegExp(`\\{${key}\\}`, 'g'), String(value)),
      template
    );

  const formatPasswordMinLength = (minLength: number) =>
    formatTemplate(t('password.requirements.minLength'), { count: minLength });

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
        message: formatPasswordMinLength(minLength)
      };
    }

    if (!hasUpperCase) {
      return {
        isValid: false,
        message: t('password.requirements.uppercase')
      };
    }

    if (!hasLowerCase) {
      return {
        isValid: false,
        message: t('password.requirements.lowercase')
      };
    }

    if (!hasNumbers) {
      return {
        isValid: false,
        message: t('password.requirements.number')
      };
    }

    if (!hasSymbols) {
      return {
        isValid: false,
        message: t('password.requirements.special')
      };
    }

    return {
      isValid: true,
      message: t('password.valid')
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
      <button
        type="button"
        onClick={toggleLanguage}
        title={language === 'tr' ? t('buttons.switchToEnglish') : t('buttons.switchToTurkish')}
        style={{
          position: 'absolute',
          top: '20px',
          right: '20px',
          border: '1px solid #E5E7EB',
          backgroundColor: '#F9FAFB',
          color: '#374151',
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer'
        }}
      >
        <i className="fa-solid fa-globe" />
      </button>

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
            {stepTitle}
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
            {stepSubtitle}
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
              {t('labels.email')}
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
              placeholder={t('placeholders.email')}
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
                {t('labels.password')}
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
                  placeholder={t('placeholders.password')}
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
                {t('labels.resetCode')}
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
                placeholder={t('placeholders.resetCode')}
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
                  {t('labels.newPassword')}
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
                    placeholder={t('placeholders.newPassword')}
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
                    {t('labels.passwordRequirements')}
                  </div>
                  <div style={{ lineHeight: '1.4' }}>
                    • En az 8 karakter<br/>
                    {t('password.requirements.uppercase')} (A-Z)<br/>
                    {t('password.requirements.lowercase')} (a-z)<br/>
                    {t('password.requirements.number')} (0-9)<br/>
                    {t('password.requirements.special')}
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
                  {t('labels.confirmPassword')}
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
                    placeholder={t('placeholders.confirmPassword')}
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
                  {t('labels.rememberMe')}
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
                {t('labels.forgotPassword')}
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
                {t('labels.backToLogin')}
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
                {stepLoadingText}
              </div>
            ) : (
              <>
                {stepButtonText}
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
          {t('labels.allRightsReserved')}
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
