import React, { useState } from 'react';
import {
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Play
} from 'lucide-react';
import PostureInstructionalVideoPlayer from './PostureInstructionalVideoPlayer';

// Single Character Clean Studio Model (Side silhouettes & 360 bar removed)
import postureCharacterImg from '../assets/images/posture_character_clean.jpg';

// Extracted High-Resolution Anatomical Thumbnails
import headIcon from '../assets/images/indicators/head.png';
import shouldersIcon from '../assets/images/indicators/shoulders.png';
import ribsIcon from '../assets/images/indicators/ribs.png';
import kneesIcon from '../assets/images/indicators/knees.png';
import feetIcon from '../assets/images/indicators/feet.png';

/**
 * NO TRE(OU)BLE - STAGE 03 PART 02: INTERACTIVE POSTURE LEARNING
 * World-Class UI Posture Visualization:
 * - 5 Real Native Pill Cards on left:
 *     - Crisp circular anatomical icons (head, shoulders, ribs, knees, feet)
 *     - Pixel-perfect typography and natural padding
 *     - Clean active card state with exact 2px teal border, soft glow, and checkmark
 * - Single 3D Character on right on illuminated pedestal
 * - Anatomically accurate radar beacon dots:
 *     - Head: 7.3% (forehead / head center, not neck)
 *     - Shoulders: 18.5% (clavicle / shoulder line)
 *     - Ribs: 28.8% (lower ribs / solar plexus)
 *     - Knees: 51.5% (knee joints)
 *     - Feet: 75.4% (feet / stance)
 * - Complete singing technique pedagogical guidance card below
 */
