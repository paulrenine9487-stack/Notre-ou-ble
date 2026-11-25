import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Music,
  UserCheck,
  Lock,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  RefreshCw,
  KeyRound
} from 'lucide-react';

const MUSIC_OPTIONS = [
  'Carnatic Music',
  'Hindustani Music',
  'Western Classical',
  'Western Pop',
  'Light Music',
  'Playback Singing',
  'Gospel Music',
  'Other'
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, selectedGoal, setSelectedGoal } = useAuth();

  // Step state: 'form' (registration inputs) | 'otp' (email verification)
  const [step, setStep] = useState('form');

  // Registration Form State (Phone Number completely removed)
  const [formData, setFormData] = useState({
    full_name: '',
    gender: '',
    email: '',
    types_of_music: [],
    vocal_trainer_name: '',
    password: '',
    confirm_password: ''
  });

  // Password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form error state
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [conflictField, setConflictField] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // OTP Verification State
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [otpError, setOtpError] = useState('');
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendSuccessNotice, setResendSuccessNotice] = useState('');

  // Handle location state (e.g. from login redirect for unverified email)
  useEffect(() => {
    if (location.state?.step === 'otp' && location.state?.email) {
      setOtpEmail(location.state.email);
      setStep('otp');
      setResendCooldown(30);
    }
  }, [location.state]);

  // Resend OTP Countdown Timer
  useEffect(() => {
    let timer;
    if (resendCooldown > 0) {
      timer = setInterval(() => {
        setResendCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Toggle music option chip
  const toggleMusicType = (type) => {
    setFormData((prev) => {
      const exists = prev.types_of_music.includes(type);
      const updated = exists
        ? prev.types_of_music.filter((item) => item !== type)
        : [...prev.types_of_music, type];

      if (errors.types_of_music && updated.length > 0) {
        setErrors((e) => ({ ...e, types_of_music: '' }));
      }
      return { ...prev, types_of_music: updated };
    });
  };

  // Field validation rules
  const validateField = (name, value, allValues = formData) => {
    switch (name) {
      case 'full_name': {
        if (!value || !value.trim()) {
          return 'Full Name is required.';
        }
        const trimmed = value.trim();
        if (trimmed.length < 3) {
          return 'Full Name must contain at least 3 characters.';
        }
        if (trimmed.length > 50) {
          return 'Full Name cannot exceed 50 characters.';
        }
        if (/\d/.test(trimmed)) {
          return 'Full Name cannot contain numbers.';
        }
        // Unicode-aware regex allowing letters from all scripts, spaces, hyphens and apostrophes
        if (!/^[\p{L}\s'\-]+$/u.test(trimmed)) {
          return 'Please enter a valid full name.';
        }
        return '';
      }

      case 'gender': {
        if (!value || !String(value).trim()) {
          return 'Please select your gender.';
        }
        return '';
      }

      case 'email': {
        if (!value || !value.trim()) {
          return 'Email ID is required.';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) {
          return 'Please enter a valid email address.';
        }
        return '';
      }

      case 'types_of_music': {
        if (!value || value.length === 0) {
          return 'Please select at least one type of music.';
        }
        return '';
      }

      case 'password': {
        if (!value) {
          return 'Password is required.';
        }
        if (value.length < 8) {
          return 'Password must contain at least 8 characters.';
        }
        if (!/[A-Z]/.test(value)) {
          return 'Include at least one uppercase letter.';
        }
        if (!/[a-z]/.test(value)) {
          return 'Include at least one lowercase letter.';
        }
        if (!/[0-9]/.test(value)) {
          return 'Include at least one number.';
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(value)) {
          return 'Include at least one special character.';
        }
        return '';
      }

      case 'confirm_password': {
        if (!value) {
          return 'Confirm password is required.';
        }
        if (value !== allValues.password) {
          return 'Passwords do not match.';
        }
        return '';
      }

      default:
        return '';
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);

    // Validate current field
    const fieldError = validateField(name, value, updatedForm);
    setErrors((prev) => ({ ...prev, [name]: fieldError }));

    // Revalidate confirm_password if original password changed
    if (name === 'password' && formData.confirm_password) {
      const confirmError = validateField('confirm_password', formData.confirm_password, updatedForm);
      setErrors((prev) => ({ ...prev, confirm_password: confirmError }));
    }

    setServerError('');
  };

  // Full form validation before submit
  const validate = () => {
    const errs = {
      full_name: validateField('full_name', formData.full_name),
      gender: validateField('gender', formData.gender),
      email: validateField('email', formData.email),
      types_of_music: validateField('types_of_music', formData.types_of_music),
      password: validateField('password', formData.password),
      confirm_password: validateField('confirm_password', formData.confirm_password, formData)
    };

    const cleanErrors = {};
    for (const [k, v] of Object.entries(errs)) {
      if (v) cleanErrors[k] = v;
    }

    setErrors(cleanErrors);
    return Object.keys(cleanErrors).length === 0;
  };

  // Check if form is valid and ready for submission
  const isFormValid =
    formData.full_name.trim().length >= 3 &&
    Boolean(formData.gender) &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim()) &&
    formData.types_of_music.length > 0 &&
    formData.password.length >= 8 &&
    /[A-Z]/.test(formData.password) &&
    /[a-z]/.test(formData.password) &&
    /[0-9]/.test(formData.password) &&
    /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(formData.password) &&
    formData.password === formData.confirm_password;

  // Handle Form Registration Submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validate()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        full_name: formData.full_name.trim(),
        username: formData.full_name.trim(), // backwards-compatible alias
        gender: formData.gender,
        email: formData.email.trim(),
        types_of_music: formData.types_of_music,
        vocal_trainer_name: formData.vocal_trainer_name.trim() || null,
        password: formData.password,
        confirm_password: formData.confirm_password,
        selected_musical_goal: selectedGoal || null
      });

      if (response && response.success) {
        setOtpEmail(formData.email.trim().toLowerCase());
        setOtpCode('');
        setOtpError('');
        setResendCooldown(30);
        setStep('otp');
        window.scrollTo({ top: 100, behavior: 'smooth' });
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Registration failed. Please verify your details and try again.';
      setServerError(msg);

      if (err.status === 409 || err.data?.conflictField || /already registered|already exists/i.test(msg)) {
        setConflictField('email');
        setErrors((prev) => ({ ...prev, email: 'This email address is already registered. Please log in.' }));
      }
      window.scrollTo({ top: 140, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle OTP Verification Submission
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    const cleanOtp = otpCode.trim();

    if (!cleanOtp) {
      setOtpError('Please enter the 6-digit verification code.');
      return;
    }
    if (!/^\d{6}$/.test(cleanOtp)) {
      setOtpError('Verification code must be exactly 6 digits.');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await api.verifyEmailOtp({
        email: otpEmail,
        otp: cleanOtp
      });

      if (res && res.success) {
        setSuccessMessage('Email verified successfully! Your account is now active. Redirecting to Login...');
        setTimeout(() => {
          navigate('/login', {
            state: {
              registeredEmail: otpEmail,
              email: otpEmail,
              infoMessage: 'Email verified successfully! Please log in with your credentials.'
            }
          });
        }, 1600);
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Invalid or expired verification code.';
      setOtpError(msg);
    } finally {
      setIsOtpLoading(false);
    }
  };

  // Handle Resend OTP Request
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || isOtpLoading) return;
    setOtpError('');
    setResendSuccessNotice('');

    try {
      const res = await api.resendRegistrationOtp(otpEmail);
      if (res && res.success) {
        setResendCooldown(30);
        setResendSuccessNotice('A new 6-digit verification code has been dispatched to your email.');
        setTimeout(() => setResendSuccessNotice(''), 4000);
      }
    } catch (err) {
      setOtpError(err.data?.message || err.message || 'Could not resend verification code. Please try again.');
    }
  };

  // Mask email for display: paulrenine9487@gmail.com -> p***7@gmail.com
  const getMaskedEmail = (emailStr) => {
    if (!emailStr || !emailStr.includes('@')) return emailStr || '';
    const [local, domain] = emailStr.split('@');
    if (local.length <= 2) return `${local.charAt(0)}*@${domain}`;
    return `${local.charAt(0)}${'*'.repeat(Math.min(local.length - 2, 5))}${local.slice(-1)}@${domain}`;
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--dash-bg, #fff9ee)',
      padding: '40px 20px 80px'
    }}>
      {/* Top Header Logo */}
      <div style={{ maxWidth: '780px', margin: '0 auto 32px', textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}>
          <img
            src="/NoTreble-Classic-darktext.png"
            alt="No Tre(ou)ble"
            style={{
              height: '42px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block'
            }}
          />
        </Link>
      </div>

      {/* Main Registration / OTP Card */}
      <div style={{
        maxWidth: '740px',
        margin: '0 auto',
        background: '#FFFFFF',
        borderRadius: '20px',
        padding: 'clamp(24px, 4vw, 38px)',
        boxShadow: '0 20px 50px rgba(25, 27, 53, 0.08), 0 0 0 1px rgba(124, 58, 237, 0.08)',
        border: '1px solid #EAE5F3'
      }}>
        {/* Title and Subtitle */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{
            fontSize: '1.35rem',
            fontWeight: 700,
            color: '#191B35',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            lineHeight: 1.25,
            marginBottom: '6px'
          }}>
            {step === 'otp' ? 'Verify Your Email Address' : 'Create your No Tre(ou)ble Account'}
          </h1>
          <p style={{
            fontSize: '0.84rem',
            color: '#77728A',
            maxWidth: '560px',
            margin: '0 auto'
          }}>
            {step === 'otp'
              ? 'Enter the 6-digit verification code sent to your email to activate your account.'
              : 'Begin your journey towards better breathing, stronger vocals and confident singing.'}
          </p>
        </div>

        {/* Selected Musical Goal Banner (Preserved) */}
        {selectedGoal && step === 'form' && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.07), rgba(6, 182, 212, 0.05))',
            border: '1.5px solid #c084fc',
            borderRadius: '16px',
            padding: '14px 20px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'linear-gradient(135deg, #7C3AED, #6366f1)',
                color: '#fff',
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Sparkles size={16} />
              </div>
              <div>
                <div style={{ fontSize: '0.72rem', color: '#7C3AED', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Target Musical Goal Attached
                </div>
                <div style={{ fontSize: '0.96rem', fontWeight: 700, color: '#191B35' }}>
                  {selectedGoal}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedGoal('')}
              style={{
                background: 'none',
                color: '#9333ea',
                fontSize: '0.78rem',
                fontWeight: 600,
                textDecoration: 'underline',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              Change
            </button>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #15966A',
            borderRadius: '14px',
            padding: '14px 18px',
            marginBottom: '28px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#065f46'
          }}>
            <CheckCircle2 size={20} style={{ color: '#15966A', flexShrink: 0 }} />
            <div style={{ fontSize: '0.94rem', fontWeight: 600 }}>{successMessage}</div>
          </div>
        )}

        {/* Server Error Alert */}
        {serverError && step === 'form' && (
          <div style={{
            background: '#fef2f2',
            border: '1.5px solid #DC4C64',
            borderRadius: '16px',
            padding: '16px 20px',
            marginBottom: '28px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            color: '#991b1b',
            boxShadow: '0 4px 14px rgba(220, 76, 100, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <AlertCircle size={22} style={{ color: '#DC4C64', flexShrink: 0 }} />
              <div style={{ fontSize: '0.96rem', fontWeight: 700 }}>{serverError}</div>
            </div>

            {conflictField === 'email' && (
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '12px',
                paddingTop: '6px',
                borderTop: '1px solid #fee2e2'
              }}>
                <button
                  type="button"
                  onClick={() => navigate('/login', {
                    state: {
                      registeredEmail: formData.email.trim(),
                      infoMessage: `An account with ${formData.email.trim()} is already registered. Please log in.`
                    }
                  })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    background: '#7C3AED',
                    color: '#FFFFFF',
                    borderRadius: '10px',
                    border: 'none',
                    fontWeight: 750,
                    fontSize: '0.88rem',
                    cursor: 'pointer'
                  }}
                >
                  <span>Log In with this Email</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* STEP 1: REGISTRATION FORM (Phone Number Removed, Username -> Full Name) */}
        {/* ================================================================= */}
        {step === 'form' && (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>

              {/* Field 1: Full Name (Required, Unicode, 3-50 chars, no numbers) */}
              <div>
                <label htmlFor="reg-fullname" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                  1. Full Name <span style={{ color: '#DC4C64' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-fullname"
                    type="text"
                    name="full_name"
                    placeholder="Enter your full name"
                    value={formData.full_name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '13px 18px 13px 44px',
                      borderRadius: '12px',
                      border: errors.full_name ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      outline: 'none',
                      transition: 'border-color 0.2s',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                    onBlur={(e) => !errors.full_name && (e.target.style.borderColor = '#EAE5F3')}
                  />
                  <User size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#7C3AED' }} />
                </div>
                {errors.full_name && (
                  <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.full_name}</p>
                )}
              </div>

              {/* Field 2: Gender (Required dropdown) */}
              <div>
                <label htmlFor="reg-gender" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                  2. Gender <span style={{ color: '#DC4C64' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <select
                    id="reg-gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '13px 40px 13px 18px',
                      borderRadius: '12px',
                      border: errors.gender ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: formData.gender ? '#1f2937' : '#9ca3af',
                      outline: 'none',
                      appearance: 'none',
                      cursor: 'pointer',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                    onBlur={(e) => !errors.gender && (e.target.style.borderColor = '#EAE5F3')}
                  >
                    <option value="" disabled>Select your gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                  <ChevronDown size={18} style={{ position: 'absolute', right: '16px', top: '16px', color: '#7C3AED', pointerEvents: 'none' }} />
                </div>
                {errors.gender && (
                  <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.gender}</p>
                )}
              </div>

              {/* Field 3: Email ID (Required, valid email format) */}
              <div>
                <label htmlFor="reg-email" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                  3. Email ID <span style={{ color: '#DC4C64' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-email"
                    type="email"
                    name="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '13px 18px 13px 44px',
                      borderRadius: '12px',
                      border: errors.email ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                    onBlur={(e) => !errors.email && (e.target.style.borderColor = '#EAE5F3')}
                  />
                  <Mail size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#7C3AED' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#77728A', marginTop: '4px' }}>
                  A 6-digit verification code will be sent to this email to activate your account.
                </div>
                {errors.email && (
                  <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.email}</p>
                )}
              </div>

              {/* Field 4: Types of Music (Required, Multi-Select Chips) */}
              <div>
                <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                  4. Types of Music <span style={{ color: '#DC4C64' }}>*</span>
                </label>
                <div style={{ fontSize: '0.82rem', color: '#77728A', marginBottom: '10px' }}>
                  Select all musical genres and vocal styles that match your training goals:
                </div>

                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '10px',
                  padding: '14px',
                  borderRadius: '14px',
                  background: '#FFFFFF',
                  border: errors.types_of_music ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3'
                }}>
                  {MUSIC_OPTIONS.map((option) => {
                    const isChecked = formData.types_of_music.includes(option);
                    return (
                      <button
                        type="button"
                        key={option}
                        onClick={() => toggleMusicType(option)}
                        style={{
                          padding: '8px 16px',
                          borderRadius: '9999px',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          border: isChecked ? '1.5px solid #7C3AED' : '1.5px solid #d8b4fe',
                          background: isChecked ? 'linear-gradient(135deg, #7C3AED, #6366f1)' : '#ffffff',
                          color: isChecked ? '#ffffff' : '#374151',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          boxShadow: isChecked ? '0 4px 10px rgba(124, 58, 237, 0.25)' : 'none'
                        }}
                      >
                        {isChecked ? '✓ ' : '+ '}
                        {option}
                      </button>
                    );
                  })}
                </div>
                {errors.types_of_music && (
                  <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.types_of_music}</p>
                )}
              </div>

              {/* Field 5: Vocal Trainer Name (OPTIONAL) */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <label htmlFor="reg-trainer-name" style={{ fontSize: '0.9rem', fontWeight: 700, color: '#191B35' }}>
                    5. Vocal Trainer Name
                  </label>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', background: '#f3e8ff', padding: '2px 8px', borderRadius: '6px' }}>
                    OPTIONAL
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-trainer-name"
                    type="text"
                    name="vocal_trainer_name"
                    placeholder="Enter your vocal guru / mentor name (optional)"
                    value={formData.vocal_trainer_name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '13px 18px 13px 44px',
                      borderRadius: '12px',
                      border: '1.5px solid #EAE5F3',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                    onBlur={(e) => e.target.style.borderColor = '#EAE5F3'}
                  />
                  <UserCheck size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#7C3AED' }} />
                </div>
                <div style={{ fontSize: '0.75rem', color: '#77728A', marginTop: '4px' }}>
                  If you currently study under a vocal teacher or guru, mention their name. This field will never block registration.
                </div>
              </div>

              {/* Field 6: Password (Required, 8+ chars, upper, lower, number, special char, toggle) */}
              <div>
                <label htmlFor="reg-password" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                  6. Password <span style={{ color: '#DC4C64' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    placeholder="Create a strong password (8+ chars)"
                    value={formData.password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '13px 48px 13px 44px',
                      borderRadius: '12px',
                      border: errors.password ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      outline: 'none',
                      boxSizing: 'border-box'
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
                <div style={{ fontSize: '0.75rem', color: '#77728A', marginTop: '4px' }}>
                  Minimum 8 characters with at least one uppercase letter, one lowercase letter, one number and one special character.
                </div>
                {errors.password && (
                  <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.password}</p>
                )}
              </div>

              {/* Field 7: Confirm Password (Required, must match password) */}
              <div>
                <label htmlFor="reg-confirm-password" style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                  7. Confirm Password <span style={{ color: '#DC4C64' }}>*</span>
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="reg-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirm_password"
                    placeholder="Re-enter your password"
                    value={formData.confirm_password}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '13px 48px 13px 44px',
                      borderRadius: '12px',
                      border: errors.confirm_password ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                      background: '#FFFFFF',
                      fontSize: '0.95rem',
                      color: '#1f2937',
                      outline: 'none',
                      boxSizing: 'border-box'
                    }}
                    onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                    onBlur={(e) => !errors.confirm_password && (e.target.style.borderColor = '#EAE5F3')}
                  />
                  <Lock size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#7C3AED' }} />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{
                      position: 'absolute',
                      right: '16px',
                      top: '14px',
                      background: 'none',
                      border: 'none',
                      color: '#77728A',
                      cursor: 'pointer'
                    }}
                    title={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.confirm_password && (
                  <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.confirm_password}</p>
                )}
              </div>
            </div>

            {/* Registration Submit Button */}
            <div style={{ marginTop: '36px' }}>
              <button
                type="submit"
                disabled={isSubmitting || !isFormValid}
                className="btn-primary-gradient"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.05rem',
                  borderRadius: '14px',
                  opacity: (isSubmitting || !isFormValid) ? 0.65 : 1,
                  cursor: (isSubmitting || !isFormValid) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Creating Account & Sending OTP...</span>
                  </>
                ) : (
                  <>
                    <span>REGISTER ACCOUNT</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* ================================================================= */}
        {/* STEP 2: EMAIL OTP VERIFICATION SCREEN (Phase 5 Requirements)       */}
        {/* ================================================================= */}
        {step === 'otp' && (
          <div>
            {/* Header / Info Badge */}
            <div style={{
              background: '#F5F3FF',
              border: '1.5px solid #DDD6FE',
              borderRadius: '16px',
              padding: '18px 20px',
              marginBottom: '28px',
              textAlign: 'center'
            }}>
              <div style={{
                width: '46px',
                height: '46px',
                borderRadius: '12px',
                background: '#7C3AED',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '12px'
              }}>
                <KeyRound size={22} />
              </div>
              <h3 style={{ fontSize: '1.08rem', fontWeight: 800, color: '#191B35', margin: '0 0 6px 0' }}>
                Verify Your Email
              </h3>
              <p style={{ fontSize: '0.86rem', color: '#5B21B6', margin: 0, lineHeight: 1.5 }}>
                A 6-digit verification code has been dispatched to:<br />
                <strong style={{ fontSize: '0.94rem', color: '#191B35' }}>{otpEmail}</strong>
              </p>
            </div>

            {/* Resend Notice */}
            {resendSuccessNotice && (
              <div style={{
                background: '#ecfdf5',
                border: '1px solid #10B981',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                fontSize: '0.86rem',
                color: '#065f46',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <CheckCircle2 size={18} color="#10B981" />
                <span>{resendSuccessNotice}</span>
              </div>
            )}

            {/* OTP Error Banner */}
            {otpError && (
              <div style={{
                background: '#fef2f2',
                border: '1.5px solid #DC4C64',
                borderRadius: '12px',
                padding: '12px 16px',
                marginBottom: '20px',
                color: '#991b1b',
                fontSize: '0.86rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertCircle size={18} color="#DC4C64" style={{ flexShrink: 0 }} />
                <span>{otpError}</span>
              </div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <div style={{ marginBottom: '24px' }}>
                <label htmlFor="reg-otp-input" style={{
                  display: 'block',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  color: '#191B35',
                  marginBottom: '8px',
                  textAlign: 'center'
                }}>
                  Enter 6-Digit Verification Code
                </label>
                <input
                  id="reg-otp-input"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => {
                    const clean = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtpCode(clean);
                    setOtpError('');
                  }}
                  placeholder="••••••"
                  style={{
                    width: '100%',
                    maxWidth: '280px',
                    margin: '0 auto',
                    display: 'block',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    border: otpError ? '2px solid #DC4C64' : '2px solid #7C3AED',
                    background: '#FFFFFF',
                    fontSize: '1.8rem',
                    fontWeight: 800,
                    letterSpacing: '10px',
                    textAlign: 'center',
                    color: '#7C3AED',
                    outline: 'none',
                    boxSizing: 'border-box'
                  }}
                />
                <div style={{ fontSize: '0.78rem', color: '#77728A', textAlign: 'center', marginTop: '8px' }}>
                  Code expires in 5 minutes.
                </div>
              </div>

              {/* Verify Button */}
              <button
                type="submit"
                disabled={isOtpLoading || otpCode.trim().length !== 6}
                className="btn-primary-gradient"
                style={{
                  width: '100%',
                  padding: '16px',
                  fontSize: '1.02rem',
                  borderRadius: '14px',
                  opacity: (isOtpLoading || otpCode.trim().length !== 6) ? 0.65 : 1,
                  cursor: (isOtpLoading || otpCode.trim().length !== 6) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '10px'
                }}
              >
                {isOtpLoading ? (
                  <>
                    <RefreshCw size={18} className="animate-spin" />
                    <span>Activating Account...</span>
                  </>
                ) : (
                  <>
                    <span>VERIFY & ACTIVATE ACCOUNT</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Resend and Edit options */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '22px',
              paddingTop: '18px',
              borderTop: '1px solid #f3effc',
              fontSize: '0.86rem'
            }}>
              <button
                type="button"
                onClick={() => {
                  setStep('form');
                  setOtpError('');
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#6B7280',
                  fontWeight: 650,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <ArrowLeft size={16} />
                <span>Edit Registration Details</span>
              </button>

              <button
                type="button"
                disabled={resendCooldown > 0 || isOtpLoading}
                onClick={handleResendOtp}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? '#9CA3AF' : '#7C3AED',
                  fontWeight: 750,
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  textDecoration: resendCooldown > 0 ? 'none' : 'underline'
                }}
              >
                {resendCooldown > 0 ? `Resend Code in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>
          </div>
        )}

        {/* Already have an account? LOGIN */}
        <div style={{
          marginTop: '28px',
          textAlign: 'center',
          paddingTop: '20px',
          borderTop: '1px solid #f3effc'
        }}>
          <span style={{ color: '#77728A', fontSize: '0.94rem' }}>
            Already have an account?{' '}
          </span>
          <Link
            to="/login"
            style={{
              color: '#7C3AED',
              fontWeight: 700,
              fontSize: '0.95rem',
              textDecoration: 'underline'
            }}
          >
            LOGIN
          </Link>
        </div>
      </div>
    </div>
  );
}
