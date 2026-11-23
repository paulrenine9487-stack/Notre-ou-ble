import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useAccessibility } from '../context/useAccessibility';

export default function ThemeToggle() {
  const { theme, isDark, toggleTheme } = useAccessibility();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '36px',
        height: '36px',
        borderRadius: '50%',
        border: isDark ? '1px solid rgba(255, 255, 255, 0.2)' : '1px solid rgba(124, 58, 237, 0.22)',
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 58, 237, 0.06)',
        color: isDark ? '#FACC15' : '#7C3AED',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: isDark
          ? '0 0 12px rgba(250, 204, 21, 0.25)'
          : '0 2px 8px rgba(124, 58, 237, 0.12)'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'scale(1.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {isDark ? (
        <Sun size={18} strokeWidth={2.4} />
      ) : (
        <Moon size={18} strokeWidth={2.4} />
      )}
    </button>
  );
}
