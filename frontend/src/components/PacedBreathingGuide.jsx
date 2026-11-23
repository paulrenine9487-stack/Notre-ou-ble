import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, CheckCircle2, Wind } from 'lucide-react';

export default function PacedBreathingGuide({ onComplete, disabled = false }) {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('Inhale'); // Inhale, Hold, Exhale, Pause
  const [countdown, setCountdown] = useState(4);
  const [cyclesCompleted, setCyclesCompleted] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  // Appoggio Pacing Cycle: 4s Inhale, 2s Hold, 6s Exhale, 2s Rest
  const cycleConfig = {
    Inhale: 4,
    Hold: 2,
    Exhale: 6,
    Pause: 2
  };

  useEffect(() => {
    let timer = null;
    if (isActive) {
      timer = setInterval(() => {
        setTotalSeconds(prev => prev + 1);

        setCountdown(prev => {
          if (prev <= 1) {
            // Next phase transition
            if (phase === 'Inhale') {
              setPhase('Hold');
              return cycleConfig.Hold;
            } else if (phase === 'Hold') {
              setPhase('Exhale');
              return cycleConfig.Exhale;
            } else if (phase === 'Exhale') {
              setPhase('Pause');
              return cycleConfig.Pause;
            } else {
              setPhase('Inhale');
              setCyclesCompleted(c => c + 1);
              return cycleConfig.Inhale;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isActive, phase]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setPhase('Inhale');
    setCountdown(cycleConfig.Inhale);
    setTotalSeconds(0);
    setCyclesCompleted(0);
  };

  const handleFinish = () => {
    setIsActive(false);
    if (onComplete) {
      onComplete(totalSeconds, cyclesCompleted);
    }
  };

  const getGuideClass = () => {
    if (!isActive) return 'breath-circle-guide';
    if (phase === 'Inhale') return 'breath-circle-guide inhale';
    if (phase === 'Hold') return 'breath-circle-guide hold';
    if (phase === 'Exhale') return 'breath-circle-guide exhale';
    return 'breath-circle-guide';
  };

  return (
    <div className="breathing-pacer-box">
      <div className={getGuideClass()}>
        <span className="breath-action-text">{isActive ? phase : 'Ready'}</span>
        <span className="breath-counter-text">{isActive ? countdown : cycleConfig.Inhale}</span>
      </div>

      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <p style={{ margin: '0 0 6px 0', fontSize: '0.88rem', fontWeight: 650, color: '#191B35' }}>
          {phase === 'Inhale' && 'Inhale softly through nose and mouth into 360° ribcage & lower abdomen.'}
          {phase === 'Hold' && 'Suspend without vocal tension. Keep ribs gently suspended.'}
          {phase === 'Exhale' && 'Release through a steady, gentle sibilant hiss with sustained appoggio.'}
          {phase === 'Pause' && 'Release all tension and prepare for the next comfortable breath.'}
        </p>
        <div style={{ fontSize: '0.78rem', color: '#77728A', fontWeight: 600 }}>
          <span>Cycles Completed: {cyclesCompleted}</span> · <span>Elapsed: {Math.floor(totalSeconds / 60)}m {totalSeconds % 60}s</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
        <button
          type="button"
          onClick={handleStartPause}
          disabled={disabled}
          style={{
            padding: '8px 20px',
            borderRadius: '9999px',
            backgroundColor: isActive ? '#EAE5F3' : '#7C3AED',
            color: isActive ? '#191B35' : '#FFFFFF',
            border: 'none',
            fontWeight: 700,
            fontSize: '0.82rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          {isActive ? <Pause size={15} /> : <Play size={15} />}
          <span>{isActive ? 'Pause Guide' : 'Start Paced Breath'}</span>
        </button>

        <button
          type="button"
          onClick={handleReset}
          style={{
            padding: '8px 14px',
            borderRadius: '9999px',
            backgroundColor: '#FFFFFF',
            border: '1px solid #EAE5F3',
            color: '#77728A',
            fontSize: '0.8rem',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RotateCcw size={13} />
          <span>Reset</span>
        </button>

        {totalSeconds >= 10 && (
          <button
            type="button"
            onClick={handleFinish}
            disabled={disabled}
            style={{
              padding: '8px 20px',
              borderRadius: '9999px',
              backgroundColor: '#15966A',
              color: '#FFFFFF',
              border: 'none',
              fontWeight: 750,
              fontSize: '0.82rem',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(30, 117, 93, 0.25)'
            }}
          >
            <CheckCircle2 size={15} />
            <span>Save & Log Drill Complete</span>
          </button>
        )}
      </div>
    </div>
  );
}
