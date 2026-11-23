import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';
import UserSidebar from '../components/UserSidebar';
import {
  Menu,
  Wind,
  Music,
  Activity,
  Mic,
  Sparkles,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Clock,
  Compass,
  X,
  Volume2,
  RefreshCw
} from 'lucide-react';
import '../styles/dashboard.css';

export default function ModuleSelectionPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lockedModal, setLockedModal] = useState(null);

  const fetchModules = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getLearningModules();
      if (res.success && Array.isArray(res.modules)) {
        setModules(res.modules);
      } else {
        setError(res.message || 'Failed to load learning modules.');
      }
    } catch (err) {
      console.error('Error fetching learning modules:', err);
      setError(err.message || 'Could not connect to the learning service.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchModules();
  }, []);

  const getModuleIcon = (category, modNum) => {
    switch (modNum) {
      case 1:
        return <Wind size={26} className="text-purple-600" />;
      case 2:
        return <Music size={26} className="text-indigo-600" />;
      case 3:
        return <Activity size={26} className="text-blue-600" />;
      case 4:
        return <Mic size={26} className="text-cyan-600" />;
      case 5:
        return <Sparkles size={26} className="text-violet-600" />;
      default:
        return <Compass size={26} className="text-purple-600" />;
    }
  };

  const handleModuleClick = (mod) => {
    if (mod.is_available && mod.module_number === 1) {
      navigate('/learning/modules/breath-management');
    } else {
      setLockedModal({
        title: mod.title,
        category: mod.category,
        moduleNumber: mod.module_number,
        message: 'This learning module will be available soon. Continue with Breath Management for now.'
      });
    }
  };

  return (
    <div className="dash-layout">
      {/* User Sidebar */}
      <UserSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Mobile Top Header */}
      <header className="mobile-header-bar">
        <button
          onClick={() => setSidebarOpen(true)}
          className="mobile-hamburger-btn"
          aria-label="Open Navigation"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-brand-title" style={{ display: 'flex', alignItems: 'center' }}>
          <img
            src="/NoTreble-Classic-darktext.png"
            alt="No Tre(ou)ble"
            style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="mobile-user-avatar"
          aria-label="Open Menu"
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : '✦'}
        </button>
      </header>

      {/* Main Content Workspace */}
      <main className="dash-main" style={{ paddingBottom: '60px' }}>
        {/* Header Breadcrumb & Heading */}
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.86rem',
            marginBottom: '10px'
          }}>
            <span style={{ color: '#77728A', fontWeight: 500 }}>Dashboard</span>
            <span style={{ color: '#9690A7' }}>/</span>
            <span style={{ color: '#7C3AED', fontWeight: 700 }}>Learning Modules</span>
          </div>

          <h1 style={{
            fontSize: '1.95rem',
            fontWeight: 800,
            color: '#191B35',
            fontFamily: "'Outfit', 'Plus Jakarta Sans', system-ui, sans-serif",
            letterSpacing: '-0.02em',
            marginBottom: '6px'
          }}>
            Learning Modules
          </h1>
          <p style={{
            fontSize: '0.98rem',
            color: '#77728A',
            margin: 0
          }}>
            Choose a module to begin. Your progress is saved automatically.
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '16px',
            marginBottom: '24px',
            color: '#991B1B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{error}</span>
            </div>
            <button
              onClick={fetchModules}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#991B1B',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* Loading Skeletons */}
        {loading && (
          <div className="module-line-list">
            {[1, 2, 3, 4, 5].map((n) => (
              <div
                key={n}
                style={{
                  height: '140px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '20px',
                  border: '1px solid #EAE5F3',
                  padding: '24px 28px',
                  boxShadow: '0 8px 24px rgba(25, 27, 53, 0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '24px'
                }}
              >
                <div className="skeleton" style={{ width: '54px', height: '54px', borderRadius: '16px', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <div className="skeleton" style={{ width: '160px', height: '18px', borderRadius: '12px', marginBottom: '10px' }} />
                  <div className="skeleton" style={{ width: '70%', height: '22px', borderRadius: '6px', marginBottom: '8px' }} />
                  <div className="skeleton" style={{ width: '90%', height: '16px', borderRadius: '6px' }} />
                </div>
                <div className="skeleton" style={{ width: '160px', height: '44px', borderRadius: '12px', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

        {/* 5 Modules - Line by Line */}
        {!loading && (
          <div className="module-line-list">
            {modules.map((mod) => {
              const isAvailable = Boolean(mod.is_available);
              const modNumFormatted = String(mod.module_number).padStart(2, '0');
              const progressPct = mod.progress_percentage || 0;
              const completedStages = mod.completed_stages || 0;
              const totalStages = mod.total_stages || 5;

              return (
                <div
                  key={mod.id || mod.module_number}
                  onClick={() => handleModuleClick(mod)}
                  className={`module-line-card ${isAvailable ? 'available' : 'locked'}`}
                >
                  <div className="module-line-left">
                    {/* Icon container */}
                    <div
                      className="module-line-icon-wrap"
                      style={{
                        backgroundColor: isAvailable ? '#F4F0FF' : '#F9FAFB',
                        border: isAvailable ? '1.5px solid #EAE5F3' : '1px solid #E5E7EB'
                      }}
                    >
                      {getModuleIcon(mod.category, mod.module_number)}
                    </div>

                    {/* Content */}
                    <div className="module-line-content">
                      {/* Meta badges row */}
                      <div className="module-line-meta">
                        <div
                          className="module-line-badge"
                          style={{
                            backgroundColor: isAvailable ? '#F4F0FF' : '#F3F4F6',
                            color: isAvailable ? '#7C3AED' : '#6B7280'
                          }}
                        >
                          MODULE {modNumFormatted} · {mod.category}
                        </div>

                        {isAvailable ? (
                          <div
                            className="module-line-status"
                            style={{
                              backgroundColor: progressPct > 0 ? '#E0F2FE' : '#ECFDF5',
                              color: progressPct > 0 ? '#0284C7' : '#15966A'
                            }}
                          >
                            <span
                              style={{
                                width: '6px',
                                height: '6px',
                                borderRadius: '50%',
                                backgroundColor: progressPct > 0 ? '#0284C7' : '#15966A',
                                display: 'inline-block'
                              }}
                            />
                            <span>{progressPct === 100 ? 'COMPLETED' : (progressPct > 0 ? 'IN PROGRESS' : 'AVAILABLE')}</span>
                          </div>
                        ) : (
                          <div
                            className="module-line-status"
                            style={{
                              backgroundColor: '#F3F4F6',
                              color: '#77728A'
                            }}
                          >
                            <Lock size={12} color="#9690A7" />
                            <span>COMING SOON</span>
                          </div>
                        )}
                      </div>

                      {/* Title */}
                      <h3
                        className="module-line-title"
                        style={{
                          color: isAvailable ? '#191B35' : '#4B5563'
                        }}
                      >
                        {mod.title}
                      </h3>

                      {/* Description */}
                      <p
                        className="module-line-desc"
                        style={{
                          color: isAvailable ? '#77728A' : '#9CA3AF'
                        }}
                      >
                        {mod.description}
                      </p>

                      {/* Progress bar for available module */}
                      {isAvailable && (
                        <div className="module-line-progress">
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            color: '#77728A',
                            marginBottom: '6px'
                          }}>
                            <span>{completedStages} of {totalStages} stages completed</span>
                            <span style={{ color: '#7C3AED', fontWeight: 800 }}>{progressPct}%</span>
                          </div>

                          <div style={{
                            width: '100%',
                            height: '7px',
                            backgroundColor: '#F4F0FF',
                            borderRadius: '9999px',
                            overflow: 'hidden'
                          }}>
                            <div
                              style={{
                                width: `${Math.min(100, Math.max(0, progressPct))}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #7C3AED, #6366F1, #3B82F6)',
                                borderRadius: '9999px',
                                transition: 'width 0.4s ease'
                              }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right side Action Button */}
                  <div className="module-line-right">
                    {isAvailable ? (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/learning/modules/breath-management');
                        }}
                        className="btn-primary-gradient"
                        style={{
                          width: '100%',
                          minWidth: '160px',
                          padding: '13px 24px',
                          fontSize: '0.94rem',
                          fontWeight: 750,
                          borderRadius: '12px',
                          letterSpacing: '0.03em',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>{mod.button_text || (completedStages > 0 ? 'CONTINUE' : 'START')}</span>
                        <ArrowRight size={16} />
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled
                        style={{
                          width: '100%',
                          minWidth: '160px',
                          padding: '13px 22px',
                          fontSize: '0.88rem',
                          fontWeight: 700,
                          borderRadius: '12px',
                          border: '1px solid #E5E7EB',
                          backgroundColor: '#F9FAFB',
                          color: '#9CA3AF',
                          cursor: 'not-allowed',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <Lock size={15} />
                        <span>COMING SOON</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Locked Module Notification Modal */}
      {lockedModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(23, 8, 43, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '24px',
            maxWidth: '460px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 25px 60px rgba(25, 27, 53, 0.25)',
            border: '1px solid #EAE5F3',
            position: 'relative'
          }}>
            <button
              onClick={() => setLockedModal(null)}
              style={{
                position: 'absolute',
                top: '18px',
                right: '18px',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: 'none',
                backgroundColor: '#F4F0FF',
                color: '#7C3AED',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <X size={16} />
            </button>

            <div style={{
              width: '52px',
              height: '52px',
              borderRadius: '16px',
              backgroundColor: '#F4F0FF',
              border: '1px solid #EAE5F3',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '18px',
              color: '#7C3AED'
            }}>
              <Lock size={24} />
            </div>

            <div style={{
              display: 'inline-block',
              backgroundColor: '#F3F4F6',
              color: '#6B7280',
              padding: '3px 10px',
              borderRadius: '9999px',
              fontSize: '0.74rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              marginBottom: '10px'
            }}>
              MODULE {String(lockedModal.moduleNumber).padStart(2, '0')} · {lockedModal.category}
            </div>

            <h3 style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              color: '#191B35',
              marginBottom: '8px',
              lineHeight: 1.3
            }}>
              {lockedModal.title}
            </h3>

            <p style={{
              fontSize: '0.92rem',
              color: '#77728A',
              lineHeight: 1.6,
              marginBottom: '26px'
            }}>
              {lockedModal.message}
            </p>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setLockedModal(null);
                  navigate('/learning/modules/breath-management');
                }}
                className="btn-primary-gradient"
                style={{
                  flex: 1,
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <span>Continue with Breath</span>
                <ArrowRight size={16} />
              </button>

              <button
                type="button"
                onClick={() => setLockedModal(null)}
                style={{
                  padding: '12px 18px',
                  borderRadius: '12px',
                  fontSize: '0.92rem',
                  fontWeight: 700,
                  backgroundColor: '#FFFFFF',
                  color: '#77728A',
                  border: '1.5px solid #EAE5F3',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
