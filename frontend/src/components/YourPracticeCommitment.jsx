import React, { useState, useEffect } from 'react';
import { Check, CheckCircle2, AlertCircle, Clock, Calendar, Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import { api } from '../services/api';

const DEFAULT_CHECKLIST = [
  {
    key: 'vocal_warmup',
    title: 'Vocal Warm-up',
    durationLabel: '5 min',
    repsLabel: '1 round'
  },
  {
    key: 'posture_breathing_simulation',
    title: 'Posture & Breathing Simulation',
    durationLabel: '5 min',
    repsLabel: '3 cycles'
  },
  {
    key: 'hiss_exhalation',
    title: 'Hiss Exhalation Practice',
    durationLabel: '3 min',
    repsLabel: '5 repetitions'
  },
  {
    key: 'song_practice_recording',
    title: 'Song Practice & Recording',
    durationLabel: '10 min',
    repsLabel: '2 rounds'
  },
  {
    key: 'journal_kanban_tracker',
    title: 'Practice Journal & Kanban Tracker',
    durationLabel: '3 min',
    repsLabel: '1 entry'
  },
  {
    key: 'vocal_cooldown',
    title: 'Vocal Cool-down – Gentle Sighs',
    durationLabel: '2 min',
    repsLabel: '5 repetitions'
  }
];

export default function YourPracticeCommitment({ onCommitmentSaved }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Checklist state - only populated when loaded from user's database records
  const [selectedActivities, setSelectedActivities] = useState([]);

  // Commitment values - empty by default until user sets them or loads saved commitment
  const [minutesPerSession, setMinutesPerSession] = useState('');
  const [sessionsPerWeek, setSessionsPerWeek] = useState(0);

  // Load saved commitment from MySQL
  const loadCommitment = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getPracticeCommitment();
      if (res && res.success) {
        if (res.hasCommitment && res.commitment) {
          setMinutesPerSession(res.commitment.minutes_per_session || '');
          setSessionsPerWeek(res.commitment.sessions_per_week || 0);
        } else {
          setMinutesPerSession('');
          setSessionsPerWeek(0);
        }
        if (Array.isArray(res.activities) && res.activities.length > 0) {
          const selected = res.activities.filter(a => a.isSelected).map(a => a.key);
          setSelectedActivities(selected);
        } else {
          setSelectedActivities([]);
        }
      }
    } catch (err) {
      console.error('Failed to load commitment:', err);
      setErrorMsg('Could not load existing commitment records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCommitment();
  }, []);

  const toggleActivity = (key) => {
    if (selectedActivities.includes(key)) {
      setSelectedActivities(selectedActivities.filter(k => k !== key));
    } else {
      setSelectedActivities([...selectedActivities, key]);
    }
  };

  // Immediate calculated weekly commitment
  const parsedMins = parseInt(minutesPerSession, 10) || 0;
  const parsedSess = parseInt(sessionsPerWeek, 10) || 0;
  const weeklyCommitmentMinutes = parsedMins * parsedSess;

  const handleSave = async () => {
    try {
      setErrorMsg('');
      setSuccessMsg('');

      if (!parsedMins || parsedMins < 1) {
        setErrorMsg('Please enter or select your minutes per session.');
        return;
      }
      if (!parsedSess || parsedSess < 1 || parsedSess > 7) {
        setErrorMsg('Please choose how many sessions per week you commit to (1 to 7).');
        return;
      }

      setSaving(true);
      const res = await api.savePracticeCommitment({
        minutes_per_session: parsedMins,
        sessions_per_week: parsedSess,
        selected_activities: selectedActivities
      });

      if (res && res.success) {
        setSuccessMsg('Your practice commitment has been saved to the database and your Learning Journal sessions have been generated!');
        if (onCommitmentSaved) {
          onCommitmentSaved(res.commitment);
        }
      } else {
        setErrorMsg(res?.message || 'Could not save commitment.');
      }
    } catch (err) {
      console.error('Save commitment failed:', err);
      setErrorMsg(err.message || 'Failed to connect to database.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#FFFFFF', padding: 32, borderRadius: 20, border: '1px solid #DFEBE3', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0D9488' }} />
        <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>Loading practice commitment...</div>
      </div>
    );
  }

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: '32px 28px',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.03)'
      }}
    >
      {/* SECTION HEADER */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <span
            style={{
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#0D9488',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              background: '#E6F4F1',
              padding: '3px 10px',
              borderRadius: 9999
            }}
          >
            SECTION 1 · COMMITMENT
          </span>
          <span style={{ color: '#CBD5E1' }}>•</span>
          <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>
            Weekly Habit Formation
          </span>
        </div>
        <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#143137', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
          Your Practice Commitment
        </h3>
        <p style={{ fontSize: '0.92rem', color: '#64748B', margin: 0 }}>
          Decide how you will keep this going.
        </p>
      </div>

      {successMsg && (
        <div
          style={{
            padding: '14px 18px',
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: 12,
            color: '#166534',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.9rem',
            fontWeight: 650
          }}
        >
          <CheckCircle2 size={20} color="#16A34A" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '14px 18px',
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: 12,
            color: '#991B1B',
            marginBottom: 24,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.9rem',
            fontWeight: 650
          }}
        >
          <AlertCircle size={20} color="#DC2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TWO-COLUMN LAYOUT */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          alignItems: 'start'
        }}
      >
        {/* LEFT SIDE: PRACTICE CHECKLIST */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '24px 20px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
              Practice Checklist
            </h4>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0D9488', background: '#E6F4F1', padding: '2px 8px', borderRadius: 9999 }}>
              {selectedActivities.length} of {DEFAULT_CHECKLIST.length} selected
            </span>
          </div>

          <p style={{ fontSize: '0.82rem', color: '#64748B', margin: '0 0 16px 0', lineHeight: 1.4 }}>
            Select the activities you commit to practising. Checkboxes reflect your planned routine.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {DEFAULT_CHECKLIST.map((item, idx) => {
              const isChecked = selectedActivities.includes(item.key);
              return (
                <div
                  key={item.key}
                  onClick={() => toggleActivity(item.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: isChecked ? '#FFFFFF' : '#F1F5F9',
                    border: isChecked ? '1.5px solid #0D9488' : '1px solid #CBD5E1',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    boxShadow: isChecked ? '0 2px 8px rgba(13, 148, 136, 0.08)' : 'none'
                  }}
                >
                  {/* Teal Checkbox */}
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: isChecked ? '2px solid #0D9488' : '2px solid #94A3B8',
                      backgroundColor: isChecked ? '#0D9488' : '#FFFFFF',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {isChecked && <Check size={14} color="#FFFFFF" strokeWidth={3} />}
                  </div>

                  {/* Activity Details */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.92rem',
                        fontWeight: 750,
                        color: isChecked ? '#0F172A' : '#475569',
                        marginBottom: 2
                      }}
                    >
                      {idx + 1}. {item.title}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#64748B' }}>
                      <span style={{ fontWeight: 600, color: '#0D9488' }}>{item.durationLabel}</span>
                      <span>•</span>
                      <span>{item.repsLabel}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT SIDE: MY COMMITMENT */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: 16,
            border: '1px solid #E2E8F0',
            padding: '24px 22px',
            display: 'flex',
            flexDirection: 'column',
            gap: 22
          }}
        >
          <div>
            <h4 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#1E293B', margin: '0 0 6px 0' }}>
              My Commitment
            </h4>
            <p style={{ fontSize: '0.82rem', color: '#64748B', margin: 0 }}>
              Set your target duration and frequency to form an effortless habit.
            </p>
          </div>

          {/* Input 1: Minutes per session */}
          <div>
            <label htmlFor="practice-minutes-input" style={{ fontSize: '0.88rem', fontWeight: 750, color: '#1E293B', display: 'block', marginBottom: 8 }}>
              Minutes per session
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {[15, 20, 30].map(mins => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setMinutesPerSession(mins)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 10,
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    border: minutesPerSession === mins ? '2px solid #0D9488' : '1px solid #CBD5E1',
                    background: minutesPerSession === mins ? '#0D9488' : '#FFFFFF',
                    color: minutesPerSession === mins ? '#FFFFFF' : '#334155',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {mins} min
                </button>
              ))}

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' }}>
                <input
                  id="practice-minutes-input"
                  name="practice_minutes"
                  aria-label="Custom minutes per session"
                  type="number"
                  min="15"
                  max="240"
                  placeholder="15"
                  value={minutesPerSession}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMinutesPerSession(val === '' ? '' : Math.max(1, parseInt(val, 10) || 1));
                  }}
                  style={{
                    width: 78,
                    padding: '7px 10px',
                    borderRadius: 8,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: '#0F172A',
                    textAlign: 'center'
                  }}
                />
                <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>min</span>
              </div>
            </div>
          </div>

          {/* Input 2: Sessions per week (1-7 selectable circular buttons) */}
          <div>
            <label style={{ fontSize: '0.88rem', fontWeight: 750, color: '#1E293B', display: 'block', marginBottom: 10 }}>
              Sessions per week
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'space-between' }}>
              {[1, 2, 3, 4, 5, 6, 7].map(num => {
                const isSelected = sessionsPerWeek === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setSessionsPerWeek(num)}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '50%',
                      fontSize: '0.98rem',
                      fontWeight: 800,
                      border: isSelected ? '2px solid #0D9488' : '1.5px solid #CBD5E1',
                      background: isSelected ? '#0D9488' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#334155',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.15s ease',
                      boxShadow: isSelected ? '0 4px 12px rgba(13, 148, 136, 0.25)' : 'none'
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Dynamic Automatic Calculation */}
          <div
            style={{
              background: '#E6F4F1',
              borderRadius: 14,
              border: '1.5px solid #BFE3DC',
              padding: '16px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 4
            }}
          >
            <div style={{ fontSize: '0.76rem', fontWeight: 800, color: '#0D9488', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Calculated Weekly Practice Target
            </div>
            {parsedMins > 0 && parsedSess > 0 ? (
              <>
                <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#134E4A' }}>
                  Your weekly commitment: {weeklyCommitmentMinutes} minutes
                </div>
                <div style={{ fontSize: '0.8rem', color: '#0D9488', fontWeight: 600 }}>
                  {parsedMins} minutes × {parsedSess} sessions = {weeklyCommitmentMinutes} min/week
                </div>
              </>
            ) : (
              <div style={{ fontSize: '0.86rem', color: '#0F766E', fontWeight: 600 }}>
                Select your minutes per session and sessions per week to calculate your weekly commitment.
              </div>
            )}
          </div>

          {/* Action Button: SAVE MY COMMITMENT */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              padding: '14px 22px',
              borderRadius: 12,
              background: '#0D9488',
              color: '#FFFFFF',
              fontSize: '0.96rem',
              fontWeight: 800,
              border: 'none',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            {saving ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>SAVING COMMITMENT...</span>
              </>
            ) : (
              <>
                <span>SAVE MY COMMITMENT</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
