import React from 'react';
import { useAccessibility } from '../context/useAccessibility';

export default function TextSizeControl() {
  const { textSize, setTextSize, isDark } = useAccessibility();

  const options = [
    { id: 'small', label: 'A-', title: 'Decrease text size (90%)' },
    { id: 'default', label: 'A', title: 'Default text size (100%)' },
    { id: 'large', label: 'A+', title: 'Increase text size (115%)' }
  ];

  return (
    <div
      role="group"
      aria-label="Text size controls"
      className="welcome-text-size-wrap"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px'
      }}
    >
      <span
        style={{
          fontSize: '0.72rem',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          color: isDark ? '#94A3B8' : '#77728A',
          userSelect: 'none',
          whiteSpace: 'nowrap'
        }}
      >
        TEXT SIZE
      </span>

      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(124, 58, 237, 0.05)',
          border: isDark ? '1px solid rgba(255, 255, 255, 0.16)' : '1px solid rgba(124, 58, 237, 0.18)',
          borderRadius: '9999px',
          padding: '2px',
          gap: '2px'
        }}
      >
        {options.map((opt) => {
          const isSelected = textSize === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => setTextSize(opt.id)}
              aria-pressed={isSelected}
              aria-label={opt.title}
              title={opt.title}
              style={{
                background: isSelected
                  ? 'linear-gradient(135deg, #7C3AED 0%, #6366F1 100%)'
                  : 'transparent',
                color: isSelected
                  ? '#FFFFFF'
                  : (isDark ? '#E2E8F0' : '#4C4265'),
                border: 'none',
                borderRadius: '9999px',
                padding: '4px 10px',
                fontSize: '0.8rem',
                fontWeight: isSelected ? 800 : 600,
                cursor: 'pointer',
                transition: 'all 0.18s ease',
                boxShadow: isSelected ? '0 2px 8px rgba(124, 58, 237, 0.35)' : 'none',
                lineHeight: 1.2
              }}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
