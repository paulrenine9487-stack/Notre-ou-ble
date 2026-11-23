import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  X,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, verifyMfa } = useAuth();

  // If passed from registration or redirect
  const registeredEmail = location.state?.registeredEmail || '';
  const infoMessage = location.state?.infoMessage || '';

  const [email, setEmail] = useState(registeredEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // MFA modal state (for Privileged Admin / Superadmin accounts)
  const [showMfaModal, setShowMfaModal] = useState(false);
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBackupCode, setMfaBackupCode] = useState('');
  const [showBackupInput, setShowBackupInput] = useState(false);
  const [mfaError, setMfaError] = useState('');
  const [isMfaLoading, setIsMfaLoading] = useState(false);
  const [secretCopied, setSecretCopied] = useState(false);

  // Forgot password modal state (3-Step OTP Verification Flow)
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [maskedEmail, setMaskedEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [forgotToken, setForgotToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [forgotStep, setForgotStep] = useState('request'); // 'request' | 'otp' | 'reset'
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [isForgotLoading, setIsForgotLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [resendCooldown]);

  const validate = () => {
    const errs = {};
    if (!email.trim()) {
      errs.email = 'Email ID is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Password is required.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsLoading(true);
    try {
      const response = await login({
        email: email.trim(),
        password
      });

      // If account requires Multi-Factor Authentication (ADMIN / SUPERADMIN)
      if (response && response.mfaRequired) {
        setMfaChallenge(response);
        setMfaCode('');
        setMfaBackupCode('');
        setShowBackupInput(false);
        setMfaError('');
        setShowMfaModal(true);
        return;
      }

      if (response && response.success) {
        // Redirect to dashboard (or admin portal if privileged)
        const isPrivileged = response.user?.role === 'ADMIN' || response.user?.role === 'SUPERADMIN';
        const destination = location.state?.from?.pathname || (isPrivileged ? '/ResonovaNotreoble' : '/dashboard');
        navigate(destination, { replace: true });
      }
    } catch (err) {
      if (err.data?.message) {
        setServerError(err.data.message);
      } else if (err.message) {
        setServerError(err.message);
      } else {
        setServerError('Invalid email or password. Please verify your credentials.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyMfaModal = async (e) => {
    e.preventDefault();
    setMfaError('');
    if (!mfaCode.trim() && !mfaBackupCode.trim()) {
      setMfaError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setIsMfaLoading(true);
      const res = await verifyMfa({
        mfaToken: mfaChallenge?.mfaToken || undefined,
        username: email?.trim() || undefined,
        code: mfaCode.trim() || undefined,
        backupCode: mfaBackupCode.trim() || undefined
      });

      if (res && res.success) {
        setShowMfaModal(false);
        const isPrivileged = res.user?.role === 'ADMIN' || res.user?.role === 'SUPERADMIN';
        const destination = location.state?.from?.pathname || (isPrivileged ? '/ResonovaNotreoble' : '/dashboard');
        navigate(destination, { replace: true });
      }
    } catch (err) {
      setMfaError(err.message || 'MFA verification failed. Please check the code and try again.');
    } finally {
      setIsMfaLoading(false);
    }
  };

  // Step 1: Request 6-digit OTP code to registered Gmail/email
  const handleRequestResetToken = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');

    if (!forgotEmail.trim()) {
      setForgotError('Please enter your registered email address.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await api.forgotPassword(forgotEmail.trim());
      setMaskedEmail(res.maskedEmail || forgotEmail.trim());
      setForgotMessage(res.message || 'A 6-digit verification code has been sent to your email.');
      setForgotStep('otp');
      setResendCooldown(45);
    } catch (err) {
      setForgotError(err.data?.message || err.message || 'Could not find an account with that email.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP code
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');

    const cleanOtp = otpCode.trim();
    if (!cleanOtp) {
      setForgotError('Please enter the 6-digit verification code.');
      return;
    }
    if (cleanOtp.length !== 6) {
      setForgotError('Verification code must be exactly 6 digits.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await api.verifyResetOtp({
        email: forgotEmail.trim(),
        otp: cleanOtp
      });
      setForgotToken(res.resetToken);
      setForgotMessage(res.message || 'Verification code confirmed! Now create your new password.');
      setForgotStep('reset');
    } catch (err) {
      setForgotError(err.data?.message || err.message || 'Invalid or expired verification code. Please check and try again.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Resend 6-digit OTP code
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isForgotLoading) return;
    setForgotError('');
    setForgotMessage('');
    setIsForgotLoading(true);
    try {
      const res = await api.resendResetOtp(forgotEmail.trim());
      setForgotMessage(res.message || 'A new verification code has been dispatched.');
      setResendCooldown(45);
    } catch (err) {
      setForgotError(err.data?.message || err.message || 'Failed to resend code.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  // Step 3: Complete password reset with new password
  const handleCompleteReset = async (e) => {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');

    if (!newPassword || newPassword.length < 6) {
      setForgotError('New password must be at least 6 characters.');
      return;
    }
    const hasLetter = /[a-zA-Z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);
    if (!hasLetter || !hasNumber) {
      setForgotError('Password must contain both letters and numbers.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setForgotError('Passwords do not match.');
      return;
    }

    setIsForgotLoading(true);
    try {
      const res = await api.resetPassword({
        token: forgotToken,
        newPassword,
        confirmPassword: confirmNewPassword
      });
      setForgotMessage(res.message || 'Password updated successfully! You can now log in.');
      setTimeout(() => {
        setShowForgotModal(false);
        setPassword('');
        setEmail(forgotEmail);
        setForgotStep('request');
        setOtpCode('');
        setNewPassword('');
        setConfirmNewPassword('');
      }, 1500);
    } catch (err) {
      setForgotError(err.data?.message || err.message || 'Failed to reset password.');
    } finally {
      setIsForgotLoading(false);
    }
  };

  return (
    <div className="auth-split-layout">
      {/* Left-side Hero Panel */}
      <div className="auth-hero-panel">
        {/* Ambient radial glow at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: '-40px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '380px',
            height: '240px',
            background: 'radial-gradient(ellipse at center, rgba(124, 58, 237, 0.28) 0%, rgba(99, 102, 241, 0.14) 40%, transparent 70%)',
            pointerEvents: 'none',
            filter: 'blur(30px)',
            zIndex: 0
          }}
        />

        {/* Top Brand Identity & Copy */}
        <div style={{ position: 'relative', zIndex: 1 }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '14px',
              textDecoration: 'none',
              marginBottom: '18px'
            }}
          >
            <img
              src="/IMG_7974.PNG"
              alt="No Tre(ou)ble Logo"
              style={{
                height: '52px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
            <img
              src="/NoTreble-Classicfinal.png"
              alt="No Tre(ou)ble"
              style={{
                height: '56px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </Link>

          <p
            style={{
              fontSize: '1.12rem',
              color: 'var(--dash-sidebar-text, #E2E8F0)',
              lineHeight: 1.55,
              fontWeight: 650,
              margin: 0,
              maxWidth: '350px'
            }}
          >
            Learn to use your voice with confidence, one module at a time.
          </p>
        </div>

        {/* Bottom Concentric Soundwave Rainbow Arches */}
        <div
          style={{
            position: 'relative',
            zIndex: 1,
            marginTop: 'auto',
            width: '100%',
            maxWidth: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'flex-end',
            lineHeight: 0,
            overflow: 'hidden'
          }}
        >
          <svg
            viewBox="0 0 440 210"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{
              width: '100%',
              maxWidth: '440px',
              height: 'auto',
              display: 'block',
              overflow: 'visible'
            }}
          >
            <defs>
              <linearGradient id="heroSoundwaveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#7001E6" />
                <stop offset="28%" stopColor="#5A2BF9" />
                <stop offset="65%" stopColor="#1D6EFD" />
                <stop offset="100%" stopColor="#00C4DA" />
              </linearGradient>
            </defs>
            {[
              { rx: 200, ry: 155, op: 0.85, width: 2.2 },
              { rx: 182, ry: 140, op: 0.78, width: 2.1 },
              { rx: 164, ry: 125, op: 0.70, width: 2.0 },
              { rx: 146, ry: 110, op: 0.62, width: 1.9 },
              { rx: 128, ry: 95, op: 0.54, width: 1.8 },
              { rx: 110, ry: 80, op: 0.46, width: 1.7 },
              { rx: 92, ry: 65, op: 0.38, width: 1.6 },
              { rx: 74, ry: 50, op: 0.30, width: 1.5 }
            ].map((arch, i) => (
              <path
                key={i}
                d={`M ${220 - arch.rx} 210 A ${arch.rx} ${arch.ry} 0 0 1 ${220 + arch.rx} 210`}
                stroke="url(#heroSoundwaveGrad)"
                strokeWidth={arch.width}
                strokeLinecap="round"
                strokeOpacity={arch.op}
              />
            ))}
          </svg>
        </div>
      </div>

      {/* Right-side Login Content Panel */}
      <div className="auth-form-panel">
        <div className="auth-card">
          {/* Title and Subtitle */}
          <div style={{ marginBottom: '24px' }}>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 800,
                color: '#191B35',
                fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
                lineHeight: 1.25,
                marginBottom: '6px'
              }}
            >
              Sign in to your account
            </h1>
            <p style={{ fontSize: '0.86rem', color: '#77728A', margin: 0 }}>
              Continue your journey towards better breathing and confident singing.
            </p>
          </div>

          {/* Info message (e.g. from registration redirect) */}
          {infoMessage && (
            <div style={{
              background: '#ecfdf5',
              border: '1px solid #15966A',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#15966A'
            }}>
              <CheckCircle2 size={18} style={{ color: '#15966A', flexShrink: 0 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{infoMessage}</div>
            </div>
          )}

          {/* Server Error Alert */}
          {serverError && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #DC4C64',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#DC4C64'
            }}>
              <AlertCircle size={18} style={{ color: '#DC4C64', flexShrink: 0 }} />
              <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{serverError}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Field 1: Email ID */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                  Email ID <span style={{ color: '#DC4C64' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    placeholder="Enter your registered email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((err) => ({ ...err, email: '' }));
                      setServerError('');
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '13px 18px 13px 44px',
                      borderRadius: '12px',
                      border: errors.email ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: '#191B35',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                    onBlur={(e) => !errors.email && (e.target.style.borderColor = '#EAE5F3')}
                  />
                  <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#7C3AED' }} />
                </div>
                {errors.email && (
                  <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.email}</p>
                )}
              </div>

              {/* Field 2: Password */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                  <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#191B35' }}>
                    Password <span style={{ color: '#DC4C64' }}>*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotModal(true);
                      setForgotEmail(email || '');
                      setForgotStep('request');
                      setForgotMessage('');
                      setForgotError('');
                      setOtpCode('');
                      setMaskedEmail('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    style={{
                      background: 'none',
                      color: '#7C3AED',
                      fontSize: '0.82rem',
                      fontWeight: 600,
                      border: 'none',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((err) => ({ ...err, password: '' }));
                      setServerError('');
                    }}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '13px 48px 13px 44px',
                      borderRadius: '12px',
                      border: errors.password ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: '#191B35',
                      outline: 'none'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                    onBlur={(e) => !errors.password && (e.target.style.borderColor = '#EAE5F3')}
                  />
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#7C3AED' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '14px',
                      background: 'none',
                      border: 'none',
                      color: '#77728A',
                      cursor: 'pointer'
                    }}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && (
                  <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.password}</p>
                )}
              </div>
            </div>

            {/* Login Button */}
            <div style={{ marginTop: '28px' }}>
              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary-gradient"
                style={{
                  width: '100%',
                  padding: '15px 24px',
                  fontSize: '1rem',
                  fontWeight: 700,
                  borderRadius: '9999px',
                  letterSpacing: '0.04em',
                  opacity: isLoading ? 0.75 : 1
                }}
              >
                {isLoading ? (
                  <span>Validating with MySQL...</span>
                ) : (
                  <>
                    <span>LOGIN</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>

          {/* New to No Tre(ou)ble? Create an Account */}
          <div style={{
            marginTop: '26px',
            textAlign: 'center',
            paddingTop: '20px',
            borderTop: '1px solid #f3effc'
          }}>
            <span style={{ color: '#77728A', fontSize: '0.92rem' }}>
              New to No Tre(ou)ble?{' '}
            </span>
            <Link
              to="/register"
              style={{
                color: '#7C3AED',
                fontWeight: 700,
                fontSize: '0.94rem',
                textDecoration: 'underline'
              }}
            >
              Create an Account
            </Link>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 100,
          background: 'rgba(23, 8, 43, 0.65)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#ffffff',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 25px 60px rgba(35, 8, 62, 0.25)',
            position: 'relative'
          }}>
            <button
              onClick={() => setShowForgotModal(false)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                background: '#f3effc',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6b21a8'
              }}
            >
              <X size={16} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
              <div style={{
                background: '#ede9fe',
                color: '#7C3AED',
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <KeyRound size={22} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.25rem', color: '#191B35', margin: 0, fontWeight: 800 }}>
                  Reset No Tre(ou)ble Password
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#77728A' }}>
                  Secure OTP Verification Flow
                </p>
              </div>
            </div>

            {/* 3-Step Flow Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F8F5FF',
              padding: '10px 16px',
              borderRadius: '12px',
              marginBottom: '18px',
              border: '1px solid #EAE5F3'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: forgotStep === 'request' ? '#7C3AED' : '#059669'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: forgotStep === 'request' ? '#7C3AED' : '#10B981',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem'
                }}>
                  {forgotStep === 'request' ? '1' : '✓'}
                </span>
                Email
              </div>

              <div style={{ flex: 1, height: '2px', background: forgotStep === 'request' ? '#E5E7EB' : '#10B981', margin: '0 8px' }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: forgotStep === 'otp' ? '#7C3AED' : forgotStep === 'reset' ? '#059669' : '#9CA3AF'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: forgotStep === 'otp' ? '#7C3AED' : forgotStep === 'reset' ? '#10B981' : '#E5E7EB',
                  color: forgotStep === 'request' ? '#6B7280' : '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem'
                }}>
                  {forgotStep === 'reset' ? '✓' : '2'}
                </span>
                Verify OTP
              </div>

              <div style={{ flex: 1, height: '2px', background: forgotStep === 'reset' ? '#10B981' : '#E5E7EB', margin: '0 8px' }} />

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: forgotStep === 'reset' ? '#7C3AED' : '#9CA3AF'
              }}>
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: forgotStep === 'reset' ? '#7C3AED' : '#E5E7EB',
                  color: forgotStep === 'reset' ? '#fff' : '#6B7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.72rem'
                }}>
                  3
                </span>
                New Password
              </div>
            </div>

            {forgotMessage && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #15966A',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.84rem',
                color: '#065f46',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{forgotMessage}</span>
              </div>
            )}

            {forgotError && (
              <div style={{
                background: '#fef2f2',
                border: '1px solid #DC4C64',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '0.84rem',
                color: '#991b1b',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px'
              }}>
                <AlertCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>{forgotError}</span>
              </div>
            )}

            {/* STEP 1: ENTER REGISTERED EMAIL */}
            {forgotStep === 'request' && (
              <form onSubmit={handleRequestResetToken}>
                <p style={{ color: '#555168', fontSize: '0.88rem', marginBottom: '16px', lineHeight: 1.5 }}>
                  Enter your registered No Tre(ou)ble email address. We will verify your account in MySQL and dispatch a 6-digit OTP code to your Gmail.
                </p>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                    Registered Email Address
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="email"
                      placeholder="e.g. paulrenine9487@gmail.com"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '12px 16px 12px 42px',
                        borderRadius: '10px',
                        border: '1.5px solid #EAE5F3',
                        fontSize: '0.92rem'
                      }}
                    />
                    <Mail
                      size={18}
                      style={{
                        position: 'absolute',
                        left: '14px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: '#9CA3AF'
                      }}
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="btn-primary-gradient"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem', borderRadius: '10px' }}
                >
                  {isForgotLoading ? 'Sending OTP Code...' : 'Send OTP Verification Code →'}
                </button>
              </form>
            )}

            {/* STEP 2: VERIFY 6-DIGIT OTP */}
            {forgotStep === 'otp' && (
              <form onSubmit={handleVerifyOtp}>
                <div style={{ textAlign: 'center', marginBottom: '18px' }}>
                  <p style={{ color: '#555168', fontSize: '0.88rem', margin: '0 0 6px 0' }}>
                    A 6-digit OTP code has been dispatched to:
                  </p>
                  <div style={{
                    display: 'inline-block',
                    background: '#F3E8FF',
                    color: '#6B21A8',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    padding: '5px 14px',
                    borderRadius: '8px',
                    border: '1px solid #E9D5FF'
                  }}>
                    {maskedEmail || forgotEmail}
                  </div>
                  <p style={{ color: '#77728A', fontSize: '0.78rem', margin: '8px 0 0 0' }}>
                    Please check your Gmail inbox and Spam folder. Valid for 10 minutes.
                  </p>
                </div>

                <div style={{ marginBottom: '20px' }}>
                  <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px', textAlign: 'center' }}>
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={6}
                    autoFocus
                    placeholder="••••••"
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{
                      width: '100%',
                      padding: '14px 16px',
                      borderRadius: '12px',
                      border: '2px solid #7C3AED',
                      fontSize: '1.8rem',
                      fontWeight: 800,
                      letterSpacing: '0.4em',
                      textAlign: 'center',
                      fontFamily: 'monospace',
                      color: '#1F2937',
                      outline: 'none',
                      boxShadow: '0 0 0 3px rgba(124, 58, 237, 0.12)'
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isForgotLoading || otpCode.trim().length !== 6}
                  className="btn-primary-gradient"
                  style={{
                    width: '100%',
                    padding: '12px',
                    fontSize: '0.96rem',
                    borderRadius: '10px',
                    opacity: (isForgotLoading || otpCode.trim().length !== 6) ? 0.65 : 1,
                    cursor: (isForgotLoading || otpCode.trim().length !== 6) ? 'not-allowed' : 'pointer'
                  }}
                >
                  {isForgotLoading ? 'Verifying Code...' : 'Verify OTP & Continue →'}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '16px', fontSize: '0.82rem' }}>
                  <button
                    type="button"
                    onClick={() => {
                      setForgotStep('request');
                      setForgotError('');
                      setForgotMessage('');
                    }}
                    style={{ background: 'none', border: 'none', color: '#6B7280', cursor: 'pointer', padding: 0 }}
                  >
                    ← Change email
                  </button>

                  <button
                    type="button"
                    disabled={resendCooldown > 0 || isForgotLoading}
                    onClick={handleResendOtp}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: resendCooldown > 0 ? '#9CA3AF' : '#7C3AED',
                      fontWeight: 700,
                      cursor: resendCooldown > 0 ? 'default' : 'pointer',
                      padding: 0
                    }}
                  >
                    {resendCooldown > 0 ? `Resend OTP in ${resendCooldown}s` : 'Resend Code'}
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: CREATE NEW PASSWORD */}
            {forgotStep === 'reset' && (
              <form onSubmit={handleCompleteReset}>
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: '10px',
                  padding: '8px 12px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#15803D',
                  fontSize: '0.82rem',
                  fontWeight: 600
                }}>
                  <ShieldCheck size={18} />
                  <span>OTP verified. You may now create your new password.</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showNewPassword ? 'text' : 'password'}
                        placeholder="Minimum 6 characters (letters & numbers)"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 42px 12px 16px',
                          borderRadius: '10px',
                          border: '1.5px solid #EAE5F3',
                          fontSize: '0.92rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#9CA3AF',
                          cursor: 'pointer'
                        }}
                      >
                        {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>
                      Confirm New Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Re-enter new password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px 42px 12px 16px',
                          borderRadius: '10px',
                          border: '1.5px solid #EAE5F3',
                          fontSize: '0.92rem'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          color: '#9CA3AF',
                          cursor: 'pointer'
                        }}
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isForgotLoading}
                  className="btn-primary-gradient"
                  style={{ width: '100%', padding: '12px', fontSize: '0.95rem', borderRadius: '10px' }}
                >
                  {isForgotLoading ? 'Updating Password...' : 'Save New Password'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* 2FA / MFA Modal for Privileged Administrators */}
      {showMfaModal && mfaChallenge && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(25, 27, 53, 0.65)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            position: 'relative'
          }}>
            <button
              type="button"
              onClick={() => {
                setShowMfaModal(false);
                setMfaChallenge(null);
                setMfaError('');
              }}
              style={{
                position: 'absolute',
                top: '20px',
                right: '20px',
                background: '#F3F4F6',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#6B7280'
              }}
            >
              <X size={18} />
            </button>

            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #201B45 0%, #4D518A 100%)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 14px',
                boxShadow: '0 6px 18px rgba(32, 27, 69, 0.25)'
              }}>
                <ShieldCheck size={28} />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: '1.25rem', fontWeight: 800, color: '#191B35' }}>
                Two-Factor Authentication
              </h3>
              <p style={{ margin: 0, fontSize: '0.86rem', color: '#6B7280', lineHeight: 1.45 }}>
                Enter your 6-digit authentication code to verify your identity and access the administration portal.
              </p>
            </div>

            {mfaError && (
              <div style={{
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                color: '#991B1B',
                fontSize: '0.84rem'
              }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{mfaError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyMfaModal}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }}>
                  6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  pattern="[0-9]*"
                  inputMode="numeric"
                  required
                  value={mfaCode}
                  onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  placeholder="000000"
                  autoFocus
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    border: '1.5px solid #EAE5F3',
                    fontSize: '1.4rem',
                    fontFamily: 'monospace',
                    fontWeight: 800,
                    letterSpacing: '0.25em',
                    textAlign: 'center',
                    color: '#191B35',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isMfaLoading}
                className="btn-primary-gradient"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '0.95rem',
                  borderRadius: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '14px'
                }}
              >
                <ShieldCheck size={18} />
                <span>{isMfaLoading ? 'Verifying...' : 'Verify & Continue'}</span>
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowMfaModal(false);
                    setMfaChallenge(null);
                    setMfaError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#6B7280',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: '4px 8px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

