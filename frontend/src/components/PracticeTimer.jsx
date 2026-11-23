import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { Play, Pause, RotateCcw, CheckCircle2, Wind, Clock } from 'lucide-react';

export default function PracticeTimer({ onSessionSaved }) {
  const [exercise, setExercise] = useState('Diaphragmatic Expansion');
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [phase, setBreathPhase] = useState('Inhale'); // Inhale | Hold | Exhale
  const [phaseCounter, setPhaseCounter] = useState(4);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const startTimeRef = useRef(null);

  // Exercise definitions
  const exercises = [
    { name: 'Diaphragmatic Expansion', inhale: 4, hold: 2, exhale: 6, desc: 'Deep 360° rib expansion with slow controlled exhale.' },
    { name: 'Box Breathing (4-4-4-4)', inhale: 4, hold: 4, exhale: 4, holdPost: 4, desc: 'Equal ratio pacing to calm vocal adrenaline.' },
    { name: 'Sustained Legato Stream', inhale: 3, hold: 0, exhale: 10, desc: 'Prolonged steady airflow for uninterrupted vocal lines.' },
    { name: 'Appoggio Breath Support', inhale: 4, hold: 3, exhale: 8, desc: 'Lean gently on the lower abdominal wall during phonation.' }
  ];

  const currentExerciseConfig = exercises.find(e => e.name === exercise) || exercises[0];

  // Overall timer
  useEffect(() => {
    let interval = null;
    if (isRunning) {
      if (!startTimeRef.current) startTimeRef.current = new Date();
      interval = setInterval(() => {
        setSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isRunning]);

  // Breathing cycle animation timer
  useEffect(() => {
    let cycleInterval = null;
    if (isRunning) {
      cycleInterval = setInterval(() => {
        setPhaseCounter(prev => {
          if (prev <= 1) {
            // Transition phase
            if (phase === 'Inhale') {
              if (currentExerciseConfig.hold > 0) {
                setBreathPhase('Hold');
                return currentExerciseConfig.hold;
              } else {
                setBreathPhase('Exhale');
                return currentExerciseConfig.exhale;
              }
            } else if (phase === 'Hold') {
              setBreathPhase('Exhale');
              return currentExerciseConfig.exhale;
            } else {
              setBreathPhase('Inhale');
              return currentExerciseConfig.inhale;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(cycleInterval);
  }, [isRunning, phase, currentExerciseConfig]);

  const handleStartPause = () => {
    if (!isRunning && !startTimeRef.current) {
      startTimeRef.current = new Date();
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setSeconds(0);
    setBreathPhase('Inhale');
    setPhaseCounter(currentExerciseConfig.inhale);
    startTimeRef.current = null;
  };

  const handleSaveSession = async () => {
    const durationMinutes = Math.max(1, Math.round(seconds / 60));
    setSaving(true);
    setNotice('');

    try {
      const payload = {
        session_type: 'Breath Management',
        exercise_name: exercise,
        duration_minutes: durationMinutes,
        start_time: startTimeRef.current ? startTimeRef.current.toISOString() : new Date().toISOString(),
        end_time: new Date().toISOString(),
        notes: notes.trim() || `Completed ${exercise} breathing practice (${durationMinutes} min)`
      };

      await api.completePracticeSession(payload);
      setNotice(`Session saved to MySQL! +${durationMinutes} min added to weekly stats.`);
      handleReset();
      setNotes('');
      if (onSessionSaved) onSessionSaved();
    } catch (err) {
      setNotice(err.message || 'Failed to save practice session.');
    } finally {
      setSaving(false);
    }
  };

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div style={{
      backgroundColor: '#FFFFFF',
      border: '1px solid #EAE5F3',
      borderRadius: '18px',
      padding: '22px 26px',
      boxShadow: '0 2px 10px rgba(25, 27, 53, 0.02)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{
            fontSize: '0.68rem',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#7C3AED',
            backgroundColor: '#F4F0FF',
            padding: '2.5px 8px',
            borderRadius: '9999px',
            display: 'inline-block',
            marginBottom: '4px'
          }}>
            GUIDED BREATHING EXERCISE
          </span>
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#191B35', margin: 0 }}>
            Breath Management Practice Timer
          </h3>
        </div>

        {/* Exercise Selection */}
        <select
          value={exercise}
          onChange={(e) => {
            setExercise(e.target.value);
            handleReset();
          }}
          disabled={isRunning}
          style={{
            padding: '6px 10px',
            borderRadius: '8px',
            border: '1px solid #EAE5F3',
            backgroundColor: '#F8FAF8',
            color: '#191B35',
            fontSize: '0.8rem',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          {exercises.map(ex => (
            <option key={ex.name} value={ex.name}>{ex.name}</option>
          ))}
        </select>
      </div>

      <p style={{ fontSize: '0.82rem', color: '#77728A', margin: '0 0 14px 0', lineHeight: 1.45 }}>
        {currentExerciseConfig.desc}
      </p>

      {/* Breathing Bubble & Timer Display */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '18px 0',
        backgroundColor: '#F8F7FC',
        borderRadius: '14px',
        marginBottom: '14px',
        position: 'relative'
      }}>
        {/* Animated Breath Bubble */}
        <div style={{
          width: '82px',
          height: '82px',
          borderRadius: '50%',
          backgroundColor: '#F4F0FF',
          border: '2px solid #7C3AED',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 1s ease-in-out',
          transform: phase === 'Inhale' ? 'scale(1.12)' : (phase === 'Hold' ? 'scale(1.12)' : 'scale(0.9)'),
          boxShadow: isRunning ? '0 0 16px rgba(124, 58, 237, 0.2)' : 'none'
        }}>
          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#191B35' }}>
            {isRunning ? phase : 'Ready'}
          </span>
          {isRunning && (
            <span style={{ fontSize: '1.1rem', fontWeight: 750, color: '#7C3AED' }}>
              {phaseCounter}s
            </span>
          )}
        </div>

        {/* Total Elapsed Time */}
        <div style={{
          marginTop: '10px',
          fontSize: '1.45rem',
          fontWeight: 700,
          color: '#191B35',
          letterSpacing: '-0.02em',
          fontVariantNumeric: 'tabular-nums'
        }}>
          {formatTime(seconds)}
        </div>
        <div style={{ fontSize: '0.68rem', color: '#77728A', fontWeight: 600, letterSpacing: '0.04em' }}>
          TOTAL DURATION ELAPSED
        </div>
      </div>

      {/* Control Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', marginBottom: '14px' }}>
        <button
          onClick={handleStartPause}
          style={{
            backgroundColor: isRunning ? '#D97706' : '#241442',
            color: '#FFFFFF',
            padding: '9px 20px',
            borderRadius: '9999px',
            border: 'none',
            fontSize: '0.84rem',
            fontWeight: 650,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(124, 58, 237, 0.12)'
          }}
        >
          {isRunning ? <Pause size={15} /> : <Play size={15} fill="currentColor" />}
          <span>{isRunning ? 'Pause' : 'Start Breathing'}</span>
        </button>

        <button
          onClick={handleReset}
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #EAE5F3',
            color: '#77728A',
            padding: '9px 16px',
            borderRadius: '9999px',
            fontSize: '0.84rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <RotateCcw size={14} />
          <span>Reset</span>
        </button>

        {seconds >= 30 && (
          <button
            onClick={handleSaveSession}
            disabled={saving}
            style={{
              backgroundColor: '#7C3AED',
              color: '#FFFFFF',
              padding: '9px 20px',
              borderRadius: '9999px',
              border: 'none',
              fontSize: '0.84rem',
              fontWeight: 650,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 2px 8px rgba(124, 58, 237, 0.2)'
            }}
          >
            <CheckCircle2 size={15} />
            <span>{saving ? 'Saving...' : 'Save to MySQL'}</span>
          </button>
        )}
      </div>

      {notice && (
        <div style={{
          padding: '10px 16px',
          borderRadius: '10px',
          backgroundColor: '#F4F0FF',
          color: '#191B35',
          fontSize: '0.88rem',
          fontWeight: 600,
          textAlign: 'center'
        }}>
          {notice}
        </div>
      )}
    </div>
  );
}
