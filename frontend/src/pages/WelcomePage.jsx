import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { useAccessibility } from '../context/useAccessibility';
import { api } from '../services/api';
import Navbar from '../components/Navbar';
import AuthChoiceModal from '../components/AuthChoiceModal';
import MusicBackground from '../components/MusicBackground';
import {
  Play,
  ChevronDown,
  Music,
  Wind,
  Activity,
  Landmark,
  Mic,
  GraduationCap,
  ArrowRight,
  Grid,
  Sliders,
  Tv,
  BookOpen
} from 'lucide-react';

// 8 rhythmic beat patterns: exactly 4 tiles blink at a time across different positions like musical beat pads
const RHYTHM_BEAT_PATTERNS = [
  ['01', '05', '07', '11'], // diagonal beat 1
  ['03', '06', '08', '12'], // diagonal beat 2
  ['02', '04', '09', '10'], // cross-accent beat
  ['01', '04', '06', '11'], // syncopated drop
  ['05', '07', '10', '12'], // bass groove
  ['02', '03', '08', '09'], // mid-range cadence
  ['01', '06', '07', '12'], // quad perimeter
  ['03', '04', '05', '10']  // reverse groove
];

export default function WelcomePage() {
  const navigate = useNavigate();
  const { selectedGoal, setSelectedGoal } = useAuth();
  const { theme, isDark, textScale, textSize } = useAccessibility();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeGoalData, setActiveGoalData] = useState(null);
  const [sliderValues, setSliderValues] = useState([72, 44, 86]);
  const [activeSliderIdx, setActiveSliderIdx] = useState(null);
  const [beatPatternIndex, setBeatPatternIndex] = useState(0);
  const [userClickedTile, setUserClickedTile] = useState(null);
  const [cmsSections, setCmsSections] = useState(null);

  // Fetch dynamic published CMS content from backend (with graceful fallback)
  useEffect(() => {
    let isMounted = true;
    api.getPublicCmsPage('homepage')
      .then(res => {
        if (isMounted && res.success && res.sections) {
          setCmsSections(res.sections);
        }
      })
      .catch(err => {
        console.warn('[CMS Notice] Using default homepage content:', err.message);
      });
    return () => { isMounted = false; };
  }, []);

  // Automatically cycle 4 blinking lights in different places in rhythm with the music
  useEffect(() => {
    const timer = setInterval(() => {
      setBeatPatternIndex((prev) => (prev + 1) % RHYTHM_BEAT_PATTERNS.length);
    }, 700); // 700ms rhythmic musical tempo
    return () => clearInterval(timer);
  }, []);

  const currentLitTiles = RHYTHM_BEAT_PATTERNS[beatPatternIndex];

  const handleTileClick = (num) => {
    setUserClickedTile(prev => (prev === num ? null : num));
  };

  const handleSliderChange = (idx, val) => {
    setActiveSliderIdx(idx);
    setSliderValues(prev => {
      const next = [...prev];
      next[idx] = val;
      return next;
    });
  };

  // Smooth scroll to the last section (Section 4: What is Your Musical Journey?) when JOURNEY button is clicked
  const handleJourneyClick = () => {
    const journeySection = document.getElementById('journey-goals');
    if (journeySection) {
      journeySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Six selectable musical goals for Section 4
  const musicalGoals = [
    {
      id: 'learn-singing',
      title: 'I want to learn singing.',
      icon: Music,
      description: 'Foundations of pitch, ear training and fundamental vocalization.'
    },
    {
      id: 'improve-breathing',
      title: 'I want to improve my breathing.',
      icon: Wind,
      description: 'Master diaphragmatic support, lung capacity, and steady airflow.'
    },
    {
      id: 'develop-technique',
      title: 'I want to develop my vocal technique.',
      icon: Activity,
      description: 'Refine agility, vibrato, register blending, and vocal resonance.'
    },
    {
      id: 'explore-classical',
      title: 'I want to explore classical singing.',
      icon: Landmark,
      description: 'Immerse in classical pedagogy, Carnatic/Hindustani, or operatic arias.'
    },
    {
      id: 'prepare-performances',
      title: 'I want to prepare for performances.',
      icon: Mic,
      description: 'Build stage presence, microphone command, and performance endurance.'
    },
    {
      id: 'vocal-trainer',
      title: 'I am a vocal trainer.',
      icon: GraduationCap,
      description: 'Access pedagogical tools, breath telemetry, and vocal diagnostic exercises.'
    }
  ];

  // Active selected goal (first card selected by default per specifications)
  const currentSelectedGoal = selectedGoal || musicalGoals[0].title;

  // When user clicks a goal card
  const handleSelectGoal = (goal) => {
    setSelectedGoal(goal.title);
    setActiveGoalData(goal);
    setModalOpen(true);
  };

  return (
    <div
      className={`welcome-page-root theme-${theme} text-size-${textSize}`}
      data-theme={theme}
      style={{
        minHeight: '100vh',
        backgroundColor: isDark ? '#0E0720' : '#F8F7FC',
        color: isDark ? '#F8FAFC' : '#191B35',
        position: 'relative',
        width: '100%',
        overflowX: 'hidden',
        margin: 0,
        padding: 0,
        transition: 'background-color 0.25s ease, color 0.25s ease',
        '--welcome-text-scale': textScale
      }}
    >
      <Navbar />

      {/* Semantic Main Content Container Targeted by Skip to Main Content */}
      <main id="main-content" tabIndex="-1" style={{ outline: 'none' }}>
        {/* =========================================================================
            SECTION 1: HERO / WELCOME SCREEN
            ========================================================================= */}
        <section
          id="hero"
          style={{
            position: 'relative',
            paddingTop: '60px',
            paddingBottom: '40px',
            minHeight: 'calc(100vh - 74px)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            backgroundColor: isDark ? '#0E0720' : '#fff9ee',
            overflow: 'hidden',
            transition: 'background-color 0.25s ease'
          }}
        >
          {/* Hero Main Content */}
          <div style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0 clamp(20px, 4vw, 36px)',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 'clamp(32px, 5vw, 64px)',
            zIndex: 2,
            flexGrow: 1,
            boxSizing: 'border-box',
            flexWrap: 'wrap'
          }}>
            {/* Left Hero Column */}
            <div style={{ flex: '1 1 480px', maxWidth: '600px', minWidth: '300px' }}>
              {/* Main Heading */}
              {cmsSections?.hero?.headline ? (
                <h1 className="hero-main-h1">
                  {cmsSections.hero.headline.includes('HAS A STORY') ? (
                    <>
                      {cmsSections.hero.headline.replace('HAS A STORY.', '').replace('HAS A STORY', '').trim()}<br />
                      <span className="hero-gradient-text">HAS A STORY.</span>
                    </>
                  ) : (
                    cmsSections.hero.headline
                  )}
                </h1>
              ) : (
                <h1 className="hero-main-h1">
                  EVERY VOICE<br />
                  <span className="hero-gradient-text">
                    HAS A STORY.
                  </span>
                </h1>
              )}

              {/* Description */}
              <p
                className="hero-desc"
                style={{
                  fontSize: 'clamp(0.92rem, 1.3vw, 1.05rem)',
                  lineHeight: 1.6,
                  color: isDark ? '#CBD5E1' : '#4c4265',
                  marginBottom: '28px',
                  fontWeight: 450,
                  transition: 'color 0.25s ease'
                }}
              >
                {cmsSections?.hero?.subheadline || cmsSections?.hero?.body || 'A comprehensive training platform for singers to build vocal strength, control, and confidence for effortless singing.'}
              </p>

              {/* Main CTA Button: ▶ JOURNEY */}
              <div>
                <button
                  type="button"
                  onClick={handleJourneyClick}
                  className="welcome-hero-journey-btn"
                  aria-label="Start Your Journey"
                >
                  <Play size={18} fill="#FFFFFF" color="#FFFFFF" style={{ flexShrink: 0 }} />
                  <span>{cmsSections?.hero?.ctaText || 'JOURNEY'}</span>
                </button>
              </div>
            </div>

            {/* Right Hero Column: Singer Image */}
            <div style={{
              flex: '1 1 420px',
              maxWidth: '520px',
              minWidth: '280px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <div
                style={{
                  position: 'relative',
                  width: '100%',
                  borderRadius: '28px',
                  overflow: 'hidden',
                  boxShadow: isDark
                    ? '0 24px 60px rgba(0, 0, 0, 0.6), 0 0 40px rgba(124, 58, 237, 0.25)'
                    : '0 20px 50px rgba(36, 20, 66, 0.14), 0 6px 20px rgba(124, 58, 237, 0.08)',
                  border: isDark
                    ? '1.5px solid rgba(167, 139, 250, 0.2)'
                    : '1.5px solid rgba(220, 208, 190, 0.6)',
                  backgroundColor: '#0A0A10'
                }}
              >
                <img
                  src={cmsSections?.hero?.mediaUrl || "/hero-singer.jpeg"}
                  alt={cmsSections?.hero?.title || "Passionate Singer with Vintage Microphone"}
                  style={{
                    width: '100%',
                    height: 'clamp(360px, 46vh, 500px)',
                    objectFit: 'cover',
                    display: 'block'
                  }}
                  onError={(e) => {
                    e.currentTarget.src = "/hero-singer.jpeg";
                  }}
                />
              </div>
            </div>
          </div>

          {/* Bottom-center scroll indicator with text: SCROLL TO BEGIN YOUR JOURNEY */}
          <div style={{ textAlign: 'center', paddingTop: '20px', zIndex: 2 }}>
            <div
              className="scroll-indicator-wrap"
              onClick={handleJourneyClick}
            >
              <span
                className="scroll-indicator-text"
                style={{ color: isDark ? '#94A3B8' : '#4c4265' }}
              >
                SCROLL TO BEGIN YOUR JOURNEY
              </span>
              <ChevronDown
                size={22}
                className="scroll-indicator-chevron"
                style={{ color: isDark ? '#A78BFA' : '#7C3AED' }}
              />
            </div>
          </div>
        </section>

      {/* =========================================================================
          CONTINUOUS LIGHT, BRIGHT MUSIC BACKGROUND (SECTIONS 2, 3, & 4)
          ========================================================================= */}
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        <MusicBackground />

        {/* =========================================================================
            SECTION 2: DISCOVER, DEVELOP, PERFORM (Staircase of Arch Cards)
            ========================================================================= */}
        <section id="discover" className="redesign-section" style={{ background: 'transparent' }}>
          {/* Decorative Atmosphere Layer */}
          <div className="section-atmosphere" aria-hidden="true">
            <div className="atmo-orb atmo-orb-violet" style={{ top: '8%', left: '5%', width: '380px', height: '380px' }} />
            <div className="atmo-orb atmo-orb-blue" style={{ bottom: '12%', right: '6%', width: '420px', height: '420px' }} />
            <div className="atmo-orb atmo-orb-pink" style={{ top: '45%', right: '35%', width: '300px', height: '300px' }} />
            <Music size={32} className="atmo-note" style={{ top: '15%', right: '14%' }} />
            <Music size={24} className="atmo-note" style={{ bottom: '22%', left: '10%' }} />
          </div>

          <div className="redesign-container">
            {/* Centered Heading Block */}
            <div style={{ textAlign: 'center', maxWidth: '780px', margin: '0 auto 60px', position: 'relative', zIndex: 3 }}>
              <h2 className="shared-section-h2">
                Three Pillars of Vocal <span className="heading-gradient-word">Excellence</span>
              </h2>
              <p className="shared-section-sub">
                A structured progression engineered to transform your vocal breathing mechanics from theoretical understanding into stage-ready confidence.
              </p>
            </div>

            {/* Staircase Grid with 3 Arched Cards */}
            <div className="staircase-grid">
              {/* Dashed gradient curved path across all three cards */}
              <svg
                className="staircase-svg-path"
                viewBox="0 0 1200 600"
                fill="none"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <defs>
                  <linearGradient id="staircaseGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.8" />
                    <stop offset="50%" stopColor="#6366F1" stopOpacity="0.7" />
                    <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.8" />
                  </linearGradient>
                </defs>
                <path
                  d="M 60 480 C 350 420, 600 240, 1140 120"
                  stroke="url(#staircaseGradient)"
                  strokeWidth="2.4"
                  strokeDasharray="3 11"
                  strokeLinecap="round"
                />
              </svg>

              {/* Card 1: DISCOVER (margin-top: 130px) */}
              <div className="staircase-card-wrapper staircase-card-1">
                <span className="card-numeral-outline" aria-hidden="true">01</span>
                <div className="arch-card">
                  <div className="arch-photo-container">
                    <img
                      src="https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?q=80&w=800&auto=format&fit=crop"
                      alt="Singer practising breathing in studio"
                      className="arch-photo"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="arch-gradient-overlay" />
                  </div>
                  <div className="step-pill-badge">Step 01</div>
                  <div className="arch-card-content">
                    <h3 className="arch-card-title">DISCOVER</h3>
                    <p className="arch-card-desc">
                      Understand how breathing works and explore the science behind vocal breathing.
                    </p>
                  </div>
                  <div className="arch-bottom-bar bar-gradient-1" />
                </div>
              </div>

              {/* Card 2: DEVELOP (margin-top: 65px) */}
              <div className="staircase-card-wrapper staircase-card-2">
                <span className="card-numeral-outline" aria-hidden="true">02</span>
                <div className="arch-card">
                  <div className="arch-photo-container">
                    <img
                      src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=800&auto=format&fit=crop"
                      alt="Singer practising in professional studio with headphones"
                      className="arch-photo"
                    />
                    <div className="arch-gradient-overlay" />
                  </div>
                  <div className="step-pill-badge">Step 02</div>
                  <div className="arch-card-content">
                    <h3 className="arch-card-title">DEVELOP</h3>
                    <p className="arch-card-desc">
                      Build breathing control, improve your practice and understand vocal techniques.
                    </p>
                  </div>
                  <div className="arch-bottom-bar bar-gradient-2" />
                </div>
              </div>

              {/* Card 3: PERFORM (margin-top: 0px) */}
              <div className="staircase-card-wrapper staircase-card-3">
                <span className="card-numeral-outline" aria-hidden="true">03</span>
                <div className="arch-card">
                  <div className="arch-photo-container">
                    <img
                      src="https://images.unsplash.com/photo-1465847899084-d164df4dedc6?q=80&w=800&auto=format&fit=crop"
                      alt="Singer performing on stage in front of audience"
                      className="arch-photo"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?q=80&w=800&auto=format&fit=crop';
                      }}
                    />
                    <div className="arch-gradient-overlay" />
                  </div>
                  <div className="step-pill-badge">Step 03</div>
                  <div className="arch-card-content">
                    <h3 className="arch-card-title">PERFORM</h3>
                    <p className="arch-card-desc">
                      Apply breath management to real songs and develop confidence in musical expression.
                    </p>
                  </div>
                  <div className="arch-bottom-bar bar-gradient-3" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
          SECTION 3: PLATFORM FEATURES (Bento Grid)
          ========================================================================= */}
        <section id="features" className="redesign-section" style={{ background: 'transparent' }}>
          {/* Decorative Atmosphere Layer */}
          <div className="section-atmosphere" aria-hidden="true">
            <div className="atmo-orb atmo-orb-blue" style={{ top: '15%', left: '8%', width: '400px', height: '400px' }} />
            <div className="atmo-orb atmo-orb-violet" style={{ bottom: '10%', right: '10%', width: '360px', height: '360px' }} />
            <Music size={28} className="atmo-note" style={{ top: '22%', right: '20%' }} />
          </div>

          <div className="redesign-container">
            {/* Centered Heading Block */}
            <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 60px', position: 'relative', zIndex: 3 }}>
              <h2 className="shared-section-h2">
                Platform <span className="heading-gradient-word">Features</span>
              </h2>
              <p className="shared-section-sub">
                Interactive, science-backed vocal tools engineered to measure, simulate and accelerate your vocal control.
              </p>
            </div>

            {/* Bento Grid Container */}
            <div className="bento-wrapper">
              <div className="bento-dot-bg" aria-hidden="true" />
              <div className="bento-grid-container">
                {/* Feature 1: CHALLENGER (Col 1-4, Span 2 Rows, Solid Gradient Fill) */}
                <div className="challenger-bento-card">
                  <div className="challenger-glow-orb" aria-hidden="true" />
                  <div>
                    <div className="challenger-icon-tile">
                      <Grid size={32} />
                    </div>
                    <div className="accent-bar-line" style={{ background: 'rgba(255, 255, 255, 0.65)' }} />
                    <h3 className="bento-card-title" style={{ color: '#ffffff' }}>
                      CHALLENGER
                    </h3>
                    <p className="bento-card-desc" style={{ color: 'rgba(255, 255, 255, 0.92)' }}>
                      Test your knowledge through interactive games, quizzes and musical challenges.
                    </p>
                  </div>

                  {/* 12 Challenge Beat Pads - Automatically 4 lights blinking across different positions in rhythm with music */}
                  <div>
                    <div className="quiz-matrix-grid" role="group" aria-label="12 challenge rhythmic beat pads">
                      {['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12'].map((num) => {
                        const isLitByMusic = currentLitTiles.includes(num);
                        const isUserActive = userClickedTile === num;
                        const isLit = isLitByMusic || isUserActive;

                        return (
                          <button
                            key={num}
                            type="button"
                            onClick={() => handleTileClick(num)}
                            className={`quiz-matrix-cell ${isLit ? 'cell-active-beat' : ''} ${isUserActive ? 'cell-user-selected' : ''}`}
                            aria-pressed={isLit}
                            title={`Pad ${num} ${isLit ? '(Blinking Beat)' : ''}`}
                          >
                            {num}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Feature 2: APPLY (Col 5-12, Row 1, Glass Card with Sliders) */}
                <div className="glass-bento-card apply-bento-card">
                  <div className="apply-card-inner">
                    <div style={{ flex: 1 }}>
                      <div className="bento-icon-tile">
                        <Sliders size={30} />
                      </div>
                      <div className="accent-bar-line" />
                      <h3 className="bento-card-title">APPLY</h3>
                      <p className="bento-card-desc">
                        Apply techniques to songs through phrase mapping and interactive practice tools.
                      </p>
                    </div>

                    {/* Interactive 3 Horizontal Slider Tracks - In Real Working & Moving Condition */}
                    <div className="slider-tracks-container">
                      {[
                        { id: 0, gradient: 'linear-gradient(90deg, #7C3AED, #3B82F6)', border: '#7C3AED', autoClass: 'slider-auto-move-1' },
                        { id: 1, gradient: 'linear-gradient(90deg, #EC4899, #7C3AED)', border: '#EC4899', autoClass: 'slider-auto-move-2' },
                        { id: 2, gradient: 'linear-gradient(90deg, #06B6D4, #3B82F6)', border: '#06B6D4', autoClass: 'slider-auto-move-3' }
                      ].map((s) => {
                        const isAuto = activeSliderIdx !== s.id;
                        return (
                          <div key={s.id} className="slider-track-wrap">
                            <div className={`slider-track ${isAuto ? s.autoClass : ''}`}>
                              <div
                                className="slider-fill"
                                style={{
                                  width: isAuto ? undefined : `${sliderValues[s.id]}%`,
                                  background: s.gradient
                                }}
                              />
                              <div
                                className="slider-knob"
                                style={{
                                  left: isAuto ? undefined : `${sliderValues[s.id]}%`,
                                  border: `2px solid ${s.border}`
                                }}
                              />
                              <input
                                type="range"
                                min="10"
                                max="100"
                                value={sliderValues[s.id]}
                                onMouseDown={() => setActiveSliderIdx(s.id)}
                                onTouchStart={() => setActiveSliderIdx(s.id)}
                                onChange={(e) => handleSliderChange(s.id, Number(e.target.value))}
                                className="slider-range-input"
                                aria-label={`Vocal parameter control ${s.id + 1}`}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Feature 3: VISUAL SIMULATION TOOLS (Col 5-8, Row 2, Glass Card with Waveform) */}
                <div className="glass-bento-card simulation-bento-card">
                  <div>
                    <div className="bento-icon-tile">
                      <Tv size={30} />
                    </div>
                    <div className="accent-bar-line" />
                    <h3 className="bento-card-title">VISUAL SIMULATION TOOLS</h3>
                    <p className="bento-card-desc">
                      Learn and practice with interactive visuals, real-time feedback and animated guidance.
                    </p>
                  </div>

                  {/* Working Vocal Frequency Waveform - Continuously Moving Audio Equalizer Bars */}
                  <div className="simulation-waveform-row" aria-hidden="true">
                    {[18, 38, 24, 52, 34, 16, 46, 28, 50, 22, 42, 20].map((h, i) => (
                      <div
                        key={i}
                        className="sim-bar"
                        style={{
                          '--target-height': `${h}px`,
                          '--anim-duration': `${0.85 + (i % 4) * 0.28}s`,
                          '--anim-delay': `${(i * 0.08).toFixed(2)}s`
                        }}
                      />
                    ))}
                  </div>
                </div>

                {/* Feature 4: DEEPER UNDERSTAND (Col 9-12, Row 2, Glass Card) */}
                <div className="glass-bento-card understand-bento-card">
                  <div>
                    <div className="bento-icon-tile">
                      <BookOpen size={30} />
                    </div>
                    <div className="accent-bar-line" />
                    <h3 className="bento-card-title">DEEPER UNDERSTAND</h3>
                    <p className="bento-card-desc">
                      Gain a complete understanding of vocal concepts, techniques and performance fundamentals.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
          SECTION 4: WHAT IS YOUR MUSICAL JOURNEY? (Split Layout)
          ========================================================================= */}
        <section id="journey-goals" className="redesign-section" style={{ background: 'transparent' }}>
          {/* Decorative Atmosphere Layer */}
          <div className="section-atmosphere" aria-hidden="true">
            <div className="atmo-orb atmo-orb-pink" style={{ top: '20%', left: '5%', width: '420px', height: '420px' }} />
            <div className="atmo-orb atmo-orb-violet" style={{ bottom: '15%', right: '12%', width: '380px', height: '380px' }} />
            <Music size={30} className="atmo-note" style={{ top: '18%', right: '15%' }} />
          </div>

          <div className="redesign-container">
            <div className="journey-split-wrapper">
              {/* Left Column: Heading, Subtitle, CTA & Login */}
              <div className="journey-left-col">
                {/* Decorative Concentric Ripple Rings */}
                <svg
                  className="journey-ripple-rings"
                  viewBox="0 0 460 460"
                  fill="none"
                  aria-hidden="true"
                >
                  <circle cx="230" cy="230" r="100" stroke="rgba(124, 58, 237, 0.12)" strokeWidth="1.5" strokeDasharray="4 6" />
                  <circle cx="230" cy="230" r="150" stroke="rgba(99, 102, 241, 0.10)" strokeWidth="1.5" />
                  <circle cx="230" cy="230" r="200" stroke="rgba(124, 58, 237, 0.07)" strokeWidth="1.5" strokeDasharray="3 9" />
                </svg>

                <h2 className="journey-h2">
                  What is Your <span className="heading-gradient-word">Musical Journey?</span>
                </h2>

                <p className="journey-subheading">
                  Please register to choose your musical goal and get started.
                </p>

                {/* 74px Tall Pill REGISTER NOW Button */}
                <div className="journey-register-btn-wrap">
                  <div className="journey-btn-glow" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => navigate('/register')}
                    className="journey-register-btn"
                  >
                    <span>REGISTER NOW</span>
                    <ArrowRight size={22} className="journey-arrow-icon" />
                  </button>
                </div>

                {/* Already Registered Link */}
                <div className="journey-login-prompt">
                  <span>Already registered with No Tre(ou)ble? </span>
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="journey-login-link"
                  >
                    Log In Here
                  </button>
                </div>
              </div>

              {/* Right Column: 2x3 Grid of Goal Cards */}
              <div className="journey-right-col" role="group" aria-label="Selectable Musical Goals">
                {musicalGoals.map((goal) => {
                  const Icon = goal.icon;
                  const isSelected = currentSelectedGoal === goal.title;

                  return (
                    <button
                      key={goal.id}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() => handleSelectGoal(goal)}
                      className={`goal-card-btn ${isSelected ? 'is-selected' : ''}`}
                    >
                      <div className="goal-card-top-row">
                        <div className="goal-icon-tile">
                          <Icon size={28} />
                        </div>
                        <div className="goal-radio-indicator">
                          {isSelected && <div className="goal-radio-inner-dot" />}
                        </div>
                      </div>

                      <h4 className="goal-card-title">
                        {goal.title}
                      </h4>
                      <p className="goal-card-desc">
                        {goal.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            BOTTOM BRAND CLOSURE (DOWNSIDE OF WELCOME PAGE)
            ========================================================================= */}
        <footer style={{
          position: 'relative',
          zIndex: 2,
          padding: '30px 24px 38px',
          textAlign: 'center',
          borderTop: isDark ? '1px solid rgba(167, 139, 250, 0.18)' : '1px solid rgba(124, 58, 237, 0.1)',
          background: isDark ? 'rgba(14, 7, 32, 0.88)' : 'rgba(255, 255, 255, 0.45)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          transition: 'background 0.25s ease, border-color 0.25s ease'
        }}>
          <div style={{
            maxWidth: '1200px',
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 800,
              fontSize: '1.05rem',
              color: isDark ? '#FFFFFF' : '#191B35',
              transition: 'color 0.25s ease'
            }}>
              <img
                src="/IMG_7974.PNG"
                alt="No Tre(ou)ble Logo"
                style={{
                  height: '28px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block',
                  ...(isDark ? { background: '#FFFFFF', borderRadius: '6px', padding: '2px 4px' } : {})
                }}
              />
              <img
                src={isDark ? '/NoTreble-Classicfinal.png' : '/NoTreble-Classic-darktext.png'}
                alt="No Tre(ou)ble"
                style={{
                  height: '24px',
                  width: 'auto',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            <p style={{
              margin: 0,
              fontSize: '0.88rem',
              color: isDark ? '#94A3B8' : '#77728A',
              fontWeight: 500,
              transition: 'color 0.25s ease'
            }}>
              © {new Date().getFullYear()} No Tre(ou)ble. Breathe Better. Sing Better. All rights reserved.
            </p>
          </div>
        </footer>
      </div>
      </main>

      {/* Auth Choice Modal Triggered when goal card is selected */}
      <AuthChoiceModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedGoalTitle={activeGoalData?.title || currentSelectedGoal}
        selectedGoalIcon={activeGoalData?.icon}
      />
    </div>
  );
}

