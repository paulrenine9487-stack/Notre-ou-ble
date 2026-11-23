import React from 'react';
import { useAccessibility } from '../context/useAccessibility';

export default function SkipToMainContent() {
  const { isDark } = useAccessibility();

  const handleSkip = (e) => {
    e.preventDefault();
    const target = document.getElementById('main-content');
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href="#main-content"
      onClick={handleSkip}
      className="welcome-skip-link"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '7px 14px',
        borderRadius: '9999px',
        fontSize: '0.8rem',
        fontWeight: 650,
        textDecoration: 'none',
        color: isDark ? '#FFFFFF' : '#191B35',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F4F0FF',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid #EAE5F3',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        whiteSpace: 'nowrap'
      }}
      title="Skip navigation and move focus directly to main content"
    >
      Skip to main content
    </a>
  );
}