export default function PostureViewer3D({
  indicators = [],
  selectedIndicatorId = null,
  onSelectIndicator = () => { },
  modelAssetUrl = null
}) {
  const [viewMode, setViewMode] = useState('3d-model'); // '3d-model' | 'instructional-video'

  // Fallback default indicators matching database schema
  const defaultIndicators = [
    {
      id: 1,
      title: 'Head level',
      body_region: 'head',
      icon: 'head',
      description: 'Align your ears directly over your shoulders. Keep your chin parallel to the floor without tucking in or tilting up to keep your vocal tract open.',
      tip: 'Imagine a puppet string gently lifting the crown of your head toward the sky.'
    },
    {
      id: 2,
      title: 'Shoulders loose',
      body_region: 'shoulders',
      icon: 'shoulders',
      description: 'Drop your shoulders naturally down and slightly back. Release any trapped trapezius tension so your clavicles stay resting and neutral.',
      tip: 'Inhale deeply without letting your shoulder blades rise a single millimetre.'
    },
    {
      id: 3,
      title: 'Chest forward',
      body_region: 'ribs',
      icon: 'ribs',
      description: 'Keep your chest comfortably lifted and forward without arching your back. Maintain open, buoyant expansion as you sing.',
      tip: 'Keep your sternum buoyant and forward to give your lungs and diaphragm optimal freedom.'
    },
    {
      id: 4,
      title: 'Knees soft, not locked',
      body_region: 'knees',
      icon: 'knees',
      description: 'Maintain a slight, elastic micro-bend in both knees to allow grounding, pelvic freedom, and optimal blood flow during singing.',
      tip: 'Locked knees cause lower-back stiffness and restricted breath support.'
    },
    {
      id: 5,
      title: 'Feet hip-width apart',
      body_region: 'feet',
      icon: 'feet',
      description: 'Place both feet firmly hip-width apart with weight balanced evenly (50/50) between the heels and the balls of the feet.',
      tip: 'Feel tripod grounding in each foot: big toe knuckle, pinky toe knuckle, and heel.'
    }
  ];

  const activeIndicators = indicators && indicators.length >= 5 ? indicators : defaultIndicators;

  // Active Indicator State
  const activeIndicator =
    activeIndicators.find((i) => i.id === selectedIndicatorId) ||
    activeIndicators[0] ||
    defaultIndicators[0];

  const currentIndex = activeIndicators.findIndex((i) => i.id === activeIndicator.id);

  // Thumbnail icon map
  const iconMap = {
    head: headIcon,
    shoulders: shouldersIcon,
    ribs: ribsIcon,
    knees: kneesIcon,
    feet: feetIcon
  };

  // Anatomical target hotspots precisely aligned with central character anatomy (x = 51.9%):
  // Head: 7.3% (forehead / ears / head center)
  // Shoulders: 18.5% (shoulder line / clavicle)
  // Ribs: 28.8% (lower ribs / solar plexus)
  // Knees: 51.5% (knee joints)
  // Feet: 75.4% (feet / sneakers)
  const anatomicalBeacons = [
    { key: 'head', id: activeIndicators[0]?.id || 1, left: '51.9%', top: '7.3%', label: 'Head level' },
    { key: 'shoulders', id: activeIndicators[1]?.id || 2, left: '51.9%', top: '18.5%', label: 'Shoulders loose' },
    { key: 'ribs', id: activeIndicators[2]?.id || 3, left: '51.9%', top: '28.8%', label: 'Chest forward' },
    { key: 'knees', id: activeIndicators[3]?.id || 4, left: '51.9%', top: '51.5%', label: 'Knees soft' },
    { key: 'feet', id: activeIndicators[4]?.id || 5, left: '51.9%', top: '75.4%', label: 'Feet grounded' }
  ];

  // Cycle Next / Prev indicator
  const handlePrevIndicator = () => {
    const nextIdx = (currentIndex - 1 + activeIndicators.length) % activeIndicators.length;
    onSelectIndicator(activeIndicators[nextIdx].id);
  };

  const handleNextIndicator = () => {
    const nextIdx = (currentIndex + 1) % activeIndicators.length;
    onSelectIndicator(activeIndicators[nextIdx].id);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        width: '100%'
      }}
    >
      <style>{`
        @keyframes radarPulse {
          0% {
            transform: scale(0.6);
            opacity: 0.9;
          }
          50% {
            transform: scale(1.6);
            opacity: 0.35;
          }
          100% {
            transform: scale(2.2);
            opacity: 0;
          }
        }
        .posture-main-stage {
          display: grid;
          grid-template-columns: minmax(210px, 240px) 1fr;
          gap: 16px;
          align-items: center;
          background: linear-gradient(135deg, #F4F8FB 0%, #E9F2F7 100%);
          border-radius: 24px;
          padding: 18px 20px;
          border: 1px solid #DCE7EE;
          box-shadow: 0 10px 30px rgba(13, 148, 136, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
        }
        @media (max-width: 768px) {
          .posture-main-stage {
            grid-template-columns: 1fr;
          }
        }
        .posture-pill-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 8px 14px 8px 8px;
          border-radius: 9999px;
          cursor: pointer;
          text-align: left;
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
          position: relative;
          width: 100%;
          box-sizing: border-box;
        }
        .posture-pill-btn:hover {
          transform: translateX(3px);
          background: #FFFFFF;
          border-color: #99F6E4;
          box-shadow: 0 4px 12px rgba(13, 148, 136, 0.10);
        }
        .beacon-point {
          position: absolute;
          transform: translate(-50%, -50%);
          cursor: pointer;
          z-index: 20;
        }
      `}</style>

      {/* Top Mode Selector Tabs */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 4, flexWrap: 'wrap' }}>
        <button
          type="button"
          onClick={() => setViewMode('3d-model')}
          style={{
            padding: '8px 16px',
            borderRadius: 9999,
            border: viewMode === '3d-model' ? '2px solid #0D9488' : '1.5px solid #E2E8F0',
            backgroundColor: viewMode === '3d-model' ? '#0D9488' : '#FFFFFF',
            color: viewMode === '3d-model' ? '#FFFFFF' : '#334155',
            fontSize: '0.82rem',
            fontWeight: 750,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: viewMode === '3d-model' ? '0 2px 8px rgba(13, 148, 136, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Sparkles size={14} />
          <span>Interactive 3D Posture Model</span>
        </button>

        <button
          type="button"
          onClick={() => setViewMode('instructional-video')}
          style={{
            padding: '8px 16px',
            borderRadius: 9999,
            border: viewMode === 'instructional-video' ? '2px solid #7C3AED' : '1.5px solid #E2E8F0',
            backgroundColor: viewMode === 'instructional-video' ? '#7C3AED' : '#FFFFFF',
            color: viewMode === 'instructional-video' ? '#FFFFFF' : '#334155',
            fontSize: '0.82rem',
            fontWeight: 750,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            boxShadow: viewMode === 'instructional-video' ? '0 2px 8px rgba(124, 58, 237, 0.25)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          <Play size={14} />
          <span>7-Step Mirror Masterclass Video</span>
        </button>
      </div>

      {viewMode === 'instructional-video' ? (
        <PostureInstructionalVideoPlayer />
      ) : (
        <>
          {/* Main Posture Visualization Stage: Native Pill Cards on Left + Single Character on Right */}
          <div className="posture-main-stage">
        {/* Left Column: 5 Native Responsive Pill Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, zIndex: 10 }}>
          {activeIndicators.map((ind) => {
            const isSelected = activeIndicator?.id === ind.id;
            return (
              <button
                key={ind.id}
                type="button"
                className="posture-pill-btn"
                onClick={() => onSelectIndicator(ind.id)}
                style={{
                  background: isSelected ? '#FFFFFF' : 'rgba(255, 255, 255, 0.82)',
                  border: isSelected ? '2px solid #0D9488' : '1.5px solid #E2E8F0',
                  boxShadow: isSelected
                    ? '0 4px 16px rgba(13, 148, 136, 0.20), inset 0 0 0 1px rgba(255, 255, 255, 0.9)'
                    : '0 2px 6px rgba(0, 0, 0, 0.03)'
                }}
                aria-label={`Select ${ind.title}`}
              >
                {/* Crisp Circular Anatomical Icon (Single circle, no outer border) */}
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  <img
                    src={iconMap[ind.body_region] || iconMap[ind.icon] || headIcon}
                    alt={ind.title}
                    style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  />
                </div>

                {/* Card Title */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: '0.90rem',
                      fontWeight: 750,
                      color: isSelected ? '#0F766E' : '#1E293B',
                      lineHeight: 1.25
                    }}
                  >
                    {ind.title}
                  </div>
                </div>

                {/* Integrated Checkmark Pill on Right */}
                {isSelected && (
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#E6FFFA',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      boxShadow: '0 1px 4px rgba(13, 148, 136, 0.25)'
                    }}
                  >
                    <CheckCircle2 size={15} color="#0D9488" />
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Right Column: Single 3D Character on Turntable Pedestal */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: 360,
            margin: '0 auto',
            aspectRatio: '405 / 520',
            borderRadius: 20,
            overflow: 'hidden'
          }}
          title="Single 3D Posture Model - Click any point to inspect alignment"
        >
          <img
            src={postureCharacterImg}
            alt="No Tre(ou)ble 3D Posture Model"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />

          {/* 5 Anatomical Hotspots: Correctly Positioned on Head, Shoulders, Ribs, Knees, Feet */}
          {anatomicalBeacons.map((beacon) => {
            const isSelected = activeIndicator?.id === beacon.id;
            return (
              <div
                key={beacon.key}
                className="beacon-point"
                style={{
                  left: beacon.left,
                  top: beacon.top
                }}
                onClick={() => onSelectIndicator(beacon.id)}
                title={`${beacon.label} - Click to inspect alignment`}
              >
                {/* Concentric radar pulse ripples on active body point */}
                {isSelected && (
                  <>
                    <div
                      style={{
                        position: 'absolute',
                        left: -14,
                        top: -14,
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: 'rgba(20, 184, 166, 0.4)',
                        animation: 'radarPulse 1.8s infinite ease-out'
                      }}
                    />
                    <div
                      style={{
                        position: 'absolute',
                        left: -20,
                        top: -20,
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        border: '1.5px solid rgba(45, 212, 191, 0.65)',
                        animation: 'radarPulse 1.8s infinite ease-out 0.6s'
                      }}
                    />
                  </>
                )}

                {/* Glowing Center Dot */}
                <div
                  style={{
                    width: isSelected ? 12 : 9,
                    height: isSelected ? 12 : 9,
                    borderRadius: '50%',
                    background: isSelected ? '#0D9488' : 'rgba(13, 148, 136, 0.75)',
                    border: '2px solid #FFFFFF',
                    boxShadow: isSelected
                      ? '0 0 12px #2DD4BF, 0 0 6px #0D9488'
                      : '0 1px 4px rgba(0,0,0,0.25)',
                    transition: 'all 0.2s ease'
                  }}
                />

                {/* Active Callout Badge at correct anatomical height */}
                {isSelected && (
                  <div
                    style={{
                      position: 'absolute',
                      left: 18,
                      top: -11,
                      background: 'rgba(25, 27, 53, 0.90)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFFFFF',
                      padding: '4px 10px',
                      borderRadius: 8,
                      fontSize: '0.72rem',
                      fontWeight: 750,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.20)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5
                    }}
                  >
                    <Sparkles size={11} color="#2DD4BF" />
                    <span>{beacon.label}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Indicator Pedagogical Instruction Card */}
      {activeIndicator && (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 18,
            border: '1px solid #D6E4EC',
            padding: '16px 20px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.03)',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 16
          }}
        >
          {/* Icon Thumbnail from exact cropped assets (Single circle, no outer border) */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              overflow: 'hidden',
              flexShrink: 0
            }}
          >
            <img
              src={iconMap[activeIndicator.body_region] || iconMap[activeIndicator.icon] || headIcon}
              alt={activeIndicator.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>

          {/* Description & Alignment Advice */}
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 8,
                marginBottom: 6
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#191B35', margin: 0 }}>
                  {activeIndicator.title}
                </h4>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    background: '#E2F3EB',
                    color: '#0D9488',
                    padding: '3px 8px',
                    borderRadius: 6
                  }}
                >
                  Region: {activeIndicator.body_region || 'Posture'}
                </span>
              </div>

              {/* Indicator Pagination */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '0.74rem', color: '#64748B', fontWeight: 600 }}>
                  {currentIndex + 1} of {activeIndicators.length}
                </span>
                <button
                  type="button"
                  onClick={handlePrevIndicator}
                  style={{
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    borderRadius: 6,
                    padding: '3px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Previous indicator"
                >
                  <ChevronLeft size={13} color="#475569" />
                </button>
                <button
                  type="button"
                  onClick={handleNextIndicator}
                  style={{
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    borderRadius: 6,
                    padding: '3px 6px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Next indicator"
                >
                  <ChevronRight size={13} color="#475569" />
                </button>
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#475569', lineHeight: 1.55, margin: '0 0 8px 0' }}>
              {activeIndicator.description}
            </p>

            {/* Practical technique singing tip */}
            {activeIndicator.tip && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#F0F9FF',
                  border: '1px solid #BAE6FD',
                  borderRadius: 10,
                  padding: '8px 12px',
                  fontSize: '0.82rem',
                  color: '#0369A1'
                }}
              >
                <Sparkles size={14} color="#0284C7" style={{ flexShrink: 0 }} />
                <span>
                  <strong>Singing Tip:</strong> {activeIndicator.tip}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
        </>
      )}
    </div>
  );
}
