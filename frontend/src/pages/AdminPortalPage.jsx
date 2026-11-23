import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';
import ColorPaletteWheel from '../components/ColorPaletteWheel';
import AdminCurriculumManager from '../components/AdminCurriculumManager';
import WelcomePageManager from '../components/WelcomePageManager';
import AdminTranscriptManager from '../components/AdminTranscriptManager';
import {
  ShieldAlert,
  Users,
  Award,
  BookOpen,
  Activity,
  UserPlus,
  ArrowLeft,
  CheckCircle,
  FileText,
  Clock,
  RefreshCw,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Palette,
  Lock,
  KeyRound,
  LogIn,
  Music,
  ShieldCheck,
  LogOut,
  Sparkles,
  User as UserIcon,
  Eye,
  EyeOff,
  LayoutDashboard,
  Menu,
  X,
  Flame,
  Calendar,
  Search,
  Filter,
  Globe,
  Film,
  Image as ImageIcon,
  Target,
  Database,
  FileSpreadsheet,
  Wind,
  Lightbulb,
  Sliders,
  FolderOpen,
  History,
  Layers,
  HelpCircle,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import '../styles/dashboard.css';

export default function AdminPortalPage() {
  const { user, login, logout, verifyMfa, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  // Admin Gateway Login State (clean, unpopulated inputs)
  const [adminIdentifier, setAdminIdentifier] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);
  const [adminAuthLoading, setAdminAuthLoading] = useState(false);
  const [adminAuthError, setAdminAuthError] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const profileDropdownRef = useRef(null);

  // Close profile dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(event.target)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Admin MFA Verification State
  const [mfaChallenge, setMfaChallenge] = useState(null);
  const [mfaCode, setMfaCode] = useState('');
  const [mfaBackupCode, setMfaBackupCode] = useState('');
  const [showBackupInput, setShowBackupInput] = useState(false);
  const [generatedBackupCodes, setGeneratedBackupCodes] = useState(null);
  const [secretCopied, setSecretCopied] = useState(false);

  const [activeTab, setActiveTab] = useState('overview'); // overview | welcome_page | curriculum | submissions | commitments | theme | users
  const [overview, setOverview] = useState(null);
  const [usersList, setUsersList] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [submissionFilter, setSubmissionFilter] = useState('');
  const [submissionTab, setSubmissionTab] = useState('tasks'); // tasks | myth_fact | reflections
  const [mfStudentResults, setMfStudentResults] = useState([]);
  const [reflectionAnswers, setReflectionAnswers] = useState([]);
  const [commitmentsList, setCommitmentsList] = useState([]);
  const [commitmentStudentSearch, setCommitmentStudentSearch] = useState('');
  const [commitmentStartDate, setCommitmentStartDate] = useState('');
  const [commitmentEndDate, setCommitmentEndDate] = useState('');
  const [commitmentsLoading, setCommitmentsLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Grading State
  const [activeGradingSubId, setActiveGradingSubId] = useState(null);
  const [gradingForm, setGradingForm] = useState({
    marks_awarded: '',
    feedback: '',
    improvement_suggestions: ''
  });
  const [gradingLoading, setGradingLoading] = useState(false);

  // New Admin Form (Superadmin only)
  const [showAdminForm, setShowAdminForm] = useState(false);
  const [adminForm, setAdminForm] = useState({
    username: '',
    email: '',
    password: '',
    phone: '',
    role: 'ADMIN'
  });

  const isSuperAdmin = user?.role === 'SUPERADMIN';
  const isAdmin = user?.role === 'ADMIN' || isSuperAdmin;

  const loadData = async () => {
    if (authLoading || !isAdmin) return;
    try {
      setLoading(true);
      setError('');

      const promises = [
        api.getAdminOverview(),
        api.getAdminPracticeReports(),
        api.getTeacherSubmissions(submissionFilter ? { status: submissionFilter } : {}),
        api.adminGetMythFactStudentResults ? api.adminGetMythFactStudentResults().catch(() => ({ success: false })) : Promise.resolve({ success: false }),
        api.adminGetLearningReflections ? api.adminGetLearningReflections({ moduleId: 1, stageId: 4 }).catch(() => ({ success: false })) : Promise.resolve({ success: false })
      ];

      if (isSuperAdmin) {
        promises.push(api.getAdminUsers());
        promises.push(api.getAdminAuditLogs());
      }

      const results = await Promise.all(promises);
      const overviewRes = results[0];
      const reportsRes = results[1];
      const subsRes = results[2];
      const mfRes = results[3];
      const refRes = results[4];

      if (overviewRes?.success) setOverview(overviewRes.data);
      if (reportsRes?.success) setReports(reportsRes.reports || []);
      if (subsRes?.success) setSubmissions(subsRes.submissions || []);
      if (mfRes?.success) setMfStudentResults(mfRes.students || []);
      if (refRes?.success) setReflectionAnswers(refRes.reflections || []);

      if (isSuperAdmin) {
        const usersRes = results[5];
        const auditRes = results[6];
        if (usersRes?.success) setUsersList(usersRes.users || []);
        if (auditRes?.success) setAuditLogs(auditRes.logs || []);
      }
    } catch (err) {
      console.error('Admin load error:', err);
      if (err.status === 403 || err.message?.includes('Forbidden') || err.message?.includes('Administrative privileges')) {
        await logout();
        setAdminAuthError('Access Denied: Administrative privileges required. Please sign in with an authorized Administrator account.');
        return;
      }
      setError(err.message || 'Failed to load administrative data.');
    } finally {
      setLoading(false);
    }
  };

  const loadCommitments = async () => {
    if (authLoading || !isAdmin) return;
    try {
      setCommitmentsLoading(true);
      const res = await api.getAdminPracticeCommitments({
        search: commitmentStudentSearch,
        startDate: commitmentStartDate,
        endDate: commitmentEndDate
      });
      if (res && res.success) {
        setCommitmentsList(res.commitments || []);
      }
    } catch (err) {
      if (err.status === 403 || err.message?.includes('Forbidden') || err.message?.includes('Administrative privileges')) {
        await logout();
        setAdminAuthError('Access Denied: Administrative privileges required.');
        return;
      }
      console.error('Failed to load commitments:', err);
    } finally {
      setCommitmentsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [isAdmin, isSuperAdmin, submissionFilter]);

  useEffect(() => {
    if (!isSuperAdmin && (activeTab === 'users' || activeTab === 'audit')) {
      setActiveTab('overview');
    }
  }, [isSuperAdmin, activeTab]);

  useEffect(() => {
    if (activeTab === 'commitments') {
      loadCommitments();
    }
  }, [activeTab, commitmentStudentSearch, commitmentStartDate, commitmentEndDate]);

  // Handler for Admin Gateway Login directly on /ResonovaNotreoble
  const handleAdminGatewayLogin = async (e) => {
    e.preventDefault();
    setAdminAuthError('');
    if (!adminIdentifier.trim() || !adminPassword) {
      setAdminAuthError('Please enter both administrative username/email and password.');
      return;
    }

    try {
      setAdminAuthLoading(true);
      const res = await login({
        username: adminIdentifier.trim(),
        password: adminPassword
      });

      // Check if MFA verification is required (Enterprise Hardening)
      if (res && res.mfaRequired) {
        setMfaChallenge(res);
        setMfaCode('');
        setMfaBackupCode('');
        setShowBackupInput(false);
        return;
      }

      if (res && res.success && res.user) {
        if (res.user.role !== 'ADMIN' && res.user.role !== 'SUPERADMIN') {
          await logout();
          setAdminAuthError('Access Denied: This account has standard vocalist privileges. Administrative credentials are required.');
        } else {
          // Admin logged in successfully; data will load via useEffect
          await loadData();
        }
      }
    } catch (err) {
      setAdminAuthError(err.message || 'Invalid administrator credentials. Please verify username and password.');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  // Handler for Admin MFA Verification
  const handleVerifyAdminMfa = async (e) => {
    e.preventDefault();
    setAdminAuthError('');
    if (!mfaCode.trim() && !mfaBackupCode.trim()) {
      setAdminAuthError('Please enter the 6-digit verification code.');
      return;
    }

    try {
      setAdminAuthLoading(true);
      const res = await verifyMfa({
        mfaToken: mfaChallenge?.mfaToken || undefined,
        username: adminIdentifier?.trim() || undefined,
        code: mfaCode.trim() || undefined,
        backupCode: mfaBackupCode.trim() || undefined
      });

      if (res && res.success && res.user) {
        if (res.backupCodes) {
          setGeneratedBackupCodes(res.backupCodes);
        }
        setMfaChallenge(null);
        await loadData();
      }
    } catch (err) {
      setAdminAuthError(err.data?.message || err.message || 'Verification failed. Invalid verification code.');
    } finally {
      setAdminAuthLoading(false);
    }
  };

  // While session/token is being checked on mount, render clean loader
  if (authLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#fff9ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        <div style={{ textAlign: 'center', color: '#191B35' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid #EAE5F3',
            borderTop: '3px solid #7C3AED',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ fontWeight: 600, color: '#77728A', fontSize: '0.9rem' }}>
            Verifying administrative access...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated or not admin, show Dedicated Admin Access Gateway
  if (!user || (!isAdmin)) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#fff9ee',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
      }}>
        <div style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '24px',
          padding: 'clamp(32px, 5vw, 44px)',
          maxWidth: '440px',
          width: '100%',
          boxShadow: '0 20px 45px rgba(25, 27, 53, 0.08), 0 1px 3px rgba(25, 27, 53, 0.05)',
          border: '1px solid #EAE5F3',
          boxSizing: 'border-box'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <img
              src="/IMG_7974.PNG"
              alt="No Tre(ou)ble Logo"
              style={{
                height: '56px',
                width: 'auto',
                objectFit: 'contain',
                marginBottom: '16px',
                display: 'inline-block'
              }}
            />
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <img
                src="/NoTreble-Classic-darktext.png"
                alt="No Tre(ou)ble"
                style={{
                  height: '38px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#191B35' }}>Admin Portal</span>
            </div>
            <p style={{ margin: 0, fontSize: '0.86rem', color: '#77728A', lineHeight: 1.45 }}>
              Authorized Administration &amp; Teacher Studio
            </p>
          </div>

          {/* Alert if non-admin user is logged in */}
          {user && !isAdmin && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              color: '#991B1B',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>Signed in as standard vocalist <strong>{user.username}</strong>. Administrator credentials are required.</span>
              </div>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  setAdminAuthError('');
                }}
                style={{
                  alignSelf: 'flex-start',
                  backgroundColor: '#991B1B',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '5px 12px',
                  fontSize: '0.78rem',
                  fontWeight: 650,
                  cursor: 'pointer'
                }}
              >
                Sign out of {user.username} to log in as Admin
              </button>
            </div>
          )}

          {adminAuthError && (
            <div style={{
              backgroundColor: '#FEF2F2',
              border: '1px solid #FCA5A5',
              borderRadius: '12px',
              padding: '12px 14px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#991B1B',
              fontSize: '0.82rem'
            }}>
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{adminAuthError}</span>
            </div>
          )}

          {/* If MFA Challenge is active, show the 2FA Verification Form */}
          {mfaChallenge ? (
            <form onSubmit={handleVerifyAdminMfa}>
              <div style={{
                backgroundColor: '#F8F7FF',
                borderRadius: '14px',
                padding: '16px',
                marginBottom: '20px',
                border: '1px solid #EAE5F3',
                textAlign: 'center'
              }}>
                <div style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                  color: '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 10px',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)'
                }}>
                  <ShieldCheck size={24} />
                </div>
                <h4 style={{ margin: '0 0 6px', fontSize: '1rem', fontWeight: 800, color: '#191B35' }}>
                  Two-Factor Authentication
                </h4>
                <p style={{ margin: 0, fontSize: '0.84rem', color: '#64748B', lineHeight: 1.45 }}>
                  Enter your 6-digit authentication code to verify your identity and access the administration portal.
                </p>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191B35', marginBottom: '6px' }}>
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
                    outline: 'none',
                    backgroundColor: '#FFFFFF'
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={adminAuthLoading}
                className="dash-btn-primary"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '12px 20px',
                  fontSize: '0.92rem',
                  backgroundColor: 'var(--dash-sidebar-bg, #201B45)',
                  borderRadius: '10px',
                  boxShadow: '0 4px 14px rgba(32, 27, 69, 0.25)',
                  cursor: adminAuthLoading ? 'wait' : 'pointer',
                  marginBottom: '14px'
                }}
              >
                <ShieldCheck size={18} />
                <span>{adminAuthLoading ? 'Verifying...' : 'Verify & Continue'}</span>
              </button>

              <div style={{ textAlign: 'center', fontSize: '0.82rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setMfaChallenge(null);
                    setAdminAuthError('');
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#77728A',
                    cursor: 'pointer',
                    fontWeight: 600,
                    padding: '4px 8px'
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* Clean Professional Login Form */
            <form onSubmit={handleAdminGatewayLogin}>
            <div style={{ marginBottom: '18px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191B35', marginBottom: '6px' }}>
                Username or Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#77728A',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <UserIcon size={17} />
                </div>
                <input
                  type="text"
                  required
                  value={adminIdentifier}
                  onChange={(e) => setAdminIdentifier(e.target.value)}
                  placeholder="Enter username or email"
                  autoComplete="username"
                  style={{
                    width: '100%',
                    padding: '11px 14px 11px 40px',
                    borderRadius: '10px',
                    border: '1.5px solid #EAE5F3',
                    fontSize: '0.9rem',
                    color: '#191B35',
                    boxSizing: 'border-box',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7C3AED';
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EAE5F3';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: '#191B35', marginBottom: '6px' }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#77728A',
                  display: 'flex',
                  alignItems: 'center',
                  pointerEvents: 'none'
                }}>
                  <Lock size={17} />
                </div>
                <input
                  type={showAdminPassword ? 'text' : 'password'}
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter password"
                  autoComplete="current-password"
                  style={{
                    width: '100%',
                    padding: '11px 42px 11px 40px',
                    borderRadius: '10px',
                    border: '1.5px solid #EAE5F3',
                    fontSize: '0.9rem',
                    color: '#191B35',
                    boxSizing: 'border-box',
                    outline: 'none',
                    backgroundColor: '#FFFFFF',
                    transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                  }}
                  onFocus={(e) => {
                    e.target.style.borderColor = '#7C3AED';
                    e.target.style.boxShadow = '0 0 0 3px rgba(124, 58, 237, 0.12)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#EAE5F3';
                    e.target.style.boxShadow = 'none';
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowAdminPassword(!showAdminPassword)}
                  style={{
                    position: 'absolute',
                    right: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#77728A',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    padding: '4px'
                  }}
                  title={showAdminPassword ? 'Hide password' : 'Show password'}
                >
                  {showAdminPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={adminAuthLoading}
              className="dash-btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                padding: '12px 20px',
                fontSize: '0.92rem',
                backgroundColor: 'var(--dash-sidebar-bg, #201B45)',
                borderRadius: '10px',
                boxShadow: '0 4px 14px rgba(32, 27, 69, 0.25)',
                cursor: adminAuthLoading ? 'wait' : 'pointer'
              }}
            >
              <LogIn size={18} />
              <span>{adminAuthLoading ? 'Authenticating...' : 'Sign In to Admin Portal'}</span>
            </button>
          </form>
          )}

          {/* Navigation link back to dashboard */}
          <div style={{ textAlign: 'center', marginTop: '22px', paddingTop: '16px', borderTop: '1px solid #EAE5F3' }}>
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#7C3AED',
                fontSize: '0.84rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <ArrowLeft size={15} />
              <span>Return to User Dashboard</span>
            </button>
          </div>
        </div>
      </div >
    );
  }

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    try {
      await api.createAdminUser(adminForm);
      setSuccessMsg(`Admin account "${adminForm.username}" created successfully.`);
      setShowAdminForm(false);
      setAdminForm({ username: '', email: '', password: '', phone: '', role: 'ADMIN' });
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to create admin.');
    }
  };

  const handleRoleChange = async (targetUserId, newRole) => {
    try {
      await api.updateUserRole(targetUserId, newRole);
      setSuccessMsg(`Updated user role to ${newRole}.`);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to update role.');
    }
  };

  // Open grading drawer with actual submission data from DB (no fake defaults)
  const handleStartGrading = (sub) => {
    setActiveGradingSubId(sub.submission_id);
    setGradingForm({
      marks_awarded: sub.marks_awarded !== null && sub.marks_awarded !== undefined ? sub.marks_awarded : '',
      feedback: sub.feedback || '',
      improvement_suggestions: sub.improvement_suggestions || ''
    });
  };

  // Submit official assessment
  const handleAssessSubmit = async (submissionId) => {
    if (gradingForm.marks_awarded === '' || isNaN(Number(gradingForm.marks_awarded))) {
      setError('Please enter valid numeric marks for this submission.');
      return;
    }
    try {
      setGradingLoading(true);
      setError('');
      await api.assessSubmission(submissionId, {
        marks_awarded: Number(gradingForm.marks_awarded),
        feedback: gradingForm.feedback.trim(),
        improvement_suggestions: gradingForm.improvement_suggestions.trim()
      });
      setSuccessMsg(`Assessment saved to database! Student score and progress updated in real time.`);
      setActiveGradingSubId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to submit assessment.');
    } finally {
      setGradingLoading(false);
    }
  };

  // Request revision from student
  const handleRequestRevisionSubmit = async (submissionId) => {
    if (!gradingForm.feedback.trim()) {
      setError('Please enter feedback explaining the revision instructions for the student.');
      return;
    }
    try {
      setGradingLoading(true);
      setError('');
      await api.requestRevision(submissionId, {
        feedback: gradingForm.feedback.trim(),
        improvement_suggestions: gradingForm.improvement_suggestions.trim()
      });
      setSuccessMsg(`Revision requested from student and updated in database.`);
      setActiveGradingSubId(null);
      await loadData();
    } catch (err) {
      setError(err.message || 'Failed to request revision.');
    } finally {
      setGradingLoading(false);
    }
  };

  const token = localStorage.getItem('resonova_token');

  return (
    <div className="admin-layout-container">
      {/* Left-Side Admin Sidebar Menu */}
      <aside className={`admin-sidebar ${mobileMenuOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="admin-sidebar-header">
          <img
            src="/IMG_7974.PNG"
            alt="No Tre(ou)ble Logo"
            className="admin-sidebar-logo"
            style={{
              height: '38px',
              width: 'auto',
              objectFit: 'contain'
            }}
          />
          <div className="admin-sidebar-brand-text">
            <span className="admin-sidebar-brand-name">
              <img
                src="/NoTreble-Classicfinal.png"
                alt="No Tre(ou)ble"
                style={{
                  height: '24px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </span>
            <span className="admin-sidebar-brand-sub">Management Studio</span>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="admin-sidebar-nav">
          <div className="admin-menu-group">
            <div className="admin-menu-header">Platform Management</div>

            {/* 1. Dashboard Analytics */}
            <button
              type="button"
              onClick={() => { setActiveTab('overview'); setMobileMenuOpen(false); }}
              className={`admin-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            >
              <span className="admin-nav-item-left">
                <LayoutDashboard size={17} />
                <span>Dashboard Analytics</span>
              </span>
            </button>

            {/* 2. Welcome Page Content */}
            <button
              type="button"
              onClick={() => { setActiveTab('welcome_page'); setMobileMenuOpen(false); }}
              className={`admin-nav-item ${activeTab === 'welcome_page' ? 'active' : ''}`}
            >
              <span className="admin-nav-item-left">
                <Globe size={17} />
                <span>Welcome Page Content</span>
              </span>
            </button>

            {/* 3. Learning Modules & Tasks */}
            <button
              type="button"
              onClick={() => { setActiveTab('curriculum'); setMobileMenuOpen(false); }}
              className={`admin-nav-item ${activeTab === 'curriculum' ? 'active' : ''}`}
            >
              <span className="admin-nav-item-left">
                <Layers size={17} />
                <span>Learning Modules &amp; Tasks</span>
              </span>
            </button>

            {/* 3b. Video Transcripts Management */}
            <button
              type="button"
              onClick={() => { setActiveTab('transcripts'); setMobileMenuOpen(false); }}
              className={`admin-nav-item ${activeTab === 'transcripts' ? 'active' : ''}`}
            >
              <span className="admin-nav-item-left">
                <FileText size={17} />
                <span>Video Transcripts</span>
              </span>
            </button>

            {/* 4. Student Answers & Grading */}
            <button
              type="button"
              onClick={() => { setActiveTab('submissions'); setMobileMenuOpen(false); }}
              className={`admin-nav-item ${activeTab === 'submissions' ? 'active' : ''}`}
            >
              <span className="admin-nav-item-left">
                <HelpCircle size={17} />
                <span>Student Answers &amp; Grading</span>
              </span>
              {submissions.length > 0 && (
                <span className="admin-nav-badge">{submissions.length}</span>
              )}
            </button>

            {/* 5. Practice Commitments */}
            <button
              type="button"
              onClick={() => { setActiveTab('commitments'); setMobileMenuOpen(false); }}
              className={`admin-nav-item ${activeTab === 'commitments' ? 'active' : ''}`}
            >
              <span className="admin-nav-item-left">
                <Flame size={17} />
                <span>Practice Commitments</span>
              </span>
              {commitmentsList.length > 0 && (
                <span className="admin-nav-badge">{commitmentsList.length}</span>
              )}
            </button>

            {/* 6. Branding Theme */}
            <button
              type="button"
              onClick={() => { setActiveTab('theme'); setMobileMenuOpen(false); }}
              className={`admin-nav-item ${activeTab === 'theme' ? 'active' : ''}`}
            >
              <span className="admin-nav-item-left">
                <Palette size={17} />
                <span>Branding Theme</span>
              </span>
            </button>

            {/* 7. User Details (Superadmin Only) */}
            {isSuperAdmin && (
              <button
                type="button"
                onClick={() => { setActiveTab('users'); setMobileMenuOpen(false); }}
                className={`admin-nav-item ${activeTab === 'users' ? 'active' : ''}`}
              >
                <span className="admin-nav-item-left">
                  <Users size={17} />
                  <span>User Details</span>
                </span>
                {usersList.length > 0 && (
                  <span className="admin-nav-badge">{usersList.length}</span>
                )}
              </button>
            )}
          </div>
        </nav>
      </aside>

      {/* Mobile Backdrop Overlay */}
      {
        mobileMenuOpen && (
          <div
            className="admin-mobile-overlay"
            onClick={() => setMobileMenuOpen(false)}
          />
        )
      }

      {/* Right Main Viewport */}
      <main className="admin-main-viewport">
        {/* Top Sticky Header */}
        <header className="admin-topbar">
          <div className="admin-topbar-left">
            <button
              type="button"
              className="admin-mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              title="Toggle Menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div>
              <h1 className="admin-topbar-title">
                {activeTab === 'overview' && 'Dashboard Analytics & Portal Traffic'}
                {activeTab === 'welcome_page' && 'Welcome Page Content & Media Management'}
                {activeTab === 'curriculum' && 'Learning Modules & Task Editor'}
                {activeTab === 'submissions' && 'Student Answers, Submissions & Grading'}
                {activeTab === 'commitments' && 'Student Practice Commitments & Progress'}
                {activeTab === 'transcripts' && 'Video Transcript Studio & Spoken Audio'}
                {activeTab === 'theme' && 'Branding & Theme Studio'}
                {activeTab === 'users' && 'User Details & Access Management'}
              </h1>
              <div className="admin-topbar-breadcrumb">
                {activeTab === 'overview' && 'Management / Dashboard Analytics & Traffic'}
                {activeTab === 'welcome_page' && 'Management / Welcome Page Content'}
                {activeTab === 'curriculum' && 'Management / Modules & 5 Tasks'}
                {activeTab === 'submissions' && 'Management / Student Answers & Assessment'}
                {activeTab === 'commitments' && 'Management / Weekly Practice Commitments'}
                {activeTab === 'transcripts' && 'Management / Video Transcripts & Timestamps'}
                {activeTab === 'theme' && 'Management / Brand & Color Palette'}
                {activeTab === 'users' && 'Superadmin / Registered Users & Roles'}
              </div>
            </div>
          </div>

          <div className="admin-topbar-right">
            <button
              onClick={() => loadData()}
              disabled={loading}
              className="dash-btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '7px 13px',
                fontSize: '0.82rem',
                borderRadius: '8px'
              }}
              title="Refresh administrative data"
            >
              <RefreshCw size={14} className={loading ? 'dash-spin' : ''} />
              <span>Refresh</span>
            </button>

            {/* Profile Dropdown (Top-Right) */}
            <div ref={profileDropdownRef} style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(prev => !prev)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '9px',
                  padding: '5px 12px 5px 6px',
                  backgroundColor: profileDropdownOpen ? '#F4F0FF' : '#FFFFFF',
                  border: '1.5px solid',
                  borderColor: profileDropdownOpen ? '#7C3AED' : '#EAE5F3',
                  borderRadius: '9999px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(25, 27, 53, 0.05)',
                  transition: 'all 0.2s ease',
                  outline: 'none'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#7C3AED';
                  e.currentTarget.style.backgroundColor = '#FAF8FF';
                }}
                onMouseLeave={(e) => {
                  if (!profileDropdownOpen) {
                    e.currentTarget.style.borderColor = '#EAE5F3';
                    e.currentTarget.style.backgroundColor = '#FFFFFF';
                  }
                }}
                aria-expanded={profileDropdownOpen}
                aria-haspopup="true"
                title={`${user.username} (${user.role}) - Click for account & sign out`}
              >
                {/* Avatar Bubble */}
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: isSuperAdmin
                    ? 'linear-gradient(135deg, #F6C358 0%, #D97706 100%)'
                    : 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                  color: isSuperAdmin ? '#191B35' : '#FFFFFF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.88rem',
                  flexShrink: 0,
                  boxShadow: isSuperAdmin ? '0 2px 6px rgba(246, 195, 88, 0.35)' : '0 2px 6px rgba(124, 58, 237, 0.3)'
                }}>
                  {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
                </div>

                {/* Username */}
                <span style={{
                  fontSize: '0.86rem',
                  fontWeight: 750,
                  color: '#191B35',
                  lineHeight: 1.15
                }}>
                  {user.username}
                </span>

                {/* Role Badge */}
                <span style={{
                  backgroundColor: isSuperAdmin ? '#FEF3C7' : '#EDE9FE',
                  color: isSuperAdmin ? '#B45309' : '#6D28D9',
                  border: `1px solid ${isSuperAdmin ? '#FCD34D' : '#DDD6FE'}`,
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '6px',
                  letterSpacing: '0.04em',
                  textTransform: 'uppercase'
                }}>
                  {user.role}
                </span>

                {/* Chevron */}
                <ChevronDown
                  size={14}
                  style={{
                    color: '#77728A',
                    transition: 'transform 0.2s ease',
                    transform: profileDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)'
                  }}
                />
              </button>

              {/* Floating Dropdown Card */}
              {profileDropdownOpen && (
                <div style={{
                  position: 'absolute',
                  top: 'calc(100% + 8px)',
                  right: 0,
                  width: '280px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '16px',
                  boxShadow: '0 12px 36px rgba(25, 27, 53, 0.12), 0 2px 8px rgba(25, 27, 53, 0.05)',
                  border: '1px solid #EAE5F3',
                  padding: '8px',
                  zIndex: 100,
                  boxSizing: 'border-box'
                }}>
                  {/* Account Header */}
                  <div style={{
                    padding: '12px 14px',
                    backgroundColor: '#F8F7FF',
                    borderRadius: '12px',
                    marginBottom: '6px'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: isSuperAdmin
                          ? 'linear-gradient(135deg, #F6C358 0%, #D97706 100%)'
                          : 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 100%)',
                        color: isSuperAdmin ? '#191B35' : '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.92rem',
                        flexShrink: 0
                      }}>
                        {user.username ? user.username.charAt(0).toUpperCase() : 'A'}
                      </div>
                      <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ fontWeight: 800, color: '#191B35', fontSize: '0.92rem' }}>
                            {user.username}
                          </span>
                          <span style={{
                            backgroundColor: isSuperAdmin ? '#FEF3C7' : '#EDE9FE',
                            color: isSuperAdmin ? '#B45309' : '#6D28D9',
                            fontSize: '0.62rem',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            letterSpacing: '0.04em'
                          }}>
                            {user.role}
                          </span>
                        </div>
                        {user.email && (
                          <div style={{
                            fontSize: '0.76rem',
                            color: '#64748B',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {user.email}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Navigation Quick Links */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', padding: '4px 0' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setProfileDropdownOpen(false);
                        navigate('/dashboard');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.84rem',
                        color: '#191B35',
                        backgroundColor: 'transparent',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'left',
                        fontWeight: 600,
                        transition: 'background-color 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F0FF'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <LayoutDashboard size={16} style={{ color: '#7C3AED' }} />
                      <span>Learner Dashboard</span>
                    </button>

                    {isSuperAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          setProfileDropdownOpen(false);
                          setActiveTab('users');
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          width: '100%',
                          padding: '9px 12px',
                          fontSize: '0.84rem',
                          color: '#191B35',
                          backgroundColor: 'transparent',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          textAlign: 'left',
                          fontWeight: 600,
                          transition: 'background-color 0.15s ease'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F4F0FF'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                      >
                        <Users size={16} style={{ color: '#F6C358' }} />
                        <span>User Access Management</span>
                      </button>
                    )}
                  </div>

                  {/* Subtle Divider */}
                  <div style={{ height: '1px', backgroundColor: '#EAE5F3', margin: '4px 6px' }} />

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      setProfileDropdownOpen(false);
                      await logout();
                      navigate('/ResonovaNotreoble');
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      width: '100%',
                      padding: '10px 12px',
                      fontSize: '0.84rem',
                      color: '#DC2626',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontWeight: 700,
                      transition: 'background-color 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FEF2F2'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <LogOut size={16} style={{ color: '#DC2626' }} />
                    <span>Log Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <div className="admin-content-area">
          {/* Alerts */}
          {error && (
            <div style={{ padding: '10px 16px', backgroundColor: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '10px', color: '#991B1B', marginBottom: '16px', fontSize: '0.82rem' }}>
              {error}
            </div>
          )}
          {successMsg && (
            <div style={{ padding: '10px 16px', backgroundColor: '#F4F0FF', border: '1px solid #7C3AED', borderRadius: '10px', color: '#191B35', marginBottom: '16px', fontSize: '0.82rem', fontWeight: 600 }}>
              {successMsg}
            </div>
          )}

          {/* Tab 1: Dashboard Analytics */}
          {activeTab === 'overview' && overview && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Analytics Header Summary */}
              <div style={{ backgroundColor: '#FFFFFF', padding: '20px 24px', borderRadius: '16px', border: '1px solid #EAE5F3', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 4px 0', color: '#191B35' }}>
                    Platform Activity &amp; Vocalist Analytics
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.84rem', color: '#77728A' }}>
                    Real-time database metrics tracking registered vocalists, authentication traffic, and practice duration.
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveTab('welcome_page')}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #EAE5F3', backgroundColor: '#F8FAF8', color: '#191B35', fontWeight: 700, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Globe size={14} color="#7C3AED" />
                    <span>Manage Welcome Page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('curriculum')}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: 'var(--dash-sidebar-bg, #201B45)', color: '#FFFFFF', fontWeight: 750, fontSize: '0.8rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <Layers size={14} />
                    <span>Curriculum Studio</span>
                  </button>
                </div>
              </div>

              {/* 6 Key Stat Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                <div className="dash-stat-card">
                  <div className="dash-stat-value">{overview.totalUsers}</div>
                  <div className="dash-stat-label">Registered Vocalists</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-value" style={{ color: '#0D9488' }}>{overview.totalLogins || 0}</div>
                  <div className="dash-stat-label">Total Platform Logins</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-value" style={{ color: '#7C3AED' }}>{overview.totalPortalVisits || 0}</div>
                  <div className="dash-stat-label">Total Portal Visits</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-value" style={{ color: '#2563EB' }}>{overview.uniqueLoginUsers || 0}</div>
                  <div className="dash-stat-label">Unique Active Users</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-value">{overview.totalPracticeMinutes}m</div>
                  <div className="dash-stat-label">Total Practice Logged</div>
                </div>
                <div className="dash-stat-card">
                  <div className="dash-stat-value" style={{ color: '#D97706' }}>
                    {submissions.filter(s => s.assessment_status === 'AWAITING_REVIEW').length}
                  </div>
                  <div className="dash-stat-label">Awaiting Teacher Review</div>
                </div>
              </div>

              {/* Live Tables: Recent Registrations & Recent Logins */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '18px' }}>
                {/* Recent Registered Users */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #EAE5F3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#191B35' }}>
                      Recent Vocalist Registrations
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#77728A', fontWeight: 650 }}>Latest 5 users</span>
                  </div>
                  {(!overview.recentUsers || overview.recentUsers.length === 0) ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#77728A', fontSize: '0.84rem' }}>
                      No registered vocalists recorded yet.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid #EAE5F3', color: '#77728A', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                            <th style={{ padding: '8px 10px' }}>User</th>
                            <th style={{ padding: '8px 10px' }}>Musical Goal</th>
                            <th style={{ padding: '8px 10px' }}>Registered</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.recentUsers.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #F4F0FF' }}>
                              <td style={{ padding: '10px' }}>
                                <div style={{ fontWeight: 750, color: '#191B35' }}>{u.username}</div>
                                <div style={{ fontSize: '0.74rem', color: '#77728A' }}>{u.email}</div>
                              </td>
                              <td style={{ padding: '10px', color: '#7C3AED', fontWeight: 600 }}>
                                {u.selected_musical_goal || 'General Vocal'}
                              </td>
                              <td style={{ padding: '10px', color: '#77728A', fontSize: '0.76rem' }}>
                                {new Date(u.created_at).toLocaleDateString()} {new Date(u.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Recent Portal Logins & Traffic */}
                <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px', border: '1px solid #EAE5F3' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '0.98rem', fontWeight: 800, margin: 0, color: '#191B35' }}>
                      Recent Portal Logins &amp; Traffic
                    </h4>
                    <span style={{ fontSize: '0.72rem', color: '#77728A', fontWeight: 650 }}>Live Authentication Events</span>
                  </div>
                  {(() => {
                    const recentLoginsToDisplay = (overview.recentLogins || []).filter(l => {
                      if (isSuperAdmin) return true;
                      const uname = (l.username || '').toLowerCase();
                      const role = (l.user_role || '').toUpperCase();
                      return role !== 'SUPERADMIN' && uname !== 'notreoblemccmrfip' && !uname.includes('superadmin');
                    });

                    if (recentLoginsToDisplay.length === 0) {
                      return (
                        <div style={{ padding: '24px', textAlign: 'center', color: '#77728A', fontSize: '0.84rem' }}>
                          No recent login activity recorded.
                        </div>
                      );
                    }

                    return (
                      <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.82rem' }}>
                          <thead>
                            <tr style={{ borderBottom: '1.5px solid #EAE5F3', color: '#77728A', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                              <th style={{ padding: '8px 10px' }}>Account</th>
                              <th style={{ padding: '8px 10px' }}>Action</th>
                              <th style={{ padding: '8px 10px' }}>IP / Device</th>
                              <th style={{ padding: '8px 10px' }}>Timestamp</th>
                            </tr>
                          </thead>
                          <tbody>
                            {recentLoginsToDisplay.map(l => (
                              <tr key={l.id} style={{ borderBottom: '1px solid #F4F0FF' }}>
                                <td style={{ padding: '10px', fontWeight: 700, color: '#191B35' }}>
                                  {l.username || 'System User'}
                                </td>
                                <td style={{ padding: '10px' }}>
                                  <span style={{ padding: '2px 8px', borderRadius: 4, backgroundColor: '#DCFCE7', color: '#166534', fontSize: '0.72rem', fontWeight: 700 }}>
                                    {l.action === 'LOGIN_SUCCESS_WITH_MFA' ? 'MFA Login' : 'Login Success'}
                                  </span>
                                </td>
                                <td style={{ padding: '10px', color: '#77728A', fontSize: '0.76rem' }}>
                                  {l.ip_address || '127.0.0.1'}
                                </td>
                                <td style={{ padding: '10px', color: '#77728A', fontSize: '0.76rem' }}>
                                  {new Date(l.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Welcome Page Content */}
          {activeTab === 'welcome_page' && (
            <WelcomePageManager />
          )}

          {/* Tab 3: Curriculum & 5 Stages Management */}
          {activeTab === 'curriculum' && (
            <AdminCurriculumManager />
          )}

          {/* Tab 3b: Video Transcripts Management Studio */}
          {activeTab === 'transcripts' && (
            <AdminTranscriptManager />
          )}

          {/* Tab 4: Student Answers & Grading */}
          {activeTab === 'submissions' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '1px solid #EAE5F3' }}>
              {/* Header with Sub-Tabs */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: '0 0 4px 0', color: '#191B35' }}>
                    Student Answers &amp; Assessment Studio
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.82rem', color: '#77728A' }}>
                    Review student answers to curriculum tasks, Fact or Myth quizzes, pinboard reflections, and listen to recordings.
                  </p>
                </div>

                {/* Sub Tab Switcher */}
                <div style={{ display: 'flex', gap: '6px', backgroundColor: '#F8FAF8', padding: '4px', borderRadius: '10px', border: '1px solid #EAE5F3' }}>
                  {[
                    { key: 'tasks', label: `Task Submissions (${submissions.length})` },
                    { key: 'myth_fact', label: `Fact or Myth Answers (${mfStudentResults.length})` },
                    { key: 'reflections', label: `Pinboard Reflections (${reflectionAnswers.length})` }
                  ].map((st) => (
                    <button
                      key={st.key}
                      type="button"
                      onClick={() => setSubmissionTab(st.key)}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: submissionTab === st.key ? 'var(--dash-sidebar-bg, #201B45)' : 'transparent',
                        color: submissionTab === st.key ? '#FFFFFF' : '#77728A',
                        fontWeight: submissionTab === st.key ? 750 : 600,
                        fontSize: '0.78rem',
                        cursor: 'pointer'
                      }}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sub-tab 1: Tasks Submissions */}
              {submissionTab === 'tasks' && (
                <div>
                  {/* Status Filter Tabs */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#77728A' }}>
                      Filter by Evaluation Status:
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {[
                        { id: '', label: 'All Submissions' },
                        { id: 'AWAITING_REVIEW', label: 'Awaiting Review' },
                        { id: 'ASSESSED', label: 'Assessed' },
                        { id: 'NEEDS_REVISION', label: 'Needs Revision' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => setSubmissionFilter(f.id)}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '9999px',
                            border: submissionFilter === f.id ? '1.5px solid #7C3AED' : '1px solid #EAE5F3',
                            backgroundColor: submissionFilter === f.id ? '#F4F0FF' : '#FFFFFF',
                            color: submissionFilter === f.id ? '#191B35' : '#77728A',
                            fontWeight: submissionFilter === f.id ? 700 : 500,
                            fontSize: '0.76rem',
                            cursor: 'pointer'
                          }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submissions List */}
                  {submissions.length === 0 ? (
                    <div style={{ padding: '36px', textAlign: 'center', backgroundColor: '#F8FAF8', borderRadius: '12px', color: '#77728A' }}>
                      <p style={{ margin: 0, fontSize: '0.88rem' }}>No student submissions found matching this filter.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {submissions.map((sub) => {
                        const isGradingThis = activeGradingSubId === sub.submission_id;
                        const isAudio = sub.submission_type === 'audio' || !!sub.file_reference;
                        const audioSrc = isAudio ? `/api/learning/submissions/${sub.submission_id}/audio?token=${token}` : null;

                        return (
                          <div
                            key={sub.submission_id}
                            style={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #EAE5F3',
                              borderRadius: '14px',
                              padding: '18px 20px',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                                  <span style={{ fontSize: '0.94rem', fontWeight: 750, color: '#191B35' }}>
                                    {sub.username}
                                  </span>
                                  <span style={{ fontSize: '0.78rem', color: '#77728A' }}>({sub.email})</span>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    backgroundColor: '#F8F7FC',
                                    color: '#191B35',
                                    padding: '2px 7px',
                                    borderRadius: '4px'
                                  }}>
                                    v{sub.submission_version || 1}
                                  </span>
                                </div>
                                <div style={{ fontSize: '0.84rem', color: '#7C3AED', fontWeight: 650 }}>
                                  Stage {sub.stage_number.toString().padStart(2, '0')}: {sub.stage_title} · {sub.task_title}
                                </div>
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className={`status-pill ${sub.assessment_status === 'COMPLETED' || sub.assessment_status === 'ASSESSED' ? 'completed' :
                                  (sub.assessment_status === 'AWAITING_REVIEW' ? 'submitted' : 'needs-revision')
                                  }`}>
                                  {sub.assessment_status === 'AWAITING_REVIEW' ? 'Awaiting Review' : sub.assessment_status}
                                </span>

                                <span style={{ fontSize: '0.85rem', fontWeight: 750, color: '#191B35' }}>
                                  {sub.marks_awarded !== null ? `${sub.marks_awarded} / ${sub.maximum_marks} marks` : `Max: ${sub.maximum_marks} marks`}
                                </span>

                                <button
                                  type="button"
                                  onClick={() => isGradingThis ? setActiveGradingSubId(null) : handleStartGrading(sub)}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: '9999px',
                                    backgroundColor: isGradingThis ? '#EAE5F3' : '#7C3AED',
                                    color: isGradingThis ? '#191B35' : '#FFFFFF',
                                    border: 'none',
                                    fontSize: '0.78rem',
                                    fontWeight: 700,
                                    cursor: 'pointer'
                                  }}
                                >
                                  {isGradingThis ? 'Close Panel' : (sub.assessment_status === 'AWAITING_REVIEW' ? 'Evaluate & Grade' : 'Edit Assessment')}
                                </button>
                              </div>
                            </div>

                            {/* Content Preview */}
                            {isAudio && (
                              <div style={{
                                backgroundColor: '#F8FAF8',
                                padding: '12px 14px',
                                borderRadius: '10px',
                                border: '1px solid #EAE5F3',
                                marginBottom: '10px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '14px',
                                flexWrap: 'wrap'
                              }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#191B35' }}>
                                  Singing Audio Recording:
                                </span>
                                <audio controls src={audioSrc} style={{ flex: 1, minWidth: '240px', height: '36px' }} />
                                {sub.original_file_name && (
                                  <span style={{ fontSize: '0.74rem', color: '#77728A' }}>
                                    {sub.original_file_name}
                                  </span>
                                )}
                              </div>
                            )}

                            {sub.text_response && !isAudio && (
                              <div style={{
                                backgroundColor: '#F8FAF8',
                                padding: '10px 14px',
                                borderRadius: '10px',
                                border: '1px solid #EAE5F3',
                                marginBottom: '10px',
                                fontSize: '0.84rem',
                                color: '#191B35',
                                lineHeight: 1.5
                              }}>
                                <strong>Student Response:</strong> {sub.text_response}
                              </div>
                            )}

                            {/* Previous Feedback (if assessed) */}
                            {sub.feedback && !isGradingThis && (
                              <div style={{ fontSize: '0.8rem', color: '#4A635E', marginTop: '6px' }}>
                                <strong>Current Feedback:</strong> {sub.feedback}
                                {sub.improvement_suggestions && <span> · <em>Suggestions: {sub.improvement_suggestions}</em></span>}
                              </div>
                            )}

                            {/* Grading Drawer / Panel */}
                            {isGradingThis && (
                              <div style={{
                                marginTop: '14px',
                                padding: '16px',
                                backgroundColor: '#F4F8F5',
                                borderRadius: '12px',
                                border: '1.5px solid #7C3AED'
                              }}>
                                <h4 style={{ fontSize: '0.94rem', fontWeight: 750, color: '#191B35', margin: '0 0 12px 0' }}>
                                  Instructor Assessment Form (Out of {sub.maximum_marks} Marks)
                                </h4>

                                <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: '14px', marginBottom: '12px' }}>
                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#191B35', marginBottom: '4px' }}>
                                      Marks Awarded:
                                    </label>
                                    <input
                                      type="number"
                                      min={0}
                                      max={sub.maximum_marks}
                                      value={gradingForm.marks_awarded}
                                      onChange={(e) => setGradingForm({ ...gradingForm, marks_awarded: e.target.value })}
                                      style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #EAE5F3',
                                        fontSize: '0.86rem',
                                        fontWeight: 700,
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                    <span style={{ fontSize: '0.72rem', color: '#77728A' }}>
                                      Max: {sub.maximum_marks} marks
                                    </span>
                                  </div>

                                  <div>
                                    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#191B35', marginBottom: '4px' }}>
                                      Written Pedagogical Feedback:
                                    </label>
                                    <input
                                      type="text"
                                      value={gradingForm.feedback}
                                      onChange={(e) => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                                      placeholder="Commend technique, airflow stability, and phrase coordination..."
                                      style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '8px',
                                        border: '1px solid #EAE5F3',
                                        fontSize: '0.84rem',
                                        boxSizing: 'border-box'
                                      }}
                                    />
                                  </div>
                                </div>

                                <div style={{ marginBottom: '14px' }}>
                                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: '#191B35', marginBottom: '4px' }}>
                                    Improvement Suggestions &amp; Practice Guidance:
                                  </label>
                                  <input
                                    type="text"
                                    value={gradingForm.improvement_suggestions}
                                    onChange={(e) => setGradingForm({ ...gradingForm, improvement_suggestions: e.target.value })}
                                    placeholder="e.g. Try holding the ribcage 2 seconds longer before releasing sound..."
                                    style={{
                                      width: '100%',
                                      padding: '8px 12px',
                                      borderRadius: '8px',
                                      border: '1px solid #EAE5F3',
                                      fontSize: '0.84rem',
                                      boxSizing: 'border-box'
                                    }}
                                  />
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleRequestRevisionSubmit(sub.submission_id)}
                                    disabled={gradingLoading}
                                    style={{
                                      padding: '8px 16px',
                                      borderRadius: '9999px',
                                      backgroundColor: '#FEE2E2',
                                      color: '#991B1B',
                                      border: '1px solid #FCA5A5',
                                      fontSize: '0.8rem',
                                      fontWeight: 700,
                                      cursor: 'pointer'
                                    }}
                                  >
                                    Request Revision
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => handleAssessSubmit(sub.submission_id)}
                                    disabled={gradingLoading}
                                    style={{
                                      padding: '8px 22px',
                                      borderRadius: '9999px',
                                      backgroundColor: '#7C3AED',
                                      color: '#FFFFFF',
                                      border: 'none',
                                      fontSize: '0.8rem',
                                      fontWeight: 750,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px'
                                    }}
                                  >
                                    <CheckCircle2 size={15} />
                                    <span>Submit Official Assessment</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 2: Fact or Myth Quiz Answers */}
              {submissionTab === 'myth_fact' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 750, color: '#191B35', margin: 0 }}>
                      Stage 4: Breathe Right – Myth or Fact Quiz Results
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#77728A' }}>
                      {mfStudentResults.length} student submissions
                    </span>
                  </div>
                  {mfStudentResults.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F8FAF8', borderRadius: '12px', color: '#77728A' }}>
                      No student quiz attempts recorded yet.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.84rem' }}>
                        <thead>
                          <tr style={{ borderBottom: '1.5px solid #EAE5F3', color: '#77728A', textTransform: 'uppercase', fontSize: '0.72rem' }}>
                            <th style={{ padding: '10px 12px' }}>Student</th>
                            <th style={{ padding: '10px 12px' }}>Attempts</th>
                            <th style={{ padding: '10px 12px' }}>Best Score</th>
                            <th style={{ padding: '10px 12px' }}>Latest Score</th>
                            <th style={{ padding: '10px 12px' }}>Status</th>
                            <th style={{ padding: '10px 12px' }}>Correct / Incorrect</th>
                            <th style={{ padding: '10px 12px' }}>Last Attempt</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mfStudentResults.map(s => (
                            <tr key={s.user_id} style={{ borderBottom: '1px solid #F4F0FF' }}>
                              <td style={{ padding: '12px' }}>
                                <div style={{ fontWeight: 750, color: '#191B35' }}>{s.username || 'Student'}</div>
                                <div style={{ fontSize: '0.74rem', color: '#77728A' }}>{s.email}</div>
                              </td>
                              <td style={{ padding: '12px', fontWeight: 650 }}>#{s.total_attempts || 1}</td>
                              <td style={{ padding: '12px', fontWeight: 750, color: '#15966A' }}>
                                {s.best_score || 0} ({s.best_percentage || 0}%)
                              </td>
                              <td style={{ padding: '12px', fontWeight: 650 }}>
                                {s.latest_score || 0} ({s.latest_percentage || 0}%)
                              </td>
                              <td style={{ padding: '12px' }}>
                                <span style={{
                                  padding: '2px 8px',
                                  borderRadius: 4,
                                  fontSize: '0.72rem',
                                  fontWeight: 750,
                                  backgroundColor: s.latest_status === 'COMPLETED' ? '#DCFCE7' : '#FEF3C7',
                                  color: s.latest_status === 'COMPLETED' ? '#166534' : '#92400E'
                                }}>
                                  {s.latest_status || 'ATTEMPTED'}
                                </span>
                              </td>
                              <td style={{ padding: '12px', fontSize: '0.78rem' }}>
                                <span style={{ color: '#16A34A', fontWeight: 700 }}>{s.total_correct_answers || 0} correct</span> •{' '}
                                <span style={{ color: '#DC2626', fontWeight: 700 }}>{s.total_incorrect_answers || 0} incorrect</span>
                              </td>
                              <td style={{ padding: '12px', color: '#77728A', fontSize: '0.76rem' }}>
                                {s.last_attempt_date ? new Date(s.last_attempt_date).toLocaleString() : 'N/A'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Sub-tab 3: Learning Pinboard Reflections */}
              {submissionTab === 'reflections' && (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '1rem', fontWeight: 750, color: '#191B35', margin: 0 }}>
                      Stage 4: Learning Reflection Pinboard Answers
                    </h4>
                    <span style={{ fontSize: '0.75rem', color: '#77728A' }}>
                      {reflectionAnswers.length} student reflections
                    </span>
                  </div>
                  {reflectionAnswers.length === 0 ? (
                    <div style={{ padding: '32px', textAlign: 'center', backgroundColor: '#F8FAF8', borderRadius: '12px', color: '#77728A' }}>
                      No student pinboard reflections recorded yet.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      {reflectionAnswers.map(r => (
                        <div key={r.id || r.user_id} style={{ backgroundColor: '#F9FBF9', border: '1px solid #DFEBE3', borderRadius: '12px', padding: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                            <div>
                              <span style={{ fontWeight: 750, color: '#191B35', fontSize: '0.92rem' }}>{r.username}</span>
                              <span style={{ fontSize: '0.76rem', color: '#77728A', marginLeft: '8px' }}>({r.email})</span>
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#77728A' }}>
                              Submitted: {new Date(r.submitted_at).toLocaleString()}
                            </div>
                          </div>
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px', fontSize: '0.82rem' }}>
                            <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAE5F3' }}>
                              <strong style={{ color: '#7C3AED', display: 'block', marginBottom: '4px' }}>1. What I Know:</strong>
                              <p style={{ margin: 0, color: '#334155', lineHeight: 1.4 }}>{r.question_1_answer || '—'}</p>
                            </div>
                            <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAE5F3' }}>
                              <strong style={{ color: '#7C3AED', display: 'block', marginBottom: '4px' }}>2. What I Want to Know:</strong>
                              <p style={{ margin: 0, color: '#334155', lineHeight: 1.4 }}>{r.question_2_answer || '—'}</p>
                            </div>
                            <div style={{ backgroundColor: '#FFFFFF', padding: '10px 12px', borderRadius: '8px', border: '1px solid #EAE5F3' }}>
                              <strong style={{ color: '#7C3AED', display: 'block', marginBottom: '4px' }}>3. What I Have Learned:</strong>
                              <p style={{ margin: 0, color: '#334155', lineHeight: 1.4 }}>{r.question_3_answer || '—'}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab: Branding & Harmonic Color Palette Wheel Studio */}
          {activeTab === 'theme' && (
            <ColorPaletteWheel
              onThemeApplied={(t) => {
                setSuccessMsg(`Branding theme "${t.theme_name}" applied and saved across No Tre(ou)ble!`);
              }}
            />
          )}

          {/* Tab 3: Users Management (Superadmin Only) */}
          {isSuperAdmin && activeTab === 'users' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '22px', border: '1px solid #EAE5F3' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0 }}>Registered Users</h3>
                {isSuperAdmin && (
                  <button
                    onClick={() => setShowAdminForm(!showAdminForm)}
                    className="dash-btn-primary"
                    style={{ padding: '8px 16px', fontSize: '0.85rem' }}
                  >
                    <UserPlus size={16} />
                    <span>{showAdminForm ? 'Close Form' : 'Create Admin Account'}</span>
                  </button>
                )}
              </div>

              {/* Admin Provisioning Form (Superadmin only) */}
              {isSuperAdmin && showAdminForm && (
                <form onSubmit={handleCreateAdmin} style={{ backgroundColor: '#F8FAF8', padding: '20px', borderRadius: '14px', border: '1px solid #EAE5F3', marginBottom: '24px' }}>
                  <h4 style={{ margin: '0 0 14px 0', fontSize: '1rem', fontWeight: 700 }}>Provision Admin Account</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '14px' }}>
                    <input
                      type="text"
                      required
                      placeholder="Username"
                      value={adminForm.username}
                      onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE5F3' }}
                    />
                    <input
                      type="email"
                      required
                      placeholder="Email"
                      value={adminForm.email}
                      onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE5F3' }}
                    />
                    <input
                      type="password"
                      required
                      placeholder="Password"
                      value={adminForm.password}
                      onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                      style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE5F3' }}
                    />
                    <div style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #EAE5F3', backgroundColor: '#FFFFFF', color: '#4D518A', fontWeight: 700, fontSize: '0.85rem', display: 'flex', alignItems: 'center' }}>
                      Role: ADMIN
                    </div>
                  </div>
                  <button type="submit" className="dash-btn-primary" style={{ padding: '8px 18px', fontSize: '0.85rem' }}>
                    Create Account
                  </button>
                </form>
              )}

              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #EAE5F3', fontSize: '0.82rem', color: '#77728A', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>User</th>
                      <th style={{ padding: '10px 12px' }}>Role</th>
                      <th style={{ padding: '10px 12px' }}>Practice Time</th>
                      <th style={{ padding: '10px 12px' }}>Completed Events</th>
                      <th style={{ padding: '10px 12px' }}>Musical Goal</th>
                      {isSuperAdmin && <th style={{ padding: '10px 12px' }}>Action</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map(u => (
                      <tr key={u.id} style={{ borderBottom: '1px solid #EAE5F3', fontSize: '0.9rem' }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 700, color: '#191B35' }}>{u.username}</div>
                          <div style={{ fontSize: '0.78rem', color: '#77728A' }}>{u.email}</div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            backgroundColor: u.role === 'SUPERADMIN' ? '#F6C358' : (u.role === 'ADMIN' ? '#F4F0FF' : '#F8F7FC'),
                            color: '#191B35',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700
                          }}>
                            {u.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px', fontWeight: 600, color: '#7C3AED' }}>
                          {u.total_practice_minutes} min ({u.total_sessions} sess)
                        </td>
                        <td style={{ padding: '12px' }}>
                          {u.completed_activities} events
                        </td>
                        <td style={{ padding: '12px', color: '#77728A', fontSize: '0.85rem' }}>
                          {u.selected_musical_goal || 'Not selected'}
                        </td>
                        {isSuperAdmin && (
                          <td style={{ padding: '12px' }}>
                            {u.role !== 'SUPERADMIN' && u.id !== user.id ? (
                              <select
                                value={u.role}
                                onChange={(e) => handleRoleChange(u.id, e.target.value)}
                                style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #EAE5F3', fontSize: '0.8rem' }}
                              >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                              </select>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#77728A' }}>—</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab 4: Practice Reports */}
          {activeTab === 'reports' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #EAE5F3' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>Platform Practice Logs</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #EAE5F3', fontSize: '0.82rem', color: '#77728A', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Date</th>
                      <th style={{ padding: '10px 12px' }}>Vocalist</th>
                      <th style={{ padding: '10px 12px' }}>Exercise</th>
                      <th style={{ padding: '10px 12px' }}>Duration</th>
                      <th style={{ padding: '10px 12px' }}>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#77728A', fontSize: '0.88rem' }}>
                          No practice sessions recorded yet in the database.
                        </td>
                      </tr>
                    ) : (
                      reports.map(r => (
                        <tr key={r.id} style={{ borderBottom: '1px solid #EAE5F3', fontSize: '0.88rem' }}>
                          <td style={{ padding: '12px', color: '#77728A' }}>
                            {new Date(r.completed_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{r.username}</td>
                          <td style={{ padding: '12px' }}>{r.exercise_name || r.session_type}</td>
                          <td style={{ padding: '12px', fontWeight: 700, color: '#7C3AED' }}>{r.duration_minutes}m</td>
                          <td style={{ padding: '12px', color: '#77728A' }}>{r.notes || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tab: Student Practice Commitments & Learning Journal (Requirement 10) */}
          {activeTab === 'commitments' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {/* Filter Bar */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '16px', padding: '20px 24px', border: '1px solid #EAE5F3', display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 220 }}>
                  <Search size={16} color="#94A3B8" />
                  <input
                    type="text"
                    placeholder="Filter by student name or email..."
                    value={commitmentStudentSearch}
                    onChange={(e) => setCommitmentStudentSearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.88rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>From:</span>
                  <input
                    type="date"
                    value={commitmentStartDate}
                    onChange={(e) => setCommitmentStartDate(e.target.value)}
                    style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>To:</span>
                  <input
                    type="date"
                    value={commitmentEndDate}
                    onChange={(e) => setCommitmentEndDate(e.target.value)}
                    style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid #CBD5E1', fontSize: '0.84rem' }}
                  />
                </div>

                {(commitmentStudentSearch || commitmentStartDate || commitmentEndDate) && (
                  <button
                    type="button"
                    onClick={() => {
                      setCommitmentStudentSearch('');
                      setCommitmentStartDate('');
                      setCommitmentEndDate('');
                    }}
                    style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #CBD5E1', background: '#F1F5F9', color: '#475569', fontSize: '0.82rem', fontWeight: 650, cursor: 'pointer' }}
                  >
                    Clear Filters
                  </button>
                )}
              </div>

              {/* Commitments Table Card */}
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #EAE5F3' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: '0 0 4px 0' }}>
                      Student Practice Commitments &amp; Progress
                    </h3>
                    <p style={{ fontSize: '0.84rem', color: '#64748B', margin: 0 }}>
                      Monitor student weekly targets, Learning Journal Kanban sessions, and real Module 1 completion percentages.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={loadCommitments}
                    disabled={commitmentsLoading}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: '#F4F0FF', color: '#7C3AED', border: '1px solid #EAE5F3', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer' }}
                  >
                    <RefreshCw size={13} className={commitmentsLoading ? 'dash-spin' : ''} />
                    <span>Refresh</span>
                  </button>
                </div>

                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid #EAE5F3', fontSize: '0.78rem', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        <th style={{ padding: '10px 12px' }}>Student</th>
                        <th style={{ padding: '10px 12px' }}>Minutes / Sess</th>
                        <th style={{ padding: '10px 12px' }}>Sess / Wk</th>
                        <th style={{ padding: '10px 12px' }}>Weekly Commitment</th>
                        <th style={{ padding: '10px 12px' }}>Sessions (P / PR / D)</th>
                        <th style={{ padding: '10px 12px' }}>Lessons %</th>
                        <th style={{ padding: '10px 12px' }}>Journal %</th>
                        <th style={{ padding: '10px 12px' }}>Practice %</th>
                        <th style={{ padding: '10px 12px' }}>Module 1 Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commitmentsLoading ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '36px', textAlign: 'center', color: '#64748B' }}>
                            <RefreshCw size={20} className="dash-spin" style={{ margin: '0 auto 8px' }} />
                            <div>Loading student practice commitments...</div>
                          </td>
                        </tr>
                      ) : commitmentsList.length === 0 ? (
                        <tr>
                          <td colSpan="9" style={{ padding: '36px', textAlign: 'center', color: '#64748B', fontSize: '0.88rem' }}>
                            No student commitments matching your filter criteria.
                          </td>
                        </tr>
                      ) : (
                        commitmentsList.map(item => (
                          <tr key={item.student_id} style={{ borderBottom: '1px solid #F1F5F9', fontSize: '0.88rem' }}>
                            <td style={{ padding: '12px' }}>
                              <div style={{ fontWeight: 750, color: '#0F172A' }}>{item.student_name || 'Student'}</div>
                              <div style={{ fontSize: '0.76rem', color: '#64748B' }}>{item.student_email}</div>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 650, color: '#334155' }}>
                              {item.minutes_per_session ? `${item.minutes_per_session} min` : '—'}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 650, color: '#334155' }}>
                              {item.sessions_per_week ? `${item.sessions_per_week} days` : '—'}
                            </td>
                            <td style={{ padding: '12px', fontWeight: 800, color: '#0D9488' }}>
                              {item.weekly_minutes ? `${item.weekly_minutes} min/wk` : '—'}
                            </td>
                            <td style={{ padding: '12px', fontSize: '0.82rem' }}>
                              <span style={{ color: '#64748B' }}>{item.planned_sessions || 0} to do</span> •{' '}
                              <span style={{ color: '#0D9488', fontWeight: 600 }}>{item.practising_sessions || 0} doing</span> •{' '}
                              <span style={{ color: '#16A34A', fontWeight: 700 }}>{item.done_sessions || 0} done</span>
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#0D9488' }}>
                              {item.lessonsPercentage}%
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#2563EB' }}>
                              {item.journalPercentage}%
                            </td>
                            <td style={{ padding: '12px', fontWeight: 700, color: '#7C3AED' }}>
                              {item.practicePercentage}%
                            </td>
                            <td style={{ padding: '12px' }}>
                              {item.isModuleComplete ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#DCFCE7', color: '#166534', padding: '3px 8px', borderRadius: 9999, fontSize: '0.74rem', fontWeight: 800 }}>
                                  <CheckCircle2 size={12} /> COMPLETE
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#FEF3C7', color: '#92400E', padding: '3px 8px', borderRadius: 9999, fontSize: '0.74rem', fontWeight: 800 }}>
                                  <Clock size={12} /> IN PROGRESS
                                </span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Audit Logs (Superadmin only) */}
          {isSuperAdmin && activeTab === 'audit' && (
            <div style={{ backgroundColor: '#FFFFFF', borderRadius: '20px', padding: '28px', border: '1px solid #EAE5F3' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '20px' }}>Admin Action Audit Trail</h3>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #EAE5F3', fontSize: '0.82rem', color: '#77728A', textTransform: 'uppercase' }}>
                      <th style={{ padding: '10px 12px' }}>Timestamp</th>
                      <th style={{ padding: '10px 12px' }}>Admin</th>
                      <th style={{ padding: '10px 12px' }}>Action</th>
                      <th style={{ padding: '10px 12px' }}>Target</th>
                      <th style={{ padding: '10px 12px' }}>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditLogs.length === 0 ? (
                      <tr>
                        <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#77728A', fontSize: '0.88rem' }}>
                          No administrative actions logged yet in the database.
                        </td>
                      </tr>
                    ) : (
                      auditLogs.map(l => (
                        <tr key={l.id} style={{ borderBottom: '1px solid #EAE5F3', fontSize: '0.88rem' }}>
                          <td style={{ padding: '12px', color: '#77728A' }}>
                            {new Date(l.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: '12px', fontWeight: 600 }}>{l.admin_username}</td>
                          <td style={{ padding: '12px', color: '#191B35', fontWeight: 600 }}>{l.action}</td>
                          <td style={{ padding: '12px', color: '#77728A' }}>{l.target_type} #{l.target_id}</td>
                          <td style={{ padding: '12px', color: '#77728A', fontSize: '0.82rem' }}>{l.details || '-'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div >

  );
}
