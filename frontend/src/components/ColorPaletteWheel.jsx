import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { hslToHex, hexToHsl, applyThemeColors } from '../utils/themeUtils';
import SleekColorCard from './SleekColorCard';
import {
  Palette,
  Check,
  RotateCcw,
  Sparkles,
  Sliders,
  Eye,
  CheckCircle2,
  AlertCircle,
  Save,
  Music,
  Flame,
  Home,
  BookOpen
} from 'lucide-react';

// Predefined Harmonic Themes
const PRESET_PALETTES = [
  {
    name: 'Official No Tre(ou)ble Purple',
    primary: '#241442',
    secondary: '#7C3AED',
    accentBg: '#F4F0FF',
    mainBg: '#F8F7FC',
    hue: 265
  },
  {
    name: 'Midnight Indigo Aria',
    primary: '#1E1B4B',
    secondary: '#4338CA',
    accentBg: '#E0E7FF',
    mainBg: '#F5F6FF',
    hue: 245
  },
  {
    name: 'Imperial Velvet Purple',
    primary: '#2E1065',
    secondary: '#7C3AED',
    accentBg: '#EDE9FE',
    mainBg: '#FAF8FF',
    hue: 270
  },
  {
    name: 'Deep Forest Conservatory',
    primary: '#064E3B',
    secondary: '#059669',
    accentBg: '#D1FAE5',
    mainBg: '#F2FDF8',
    hue: 155
  },
  {
    name: 'Royal Sapphire Resonance',
    primary: '#0C4A6E',
    secondary: '#0284C7',
    accentBg: '#E0F2FE',
    mainBg: '#F4F9FD',
    hue: 200
  },
  {
    name: 'Amber Symphony Warmth',
    primary: '#451A03',
    secondary: '#D97706',
    accentBg: '#FEF3C7',
    mainBg: '#FFFBEB',
    hue: 35
  },
  {
    name: 'Crimson Opera Alto',
    primary: '#4C0519',
    secondary: '#E11D48',
    accentBg: '#FFE4E6',
    mainBg: '#FFF5F6',
    hue: 345
  },
  {
    name: 'Nordic Slate & Mint',
    primary: '#1E293B',
    secondary: '#0D9488',
    accentBg: '#CCFBF1',
    mainBg: '#F1F5F9',
    hue: 170
  }
];

