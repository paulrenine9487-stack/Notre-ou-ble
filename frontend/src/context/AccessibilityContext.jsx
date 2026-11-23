import React, { useState, useEffect } from 'react';
import { AccessibilityContext } from './accessibilityContextDef';

const THEME_STORAGE_KEY = 'notreoble_welcome_theme';
const TEXT_SIZE_STORAGE_KEY = 'notreoble_welcome_text_size';

export function AccessibilityProvider({ children }) {
  // Theme state: 'light' or 'dark'
  const [theme, setThemeState] = useState(() => {
    try {
      const savedTheme = localStorage.getItem(THEME_STORAGE_KEY);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      // Respect user's system preference only when no saved preference exists
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch (e) {
      // Fallback
    }
    return 'light'; // Approved Light Mode default
  });

  // Text size state: 'small' (90%), 'default' (100%), 'large' (115%)
  const [textSize, setTextSizeState] = useState(() => {
    try {
      const savedSize = localStorage.getItem(TEXT_SIZE_STORAGE_KEY);
      if (['small', 'default', 'large'].includes(savedSize)) {
        return savedSize;
      }
    } catch (e) {
      // Fallback
    }
    return 'default'; // Default 'A'
  });

  const textScaleMap = {
    small: 0.9,
    default: 1.0,
    large: 1.15
  };

  const textScale = textScaleMap[textSize] || 1.0;

  const setTheme = (newTheme) => {
    if (newTheme === 'light' || newTheme === 'dark') {
      setThemeState(newTheme);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      } catch (e) {}
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  const setTextSize = (newSize) => {
    if (['small', 'default', 'large'].includes(newSize)) {
      setTextSizeState(newSize);
      try {
        localStorage.setItem(TEXT_SIZE_STORAGE_KEY, newSize);
      } catch (e) {}
    }
  };

  // Sync to root document attributes for styling & screen reader attributes
  useEffect(() => {
    document.documentElement.setAttribute('data-welcome-theme', theme);
    document.documentElement.setAttribute('data-welcome-text-size', textSize);
    document.documentElement.style.setProperty('--welcome-text-scale', textScale.toString());
  }, [theme, textSize, textScale]);

  const value = {
    theme,
    isDark: theme === 'dark',
    setTheme,
    toggleTheme,
    textSize,
    setTextSize,
    textScale
  };

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export default AccessibilityProvider;
