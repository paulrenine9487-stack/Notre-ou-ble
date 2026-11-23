import React, { useState, useEffect, useRef } from 'react';
import { Pipette, X, Check } from 'lucide-react';
import { hexToRgb, rgbToHex, rgbToHsv, hsvToRgb, hexToHsl } from '../utils/themeUtils';

/**
 * SleekColorCard Component
 * Replicates the dark, modern color card design from the user's reference mockup:
 * - Upper title (e.g. PRIMARY (MAROON/RED), SECONDARY (NAVY/BLUE))
 * - Color Swatch + Large White Input with Golden Yellow Border (#F6C358)
 * - Full-width Color Preview Bar underneath
 * - Popover Color Picker with:
 *     * 2D Saturation/Value Canvas with draggable selector
 *     * Eyedropper tool (native EyeDropper API with native fallback)
 *     * Circular color preview
 *     * Rainbow Hue Slider
 *     * Exact R, G, B numeric channel inputs with labels
 */
export default function SleekColorCard({
  title = 'PRIMARY (MAROON/RED)',
  color = '#241442',
  onChange,
  onOpenStateChange
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(color);
  const cardRef = useRef(null);
  const popoverRef = useRef(null);
  const satValCanvasRef = useRef(null);
  const nativeColorInputRef = useRef(null);

  // Derive RGB and HSV from current color
  const rgb = hexToRgb(color);
  const hsv = rgbToHsv(rgb.r, rgb.g, rgb.b);

  // Sync internal input value when external color changes
  useEffect(() => {
    setInputValue(color.toUpperCase());
  }, [color]);

  // Notify parent if open state changes
  useEffect(() => {
    if (onOpenStateChange) onOpenStateChange(isOpen);
  }, [isOpen, onOpenStateChange]);

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (
        isOpen &&
        cardRef.current &&
        !cardRef.current.contains(event.target) &&
        popoverRef.current &&
        !popoverRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle typing in the white hex input
  const handleHexInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);

    let clean = val.trim();
    if (!clean.startsWith('#')) clean = '#' + clean;

    // Validate 3 or 6 hex digits
    if (/^#[0-9A-Fa-f]{6}$/.test(clean)) {
      if (onChange) onChange(clean.toUpperCase());
    } else if (/^#[0-9A-Fa-f]{3}$/.test(clean)) {
      const expanded = '#' + clean.slice(1).split('').map(c => c + c).join('');
      if (onChange) onChange(expanded.toUpperCase());
    }
  };

  // Handle 2D Saturation / Value selection
  const handleSatValSelect = (e) => {
    if (!satValCanvasRef.current) return;
    const rect = satValCanvasRef.current.getBoundingClientRect();
    const clientX = e.clientX ?? (e.touches && e.touches[0]?.clientX);
    const clientY = e.clientY ?? (e.touches && e.touches[0]?.clientY);
    if (clientX === undefined || clientY === undefined) return;

    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

    const s = Math.round((x / rect.width) * 100);
    const v = Math.round((1 - y / rect.height) * 100);

    const newRgb = hsvToRgb(hsv.h, s, v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    if (onChange) onChange(newHex);
  };

  const startSatValDrag = (e) => {
    e.preventDefault();
    handleSatValSelect(e);

    const onMove = (moveEvent) => {
      handleSatValSelect(moveEvent);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    window.addEventListener('touchmove', onMove);
    window.addEventListener('touchend', onUp);
  };

  // Handle Rainbow Hue Slider change
  const handleHueChange = (newHue) => {
    const s = hsv.s === 0 ? 80 : hsv.s; // ensure visible saturation if pure gray
    const v = hsv.v === 0 ? 50 : hsv.v; // ensure visible brightness
    const newRgb = hsvToRgb(newHue, s, v);
    const newHex = rgbToHex(newRgb.r, newRgb.g, newRgb.b);
    if (onChange) onChange(newHex);
  };

  // Handle RGB numeric input changes
  const handleRgbChannelChange = (channel, value) => {
    let num = parseInt(value, 10);
    if (isNaN(num)) num = 0;
    num = Math.max(0, Math.min(255, num));

    const nextRgb = {
      r: channel === 'r' ? num : rgb.r,
      g: channel === 'g' ? num : rgb.g,
      b: channel === 'b' ? num : rgb.b
    };

    const newHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
    if (onChange) onChange(newHex);
  };

  // Eyedropper Tool
  const handleEyedropper = async () => {
    if (window.EyeDropper) {
      try {
        const eyeDropper = new window.EyeDropper();
        const result = await eyeDropper.open();
        if (result && result.sRGBHex) {
          if (onChange) onChange(result.sRGBHex.toUpperCase());
        }
      } catch (err) {
        // User cancelled or aborted eyedropper
      }
    } else if (nativeColorInputRef.current) {
      nativeColorInputRef.current.click();
    }
  };

  // Hue pure color for 2D canvas background
  const pureHueHex = rgbToHex(
    hsvToRgb(hsv.h, 100, 100).r,
    hsvToRgb(hsv.h, 100, 100).g,
    hsvToRgb(hsv.h, 100, 100).b
  );

  return (
    <div
      ref={cardRef}
      style={{
        backgroundColor: '#0A0B10',
        borderRadius: '14px',
        padding: '16px 18px',
        border: '1px solid #1A1D27',
        boxShadow: '0 6px 22px rgba(0, 0, 0, 0.45)',
        position: 'relative',
        userSelect: 'none'
      }}
    >
      {/* Title (Vibrant Sky Blue Matching Screenshot) */}
      <div
        style={{
          color: '#4A85F6',
          fontSize: '0.80rem',
          fontWeight: 800,
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          marginBottom: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span>{title}</span>
        <span style={{ fontSize: '0.68rem', color: '#64748B', fontWeight: 600, letterSpacing: '0' }}>
          {isOpen ? 'Tap outside to close' : 'Click to edit'}
        </span>
      </div>

      {/* Top Row: Square Swatch + Large White Input with Gold Border */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Color Swatch */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title="Click to open color picker"
          style={{
            width: '46px',
            height: '46px',
            borderRadius: '8px',
            backgroundColor: color,
            border: '2px solid rgba(255, 255, 255, 0.25)',
            boxShadow: `0 0 12px ${color}55`,
            cursor: 'pointer',
            flexShrink: 0,
            padding: 0,
            outline: 'none',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
        />

        {/* Big White Rounded Input Field with Gold Border (#F6C358) */}
        <div style={{ flex: 1, position: 'relative' }}>
          <input
            type="text"
            value={inputValue}
            onChange={handleHexInputChange}
            onClick={() => setIsOpen(true)}
            placeholder="#241442"
            maxLength={9}
            style={{
              width: '100%',
              backgroundColor: '#FFFFFF',
              border: '2.5px solid #F6C358',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '1.18rem',
              fontWeight: 750,
              fontFamily: 'monospace, "Plus Jakarta Sans", sans-serif',
              color: '#0F172A',
              outline: 'none',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
              boxSizing: 'border-box',
              letterSpacing: '0.02em'
            }}
          />
        </div>
      </div>

      {/* Full-width Color Preview Bar underneath */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        title="Click to open color picker"
        style={{
          width: '100%',
          height: '32px',
          backgroundColor: color,
          borderRadius: '8px',
          marginTop: '12px',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          boxShadow: `inset 0 0 10px rgba(0, 0, 0, 0.25), 0 2px 8px ${color}44`,
          cursor: 'pointer',
          transition: 'opacity 0.2s ease'
        }}
        onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.9'; }}
        onMouseLeave={(e) => { e.currentTarget.style.opacity = '1'; }}
      />

      {/* Hidden native color input fallback */}
      <input
        ref={nativeColorInputRef}
        type="color"
        value={color.length === 7 ? color : '#241442'}
        onChange={(e) => {
          if (onChange) onChange(e.target.value.toUpperCase());
        }}
        style={{ display: 'none' }}
      />

      {/* =================================================================== */}
      {/* FLOATING INTERACTIVE COLOR PICKER POPOVER (Exact Match to Image 1)  */}
      {/* =================================================================== */}
      {isOpen && (
        <div
          ref={popoverRef}
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            left: 0,
            right: 0,
            zIndex: 1000,
            backgroundColor: '#0E111A',
            border: '1px solid #23283B',
            borderRadius: '14px',
            padding: '14px',
            boxShadow: '0 16px 42px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)'
          }}
        >
          {/* 1. 2D Saturation / Value Canvas */}
          <div
            ref={satValCanvasRef}
            onMouseDown={startSatValDrag}
            onTouchStart={startSatValDrag}
            style={{
              width: '100%',
              height: '136px',
              borderRadius: '8px',
              backgroundColor: pureHueHex,
              position: 'relative',
              cursor: 'crosshair',
              overflow: 'hidden',
              boxShadow: 'inset 0 0 4px rgba(0, 0, 0, 0.4)'
            }}
          >
            {/* White horizontal gradient overlay (0% to 100% saturation) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to right, #FFFFFF 0%, rgba(255, 255, 255, 0) 100%)'
              }}
            />
            {/* Black vertical gradient overlay (100% to 0% brightness/value) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'linear-gradient(to bottom, transparent 0%, #000000 100%)'
              }}
            />

            {/* Draggable circular selector ring */}
            <div
              style={{
                position: 'absolute',
                left: `${hsv.s}%`,
                top: `${100 - hsv.v}%`,
                transform: 'translate(-50%, -50%)',
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: '2px solid #FFFFFF',
                boxShadow: '0 0 3px #000000, inset 0 0 3px #000000',
                pointerEvents: 'none'
              }}
            />
          </div>

          {/* 2. Middle Row: Eyedropper + Circular Preview + Rainbow Hue Slider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginTop: '12px'
            }}
          >
            {/* Eyedropper Tool */}
            <button
              type="button"
              onClick={handleEyedropper}
              title="Pick color from screen or launch palette"
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '6px',
                backgroundColor: '#191D2C',
                border: '1px solid #2B3349',
                color: '#CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                flexShrink: 0,
                padding: 0
              }}
            >
              <Pipette size={15} />
            </button>

            {/* Circular Color Preview */}
            <div
              style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                backgroundColor: color,
                border: '2px solid #FFFFFF',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
                flexShrink: 0
              }}
            />

            {/* Rainbow Horizontal Hue Slider */}
            <div style={{ flex: 1, position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="range"
                min="0"
                max="359"
                value={hsv.h}
                onChange={(e) => handleHueChange(parseInt(e.target.value, 10))}
                style={{
                  width: '100%',
                  height: '12px',
                  borderRadius: '6px',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  background:
                    'linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)',
                  outline: 'none',
                  cursor: 'pointer',
                  margin: 0
                }}
              />
            </div>
          </div>

          {/* 3. Bottom Row: Numeric RGB Inputs (R, G, B) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
              marginTop: '12px'
            }}
          >
            {/* Red Channel */}
            <div>
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.r}
                onChange={(e) => handleRgbChannelChange('r', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#161925',
                  border: '1px solid #282F45',
                  borderRadius: '6px',
                  padding: '6px 4px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div
                style={{
                  color: '#94A3B8',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginTop: '3px',
                  letterSpacing: '0.04em'
                }}
              >
                R
              </div>
            </div>

            {/* Green Channel */}
            <div>
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.g}
                onChange={(e) => handleRgbChannelChange('g', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#161925',
                  border: '1px solid #282F45',
                  borderRadius: '6px',
                  padding: '6px 4px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div
                style={{
                  color: '#94A3B8',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginTop: '3px',
                  letterSpacing: '0.04em'
                }}
              >
                G
              </div>
            </div>

            {/* Blue Channel */}
            <div>
              <input
                type="number"
                min="0"
                max="255"
                value={rgb.b}
                onChange={(e) => handleRgbChannelChange('b', e.target.value)}
                style={{
                  width: '100%',
                  backgroundColor: '#161925',
                  border: '1px solid #282F45',
                  borderRadius: '6px',
                  padding: '6px 4px',
                  color: '#FFFFFF',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
              <div
                style={{
                  color: '#94A3B8',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  textAlign: 'center',
                  marginTop: '3px',
                  letterSpacing: '0.04em'
                }}
              >
                B
              </div>
            </div>
          </div>

          {/* Quick Actions at bottom of popover */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid #1F2436'
            }}
          >
            <button
              type="button"
              onClick={() => nativeColorInputRef.current?.click()}
              style={{
                background: 'none',
                border: 'none',
                color: '#60A5FA',
                fontSize: '0.72rem',
                fontWeight: 650,
                cursor: 'pointer',
                padding: '2px 4px'
              }}
            >
              System Picker...
            </button>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              style={{
                backgroundColor: '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Check size={12} />
              <span>Done</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
