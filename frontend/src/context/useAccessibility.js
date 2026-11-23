import { useContext } from 'react';
import { AccessibilityContext } from './accessibilityContextDef';

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    // Provide safe default fallback if outside provider
    return {
      theme: 'light',
      isDark: false,
      setTheme: () => {},
      toggleTheme: () => {},
      textSize: 'default',
      setTextSize: () => {},
      textScale: 1.0
    };
  }
  return context;
}

export default useAccessibility;
