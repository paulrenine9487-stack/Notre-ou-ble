// Theme utility functions for No Tre(ou)ble

export function hslToHex(h, s, l) {
  l /= 100;
  const a = (s * Math.min(l, 1 - l)) / 100;
  const f = n => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`.toUpperCase();
}

export function hexToHsl(hex) {
  let c = (hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) c = '000000';
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
  }
  return {
    h: isNaN(h) ? 0 : h,
    s: isNaN(s) ? 0 : Math.round(s * 100),
    l: isNaN(l) ? 0 : Math.round(l * 100)
  };
}

export function hexToRgb(hex) {
  let c = (hex || '#000000').replace('#', '');
  if (c.length === 3) c = c.split('').map(x => x + x).join('');
  if (c.length !== 6) c = '000000';
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

export function rgbToHex(r, g, b) {
  const clamp = v => Math.min(255, Math.max(0, Math.round(Number(v) || 0)));
  const toHex = v => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function adjustBrightness(hex, percent) {
  let { r, g, b } = hexToRgb(hex);
  r = Math.min(255, Math.max(0, r + Math.round(255 * (percent / 100))));
  g = Math.min(255, Math.max(0, g + Math.round(255 * (percent / 100))));
  b = Math.min(255, Math.max(0, b + Math.round(255 * (percent / 100))));
  return rgbToHex(r, g, b);
}

// Convert HSL (0-360, 0-100, 0-100) with HSV-style Saturation & Brightness
export function hsvToRgb(h, s, v) {
  s = s / 100;
  v = v / 100;
  let c = v * s;
  let x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  let m = v - c;
  let r = 0, g = 0, b = 0;
  if (h >= 0 && h < 60) { r = c; g = x; b = 0; }
  else if (h >= 60 && h < 120) { r = x; g = c; b = 0; }
  else if (h >= 120 && h < 180) { r = 0; g = c; b = x; }
  else if (h >= 180 && h < 240) { r = 0; g = x; b = c; }
  else if (h >= 240 && h < 300) { r = x; g = 0; b = c; }
  else if (h >= 300 && h < 360) { r = c; g = 0; b = x; }
  return {
    r: Math.round((r + m) * 255),
    g: Math.round((g + m) * 255),
    b: Math.round((b + m) * 255)
  };
}

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  let s = max === 0 ? 0 : d / max;
  let v = max;

  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h = Math.round(h * 60);
  }
  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    v: Math.round(v * 100)
  };
}

// Apply CSS variables to document root directly and persist to localStorage
export function applyThemeColors(theme) {
  if (!theme) return;
  const root = document.documentElement;

  let primary = theme.primary_color || '#241442';
  let secondary = theme.secondary_color || '#7C3AED';
  let accentBg = theme.accent_bg_color || '#F4F0FF';
  let mainBg = theme.main_bg_color || '#F8F7FC';

  // Normalize legacy teal palette to official No Tre(ou)ble brand palette
  if (primary.toUpperCase() === '#193B40') primary = '#241442';
  if (secondary.toUpperCase() === '#398575') secondary = '#7C3AED';
  if (accentBg.toUpperCase() === '#DCECE5') accentBg = '#F4F0FF';
  if (mainBg.toUpperCase() === '#F3F6F3') mainBg = '#F8F7FC';

  // Save to localStorage for instant hydration on page reloads across all tabs
  try {
    localStorage.setItem('resonova_theme', JSON.stringify({
      primary_color: primary,
      secondary_color: secondary,
      accent_bg_color: accentBg,
      main_bg_color: mainBg,
      theme_name: theme.theme_name || 'Active Theme'
    }));
  } catch (e) {}

  // 1. Dashboard CSS Variables
  root.style.setProperty('--dash-sidebar-bg', primary);
  root.style.setProperty('--dash-accent', secondary);
  root.style.setProperty('--dash-accent-bg', accentBg);
  root.style.setProperty('--dash-bg', mainBg);

  // 2. Shared Global Brand Variables
  root.style.setProperty('--brand-deep', primary);
  root.style.setProperty('--brand-primary', secondary);
  root.style.setProperty('--primary-purple', secondary);
  root.style.setProperty('--accent-purple', secondary);
  root.style.setProperty('--border-focus', secondary);
  root.style.setProperty('--background-soft', accentBg);
  root.style.setProperty('--background-main', mainBg);

  // 3. Dynamic Tones for interactive elements (hover, active, indicators)
  const activeSidebarHover = adjustBrightness(primary, 18);
  const secondaryDark = adjustBrightness(secondary, -15);
  const secondaryLight = adjustBrightness(secondary, 20);

  root.style.setProperty('--dash-sidebar-active', activeSidebarHover);
  root.style.setProperty('--dash-sidebar-indicator', secondary);
  root.style.setProperty('--dash-accent-hover', secondaryDark);
  root.style.setProperty('--btn-gradient', `linear-gradient(110deg, ${secondary} 0%, ${secondaryLight} 100%)`);
  root.style.setProperty('--brand-gradient', `linear-gradient(110deg, ${secondary} 0%, ${secondaryLight} 100%)`);
  root.style.setProperty('--gradient-primary', `linear-gradient(110deg, ${primary} 0%, ${secondary} 100%)`);

  // Set unified sidebar and brand text tokens
  root.style.setProperty('--dash-sidebar-text', '#E5DDF5');
  root.style.setProperty('--dash-sidebar-muted', '#C9B9E9');
  root.style.setProperty('--dash-text-primary', '#191B35');
  root.style.setProperty('--dash-text-secondary', '#77728A');
  root.style.setProperty('--dash-border', '#EAE5F3');

  // 4. Dispatch browser custom event for immediate React component reactivity
  try {
    window.dispatchEvent(new CustomEvent('resonova_theme_change', {
      detail: { primary, secondary, accentBg, mainBg }
    }));
  } catch (e) {}
}