export default function ColorPaletteWheel({ onThemeApplied }) {
  const [currentHue, setCurrentHue] = useState(261);
  const [harmonyMode, setHarmonyMode] = useState('opposite'); // 'opposite' | 'analogous' | 'monochromatic'
  const [themeName, setThemeName] = useState('Official No Tre(ou)ble Palette');

  const [primaryColor, setPrimaryColor] = useState('#241442');
  const [secondaryColor, setSecondaryColor] = useState('#7C3AED');
  const [accentBgColor, setAccentBgColor] = useState('#F4F0FF');
  const [mainBgColor, setMainBgColor] = useState('#F8F7FC');

  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState({ text: '', type: '' });

  // Load existing theme on mount
  useEffect(() => {
    api.getBrandingTheme()
      .then(res => {
        if (res.success && res.theme) {
          const t = res.theme;
          setThemeName(t.theme_name || 'Official No Tre(ou)ble Palette');
          setPrimaryColor(t.primary_color || '#241442');
          setSecondaryColor(t.secondary_color || '#7C3AED');
          setAccentBgColor(t.accent_bg_color || '#F4F0FF');
          setMainBgColor(t.main_bg_color || '#F8F7FC');

          const hsl = hexToHsl(t.secondary_color || t.primary_color || '#7C3AED');
          if (hsl && typeof hsl.h === 'number') {
            setCurrentHue(hsl.h);
          }
        }
      })
      .catch(err => console.error('Failed to load branding theme:', err));
  }, []);

  // Update theme dynamically based on wheel hue & harmony mode
  const handleWheelHueChange = (newHue, mode = harmonyMode) => {
    setCurrentHue(newHue);

    let nextPrimary = primaryColor;
    let nextSecondary = secondaryColor;
    let nextAccentBg = accentBgColor;

    if (mode === 'opposite') {
      // Primary: Deep rich tone from current hue
      nextPrimary = hslToHex(newHue, 70, 18);
      // Secondary: Complementary tone 180 degrees away
      const oppHue = (newHue + 180) % 360;
      nextSecondary = hslToHex(oppHue, 85, 52);
      nextAccentBg = hslToHex(newHue, 45, 96);
    } else if (mode === 'analogous') {
      nextPrimary = hslToHex(newHue, 70, 18);
      const anaHue = (newHue + 35) % 360;
      nextSecondary = hslToHex(anaHue, 85, 52);
      nextAccentBg = hslToHex(newHue, 40, 96);
    } else if (mode === 'monochromatic') {
      nextPrimary = hslToHex(newHue, 75, 18);
      nextSecondary = hslToHex(newHue, 85, 55);
      nextAccentBg = hslToHex(newHue, 35, 96);
    }

    setPrimaryColor(nextPrimary);
    setSecondaryColor(nextSecondary);
    setAccentBgColor(nextAccentBg);

    applyThemeColors({
      primary_color: nextPrimary,
      secondary_color: nextSecondary,
      accent_bg_color: nextAccentBg,
      main_bg_color: mainBgColor
    });
  };

  // Switch harmony mode ('opposite', 'analogous', 'monochromatic')
  const handleHarmonyModeSelect = (mode) => {
    setHarmonyMode(mode);
    handleWheelHueChange(currentHue, mode);
  };

  // Select Preset Palette
  const handleSelectPreset = (preset) => {
    setThemeName(preset.name);
    setPrimaryColor(preset.primary);
    setSecondaryColor(preset.secondary);
    setAccentBgColor(preset.accentBg);
    setMainBgColor(preset.mainBg);
    setCurrentHue(preset.hue);

    applyThemeColors({
      primary_color: preset.primary,
      secondary_color: preset.secondary,
      accent_bg_color: preset.accentBg,
      main_bg_color: preset.mainBg
    });

    setStatusMessage({
      text: `Loaded preset "${preset.name}". Click "Save & Apply Theme" to persist to MySQL.`,
      type: 'info'
    });
  };

  // Direct manual color changes from Sleek Cards
  const handleManualColorChange = (type, val) => {
    let nextTheme = {
      primary_color: primaryColor,
      secondary_color: secondaryColor,
      accent_bg_color: accentBgColor,
      main_bg_color: mainBgColor
    };

    if (type === 'primary') {
      setPrimaryColor(val);
      nextTheme.primary_color = val;
    } else if (type === 'secondary') {
      setSecondaryColor(val);
      nextTheme.secondary_color = val;
      const hsl = hexToHsl(val);
      if (hsl && typeof hsl.h === 'number') {
        setCurrentHue(hsl.h);
      }
    } else if (type === 'accentBg') {
      setAccentBgColor(val);
      nextTheme.accent_bg_color = val;
    } else if (type === 'mainBg') {
      setMainBgColor(val);
      nextTheme.main_bg_color = val;
    }

    applyThemeColors(nextTheme);
  };

  // Save to MySQL backend
  const handleSaveTheme = async () => {
    try {
      setSaving(true);
      setStatusMessage({ text: '', type: '' });

      const res = await api.updateBrandingTheme({
        theme_name: themeName,
        primary_color: primaryColor,
        secondary_color: secondaryColor,
        accent_bg_color: accentBgColor,
        main_bg_color: mainBgColor
      });

      if (res.success) {
        applyThemeColors(res.theme);
        setStatusMessage({
          text: 'Branding theme saved to MySQL successfully! All user dashboards, navigation and modules are synchronized.',
          type: 'success'
        });
        if (onThemeApplied) onThemeApplied(res.theme);
      }
    } catch (err) {
      console.error('Failed to save branding theme:', err);
      setStatusMessage({
        text: err.message || 'Failed to save branding theme to database.',
        type: 'error'
      });
    } finally {
      setSaving(false);
    }
  };

  // Reset to default
  const handleResetDefault = () => {
    handleSelectPreset(PRESET_PALETTES[0]);
  };

  // =========================================================================
  // COLOR WHEEL GEOMETRY & CALCULATIONS (24 Wedges, Exact Cartesian Math)
  // =========================================================================
  const wheelRadius = 135;
  const innerRadius = 82;
  const oppositeHue = (currentHue + 180) % 360;
  const analogousHue1 = (currentHue + 35) % 360;
  const analogousHue2 = (currentHue - 35 + 360) % 360;

  // Degrees to Cartesian coordinates (Center at 160, 160)
  const getCoordinates = (angleDeg, radius) => {
    const angleRad = (angleDeg - 90) * (Math.PI / 180);
    return {
      x: 160 + radius * Math.cos(angleRad),
      y: 160 + radius * Math.sin(angleRad)
    };
  };

  const primaryMarker = getCoordinates(currentHue, (wheelRadius + innerRadius) / 2);
  const oppositeMarker = getCoordinates(oppositeHue, (wheelRadius + innerRadius) / 2);
  const analogousMarker1 = getCoordinates(analogousHue1, (wheelRadius + innerRadius) / 2);
  const analogousMarker2 = getCoordinates(analogousHue2, (wheelRadius + innerRadius) / 2);

  // 24 Stepped blocks around the color wheel (15 degrees each)
  const wheelSegments = Array.from({ length: 24 }).map((_, i) => {
    const startAngle = i * 15;
    const endAngle = (i + 1) * 15;
    const midAngle = (startAngle + endAngle) / 2;
    const segHue = Math.round(i * 15);
    return {
      index: i,
      hue: segHue,
      color: hslToHex(segHue, 88, 52),
      startAngle,
      endAngle,
      midAngle
    };
  });

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      borderRadius: '24px',
      padding: 'clamp(20px, 3vw, 32px)',
      border: '1.5px solid #EAE5F3',
      boxShadow: '0 8px 30px rgba(25, 27, 53, 0.04)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '14px', marginBottom: '24px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{
              width: '34px',
              height: '34px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #7C3AED 0%, #241442 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)'
            }}>
              <Palette size={19} />
            </div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#191B35', margin: 0, letterSpacing: '-0.02em' }}>
              Branding Theme & Visual Identity Studio
            </h2>
          </div>
          <p style={{ margin: 0, fontSize: '0.88rem', color: '#77728A', lineHeight: 1.5 }}>
            Interactive Harmonic Color Palette Studio styled with No Tre(ou)ble's signature dashboard identity. Rotate the spectrum, switch harmony modes, and synchronize your theme live to MySQL.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            type="button"
            onClick={handleResetDefault}
            style={{
              padding: '9px 18px',
              borderRadius: '9999px',
              backgroundColor: '#FFFFFF',
              border: '1.5px solid #EAE5F3',
              color: '#191B35',
              fontSize: '0.84rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <RotateCcw size={14} />
            <span>Reset Default</span>
          </button>

          <button
            type="button"
            onClick={handleSaveTheme}
            disabled={saving}
            className="dash-btn-primary"
            style={{ padding: '9px 24px', fontSize: '0.86rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
          >
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save & Apply Theme'}</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {statusMessage.text && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          marginBottom: '22px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '0.86rem',
          fontWeight: 650,
          backgroundColor: statusMessage.type === 'error' ? '#FEF2F2' : (statusMessage.type === 'info' ? '#EFF6FF' : '#DCFCE7'),
          color: statusMessage.type === 'error' ? '#991B1B' : (statusMessage.type === 'info' ? '#1E40AF' : '#166534'),
          border: `1px solid ${statusMessage.type === 'error' ? '#FCA5A5' : (statusMessage.type === 'info' ? '#BFDBFE' : '#86EFAC')}`
        }}>
          {statusMessage.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2-COLUMN MAIN STUDIO: LEFT HARMONIC WHEEL + RIGHT ACTIVE PALETTE    */}
      {/* =================================================================== */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
        gap: '24px',
        marginBottom: '28px'
      }}>
        {/* ================================================================= */}
        {/* LEFT COLUMN: INTERACTIVE HARMONIC COLOR WHEEL                    */}
        {/* Styled with Dashboard Left Panel Signature Theme (Periwinkle      */}
        {/* Lavender Gradient + Sonic Waves from Image 2)                    */}
        {/* ================================================================= */}
        <div style={{
          background: 'linear-gradient(165deg, #7C7BF8 0%, #8E8DFA 50%, #9F9DFA 100%)',
          borderRadius: '22px',
          padding: '24px 22px 20px',
          boxShadow: '0 12px 36px rgba(124, 123, 248, 0.28), 0 2px 8px rgba(0,0,0,0.06)',
          border: '1.5px solid rgba(255, 255, 255, 0.35)',
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          {/* Top Bar: Hue Badge on Left + Harmony Mode Tabs on Right */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            width: '100%',
            marginBottom: '16px',
            position: 'relative',
            zIndex: 2
          }}>
            {/* Top-Left Hue Badge */}
            <div style={{
              backgroundColor: 'rgba(25, 27, 53, 0.40)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '8px 14px',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              color: '#FFFFFF'
            }}>
              <div style={{ fontSize: '0.94rem', fontWeight: 800, letterSpacing: '-0.01em' }}>
                Hue: {currentHue}°
              </div>
              <div style={{ fontSize: '0.72rem', color: 'rgba(255, 255, 255, 0.75)', textTransform: 'capitalize', fontWeight: 600 }}>
                {harmonyMode}
              </div>
            </div>

            {/* Top-Right Harmony Mode Tabs (Opposite, Analogous, Monochromatic) */}
            <div style={{
              display: 'flex',
              gap: '6px',
              backgroundColor: 'rgba(25, 27, 53, 0.32)',
              backdropFilter: 'blur(10px)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid rgba(255, 255, 255, 0.2)'
            }}>
              {[
                { id: 'opposite', label: 'Opposite' },
                { id: 'analogous', label: 'Analogous' },
                { id: 'monochromatic', label: 'Monochromatic' }
              ].map(tab => {
                const isActive = harmonyMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleHarmonyModeSelect(tab.id)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: isActive ? '#FFFFFF' : 'transparent',
                      color: isActive ? '#241442' : 'rgba(255, 255, 255, 0.85)',
                      fontSize: '0.76rem',
                      fontWeight: isActive ? 800 : 600,
                      cursor: 'pointer',
                      boxShadow: isActive ? '0 2px 8px rgba(0, 0, 0, 0.12)' : 'none',
                      transition: 'all 0.18s ease'
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* SVG 3D COLOR WHEEL */}
          <div style={{
            position: 'relative',
            width: '320px',
            height: '320px',
            maxWidth: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2
          }}>
            <svg
              viewBox="0 0 320 320"
              style={{ width: '100%', height: '100%', overflow: 'visible', filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))' }}
            >
              <defs>
                {/* 3D Tone Sphere Radial Gradient */}
                <radialGradient id="sphereGrad" cx="38%" cy="32%" r="65%">
                  <stop offset="0%" stopColor={hslToHex(currentHue, 80, 80)} />
                  <stop offset="28%" stopColor={hslToHex(currentHue, 85, 55)} />
                  <stop offset="65%" stopColor={hslToHex(currentHue, 95, 30)} />
                  <stop offset="100%" stopColor={hslToHex(currentHue, 100, 12)} />
                </radialGradient>

                {/* Sphere Drop Shadow */}
                <radialGradient id="sphereShadow" cx="50%" cy="50%" r="50%">
                  <stop offset="70%" stopColor="rgba(0,0,0,0.4)" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
              </defs>

              {/* Outer Spectrum Ring (24 Stepped Color Wedges) */}
              {wheelSegments.map(seg => {
                const r1 = innerRadius + 2;
                const r2 = wheelRadius;
                const a1 = (seg.startAngle - 90) * (Math.PI / 180);
                const a2 = (seg.endAngle - 90) * (Math.PI / 180);

                const x1 = 160 + r1 * Math.cos(a1);
                const y1 = 160 + r1 * Math.sin(a1);
                const x2 = 160 + r2 * Math.cos(a1);
                const y2 = 160 + r2 * Math.sin(a1);
                const x3 = 160 + r2 * Math.cos(a2);
                const y3 = 160 + r2 * Math.sin(a2);
                const x4 = 160 + r1 * Math.cos(a2);
                const y4 = 160 + r1 * Math.sin(a2);

                const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;

                const isCurrent = Math.abs(seg.midAngle - currentHue) <= 7.5 || Math.abs(seg.midAngle - currentHue) >= 352.5;

                return (
                  <path
                    key={seg.index}
                    d={d}
                    fill={seg.color}
                    cursor="pointer"
                    onClick={() => handleWheelHueChange(seg.hue)}
                    opacity={isCurrent ? 1 : 0.92}
                    stroke={isCurrent ? '#FFFFFF' : 'rgba(0,0,0,0.18)'}
                    strokeWidth={isCurrent ? 2.5 : 0.6}
                    style={{ transition: 'all 0.15s ease' }}
                  />
                );
              })}

              {/* Sphere Outer Dark Rim */}
              <circle
                cx="160"
                cy="160"
                r={innerRadius - 2}
                fill="none"
                stroke="rgba(0, 0, 0, 0.45)"
                strokeWidth="5"
              />

              {/* Center 3D Spherical Tone Ball */}
              <circle
                cx="160"
                cy="160"
                r={innerRadius - 4}
                fill="url(#sphereGrad)"
                stroke="rgba(255, 255, 255, 0.3)"
                strokeWidth="1.5"
              />

              {/* 5 Harmonic Palette Tonal Dots across sphere */}
              {[0.24, 0.36, 0.48, 0.60, 0.72].map((step, idx) => {
                const dotX = 160 - (innerRadius - 16) * (0.8 - step);
                const dotY = 160 - (idx - 2) * 2;
                const dotR = idx === 2 ? 5.5 : 4.5;
                const dotHue = harmonyMode === 'opposite'
                  ? (idx >= 3 ? oppositeHue : currentHue)
                  : currentHue;
                const dotLight = 40 + idx * 10;
                return (
                  <circle
                    key={idx}
                    cx={dotX}
                    cy={dotY}
                    r={dotR}
                    fill={hslToHex(dotHue, 75, dotLight)}
                    stroke="rgba(255,255,255,0.85)"
                    strokeWidth="1.2"
                    style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
                  />
                );
              })}

              {/* Active Wedge Selection Highlight Frame */}
              {(() => {
                const segIdx = Math.floor(((currentHue + 7.5) % 360) / 15);
                const sAngle = segIdx * 15;
                const eAngle = (segIdx + 1) * 15;
                const r1 = innerRadius + 1;
                const r2 = wheelRadius + 2;
                const a1 = (sAngle - 90) * (Math.PI / 180);
                const a2 = (eAngle - 90) * (Math.PI / 180);

                const x1 = 160 + r1 * Math.cos(a1);
                const y1 = 160 + r1 * Math.sin(a1);
                const x2 = 160 + r2 * Math.cos(a1);
                const y2 = 160 + r2 * Math.sin(a1);
                const x3 = 160 + r2 * Math.cos(a2);
                const y3 = 160 + r2 * Math.sin(a2);
                const x4 = 160 + r1 * Math.cos(a2);
                const y4 = 160 + r1 * Math.sin(a2);

                const d = `M ${x1} ${y1} L ${x2} ${y2} A ${r2} ${r2} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${r1} ${r1} 0 0 0 ${x1} ${y1} Z`;

                return (
                  <path
                    d={d}
                    fill="none"
                    stroke="#FFFFFF"
                    strokeWidth="3.2"
                    style={{ filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.8))' }}
                  />
                );
              })()}

              {/* Primary Marker Handle Dot */}
              <circle
                cx={primaryMarker.x}
                cy={primaryMarker.y}
                r="6.5"
                fill="#FFFFFF"
                stroke={hslToHex(currentHue, 90, 45)}
                strokeWidth="2.5"
                style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}
              />

              {/* Opposite Harmonic Marker (Secondary Accent) */}
              {harmonyMode === 'opposite' && (
                <g style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))' }}>
                  <circle
                    cx={oppositeMarker.x}
                    cy={oppositeMarker.y}
                    r="8.5"
                    fill={hslToHex(oppositeHue, 85, 52)}
                    stroke="#FFFFFF"
                    strokeWidth="3"
                  />
                  <circle
                    cx={oppositeMarker.x}
                    cy={oppositeMarker.y}
                    r="3.5"
                    fill="#FFFFFF"
                  />
                </g>
              )}

              {/* Analogous Markers */}
              {harmonyMode === 'analogous' && (
                <>
                  <circle
                    cx={analogousMarker1.x}
                    cy={analogousMarker1.y}
                    r="7"
                    fill={hslToHex(analogousHue1, 85, 52)}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.4))' }}
                  />
                  <circle
                    cx={analogousMarker2.x}
                    cy={analogousMarker2.y}
                    r="7"
                    fill={hslToHex(analogousHue2, 85, 52)}
                    stroke="#FFFFFF"
                    strokeWidth="2.5"
                    style={{ filter: 'drop-shadow(0 2px 5px rgba(0,0,0,0.4))' }}
                  />
                </>
              )}
            </svg>
          </div>

          {/* Spectrum Rotation Slider */}
          <div style={{ width: '100%', marginTop: '16px', position: 'relative', zIndex: 2 }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.78rem',
              fontWeight: 700,
              color: '#FFFFFF',
              marginBottom: '6px'
            }}>
              <span>Rotate Spectrum</span>
              <span>{currentHue}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="359"
              value={currentHue}
              onChange={(e) => handleWheelHueChange(parseInt(e.target.value, 10))}
              style={{
                width: '100%',
                accentColor: '#FFFFFF',
                cursor: 'pointer',
                height: '6px',
                borderRadius: '3px'
              }}
            />
          </div>

          {/* Concentric Sonic Wave Arcs at Bottom (Signature Dashboard Left Panel Element from Image 2) */}
          <div style={{
            position: 'absolute',
            bottom: '-45px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '260px',
            height: '130px',
            pointerEvents: 'none',
            zIndex: 1,
            opacity: 0.65
          }}>
            <svg viewBox="0 0 260 130" style={{ width: '100%', height: '100%' }}>
              <path d="M 10 130 A 120 120 0 0 1 250 130" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5" />
              <path d="M 30 130 A 100 100 0 0 1 230 130" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
              <path d="M 50 130 A 80 80 0 0 1 210 130" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
              <path d="M 70 130 A 60 60 0 0 1 190 130" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />
            </svg>
          </div>
        </div>

        {/* ================================================================= */}
        {/* RIGHT COLUMN: ACTIVE PALETTE CONTROLS & LIVE DASHBOARD PREVIEW    */}
        {/* Styled with Dashboard Right Side Theme (Soft Cream + White Cards  */}
        {/* from Image 4)                                                    */}
        {/* ================================================================= */}
        <div style={{
          backgroundColor: '#FCFAF6',
          borderRadius: '22px',
          padding: '22px',
          border: '1.5px solid #EAE5F3',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '18px'
        }}>
          {/* Sleek Primary & Secondary Hex Control Cards */}
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '14px',
              marginBottom: '16px'
            }}>
              <SleekColorCard
                title="PRIMARY BRAND"
                color={primaryColor}
                onChange={(val) => handleManualColorChange('primary', val)}
              />

              <SleekColorCard
                title="SECONDARY ACCENT"
                color={secondaryColor}
                onChange={(val) => handleManualColorChange('secondary', val)}
              />
            </div>

            {/* Supporting Workspace & Pill Backgrounds */}
            <div style={{
              backgroundColor: '#FFFFFF',
              borderRadius: '14px',
              padding: '12px 16px',
              border: '1px solid #EAE5F3',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              alignItems: 'center'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#191B35', marginBottom: '4px' }}>
                  Accent Background
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={accentBgColor}
                    onChange={(e) => handleManualColorChange('accentBg', e.target.value)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      border: '1px solid #EAE5F3',
                      cursor: 'pointer',
                      padding: '2px',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  <input
                    type="text"
                    value={accentBgColor}
                    onChange={(e) => handleManualColorChange('accentBg', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: '1px solid #EAE5F3',
                      fontSize: '0.80rem',
                      fontFamily: 'monospace',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#191B35', marginBottom: '4px' }}>
                  Workspace Canvas
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="color"
                    value={mainBgColor}
                    onChange={(e) => handleManualColorChange('mainBg', e.target.value)}
                    style={{
                      width: '30px',
                      height: '30px',
                      borderRadius: '6px',
                      border: '1px solid #EAE5F3',
                      cursor: 'pointer',
                      padding: '2px',
                      backgroundColor: '#FFFFFF'
                    }}
                  />
                  <input
                    type="text"
                    value={mainBgColor}
                    onChange={(e) => handleManualColorChange('mainBg', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '5px 8px',
                      borderRadius: '6px',
                      border: '1px solid #EAE5F3',
                      fontSize: '0.80rem',
                      fontFamily: 'monospace',
                      fontWeight: 700
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Real-Time Live Application Mockup Preview */}
          <div style={{
            backgroundColor: mainBgColor,
            borderRadius: '16px',
            border: '1.5px solid #EAE5F3',
            padding: '16px',
            boxShadow: '0 4px 16px rgba(0,0,0,0.03)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontSize: '0.74rem', fontWeight: 800, color: secondaryColor, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <Eye size={13} />
              <span>Real-Time Dashboard Preview</span>
            </div>

            {/* Mock Dashboard Banner */}
            <div style={{
              backgroundColor: accentBgColor,
              borderRadius: '12px',
              padding: '12px 14px',
              border: `1.5px solid ${secondaryColor}33`,
              marginBottom: '10px'
            }}>
              <div style={{ fontSize: '0.62rem', fontWeight: 800, color: secondaryColor, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>
                YOUR VOICE, YOUR PACE
              </div>
              <div style={{ fontSize: '0.90rem', fontWeight: 800, color: primaryColor, marginBottom: '6px' }}>
                Make every practice session count.
              </div>
              <button
                type="button"
                style={{
                  backgroundColor: primaryColor,
                  color: '#FFFFFF',
                  padding: '5px 12px',
                  borderRadius: '9999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Resume breath management →
              </button>
            </div>

            {/* Mock Stat Card & Sidebar pill */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '10px', padding: '10px 12px', border: '1px solid #EAE5F3' }}>
                <div style={{ fontSize: '1.10rem', fontWeight: 800, color: primaryColor }}>35 min</div>
                <div style={{ fontSize: '0.70rem', color: '#77728A' }}>Practice this week</div>
                <div style={{ fontSize: '0.66rem', color: secondaryColor, fontWeight: 700, marginTop: '3px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Flame size={11} />
                  <span>Dynamic MySQL sync</span>
                </div>
              </div>

              <div style={{
                backgroundColor: primaryColor,
                borderRadius: '10px',
                padding: '10px 12px',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <img
                    src="/IMG_7974.PNG"
                    alt="Logo"
                    style={{ height: '18px', width: 'auto', objectFit: 'contain', background: '#FFFFFF', borderRadius: '4px', padding: '1px 3px' }}
                  />
                  <img
                    src="/NoTreble-Classicfinal.png"
                    alt="No Tre(ou)ble"
                    style={{ height: '16px', width: 'auto', objectFit: 'contain' }}
                  />
                </div>
                <div style={{ backgroundColor: 'rgba(255,255,255,0.18)', padding: '3px 6px', borderRadius: '5px', fontSize: '0.66rem', fontWeight: 700, color: '#FFFFFF', marginTop: '6px' }}>
                  My Dashboard · Active
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Preset Vocal Palettes Row */}
      <div style={{ borderTop: '1.5px solid #EAE5F3', paddingTop: '22px' }}>
        <h4 style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191B35', margin: '0 0 12px 0' }}>
          Curated Vocal Studio Palettes (1-Click Select)
        </h4>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '12px'
        }}>
          {PRESET_PALETTES.map(p => {
            const isSelected = primaryColor.toLowerCase() === p.primary.toLowerCase() && secondaryColor.toLowerCase() === p.secondary.toLowerCase();
            return (
              <button
                key={p.name}
                type="button"
                onClick={() => handleSelectPreset(p)}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '12px',
                  border: isSelected ? `2px solid ${p.secondary}` : '1.5px solid #EAE5F3',
                  padding: '12px',
                  textAlign: 'left',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  position: 'relative',
                  boxShadow: isSelected ? '0 4px 14px rgba(124, 58, 237, 0.12)' : 'none'
                }}
              >
                <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: p.primary }} />
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: p.secondary }} />
                  <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: p.accentBg, border: '1px solid #E2E8F0' }} />
                </div>
                <div style={{ fontSize: '0.78rem', fontWeight: 750, color: '#191B35', lineHeight: 1.25 }}>
                  {p.name}
                </div>
                {isSelected && (
                  <span style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    backgroundColor: p.secondary,
                    color: '#FFFFFF',
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Check size={11} strokeWidth={3} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
