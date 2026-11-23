import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  Music,
  UserCheck,
  Lock,
  Sparkles,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  ChevronDown
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
  const { register, selectedGoal, setSelectedGoal } = useAuth();

  const [formData, setFormData] = useState({
    username: '',
    gender: '',
    email: '',
    phone: '',
    types_of_music: [],
    vocal_trainer_name: '',
    password: '',
    confirm_password: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [conflictField, setConflictField] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Toggle music option
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setServerError('');
  };

  // Client-side validations
  const validate = () => {
    const errs = {};

    // 1. Username
    if (!formData.username.trim()) {
      errs.username = 'Username is required.';
    } else if (formData.username.trim().length < 3) {
      errs.username = 'Username must be at least 3 characters.';
    }

    // 2. Gender
    if (!formData.gender) {
      errs.gender = 'Please select your gender.';
    }

    // 3. Email
    if (!formData.email.trim()) {
      errs.email = 'Email ID is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    // 4. Phone
    if (!formData.phone.trim()) {
      errs.phone = 'Phone number is required.';
    } else {
      const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
      const indianPhoneRegex = /^(\+?91|0)?[6-9]\d{9}$/;
      const genericPhoneRegex = /^\+?[0-9]{10,15}$/;
      if (!indianPhoneRegex.test(cleanPhone) && !genericPhoneRegex.test(cleanPhone)) {
        errs.phone = 'Please enter a valid 10-digit mobile number (e.g., 9876543210 or +91...).';
      }
    }

    // 5. Types of music
    if (formData.types_of_music.length === 0) {
      errs.types_of_music = 'Please select at least one type of music.';
    }

    // 6. Vocal trainer name is explicitly OPTIONAL - no validation needed

    // 7. Password
    if (!formData.password) {
      errs.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    } else if (!/[a-zA-Z]/.test(formData.password) || !/[0-9]/.test(formData.password)) {
      errs.password = 'Password must include both letters and numbers.';
    }

    // 8. Confirm Password
    if (!formData.confirm_password) {
      errs.confirm_password = 'Confirm password is required.';
    } else if (formData.password !== formData.confirm_password) {
      errs.confirm_password = 'Password and Confirm Password do not match.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

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
        username: formData.username.trim(),
        gender: formData.gender,
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        types_of_music: formData.types_of_music,
        vocal_trainer_name: formData.vocal_trainer_name.trim() || null,
        password: formData.password,
        confirm_password: formData.confirm_password,
        selected_musical_goal: selectedGoal || null
      });

      if (response.success) {
        setSuccessMessage('Registration successful! Redirecting you to the Login page...');
        setTimeout(() => {
          navigate('/login', {
            state: {
              registeredEmail: formData.email.trim(),
              infoMessage: 'Registration successful! Please log in with your credentials.'
            }
          });
        }, 1800);
      }
    } catch (err) {
      const msg = err.data?.message || err.message || 'Registration failed. Please verify your details and try again.';
      setServerError(msg);
      if (err.status === 409 || err.data?.conflictField || /already exists|already taken/i.test(msg)) {
        const field = err.data?.conflictField || (/username/i.test(msg) ? 'username' : 'email');
        setConflictField(field);
        if (field === 'username') {
          setErrors(prev => ({ ...prev, username: 'This username is already taken. Please choose another username.' }));
        } else {
          setErrors(prev => ({ ...prev, email: 'An account with this email already exists. Please log in.' }));
        }
      }
      window.scrollTo({ top: 140, behavior: 'smooth' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--dash-bg, #fff9ee)',
      padding: '40px 20px 80px'
    }}>
      {/* Top Header Logo */}
      <div style={{ maxWidth: '780px', margin: '0 auto 32px', textAlign: 'center' }}>
        <Link to="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
          <img
            src="/IMG_7974.PNG"
            alt="No Tre(ou)ble Logo"
            style={{
              height: '52px',
              width: 'auto',
              objectFit: 'contain',
              display: 'block',
              background: '#FFFFFF',
              borderRadius: '12px',
              padding: '4px 6px',
              boxShadow: '0 4px 12px rgba(25, 27, 53, 0.08)'
            }}
          />
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

      {/* Main Registration Card */}
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
            Create your No Tre(ou)ble Account
          </h1>
          <p style={{
            fontSize: '0.84rem',
            color: '#77728A',
            maxWidth: '560px',
            margin: '0 auto'
          }}>
            Begin your journey towards better breathing, stronger vocals and confident singing.
          </p>
        </div>

        {/* Selected Musical Goal Banner (if selected from Section 4) */}
        {selectedGoal && (
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
                textDecoration: 'underline'
              }}
            >
              Change
            </button>
          </div>
        )}

        {/* Server Success Alert */}
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
        {serverError && (
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
                      infoMessage: `Welcome back! An account with ${formData.email.trim()} is already registered. Please log in.`
                    }
                  })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '9px 18px',
                    background: '#DC4C64',
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
                <button
                  type="button"
                  onClick={() => navigate('/login', {
                    state: {
                      registeredEmail: formData.email.trim(),
                      openForgotModal: true
                    }
                  })}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#991b1b',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  Forgot your password? Reset it here
                </button>
              </div>
            )}
          </div>
        )}

        {/* Registration Form with fields in EXACT order */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            {/* Field 1: Username (Required, unique) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                1. Username <span style={{ color: '#DC4C64' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="username"
                  placeholder="Enter a unique username"
                  value={formData.username}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '13px 18px 13px 44px',
                    borderRadius: '12px',
                    border: errors.username ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                    background: '#FFFFFF',
                    fontSize: '0.95rem',
                    color: '#1f2937',
                    outline: 'none',
                    transition: 'border-color 0.2s'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                  onBlur={(e) => !errors.username && (e.target.style.borderColor = '#EAE5F3')}
                />
                <User size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#7C3AED' }} />
              </div>
              {errors.username && (
                <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.username}</p>
              )}
            </div>

            {/* Field 2: Gender (Required dropdown) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                2. Gender <span style={{ color: '#DC4C64' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <select
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
                    cursor: 'pointer'
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

            {/* Field 3: Email ID (Required, valid email, unique) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                3. Email ID <span style={{ color: '#DC4C64' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
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

            {/* Field 4: Phone Number (Required, Indian mobile numbers) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                4. Phone Number <span style={{ color: '#DC4C64' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="tel"
                  name="phone"
                  placeholder="e.g. 9876543210 or +91 98765 43210"
                  value={formData.phone}
                  onChange={handleChange}
                  style={{
                    width: '100%',
                    padding: '13px 18px 13px 44px',
                    borderRadius: '12px',
                    border: errors.phone ? '1.5px solid #DC4C64' : '1.5px solid #EAE5F3',
                    background: '#FFFFFF',
                    fontSize: '0.95rem',
                    color: '#1f2937',
                    outline: 'none'
                  }}
                  onFocus={(e) => e.target.style.borderColor = '#7C3AED'}
                  onBlur={(e) => !errors.phone && (e.target.style.borderColor = '#EAE5F3')}
                />
                <Phone size={18} style={{ position: 'absolute', left: '16px', top: '15px', color: '#7C3AED' }} />
              </div>
              <div style={{ fontSize: '0.75rem', color: '#77728A', marginTop: '4px' }}>
                Supports Indian 10-digit mobile numbers with or without +91 prefix.
              </div>
              {errors.phone && (
                <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.phone}</p>
              )}
            </div>

            {/* Field 5: Types of Music (Required, Multi-Select Dropdown/Chips) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                5. Types of Music <span style={{ color: '#DC4C64' }}>*</span>
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

            {/* Field 6: Vocal Trainer Name (OPTIONAL) */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <label style={{ fontSize: '0.9rem', fontWeight: 700, color: '#191B35' }}>
                  6. Vocal Trainer Name
                </label>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C3AED', background: '#f3e8ff', padding: '2px 8px', borderRadius: '6px' }}>
                  OPTIONAL
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
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
                    outline: 'none'
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

            {/* Field 7: Password (Required, secure, show/hide, strength) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                7. Password <span style={{ color: '#DC4C64' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  placeholder="Create a secure password (letters and numbers)"
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
              <div style={{ fontSize: '0.75rem', color: '#77728A', marginTop: '4px' }}>
                Minimum 6 characters, combining letters and numbers.
              </div>
              {errors.password && (
                <p style={{ color: '#DC4C64', fontSize: '0.82rem', marginTop: '5px', fontWeight: 600 }}>{errors.password}</p>
              )}
            </div>

            {/* Field 8: Confirm Password (Required, must match) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.9rem', fontWeight: 700, color: '#191B35', marginBottom: '8px' }}>
                8. Confirm Password <span style={{ color: '#DC4C64' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <input
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
                    outline: 'none'
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

          {/* Registration Submit Buttons */}
          <div style={{ marginTop: '36px' }}>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary-gradient"
              style={{
                width: '100%',
                padding: '16px',
                fontSize: '1.05rem',
                borderRadius: '14px',
                opacity: isSubmitting ? 0.75 : 1
              }}
            >
              {isSubmitting ? (
                <span>Registering Account in MySQL...</span>
              ) : (
                <>
                  <span>REGISTER ACCOUNT</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </form>

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

