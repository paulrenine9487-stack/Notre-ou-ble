import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, X, Check } from 'lucide-react';
import { useAccessibility } from '../context/useAccessibility';

export default function AccessibilityMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    theme,
    isDark,
    setTheme,
    textSize,
    setTextSize
  } = useAccessibility();

  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Toggle dropdown panel
  const handleToggle = () => {
    setIsOpen((prev) => !prev);
  };

  // Close dropdown panel
  const handleClose = () => {
    setIsOpen(false);
    if (buttonRef.current) {
      buttonRef.current.focus();
    }
  };

  // Close on Click Outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape Key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      {/* =========================================================================
          EXACT ACCESSIBILITY BUTTON
          Preserves uploaded accessibility symbol asset
          Size: approximately 44-48px (46px diameter)
          ========================================================================= */}
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        aria-label="Accessibility Settings"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        title="Accessibility Settings"
        className="accessibility-trigger-btn"
        style={{
          width: '46px',
          height: '46px',
          padding: 0,
          margin: 0,
          borderRadius: '50%',
          backgroundColor: isDark ? '#19132B' : '#FFFFFF',
          border: isDark ? '1px solid rgba(124, 58, 237, 0.25)' : '1px solid #EAE5F3',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: isDark
            ? '0 2px 8px rgba(0, 0, 0, 0.35)'
            : '0 2px 8px rgba(36, 20, 66, 0.08)',
          transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, background-color 0.2s ease, border-color 0.2s ease',
          outline: 'none',
          flexShrink: 0
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.04)';
          e.currentTarget.style.boxShadow = isDark
            ? '0 4px 14px rgba(0, 0, 0, 0.5)'
            : '0 4px 14px rgba(124, 58, 237, 0.16)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = isDark
            ? '0 2px 8px rgba(0, 0, 0, 0.35)'
            : '0 2px 8px rgba(36, 20, 66, 0.08)';
        }}
        onFocus={(e) => {
          e.currentTarget.style.outline = '3px solid #7C3AED';
          e.currentTarget.style.outlineOffset = '2px';
        }}
        onBlur={(e) => {
          e.currentTarget.style.outline = 'none';
        }}
      >
        {/* Exactly ONE purple circular outline + ONE purple universal accessibility person inside */}
        <svg
          viewBox="0 0 100 100"
          width="28"
          height="28"
          fill="none"
          style={{ display: 'block', flexShrink: 0 }}
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id="headerAccPurpleGrad"
              gradientUnits="userSpaceOnUse"
              x1="15"
              y1="15"
              x2="85"
              y2="85"
            >
              <stop offset="0%" stopColor="#7C3AED" />
              <stop offset="50%" stopColor="#6366F1" />
              <stop offset="100%" stopColor="#5B21B6" />
            </linearGradient>
          </defs>

          {/* Exactly ONE circular outline */}
          <circle
            cx="50"
            cy="50"
            r="44"
            stroke="url(#headerAccPurpleGrad)"
            strokeWidth="6"
            fill="none"
          />

          {/* Circular Head */}
          <circle
            cx="50"
            cy="26"
            r="7.5"
            fill="url(#headerAccPurpleGrad)"
          />

          {/* Complete Accessibility Person: Outstretched Arms, Central Torso & Legs */}
          <path
            d="M 22 41.5 H 78 M 50 41.5 V 56.5 L 35 77 M 50 56.5 L 65 77"
            stroke="url(#headerAccPurpleGrad)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* =========================================================================
          ACCESSIBILITY DROPDOWN POPUP
          Heading: ACCESSIBILITY SETTINGS
          Controls: TEXT SIZE (A-, A, A+), COLOUR MODE (Light, Dark)
          ========================================================================= */}
      {isOpen && (
        <div
          ref={menuRef}
          role="dialog"
          aria-label="Accessibility Settings"
          className="accessibility-popup-panel"
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: 0,
            width: '290px',
            backgroundColor: isDark ? '#160D2C' : '#FFFFFF',
            color: isDark ? '#F8FAFC' : '#1E1B4B',
            borderRadius: '18px',
            border: isDark
              ? '1px solid rgba(167, 139, 250, 0.28)'
              : '1px solid rgba(124, 58, 237, 0.16)',
            boxShadow: isDark
              ? '0 24px 50px -10px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(167, 139, 250, 0.15)'
              : '0 20px 45px -10px rgba(25, 59, 64, 0.25), 0 8px 18px rgba(0, 0, 0, 0.06)',
            padding: '18px 20px',
            zIndex: 1000,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
            animation: 'accessibilityPopupFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Panel Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '14px',
              paddingBottom: '12px',
              borderBottom: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(0, 0, 0, 0.07)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: isDark ? 'rgba(124, 58, 237, 0.18)' : '#F4F0FF',
                  border: isDark ? '1px solid rgba(124, 58, 237, 0.35)' : '1px solid #EAE5F3',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <img
                  src="/accessibility-symbol.svg"
                  alt=""
                  style={{ width: '18px', height: '18px', objectFit: 'contain' }}
                />
              </div>
              <h2
                style={{
                  margin: 0,
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  letterSpacing: '0.07em',
                  textTransform: 'uppercase',
                  color: isDark ? '#FFFFFF' : '#191B35'
                }}
              >
                ACCESSIBILITY SETTINGS
              </h2>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close accessibility settings"
              style={{
                background: 'transparent',
                border: 'none',
                color: isDark ? '#94A3B8' : '#64748B',
                cursor: 'pointer',
                padding: '4px',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s ease, background-color 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = isDark ? '#FFFFFF' : '#0F172A';
                e.currentTarget.style.backgroundColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = isDark ? '#94A3B8' : '#64748B';
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <X size={17} />
            </button>
          </div>

          {/* =========================================================================
              SECTION 1: TEXT SIZE (A-, A, A+)
              ========================================================================= */}
          <div style={{ marginBottom: '18px' }}>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 750,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isDark ? '#A78BFA' : '#6D28D9',
                marginBottom: '8px'
              }}
            >
              TEXT SIZE
            </div>

            <div
              role="group"
              aria-label="Text Size Controls"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '8px',
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(124, 58, 237, 0.04)',
                padding: '4px',
                borderRadius: '12px',
                border: isDark ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid rgba(124, 58, 237, 0.12)'
              }}
            >
              {/* A- Button (Reduce: 90%) */}
              <button
                type="button"
                onClick={() => setTextSize('small')}
                aria-label="Reduce text size to 90%"
                aria-pressed={textSize === 'small'}
                style={{
                  padding: '7px 0',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  backgroundColor: textSize === 'small'
                    ? '#7C3AED'
                    : 'transparent',
                  color: textSize === 'small'
                    ? '#FFFFFF'
                    : (isDark ? '#CBD5E1' : '#334155'),
                  boxShadow: textSize === 'small'
                    ? '0 3px 8px rgba(0, 0, 0, 0.2)'
                    : 'none',
                  fontFamily: 'inherit'
                }}
              >
                A−
              </button>

              {/* A Button (Default: 100%) */}
              <button
                type="button"
                onClick={() => setTextSize('default')}
                aria-label="Restore default text size (100%)"
                aria-pressed={textSize === 'default'}
                style={{
                  padding: '7px 0',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '0.92rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  backgroundColor: textSize === 'default'
                    ? '#7C3AED'
                    : 'transparent',
                  color: textSize === 'default'
                    ? '#FFFFFF'
                    : (isDark ? '#CBD5E1' : '#334155'),
                  boxShadow: textSize === 'default'
                    ? '0 3px 8px rgba(0, 0, 0, 0.2)'
                    : 'none',
                  fontFamily: 'inherit'
                }}
              >
                A
              </button>

              {/* A+ Button (Increase: 115%) */}
              <button
                type="button"
                onClick={() => setTextSize('large')}
                aria-label="Increase text size to 115%"
                aria-pressed={textSize === 'large'}
                style={{
                  padding: '7px 0',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1.02rem',
                  fontWeight: 750,
                  cursor: 'pointer',
                  transition: 'all 0.18s ease',
                  backgroundColor: textSize === 'large'
                    ? '#7C3AED'
                    : 'transparent',
                  color: textSize === 'large'
                    ? '#FFFFFF'
                    : (isDark ? '#CBD5E1' : '#334155'),
                  boxShadow: textSize === 'large'
                    ? '0 3px 8px rgba(0, 0, 0, 0.2)'
                    : 'none',
                  fontFamily: 'inherit'
                }}
              >
                A+
              </button>
            </div>
          </div>

          {/* =========================================================================
              SECTION 2: COLOUR MODE (Light / Dark)
              ========================================================================= */}
          <div>
            <div
              style={{
                fontSize: '0.74rem',
                fontWeight: 750,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: isDark ? '#A78BFA' : '#6D28D9',
                marginBottom: '8px'
              }}
            >
              COLOUR MODE
            </div>

            <div
              role="group"
              aria-label="Colour Mode Settings"
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '8px'
              }}
            >
              {/* Light Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-label="Enable Light Mode"
                aria-pressed={!isDark}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: !isDark
                    ? '1.5px solid #7C3AED'
                    : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'),
                  backgroundColor: !isDark
                    ? '#7C3AED'
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC'),
                  color: !isDark
                    ? '#FFFFFF'
                    : (isDark ? '#94A3B8' : '#64748B'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  transition: 'all 0.18s ease',
                  fontFamily: 'inherit',
                  boxShadow: !isDark ? '0 3px 10px rgba(124, 58, 237, 0.25)' : 'none'
                }}
              >
                <Sun size={15} />
                <span>Light</span>
                {!isDark && <Check size={14} />}
              </button>

              {/* Dark Mode Button */}
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-label="Enable Dark Mode"
                aria-pressed={isDark}
                style={{
                  padding: '9px 12px',
                  borderRadius: '10px',
                  border: isDark
                    ? '1.5px solid #A78BFA'
                    : (isDark ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.1)'),
                  backgroundColor: isDark
                    ? '#7C3AED'
                    : (isDark ? 'rgba(255, 255, 255, 0.05)' : '#F8FAFC'),
                  color: isDark
                    ? '#FFFFFF'
                    : (isDark ? '#94A3B8' : '#64748B'),
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  transition: 'all 0.18s ease',
                  fontFamily: 'inherit',
                  boxShadow: isDark ? '0 3px 12px rgba(124, 58, 237, 0.35)' : 'none'
                }}
              >
                <Moon size={15} />
                <span>Dark</span>
                {isDark && <Check size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
