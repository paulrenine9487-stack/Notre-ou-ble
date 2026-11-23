import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { X, UserCheck, UserPlus, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AuthChoiceModal({ isOpen, onClose, selectedGoalTitle, selectedGoalIcon: Icon }) {
  const navigate = useNavigate();
  const { setSelectedGoal } = useAuth();

  if (!isOpen) return null;

  const handleProceedToRegister = () => {
    setSelectedGoal(selectedGoalTitle);
    onClose();
    navigate('/register');
  };

  const handleProceedToLogin = () => {
    setSelectedGoal(selectedGoalTitle);
    onClose();
    navigate('/login');
  };

  return (
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
      padding: '20px',
      animation: 'modalBackdropFade 0.25s ease-out'
    }}>
      <div style={{
        background: '#ffffff',
        borderRadius: '24px',
        maxWidth: '540px',
        width: '100%',
        padding: '36px 32px',
        boxShadow: '0 25px 60px rgba(35, 8, 62, 0.25), 0 0 0 1px rgba(124, 58, 237, 0.1)',
        position: 'relative',
        animation: 'modalScaleIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            background: '#F4F0FF',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#7C3AED',
            cursor: 'pointer',
            transition: 'background 0.2s'
          }}
          title="Close"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(110deg, #7C3AED 0%, #6366F1 55%, #3B82F6 100%)',
            padding: '4px 12px',
            borderRadius: '9999px',
            color: '#FFFFFF',
            fontSize: '0.74rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: '10px'
          }}>
            <Sparkles size={12} />
            <span>Goal Selected</span>
          </div>

          <h3 style={{
            fontSize: '1.25rem',
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            fontWeight: 700,
            color: '#191B35',
            marginBottom: '6px',
            lineHeight: 1.25
          }}>
            Continue Your Journey
          </h3>

          <p style={{ color: '#6b7280', fontSize: '0.82rem' }}>
            To personalize your vocal breathing curriculum, please choose how you would like to proceed:
          </p>
        </div>

        {/* Selected Goal Card Preview */}
        <div style={{
          background: 'linear-gradient(135deg, #f8f6fc 0%, #f1ecfa 100%)',
          border: '1.5px solid #8b5cf6',
          borderRadius: '14px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          boxShadow: '0 4px 14px rgba(139, 92, 246, 0.12)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 4px 10px rgba(124, 58, 237, 0.25)'
            }}>
              {Icon ? <Icon size={17} /> : <Sparkles size={17} />}
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#7c3aed', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Your Selected Focus
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#191B35' }}>
                {selectedGoalTitle}
              </div>
            </div>
          </div>
          <CheckCircle2 size={20} style={{ color: '#7C3AED' }} />
        </div>

        {/* Two Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {/* Option 2: New User - Register (Recommended primary) */}
          <button
            onClick={handleProceedToRegister}
            className="btn-primary-gradient"
            style={{
              width: '100%',
              padding: '11px 18px',
              fontSize: '0.88rem',
              borderRadius: '12px',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '8px',
                padding: '6px'
              }}>
                <UserPlus size={18} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700 }}>New User – Register</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.9 }}>Create your account and lock in this goal</div>
              </div>
            </div>
            <span style={{ fontSize: '1.2rem' }}>→</span>
          </button>

          {/* Option 1: Existing User - Login */}
          <button
            onClick={handleProceedToLogin}
            style={{
              width: '100%',
              padding: '14px 24px',
              fontSize: '1rem',
              borderRadius: '14px',
              background: '#FFFFFF',
              border: '2px solid #EAE5F3',
              color: '#191B35',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s',
              boxShadow: '0 2px 8px rgba(25, 27, 53, 0.04)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#7C3AED';
              e.currentTarget.style.background = '#F4F0FF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#EAE5F3';
              e.currentTarget.style.background = '#FFFFFF';
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                background: '#F4F0FF',
                borderRadius: '8px',
                padding: '6px',
                color: '#7C3AED'
              }}>
                <UserCheck size={18} />
              </div>
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontWeight: 700 }}>Existing User – Login</div>
                <div style={{ fontSize: '0.75rem', color: '#77728A' }}>Sign in to continue your existing lessons</div>
              </div>
            </div>
            <span style={{ fontSize: '1.2rem', color: '#7C3AED' }}>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
