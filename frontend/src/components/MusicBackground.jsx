import React from 'react';
import '../styles/musicBackground.css';

export default function MusicBackground() {
  // Equalizer 28 bar heights (40-200px)
  const eqHeights = [
    45, 68, 95, 140, 180, 195, 160, 120, 85, 70,
    115, 170, 200, 185, 140, 95, 125, 175, 190, 170,
    135, 105, 75, 110, 150, 115, 70, 42
  ];

  return (
    <div className="music-bg-container" aria-hidden="true">
      {/* Base Vertical Gradient + 6 Alternating Radial Glows */}
      <div className="music-bg-base" />

      {/* SVG Vector Artwork Layer */}
      <svg
        className="music-bg-svg"
        viewBox="0 0 1440 3200"
        preserveAspectRatio="xMidYMin slice"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="dividerGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>

          <linearGradient id="eqBarGrad" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#8B5CF6" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <radialGradient id="discGrad" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.85" />
            <stop offset="70%" stopColor="#6366F1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#38BDF8" stopOpacity="0.35" />
          </radialGradient>

          <linearGradient id="bottomWave1" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#A78BFA" />
            <stop offset="50%" stopColor="#38BDF8" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>

          <linearGradient id="bottomWave2" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7C3AED" />
            <stop offset="100%" stopColor="#38BDF8" />
          </linearGradient>

          <linearGradient id="bottomWave3" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#EC4899" />
            <stop offset="100%" stopColor="#8B5CF6" />
          </linearGradient>

          {/* Masks */}
          {/* Horizontal fade mask for staff lines & equalizer */}
          <linearGradient id="hFadeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#000000" />
            <stop offset="12%" stopColor="#FFFFFF" />
            <stop offset="88%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>
          <mask id="hFadeMask">
            <rect x="-60" y="0" width="1560" height="3200" fill="url(#hFadeGrad)" />
          </mask>

          {/* Zone B Dot Grid Pattern & Mask */}
          <pattern id="dotPattern" width="28" height="28" patternUnits="userSpaceOnUse">
            <circle cx="14" cy="14" r="1" fill="#8B5CF6" fillOpacity="0.55" />
          </pattern>

          <radialGradient id="dotMaskGrad" cx="50%" cy="50%" r="50%">
            <stop offset="30%" stopColor="#FFFFFF" stopOpacity="1" />
            <stop offset="70%" stopColor="#FFFFFF" stopOpacity="0.65" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0" />
          </radialGradient>
          <mask id="dotEllipticalMask">
            <ellipse cx="720" cy="1580" rx="660" ry="430" fill="url(#dotMaskGrad)" />
          </mask>

          {/* Reusable Symbol: Single Eighth Note */}
          <g id="mb-note-single">
            <ellipse cx="10" cy="22" rx="9.5" ry="6.8" transform="rotate(-25 10 22)" fill="currentColor" />
            <rect x="17" y="0" width="2.4" height="23" fill="currentColor" />
            <path d="M 19.4 0 C 24.5 5.5, 26.5 12, 22.5 18 C 21.2 13.5, 20.8 8.5, 19.4 4 Z" fill="currentColor" />
          </g>

          {/* Reusable Symbol: Beamed Eighth Notes */}
          <g id="mb-note-beamed">
            <ellipse cx="9" cy="24" rx="8.5" ry="6.2" transform="rotate(-25 9 24)" fill="currentColor" />
            <rect x="15.5" y="2" width="2.4" height="23" fill="currentColor" />
            <ellipse cx="33" cy="19" rx="8.5" ry="6.2" transform="rotate(-25 33 19)" fill="currentColor" />
            <rect x="39.5" y="-3" width="2.4" height="23" fill="currentColor" />
            <polygon points="15.5,2 41.9,-3 41.9,2.4 15.5,7.4" fill="currentColor" />
          </g>

          {/* Reusable Symbol: 4-Point Sparkle */}
          <g id="mb-sparkle">
            <path d="M 0 -18 Q 0 0, 18 0 Q 0 0, 0 18 Q 0 0, -18 0 Q 0 0, 0 -18 Z" fill="currentColor" />
          </g>
        </defs>

        {/* =====================================================================
            GIANT WATERMARKS (4 oversized music notes, ultra-light 5-6% opacity)
            ===================================================================== */}
        {/* Watermark 1: Soft Pastel Violet at Top-Left (Zone A) */}
        <g
          className="mb-watermark-note"
          transform="translate(60, 140) scale(4.5) rotate(-14)"
          color="#C4B5FD"
          opacity="0.06"
        >
          <use href="#mb-note-beamed" />
        </g>

        {/* Watermark 2: Soft Pastel Violet at Top-Right (Zone A) */}
        <g
          className="mb-watermark-note"
          transform="translate(1240, 480) scale(4.4) rotate(16)"
          color="#C4B5FD"
          opacity="0.05"
        >
          <use href="#mb-note-single" />
        </g>

        {/* Watermark 3: Soft Sky Blue at Lower-Right (Zone B / C transition) */}
        <g
          className="mb-watermark-note"
          transform="translate(1230, 2260) scale(4.6) rotate(12)"
          color="#BAE6FD"
          opacity="0.06"
        >
          <use href="#mb-note-beamed" />
        </g>

        {/* Watermark 4: Soft Sky Blue at Lower-Left (Zone C) */}
        <g
          className="mb-watermark-note"
          transform="translate(50, 2740) scale(4.5) rotate(-16)"
          color="#BAE6FD"
          opacity="0.06"
        >
          <use href="#mb-note-single" />
        </g>

        {/* =====================================================================
            ZONE A: Behind Section 2 (Y: ~0 to 1050) - Soft, Light, Uncluttered
            ===================================================================== */}
        {/* Five flowing staff lines, ultra-light 1.2px, #C4B5FD at 10% opacity */}
        <g mask="url(#hFadeMask)">
          <path d="M -40 280 C 320 180, 760 440, 1480 250" stroke="#C4B5FD" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <path d="M -40 298 C 320 198, 760 458, 1480 268" stroke="#C4B5FD" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <path d="M -40 316 C 320 216, 760 476, 1480 286" stroke="#C4B5FD" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <path d="M -40 334 C 320 234, 760 494, 1480 304" stroke="#C4B5FD" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <path d="M -40 352 C 320 252, 760 512, 1480 322" stroke="#C4B5FD" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
        </g>

        {/* Second set of three staff lines, ultra-light 1.2px, #BAE6FD at 10% opacity */}
        <g mask="url(#hFadeMask)">
          <path d="M -40 520 C 420 640, 960 400, 1480 530" stroke="#BAE6FD" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <path d="M -40 538 C 420 658, 960 418, 1480 548" stroke="#BAE6FD" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <path d="M -40 556 C 420 676, 960 436, 1480 566" stroke="#BAE6FD" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
        </g>

        {/* Floating Notes in Zone A: positioned at outer margins away from center text */}
        <g transform="translate(100, 260) scale(1.2) rotate(-6)" color="#A78BFA" opacity="0.12">
          <use href="#mb-note-beamed" />
        </g>
        <g className="mb-mobile-hide" transform="translate(1330, 230) scale(1.15) rotate(10)" color="#A78BFA" opacity="0.12">
          <use href="#mb-note-single" />
        </g>
        <g transform="translate(150, 580) scale(1.2) rotate(6)" color="#38BDF8" opacity="0.12">
          <use href="#mb-note-beamed" />
        </g>
        <g className="mb-mobile-hide" transform="translate(1260, 520) scale(1.2) rotate(-8)" color="#38BDF8" opacity="0.12">
          <use href="#mb-note-single" />
        </g>

        {/* Delicate Sparkles in Zone A: positioned at outer margins away from text */}
        <g transform="translate(70, 200) scale(1.3)" color="#FBCFE8" opacity="0.14">
          <use href="#mb-sparkle" />
        </g>
        <g className="mb-mobile-hide" transform="translate(1360, 170) scale(1.3)" color="#C4B5FD" opacity="0.14">
          <use href="#mb-sparkle" />
        </g>
        <g transform="translate(80, 490) scale(1.2)" color="#FBCFE8" opacity="0.12">
          <use href="#mb-sparkle" />
        </g>
        <g className="mb-mobile-hide" transform="translate(1340, 450) scale(1.2)" color="#C4B5FD" opacity="0.12">
          <use href="#mb-sparkle" />
        </g>

        {/* Section Divider 1 (Zone A to B, ~Y=1050): Light wavy gradient lines */}
        <g opacity="0.18">
          <path
            d="M -20 1030 C 260 990, 520 1070, 780 1020 C 1040 970, 1260 1060, 1460 1030"
            stroke="url(#dividerGrad)"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M -20 1045 C 260 1005, 520 1085, 780 1035 C 1040 985, 1260 1075, 1460 1045"
            stroke="url(#dividerGrad)"
            strokeWidth="1.5"
            fill="none"
          />
        </g>

        {/* =====================================================================
            ZONE B: Behind Section 3 (Y: ~1050 to 2100) - Soft, Light, Uncluttered
            ===================================================================== */}
        {/* Dot grid: light opacity 0.08 */}
        <rect x="0" y="1120" width="1440" height="920" fill="url(#dotPattern)" mask="url(#dotEllipticalMask)" opacity="0.18" />

        {/* Vinyl-style Concentric Rings: 3 at Left + Gradient Disc (Soft) */}
        <g transform="translate(90, 1420)">
          <circle cx="0" cy="0" r="32" fill="url(#discGrad)" fillOpacity="0.12" />
          <circle cx="0" cy="0" r="60" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="105" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="150" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
        </g>

        {/* Vinyl-style Concentric Rings: 4 at Right + Gradient Disc (Soft) */}
        <g transform="translate(1360, 1540)">
          <circle cx="0" cy="0" r="42" fill="url(#discGrad)" fillOpacity="0.12" />
          <circle cx="0" cy="0" r="70" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="120" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="170" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="220" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
        </g>

        {/* Equalizer Ribbon: light pastel vertical bars */}
        <g mask="url(#hFadeMask)">
          {eqHeights.map((h, i) => {
            const x = 18 + i * 50.5;
            const baseY = 1970;
            return (
              <rect
                key={i}
                x={x}
                y={baseY - h}
                width={12}
                height={h}
                rx={6}
                ry={6}
                fill="url(#eqBarGrad)"
                fillOpacity="0.14"
              />
            );
          })}
        </g>

        {/* Notes in Zone B (Soft, Light) */}
        <g transform="translate(120, 1260) scale(1.2) rotate(-5)" color="#A78BFA" opacity="0.12">
          <use href="#mb-note-beamed" />
        </g>
        <g className="mb-mobile-hide" transform="translate(1320, 1700) scale(1.2) rotate(8)" color="#A78BFA" opacity="0.12">
          <use href="#mb-note-single" />
        </g>

        {/* Sparkles in Zone B (Soft, Light) */}
        <g transform="translate(110, 1680) scale(1.3)" color="#7DD3FC" opacity="0.14">
          <use href="#mb-sparkle" />
        </g>
        <g className="mb-mobile-hide" transform="translate(1330, 1840) scale(1.3)" color="#FBCFE8" opacity="0.14">
          <use href="#mb-sparkle" />
        </g>

        {/* Section Divider 2 (Zone B to C, ~Y=2100): Light wavy gradient lines */}
        <g opacity="0.18">
          <path
            d="M -20 2080 C 260 2040, 520 2120, 780 2070 C 1040 2020, 1260 2110, 1460 2080"
            stroke="url(#dividerGrad)"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M -20 2095 C 260 2055, 520 2135, 780 2085 C 1040 2035, 1260 2125, 1460 2095"
            stroke="url(#dividerGrad)"
            strokeWidth="1.5"
            fill="none"
          />
        </g>

        {/* =====================================================================
            ZONE C: Behind Section 4 (Y: ~2100 to 3200) - Soft, Light, Uncluttered
            ===================================================================== */}
        {/* Ripple rings: 4 at left edge (Soft) */}
        <g transform="translate(60, 2520)">
          <circle cx="0" cy="0" r="36" fill="#8B5CF6" fillOpacity="0.12" />
          <circle cx="0" cy="0" r="65" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="115" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="165" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="215" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
        </g>

        {/* Ripple rings: 3 at right edge (Soft) */}
        <g transform="translate(1380, 2450)">
          <circle cx="0" cy="0" r="30" fill="url(#discGrad)" fillOpacity="0.12" />
          <circle cx="0" cy="0" r="60" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="110" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
          <circle cx="0" cy="0" r="160" stroke="#8B5CF6" strokeWidth="1.2" strokeOpacity="0.10" fill="none" />
        </g>

        {/* Notes in Zone C (Soft, Light) */}
        <g transform="translate(140, 2320) scale(1.2) rotate(-8)" color="#A78BFA" opacity="0.12">
          <use href="#mb-note-single" />
        </g>
        <g className="mb-mobile-hide" transform="translate(1310, 2360) scale(1.15) rotate(10)" color="#A78BFA" opacity="0.12">
          <use href="#mb-note-single" />
        </g>

        {/* Sparkles in Zone C (Soft, Light) */}
        <g transform="translate(110, 2230) scale(1.3)" color="#FBCFE8" opacity="0.14">
          <use href="#mb-sparkle" />
        </g>
        <g className="mb-mobile-hide" transform="translate(1340, 2730) scale(1.3)" color="#7DD3FC" opacity="0.14">
          <use href="#mb-sparkle" />
        </g>

        {/* Three Layered Wave Shapes along the bottom 340px (Y: 2860 to 3200) - Soft Pastel */}
        <path
          d="M 0 2920 C 320 2850, 720 2960, 1100 2870 C 1260 2830, 1370 2850, 1440 2870 L 1440 3200 L 0 3200 Z"
          fill="url(#bottomWave1)"
          fillOpacity="0.16"
        />

        <path
          d="M 0 2980 C 380 3040, 780 2910, 1120 3000 C 1280 3040, 1380 2980, 1440 2950 L 1440 3200 L 0 3200 Z"
          fill="url(#bottomWave2)"
          fillOpacity="0.10"
        />

        <path
          d="M 0 3050 C 360 2990, 740 3090, 1080 3020 C 1260 2980, 1380 3040, 1440 3030 L 1440 3200 L 0 3200 Z"
          fill="url(#bottomWave3)"
          fillOpacity="0.12"
        />
      </svg>
    </div>
  );
}
