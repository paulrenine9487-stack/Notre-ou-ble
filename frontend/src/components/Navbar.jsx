import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Music } from 'lucide-react';
import { useAccessibility } from '../context/useAccessibility';
import AccessibilityMenu from './AccessibilityMenu';

export default function Navbar() {
  const navigate = useNavigate();
  const { isDark } = useAccessibility();

  return (
    <header
      role="banner"
      style={{
        width: '100%',
        backgroundColor: isDark ? '#120926' : '#FFFFFF',
        borderBottom: isDark ? '1px solid rgba(167, 139, 250, 0.15)' : '1px solid #EAE5F3',
        padding: '14px 0',
        position: 'sticky',
        top: 0,
        left: 0,
        zIndex: 100,
        boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.4)' : '0 2px 14px rgba(25, 27, 53, 0.04)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease'
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 clamp(16px, 3vw, 28px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          boxSizing: 'border-box',
          gap: '12px'
        }}
      >
        {/* Brand Logo at Top-Left */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textDecoration: 'none',
            flexShrink: 0
          }}
          aria-label="No Tre(ou)ble Home"
        >
          <img
            src="/IMG_7974.PNG"
            alt="No Tre(ou)ble Logo"
            style={{
              height: '46px',
              width: 'auto',
              maxHeight: '46px',
              objectFit: 'contain',
              flexShrink: 0,
              display: 'block',
              ...(isDark ? { background: '#FFFFFF', borderRadius: '10px', padding: '3px 5px' } : {})
            }}
          />
          <div>
            <img
              src={isDark ? '/NoTreble-Classicfinal.png' : '/NoTreble-Classic-darktext.png'}
              alt="No Tre(ou)ble"
              style={{
                height: '42px',
                width: 'auto',
                objectFit: 'contain',
                display: 'block'
              }}
            />
          </div>
        </Link>

        {/* Right-Side Controls: LOGIN BUTTON → ACCESSIBILITY ICON BUTTON */}
        <nav
          aria-label="Header controls and navigation"
          className="welcome-header-right-nav"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
            flexWrap: 'nowrap',
            justifyContent: 'flex-end'
          }}
        >
          {/* 1. Circular Login Icon Button (Follows uploaded Login symbol reference) */}
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="welcome-header-login-btn"
            aria-label="Login"
            title="Login"
            style={{
              width: '46px',
              height: '46px',
              padding: 0,
              margin: 0,
              borderRadius: '50%',
              background: 'linear-gradient(110deg, #7C3AED 0%, #6366F1 55%, #3B82F6 100%)',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: isDark
                ? '0 4px 16px rgba(124, 58, 237, 0.45)'
                : '0 4px 16px rgba(124, 58, 237, 0.32)',
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
              flexShrink: 0,
              outline: 'none'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = isDark
                ? '0 6px 22px rgba(124, 58, 237, 0.65)'
                : '0 6px 22px rgba(124, 58, 237, 0.48)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = isDark
                ? '0 4px 16px rgba(124, 58, 237, 0.45)'
                : '0 4px 16px rgba(124, 58, 237, 0.32)';
            }}
            onFocus={(e) => {
              e.currentTarget.style.outline = '3px solid #7C3AED';
              e.currentTarget.style.outlineOffset = '2px';
            }}
          >
            {/* Login Symbol: Person + Doorframe + Entering Arrow */}
            <svg
              viewBox="0 0 58 58"
              width="26"
              height="26"
              fill="none"
              style={{ display: 'block' }}
            >
              <circle cx="17.5" cy="18" r="4.5" fill="#FFFFFF" />
              <path
                d="M 12 30.5 C 12 25.5 14.5 24 17.5 24 C 20.5 24 23 25.5 23 30.5 C 23 33.5 21.8 36.5 20.2 38.5 L 21.5 45.5 C 21.6 46.2 21 47 20.2 47 C 19.6 47 19.1 46.5 19 45.8 L 17.8 41.2 L 16.5 45.8 C 16.4 46.5 15.9 47 15.3 47 C 14.5 47 13.9 46.2 14 45.5 L 15 38.8 C 13.2 36.8 12 33.8 12 30.5 Z"
                fill="#FFFFFF"
              />
              <path
                d="M 21.5 29.5 H 34"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
              />
              <path
                d="M 29.5 25 L 34 29.5 L 29.5 34"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M 31 14.5 H 41 C 42.4 14.5 43.5 15.6 43.5 17 V 41 C 43.5 42.4 42.4 43.5 41 43.5 H 31"
                stroke="#FFFFFF"
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>

          {/* 2. Accessibility Icon Button immediately to the RIGHT of LOGIN */}
          <AccessibilityMenu />
        </nav>
      </div>
    </header>
  );
}
