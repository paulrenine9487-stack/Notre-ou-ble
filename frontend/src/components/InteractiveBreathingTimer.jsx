import React, { useState, useEffect, useRef, useMemo } from 'react';
import api from '../services/api';
import {
  Play,
  Pause,
  RotateCcw,
  Sliders,
  Leaf,
  BarChart2,
  Star
} from 'lucide-react';

/**
 * NO TRE(OU)BLE - STAGE 03 PART 02 STEP 02: BREATHE
 * Exact 3-Column Layout:
 * - Left Column: Practice Level Cards (Beginner, Intermediate, Advanced) + Breathing Pacing Adjustments (Inhale, Hold, Exhale sliders)
 * - Center Column: Breathing & Lungs Mechanics Card (Glowing lungs, trachea, expansion arrows, animated diaphragm with down/up arrows, caption)
 * - Right Column: Ready to Practice / Timer Card (Status badge, circular countdown timer, Cycle 1 of 5, Elapsed/Remaining, Action buttons)
 */
export default function InteractiveBreathingTimer({
  initialLevels = [],
  onSessionComplete = () => {}
}) {
  // 1. Fallback Default Levels per User Specification
  const defaultLevelConfigs = useMemo(() => [
    {
      level_key: 'beginner',
      level_name: 'Beginner',
      subtitle: 'Gentle breathing for awareness',
      daily_practice_duration: '5–10 min',
      core_focus: 'Eliminating shoulder/chest movement; learning low belly and rib expansion.',
      inhale_duration: 4.0,
      hold_duration: 3.0,
      exhale_duration: 10.0,
      hold_min: 2.0,
      hold_max: 4.0,
      exhale_min: 8.0,
      exhale_max: 12.0,
      default_cycles: 5
    },
    {
      level_key: 'intermediate',
      level_name: 'Intermediate',
      subtitle: 'Build control and capacity',
      daily_practice_duration: '10–15 min',
      core_focus: 'Controlling airflow speed without squeezing the throat; keeping ribs expanded while exhaling.',
      inhale_duration: 2.0,
      hold_duration: 2.0,
      exhale_duration: 20.0,
      hold_min: 2.0,
      hold_max: 2.0,
      exhale_min: 15.0,
      exhale_max: 25.0,
      default_cycles: 5
    },
    {
      level_key: 'advanced',
      level_name: 'Advanced',
      subtitle: 'For stamina and high notes',
      daily_practice_duration: '10–15 min',
      core_focus: 'Instant, silent diaphragmatic drop; budgeting air for complex runs and high notes.',
      inhale_duration: 1.0,
      hold_duration: 0.0,
      exhale_duration: 30.0,
      inhale_min: 0.5,
      inhale_max: 1.0,
      hold_min: 0.0,
      hold_max: 0.0,
      exhale_min: 30.0,
      exhale_max: 60.0,
      default_cycles: 5
    }
  ], []);

  // 2. Active Level & Dynamic Settings
  const [levels, setLevels] = useState(initialLevels.length > 0 ? initialLevels : defaultLevelConfigs);
  const [selectedLevelKey, setSelectedLevelKey] = useState('beginner');

  // Load levels from backend
  useEffect(() => {
    let isMounted = true;
    api.getBreathingLevels()
      .then((res) => {
        if (isMounted && res && res.success && Array.isArray(res.levels) && res.levels.length > 0) {
          setLevels(res.levels);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch breathing levels from backend, using default configurations:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // Active level config
  const activeLevel = useMemo(() => {
    return levels.find(l => l.level_key === selectedLevelKey) || levels[0] || defaultLevelConfigs[0];
  }, [levels, selectedLevelKey, defaultLevelConfigs]);

  // 3. User-Configurable Timing Adjustments (within permitted ranges)
  const [customInhale, setCustomInhale] = useState(4.0);
  const [customHold, setCustomHold] = useState(3.0);
  const [customExhale, setCustomExhale] = useState(10.0);
  const [selectedCycles, setSelectedCycles] = useState(5);
  const [pulsedRhythm, setPulsedRhythm] = useState(false);

  // Synchronize custom inputs when switching levels
  useEffect(() => {
    if (activeLevel) {
      setCustomInhale(parseFloat(activeLevel.inhale_duration));
      setCustomHold(parseFloat(activeLevel.hold_duration));
      setCustomExhale(parseFloat(activeLevel.exhale_duration));
      setSelectedCycles(activeLevel.default_cycles || 5);
      setPulsedRhythm(false);
      handleReset();
    }
  }, [selectedLevelKey, activeLevel]);

  // 4. Dynamic Duration Calculations
  const durationPerCycle = useMemo(() => {
    return Math.round((customInhale + customHold + customExhale) * 10) / 10;
  }, [customInhale, customHold, customExhale]);

  const totalSessionDuration = useMemo(() => {
    return Math.round(durationPerCycle * selectedCycles);
  }, [durationPerCycle, selectedCycles]);

  const formatTime = (secs) => {
    const s = Math.round(secs);
    if (s <= 0) return '0s';
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m === 0) return `${rem}s`;
    return `${m}m ${rem > 0 ? `${rem}s` : ''}`.trim();
  };

  // Slider track fill percentages for color themes
  const inhaleMin = selectedLevelKey === 'advanced' ? 0.5 : 4;
  const inhaleMax = selectedLevelKey === 'advanced' ? 1.0 : 4;
  const inhalePercent = inhaleMax === inhaleMin ? 100 : Math.min(100, Math.max(0, Math.round(((customInhale - inhaleMin) / (inhaleMax - inhaleMin)) * 100)));

  const holdMin = selectedLevelKey === 'beginner' ? 2 : (selectedLevelKey === 'advanced' ? 0 : 2);
  const holdMax = selectedLevelKey === 'beginner' ? 4 : (selectedLevelKey === 'advanced' ? 0 : 2);
  const holdPercent = holdMax === holdMin ? 100 : Math.min(100, Math.max(0, Math.round(((customHold - holdMin) / (holdMax - holdMin)) * 100)));

  const exhaleMin = activeLevel.exhale_min || (selectedLevelKey === 'beginner' ? 8 : selectedLevelKey === 'intermediate' ? 15 : 30);
  const exhaleMax = activeLevel.exhale_max || (selectedLevelKey === 'beginner' ? 12 : selectedLevelKey === 'intermediate' ? 25 : 60);
  const exhalePercent = exhaleMax === exhaleMin ? 100 : Math.min(100, Math.max(0, Math.round(((customExhale - exhaleMin) / (exhaleMax - exhaleMin)) * 100)));

  // 5. Timer & Animation State
  const [isRunning, setIsRunning] = useState(false);
  const [currentPhase, setCurrentPhase] = useState('idle'); // 'idle' | 'inhale' | 'hold' | 'exhale'
  const [phaseSecondsLeft, setPhaseSecondsLeft] = useState(customInhale);
  const [currentCycle, setCurrentCycle] = useState(1);
  const [elapsedTotal, setElapsedTotal] = useState(0);
  const [sessionSuccess, setSessionSuccess] = useState(false);
  const [savingSession, setSavingSession] = useState(false);

  const timerRef = useRef(null);

  // 6. Master Play / Pause / Resume
  const handleTogglePlayPause = () => {
    if (isRunning) {
      setIsRunning(false);
      clearInterval(timerRef.current);
    } else {
      setIsRunning(true);
      setSessionSuccess(false);
      if (currentPhase === 'idle') {
        setCurrentPhase('inhale');
        setPhaseSecondsLeft(customInhale);
      }
    }
  };

  // 7. Reset Timer
  const handleReset = () => {
    setIsRunning(false);
    clearInterval(timerRef.current);
    setCurrentPhase('idle');
    setPhaseSecondsLeft(customInhale);
    setCurrentCycle(1);
    setElapsedTotal(0);
    setSessionSuccess(false);
  };

  // 8. Main Interval Engine (100ms precision)
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = setInterval(() => {
      setElapsedTotal((prev) => prev + 0.1);

      setPhaseSecondsLeft((prevLeft) => {
        const nextLeft = Math.max(0, prevLeft - 0.1);

        if (nextLeft <= 0.05) {
          // Transition phase
          if (currentPhase === 'inhale') {
            if (customHold > 0) {
              setCurrentPhase('hold');
              return customHold;
            } else {
              // Advanced immediate transition
              setCurrentPhase('exhale');
              return customExhale;
            }
          } else if (currentPhase === 'hold') {
            setCurrentPhase('exhale');
            return customExhale;
          } else if (currentPhase === 'exhale') {
            // Cycle finished
            if (currentCycle >= selectedCycles) {
              setIsRunning(false);
              setCurrentPhase('idle');
              setSessionSuccess(true);
              handleLogBreathingSession();
              return customInhale;
            } else {
              setCurrentCycle((c) => c + 1);
              setCurrentPhase('inhale');
              return customInhale;
            }
          }
        }
        return nextLeft;
      });
    }, 100);

    return () => clearInterval(timerRef.current);
  }, [isRunning, currentPhase, currentCycle, selectedCycles, customInhale, customHold, customExhale]);

  // Log completed breathing session to MySQL
  const handleLogBreathingSession = async () => {
    setSavingSession(true);
    const sessionPayload = {
      level_key: selectedLevelKey,
      inhale_duration: customInhale,
      hold_duration: customHold,
      exhale_duration: customExhale,
      completed_cycles: selectedCycles,
      target_cycles: selectedCycles,
      total_duration_seconds: totalSessionDuration,
      completion_status: 'COMPLETED',
      notes: pulsedRhythm ? 'Completed with pulsed exhalation rhythm.' : 'Steady airflow exercise.'
    };

    try {
      await api.saveBreathingSession(2, sessionPayload);
      if (onSessionComplete) {
        onSessionComplete(sessionPayload);
      }
    } catch (err) {
      console.error('Failed to log breathing session to MySQL:', err);
    } finally {
      setSavingSession(false);
    }
  };

  // 9. Synchronized Animation Values
  // Lungs scale: resting (0.92), expanded (1.18)
  const lungsScale = useMemo(() => {
    if (currentPhase === 'inhale') return 1.18;
    if (currentPhase === 'hold') return 1.18;
    if (currentPhase === 'exhale') return 0.92;
    return 1.0;
  }, [currentPhase]);

  // Diaphragm position: resting (0px), flattened downward (18px)
  const diaphragmY = useMemo(() => {
    if (currentPhase === 'inhale' || currentPhase === 'hold') return 18;
    return 0;
  }, [currentPhase]);

  // Transition duration in seconds for CSS
  const animationDuration = useMemo(() => {
    if (currentPhase === 'inhale') return customInhale;
    if (currentPhase === 'hold') return customHold > 0 ? customHold : 0.1;
    if (currentPhase === 'exhale') return customExhale;
    return 1.0;
  }, [currentPhase, customInhale, customHold, customExhale]);

  return (
    <div style={{ width: '100%' }}>
      <style>{`
        @keyframes airflowDown {
          0% { stroke-dashoffset: 40; opacity: 0.2; }
          50% { opacity: 0.9; }
          100% { stroke-dashoffset: 0; opacity: 0.2; }
        }
        @keyframes airflowUp {
          0% { stroke-dashoffset: 0; opacity: 0.2; }
          50% { opacity: 0.9; }
          100% { stroke-dashoffset: 40; opacity: 0.2; }
        }
        @keyframes pulseArrowDown {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(4px); opacity: 1; }
        }
        @keyframes pulseArrowUp {
          0%, 100% { transform: translateY(0); opacity: 0.7; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .breathe-level-card {
          display: flex;
          align-items: center;
          justifyContent: space-between;
          padding: 10px 14px;
          border-radius: 12px;
          background: #FFFFFF;
          border: 1.5px solid #E2E8F0;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .breathe-level-card:hover {
          border-color: #0D9488;
          transform: translateY(-1px);
        }
        .breathe-level-card.selected {
          border-color: #0D9488;
          background: #F0FDF9;
          box-shadow: 0 2px 8px rgba(13, 148, 136, 0.08);
        }
        .breathe-slider-track {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 9999px;
          outline: none;
          cursor: pointer;
          transition: background 0.15s ease;
        }
        /* Inhale Thumb (Teal Theme) */
        .breathe-slider-inhale::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          background: #0D9488;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 5px rgba(13, 148, 136, 0.45);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .breathe-slider-inhale::-webkit-slider-thumb:hover {
          transform: scale(1.18);
          box-shadow: 0 3px 8px rgba(13, 148, 136, 0.6);
        }
        .breathe-slider-inhale::-moz-range-thumb {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          cursor: pointer;
          background: #0D9488;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 5px rgba(13, 148, 136, 0.45);
        }
        /* Hold Thumb (Blue Theme) */
        .breathe-slider-hold::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          background: #2563EB;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 5px rgba(37, 99, 235, 0.45);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .breathe-slider-hold::-webkit-slider-thumb:hover {
          transform: scale(1.18);
          box-shadow: 0 3px 8px rgba(37, 99, 235, 0.6);
        }
        .breathe-slider-hold::-moz-range-thumb {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          cursor: pointer;
          background: #2563EB;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 5px rgba(37, 99, 235, 0.45);
        }
        /* Exhale Thumb (Purple Theme) */
        .breathe-slider-exhale::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          cursor: pointer;
          background: #7E22CE;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 5px rgba(126, 34, 206, 0.45);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .breathe-slider-exhale::-webkit-slider-thumb:hover {
          transform: scale(1.18);
          box-shadow: 0 3px 8px rgba(126, 34, 206, 0.6);
        }
        .breathe-slider-exhale::-moz-range-thumb {
          width: 15px;
          height: 15px;
          border-radius: 50%;
          cursor: pointer;
          background: #7E22CE;
          border: 2px solid #FFFFFF;
          box-shadow: 0 2px 5px rgba(126, 34, 206, 0.45);
        }
      `}</style>

      {/* 3-COLUMN MAIN LAYOUT */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
          alignItems: 'stretch'
        }}
      >
        {/* =================================================================== */}
        {/* COLUMN 1: LEVEL CARDS + PACING ADJUSTMENTS                          */}
        {/* =================================================================== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Level 1: Beginner */}
          <div
            className={`breathe-level-card ${selectedLevelKey === 'beginner' ? 'selected' : ''}`}
            onClick={() => setSelectedLevelKey('beginner')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Leaf size={20} color={selectedLevelKey === 'beginner' ? '#0D9488' : '#64748B'} />
              <div>
                <div style={{ fontSize: '0.90rem', fontWeight: 800, color: '#191B35' }}>Beginner</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Gentle breathing for awareness</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#CCFBF1', color: '#0F766E', padding: '2px 8px', borderRadius: 9999 }}>
                5–10 min
              </span>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: selectedLevelKey === 'beginner' ? '2px solid #0D9488' : '2px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#FFFFFF'
                }}
              >
                {selectedLevelKey === 'beginner' && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0D9488' }} />
                )}
              </div>
            </div>
          </div>

          {/* Level 2: Intermediate */}
          <div
            className={`breathe-level-card ${selectedLevelKey === 'intermediate' ? 'selected' : ''}`}
            onClick={() => setSelectedLevelKey('intermediate')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart2 size={20} color={selectedLevelKey === 'intermediate' ? '#0D9488' : '#64748B'} />
              <div>
                <div style={{ fontSize: '0.90rem', fontWeight: 800, color: '#191B35' }}>Intermediate</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>Build control and capacity</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 9999 }}>
                10–15 min
              </span>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: selectedLevelKey === 'intermediate' ? '2px solid #0D9488' : '2px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#FFFFFF'
                }}
              >
                {selectedLevelKey === 'intermediate' && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0D9488' }} />
                )}
              </div>
            </div>
          </div>

          {/* Level 3: Advanced */}
          <div
            className={`breathe-level-card ${selectedLevelKey === 'advanced' ? 'selected' : ''}`}
            onClick={() => setSelectedLevelKey('advanced')}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Star size={20} color={selectedLevelKey === 'advanced' ? '#0D9488' : '#64748B'} />
              <div>
                <div style={{ fontSize: '0.90rem', fontWeight: 800, color: '#191B35' }}>Advanced</div>
                <div style={{ fontSize: '0.74rem', color: '#64748B' }}>For stamina and high notes</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: 9999 }}>
                10–15 min
              </span>
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: '50%',
                  border: selectedLevelKey === 'advanced' ? '2px solid #0D9488' : '2px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: '#FFFFFF'
                }}
              >
                {selectedLevelKey === 'advanced' && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#0D9488' }} />
                )}
              </div>
            </div>
          </div>

          {/* Breathing Pacing Adjustments Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 14,
              border: '1px solid #E2E8F0',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 8,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 1 }}>
              <Sliders size={15} color="#0D9488" />
              <h4 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#191B35', margin: 0 }}>
                Breathing Pacing Adjustments
              </h4>
            </div>

            {/* INHALE Adjustment Row */}
            <div
              style={{
                background: 'linear-gradient(135deg, #F0FDFA 0%, #E6FFFA 100%)',
                border: '1.5px solid #99F6E4',
                borderLeft: '4.5px solid #0D9488',
                borderRadius: 11,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: '0 2px 6px rgba(13, 148, 136, 0.04)'
              }}
            >
              <div style={{ minWidth: 84 }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 850,
                    color: '#0F766E',
                    background: '#CCFBF1',
                    padding: '1px 6px',
                    borderRadius: 5,
                    letterSpacing: '0.05em',
                    display: 'inline-block',
                    marginBottom: 2
                  }}
                >
                  INHALE
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#134E4A', lineHeight: 1.1 }}>
                  {customInhale}s
                </div>
                <span style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 500 }}>
                  {selectedLevelKey === 'advanced' ? 'Range: 0.5–1s' : 'Fixed target'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  className="breathe-slider-track breathe-slider-inhale"
                  min={selectedLevelKey === 'advanced' ? 0.5 : 4}
                  max={selectedLevelKey === 'advanced' ? 1.0 : 4}
                  step={0.5}
                  value={customInhale}
                  disabled={isRunning || selectedLevelKey !== 'advanced'}
                  onChange={(e) => setCustomInhale(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #0D9488 0%, #14B8A6 ${inhalePercent}%, #E2E8F0 ${inhalePercent}%, #E2E8F0 100%)`
                  }}
                />
              </div>
            </div>

            {/* HOLD Adjustment Row */}
            <div
              style={{
                background: 'linear-gradient(135deg, #EFF6FF 0%, #E0E7FF 100%)',
                border: '1.5px solid #BFDBFE',
                borderLeft: '4.5px solid #2563EB',
                borderRadius: 11,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.04)'
              }}
            >
              <div style={{ minWidth: 84 }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 850,
                    color: '#1D4ED8',
                    background: '#DBEAFE',
                    padding: '1px 6px',
                    borderRadius: 5,
                    letterSpacing: '0.05em',
                    display: 'inline-block',
                    marginBottom: 2
                  }}
                >
                  HOLD
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#1E3A8A', lineHeight: 1.1 }}>
                  {customHold}s
                </div>
                <span style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 500 }}>
                  {selectedLevelKey === 'beginner' ? 'Range: 2–4s' : selectedLevelKey === 'advanced' ? '0s (Immediate)' : 'Fixed 2s'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  className="breathe-slider-track breathe-slider-hold"
                  min={selectedLevelKey === 'beginner' ? 2 : customHold}
                  max={selectedLevelKey === 'beginner' ? 4 : customHold}
                  step={1}
                  value={customHold}
                  disabled={isRunning || selectedLevelKey !== 'beginner'}
                  onChange={(e) => setCustomHold(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #2563EB 0%, #3B82F6 ${holdPercent}%, #E2E8F0 ${holdPercent}%, #E2E8F0 100%)`
                  }}
                />
              </div>
            </div>

            {/* EXHALE Adjustment Row */}
            <div
              style={{
                background: 'linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)',
                border: '1.5px solid #E9D5FF',
                borderLeft: '4.5px solid #7E22CE',
                borderRadius: 11,
                padding: '8px 12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                boxShadow: '0 2px 6px rgba(126, 34, 206, 0.04)'
              }}
            >
              <div style={{ minWidth: 84 }}>
                <span
                  style={{
                    fontSize: '0.62rem',
                    fontWeight: 850,
                    color: '#7E22CE',
                    background: '#F3E8FF',
                    padding: '1px 6px',
                    borderRadius: 5,
                    letterSpacing: '0.05em',
                    display: 'inline-block',
                    marginBottom: 2
                  }}
                >
                  EXHALE
                </span>
                <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#581C87', lineHeight: 1.1 }}>
                  {customExhale}s
                </div>
                <span style={{ fontSize: '0.66rem', color: '#64748B', fontWeight: 500 }}>
                  {selectedLevelKey === 'beginner'
                    ? 'Range: 8–12s'
                    : selectedLevelKey === 'intermediate'
                    ? 'Range: 15–25s'
                    : '30+ seconds'}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <input
                  type="range"
                  className="breathe-slider-track breathe-slider-exhale"
                  min={activeLevel.exhale_min || 8}
                  max={activeLevel.exhale_max || 30}
                  step={1}
                  value={customExhale}
                  disabled={isRunning}
                  onChange={(e) => setCustomExhale(parseFloat(e.target.value))}
                  style={{
                    background: `linear-gradient(to right, #7E22CE 0%, #9333EA ${exhalePercent}%, #E2E8F0 ${exhalePercent}%, #E2E8F0 100%)`
                  }}
                />
              </div>
            </div>

            {/* Advanced pulsed rhythm toggle */}
            {selectedLevelKey === 'advanced' && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#334155', cursor: 'pointer', fontWeight: 600, marginTop: 4 }}>
                <input
                  type="checkbox"
                  checked={pulsedRhythm}
                  onChange={(e) => setPulsedRhythm(e.target.checked)}
                  style={{ accentColor: '#0D9488' }}
                />
                <span>Enable Pulsed Exhalation Rhythms</span>
              </label>
            )}
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 2: BREATHING & LUNGS MECHANICS (CENTRAL VISUALIZER)          */}
        {/* =================================================================== */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 4 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
              {/* Twin lungs teal icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 4V13M12 13L8 16M12 13L16 16" stroke="#0D9488" strokeWidth="2.4" strokeLinecap="round" />
                <path d="M8 8C5 8 3 11 3 15C3 18 5 20 8 19C10 18 10 13 8 8Z" fill="#2DD4BF" opacity="0.8" />
                <path d="M16 8C19 8 21 11 21 15C21 18 19 20 16 19C14 18 14 13 16 8Z" fill="#2DD4BF" opacity="0.8" />
              </svg>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#191B35', margin: 0 }}>
                Breathing & Lungs Mechanics
              </h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#64748B', margin: '2px 0 0 0', maxWidth: 340, lineHeight: 1.4 }}>
              Follow the inhale – hold – exhale cycle and feel the movement of your lungs and diaphragm.
            </p>
          </div>

          {/* Central Glowing Lungs & Diaphragm Illustration */}
          <div
            style={{
              position: 'relative',
              width: 280,
              height: 215,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '4px 0'
            }}
          >
            <svg
              width="270"
              height="210"
              viewBox="0 0 300 240"
              style={{
                transition: `transform ${animationDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                transform: `scale(${lungsScale})`,
                transformOrigin: '50% 32%'
              }}
            >
              <defs>
                {/* Lungs Cyan Gradient */}
                <linearGradient id="lungCyanGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38BDF8" />
                  <stop offset="50%" stopColor="#00BAFA" />
                  <stop offset="100%" stopColor="#0284C7" />
                </linearGradient>

                {/* Diaphragm Pink Muscle Gradient */}
                <linearGradient id="diaphragmPink" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#FB7185" />
                  <stop offset="60%" stopColor="#F43F5E" />
                  <stop offset="100%" stopColor="#BE123C" />
                </linearGradient>

                {/* Glow Filter */}
                <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Trachea (Cyan Ribbed Tube) */}
              <rect x="143" y="10" width="14" height="42" rx="4" fill="#0284C7" />
              <line x1="143" y1="18" x2="157" y2="18" stroke="#7DD3FC" strokeWidth="2" />
              <line x1="143" y1="26" x2="157" y2="26" stroke="#7DD3FC" strokeWidth="2" />
              <line x1="143" y1="34" x2="157" y2="34" stroke="#7DD3FC" strokeWidth="2" />
              <line x1="143" y1="42" x2="157" y2="42" stroke="#7DD3FC" strokeWidth="2" />

              {/* Airflow Particles inside Trachea */}
              {isRunning && (
                <line
                  x1="150"
                  y1="12"
                  x2="150"
                  y2="50"
                  stroke="#FFFFFF"
                  strokeWidth="3.5"
                  strokeDasharray="4 4"
                  style={{
                    animation: currentPhase === 'inhale' ? 'airflowDown 0.8s infinite linear' : currentPhase === 'exhale' ? 'airflowUp 0.8s infinite linear' : 'none'
                  }}
                />
              )}

              {/* Bronchial bifurcation */}
              <path d="M 150 48 L 126 70 M 150 48 L 174 70" stroke="#0369A1" strokeWidth="5" strokeLinecap="round" />

              {/* LEFT LUNG LOBE */}
              <path
                d="M 124 64 C 76 68, 52 105, 56 160 C 60 188, 92 198, 122 178 C 138 168, 136 94, 124 64 Z"
                fill="url(#lungCyanGlow)"
                filter="url(#cyanGlow)"
                opacity={currentPhase === 'inhale' || currentPhase === 'hold' ? 1.0 : 0.88}
                style={{ transition: `all ${animationDuration}s ease` }}
              />

              {/* Left Lung Bronchial Tree */}
              <path d="M 120 84 Q 96 112 102 152 M 120 102 Q 86 126 84 146 M 102 120 Q 80 134 76 156" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.65" />

              {/* Left Expansion Arrow (white diagonal arrow) */}
              <g
                style={{
                  transform: currentPhase === 'inhale' ? 'translate(-3px, -3px)' : 'none',
                  transition: `transform ${animationDuration}s ease`
                }}
              >
                <line x1="106" y1="130" x2="88" y2="104" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                <polyline points="86,116 88,104 100,104" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* RIGHT LUNG LOBE */}
              <path
                d="M 176 64 C 224 68, 248 105, 244 160 C 240 188, 208 198, 178 178 C 162 168, 164 94, 176 64 Z"
                fill="url(#lungCyanGlow)"
                filter="url(#cyanGlow)"
                opacity={currentPhase === 'inhale' || currentPhase === 'hold' ? 1.0 : 0.88}
                style={{ transition: `all ${animationDuration}s ease` }}
              />

              {/* Right Lung Bronchial Tree */}
              <path d="M 180 84 Q 204 112 198 152 M 180 102 Q 214 126 216 146 M 198 120 Q 220 134 224 156" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" opacity="0.65" />

              {/* Right Expansion Arrow (white diagonal arrow) */}
              <g
                style={{
                  transform: currentPhase === 'inhale' ? 'translate(3px, -3px)' : 'none',
                  transition: `transform ${animationDuration}s ease`
                }}
              >
                <line x1="194" y1="130" x2="212" y2="104" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" />
                <polyline points="200,104 212,104 214,116" fill="none" stroke="#FFFFFF" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
              </g>

              {/* DIAPHRAGM MUSCLE DOME */}
              <g
                style={{
                  transition: `transform ${animationDuration}s cubic-bezier(0.4, 0, 0.2, 1)`,
                  transform: `translateY(${diaphragmY}px)`
                }}
              >
                <path
                  d="M 64 200 Q 150 162 236 200 Q 150 182 64 200 Z"
                  fill="url(#diaphragmPink)"
                  stroke="#E11D48"
                  strokeWidth="1.5"
                />

                {/* Animated Diaphragm Arrow (Down on Inhale, Up on Exhale) */}
                {isRunning && currentPhase === 'inhale' && (
                  <g style={{ animation: 'pulseArrowDown 0.8s infinite ease-in-out' }}>
                    <line x1="150" y1="202" x2="150" y2="226" stroke="#00BAFA" strokeWidth="3.5" strokeLinecap="round" />
                    <polyline points="142,218 150,226 158,218" fill="none" stroke="#00BAFA" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
                {isRunning && currentPhase === 'exhale' && (
                  <g style={{ animation: 'pulseArrowUp 0.8s infinite ease-in-out' }}>
                    <line x1="150" y1="226" x2="150" y2="202" stroke="#00BAFA" strokeWidth="3.5" strokeLinecap="round" />
                    <polyline points="142,210 150,202 158,210" fill="none" stroke="#00BAFA" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
                {!isRunning && (
                  <g>
                    <line x1="150" y1="202" x2="150" y2="226" stroke="#00BAFA" strokeWidth="3" strokeLinecap="round" />
                    <polyline points="142,218 150,226 158,218" fill="none" stroke="#00BAFA" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </g>
                )}
              </g>
            </svg>
          </div>

          {/* Bottom Capsule Caption */}
          <div
            style={{
              background: '#F1F5F9',
              borderRadius: 9999,
              padding: '6px 16px',
              fontSize: '0.74rem',
              fontWeight: 600,
              color: '#475569',
              textAlign: 'center',
              width: '94%',
              marginTop: 4
            }}
          >
            Diaphragm moves down during inhale and up during exhale
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLUMN 3: PRACTICE TIMER & CONTROLS                                 */}
        {/* =================================================================== */}
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '16px 14px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.02)'
          }}
        >
          {/* Top Status Capsule */}
          <div
            style={{
              background:
                !isRunning
                  ? '#EEF2F6'
                  : currentPhase === 'inhale'
                  ? '#CCFBF1'
                  : currentPhase === 'hold'
                  ? '#DBEAFE'
                  : '#F3E8FF',
              color:
                !isRunning
                  ? '#475569'
                  : currentPhase === 'inhale'
                  ? '#0F766E'
                  : currentPhase === 'hold'
                  ? '#1D4ED8'
                  : '#7E22CE',
              fontSize: '0.68rem',
              fontWeight: 800,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              padding: '4px 14px',
              borderRadius: 9999
            }}
          >
            {!isRunning ? 'READY TO PRACTICE' : currentPhase.toUpperCase()}
          </div>

          {/* Large Circular Countdown Timer */}
          <div
            style={{
              position: 'relative',
              width: 136,
              height: 136,
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#FFFFFF',
              border: `3px solid ${
                !isRunning
                  ? '#E2E8F0'
                  : currentPhase === 'inhale'
                  ? '#0D9488'
                  : currentPhase === 'hold'
                  ? '#2563EB'
                  : '#9333EA'
              }`,
              boxShadow: isRunning ? '0 0 16px rgba(13, 148, 136, 0.15)' : 'none',
              transition: 'border-color 0.3s ease',
              margin: '8px 0'
            }}
          >
            <span
              style={{
                fontSize: '2.1rem',
                fontWeight: 900,
                color: '#191B35',
                lineHeight: 1,
                letterSpacing: '-0.02em'
              }}
            >
              {!isRunning ? `${customInhale}s` : `${Math.ceil(phaseSecondsLeft)}s`}
            </span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B', marginTop: 2 }}>
              {!isRunning
                ? 'Start Timer'
                : currentPhase === 'inhale'
                ? 'Inhale...'
                : currentPhase === 'hold'
                ? 'Hold breath'
                : 'Exhale (sss)'}
            </span>
          </div>

          {/* Cycle & Elapsed/Remaining Stats */}
          <div style={{ textAlign: 'center', width: '100%' }}>
            <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#191B35' }}>
              Cycle {isRunning ? currentCycle : 1} of {selectedCycles}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
              Elapsed: {formatTime(elapsedTotal)} · Remaining: {formatTime(Math.max(0, totalSessionDuration - elapsedTotal))}
            </div>

            {/* Cycle Progress Dots */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 6, marginBottom: 10 }}>
              {Array.from({ length: selectedCycles }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: i < currentCycle ? '#0D9488' : '#CBD5E1',
                    transition: 'background 0.25s ease'
                  }}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>
            <button
              type="button"
              onClick={handleTogglePlayPause}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                padding: '10px 18px',
                borderRadius: 9999,
                background: '#0D9488',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.88rem',
                fontWeight: 800,
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(13, 148, 136, 0.25)',
                transition: 'all 0.18s ease'
              }}
            >
              {isRunning ? <Pause size={15} fill="#FFFFFF" /> : <Play size={15} fill="#FFFFFF" />}
              <span>
                {!isRunning
                  ? 'Start Breathing Practice'
                  : currentPhase === 'idle'
                  ? 'Start Breathing Practice'
                  : isRunning
                  ? 'Pause Practice'
                  : 'Resume Practice'}
              </span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 5,
                padding: '7px 16px',
                borderRadius: 9999,
                background: '#FFFFFF',
                color: '#475569',
                border: '1px solid #CBD5E1',
                fontSize: '0.80rem',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.18s ease'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
