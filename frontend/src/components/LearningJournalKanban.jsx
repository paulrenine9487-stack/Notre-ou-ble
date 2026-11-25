import React, { useState, useEffect } from 'react';
import {
  Plus,
  Play,
  Check,
  CheckCircle2,
  Clock,
  Calendar,
  MoreVertical,
  X,
  AlertCircle,
  RefreshCw,
  MoveRight,
  MoveLeft,
  Flame,
  FileText
} from 'lucide-react';
import { api } from '../services/api';

export default function LearningJournalKanban({ onSessionsUpdated, refreshTrigger }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Drag-and-drop state
  const [draggingSessionId, setDraggingSessionId] = useState(null);

  // Add Session Modal state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newActivity, setNewActivity] = useState('Breath Routine & Song Vocalization');
  const [newDuration, setNewDuration] = useState(10);
  const [newDate, setNewDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [modalSaving, setModalSaving] = useState(false);

  // Completion modal for entering actual duration / reflection
  const [completeModalSession, setCompleteModalSession] = useState(null);
  const [actualDuration, setActualDuration] = useState(10);
  const [completeNotes, setCompleteNotes] = useState('');
  const [completeSubmitting, setCompleteSubmitting] = useState(false);
  const [completeModalError, setCompleteModalError] = useState('');
  const [updatingSessionId, setUpdatingSessionId] = useState(null);

  const loadSessions = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      }
      setErrorMsg('');
      const res = await api.getLearningJournalSessions();
      if (res && res.success) {
        setSessions(res.sessions || []);
      }
    } catch (err) {
      console.error('Failed to load journal sessions:', err);
      if (!isBackground) {
        setErrorMsg('Could not load learning journal sessions.');
      }
    } finally {
      if (!isBackground) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const isBackground = sessions.length > 0;
    loadSessions(isBackground);
  }, [refreshTrigger]);

  useEffect(() => {
    const handleCommitmentSaved = (e) => {
      if (e.detail?.sessions && Array.isArray(e.detail.sessions)) {
        setSessions(e.detail.sessions);
      } else {
        loadSessions(true);
      }
    };
    window.addEventListener('resonova_commitment_saved', handleCommitmentSaved);
    return () => window.removeEventListener('resonova_commitment_saved', handleCommitmentSaved);
  }, []);

  const showNotification = (msg) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast('');
    }, 3500);
  };

  // Change status of a session (via Drag & Drop or Button)
  const changeSessionStatus = async (sessionId, newStatus, actualDur = null, notes = null) => {
    // If moving to 'done' and no duration provided, open completion modal
    if (newStatus === 'done' && actualDur === null) {
      const target = sessions.find(s => s.id === sessionId);
      if (target) {
        setCompleteModalSession(target);
        setActualDuration(target.planned_duration || 10);
        setCompleteNotes(target.notes || '');
        setCompleteModalError('');
        return;
      }
    }

    setUpdatingSessionId(sessionId);
    setErrorMsg('');

    try {
      const payload = { status: newStatus };
      if (actualDur !== null && actualDur !== undefined && !isNaN(Number(actualDur))) {
        payload.actual_duration = Number(actualDur);
      }
      if (notes !== null && notes !== undefined && notes !== '') {
        payload.notes = notes;
      }

      const res = await api.updateLearningJournalSessionStatus(sessionId, payload);

      if (res && res.success && res.session) {
        // Authoritative update directly from MySQL confirmation
        setSessions(prev => prev.map(s => s.id === sessionId ? res.session : s));
        const displayLabel = newStatus === 'planned' ? 'TO DO' : newStatus === 'practising' ? 'DOING' : 'DONE';
        showNotification(`Session moved to ${displayLabel}!`);
        if (onSessionsUpdated) {
          onSessionsUpdated();
        }
      } else {
        setErrorMsg(res?.message || 'Could not update session status in database.');
      }
    } catch (err) {
      console.error('Status update failed:', err);
      setErrorMsg(err.message || 'Failed to sync session with database.');
    } finally {
      setUpdatingSessionId(null);
    }
  };

  // Drag & Drop Handlers
  const handleDragStart = (e, session) => {
    e.dataTransfer.setData('text/plain', session.id);
    setDraggingSessionId(session.id);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const id = draggingSessionId || parseInt(e.dataTransfer.getData('text/plain'), 10);
    setDraggingSessionId(null);
    if (!id) return;

    const currentSession = sessions.find(s => s.id === id);
    if (currentSession && currentSession.status !== targetStatus) {
      changeSessionStatus(id, targetStatus);
    }
  };

  // Add Manual Session Handler
  const handleAddSession = async (e) => {
    e.preventDefault();
    try {
      setModalSaving(true);
      const res = await api.addLearningJournalSession({
        session_title: newTitle,
        activity: newActivity,
        planned_duration: newDuration,
        scheduled_date: newDate || null,
        notes: newNotes || null
      });

      if (res && res.success) {
        setSessions(prev => [...prev, res.session]);
        setShowAddModal(false);
        setNewTitle('');
        setNewNotes('');
        showNotification('New session added to To Do!');
        if (onSessionsUpdated) onSessionsUpdated();
      } else {
        setErrorMsg(res?.message || 'Could not create session.');
      }
    } catch (err) {
      console.error('Failed to add session:', err);
      setErrorMsg('Failed to save new session to MySQL.');
    } finally {
      setModalSaving(false);
    }
  };

  // Complete Session Modal Submit
  const handleCompleteSubmit = async (e) => {
    e.preventDefault();
    if (!completeModalSession || completeSubmitting) return;

    const sId = completeModalSession.id;
    setCompleteSubmitting(true);
    setCompleteModalError('');

    try {
      const payload = {
        status: 'done',
        actual_duration: Number(actualDuration) || completeModalSession.planned_duration || 10,
        notes: completeNotes ? String(completeNotes).trim() : null
      };

      const res = await api.updateLearningJournalSessionStatus(sId, payload);

      if (res && res.success && res.session) {
        // Authoritative update from database confirmation
        setSessions(prev => prev.map(s => s.id === sId ? res.session : s));
        setCompleteModalSession(null);
        showNotification('Session marked as DONE and logged to Practice Journal! ✓');
        if (onSessionsUpdated) {
          onSessionsUpdated();
        }
      } else {
        setCompleteModalError(res?.message || 'Could not complete session in database.');
      }
    } catch (err) {
      console.error('Completion submission failed:', err);
      setCompleteModalError(err.message || 'Failed to sync session with database.');
    } finally {
      setCompleteSubmitting(false);
    }
  };

  // Group sessions by column
  const plannedSessions = sessions.filter(s => s.status === 'planned');
  const practisingSessions = sessions.filter(s => s.status === 'practising');
  const doneSessions = sessions.filter(s => s.status === 'done');

  const columns = [
    {
      id: 'planned',
      title: 'TO DO',
      badgeColor: '#475569',
      badgeBg: '#F1F5F9',
      borderColor: '#CBD5E1',
      items: plannedSessions
    },
    {
      id: 'practising',
      title: 'DOING',
      badgeColor: '#0D9488',
      badgeBg: '#E6F4F1',
      borderColor: '#99F6E4',
      items: practisingSessions
    },
    {
      id: 'done',
      title: 'DONE',
      badgeColor: '#16A34A',
      badgeBg: '#DCFCE7',
      borderColor: '#86EFAC',
      items: doneSessions
    }
  ];

  if (loading) {
    return (
      <div style={{ background: '#FFFFFF', padding: 32, borderRadius: 20, border: '1px solid #DFEBE3', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0D9488' }} />
        <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>Loading learning journal Kanban...</div>
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
      {/* SECTION HEADER & ADD BUTTON */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 24,
          flexWrap: 'wrap',
          gap: 16
        }}
      >
        <div>
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
              SECTION 2 · JOURNAL
            </span>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>
              Weekly Kanban Tracker
            </span>
          </div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: '#143137', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
            Learning Journal
          </h3>
          <p style={{ fontSize: '0.92rem', color: '#64748B', margin: 0 }}>
            Move your practice sessions across the board each week.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            borderRadius: 12,
            background: '#0D9488',
            color: '#FFFFFF',
            fontSize: '0.88rem',
            fontWeight: 750,
            border: 'none',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(13, 148, 136, 0.2)',
            transition: 'all 0.15s ease'
          }}
        >
          <Plus size={16} strokeWidth={2.5} />
          <span>Add Session</span>
        </button>
      </div>

      {successToast && (
        <div
          style={{
            padding: '12px 16px',
            background: '#F0FDF4',
            border: '1.5px solid #86EFAC',
            borderRadius: 12,
            color: '#166534',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem',
            fontWeight: 650
          }}
        >
          <CheckCircle2 size={18} color="#16A34A" />
          <span>{successToast}</span>
        </div>
      )}

      {errorMsg && (
        <div
          style={{
            padding: '12px 16px',
            background: '#FEF2F2',
            border: '1.5px solid #FCA5A5',
            borderRadius: 12,
            color: '#991B1B',
            marginBottom: 20,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.88rem',
            fontWeight: 650
          }}
        >
          <AlertCircle size={18} color="#DC2626" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Empty State Banner if no sessions exist */}
      {sessions.length === 0 && (
        <div
          style={{
            background: '#F8FAFC',
            border: '1.5px dashed #CBD5E1',
            borderRadius: 14,
            padding: '24px 20px',
            textAlign: 'center',
            marginBottom: 20
          }}
        >
          <div style={{ fontSize: '1rem', fontWeight: 750, color: '#334155', marginBottom: 4 }}>
            No practice sessions scheduled yet
          </div>
          <div style={{ fontSize: '0.84rem', color: '#64748B', maxWidth: 480, margin: '0 auto' }}>
            Choose your weekly practice commitment in Section 1 above to automatically generate your sessions, or click <strong>+ Add Session</strong> to create one manually.
          </div>
        </div>
      )}

      {/* THREE-COLUMN KANBAN BOARD */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 20,
          alignItems: 'start'
        }}
      >
        {columns.map(col => (
          <div
            key={col.id}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, col.id)}
            style={{
              background: '#F8FAFC',
              borderRadius: 16,
              border: '1px solid #E2E8F0',
              padding: '18px 16px',
              minHeight: 380,
              display: 'flex',
              flexDirection: 'column',
              transition: 'background 0.2s ease'
            }}
          >
            {/* Column Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingBottom: 14,
                marginBottom: 14,
                borderBottom: '1.5px solid #E2E8F0'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 800,
                    letterSpacing: '0.04em',
                    color: col.badgeColor
                  }}
                >
                  {col.title}
                </span>
                <span
                  style={{
                    fontSize: '0.74rem',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: 9999,
                    background: col.badgeBg,
                    color: col.badgeColor,
                    border: `1px solid ${col.borderColor}`
                  }}
                >
                  {col.items.length}
                </span>
              </div>

              <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 600 }}>
                {col.id === 'planned' ? 'Ready to Start' : col.id === 'practising' ? 'In Progress' : 'Completed'}
              </span>
            </div>

            {/* Column Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
              {col.items.length === 0 ? (
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '30px 10px',
                    color: '#94A3B8',
                    fontSize: '0.82rem',
                    fontWeight: 500,
                    border: '1.5px dashed #CBD5E1',
                    borderRadius: 12,
                    textAlign: 'center'
                  }}
                >
                  Drag sessions here or use buttons below
                </div>
              ) : (
                col.items.map(session => (
                  <div
                    key={session.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, session)}
                    style={{
                      background: '#FFFFFF',
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      padding: '16px 14px',
                      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                      cursor: 'grab',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10
                    }}
                  >
                    {/* Top Row: Title & Duration Badge */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div>
                        <div style={{ fontSize: '0.94rem', fontWeight: 800, color: '#1E293B', lineHeight: 1.3 }}>
                          {session.session_title}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#64748B', marginTop: 3 }}>
                          {session.activity || 'Breath Routine & Vocalization'}
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.74rem',
                          fontWeight: 750,
                          color: '#0D9488',
                          background: '#E6F4F1',
                          padding: '3px 8px',
                          borderRadius: 6,
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {session.status === 'done' && session.actual_duration
                          ? `${session.actual_duration} min done`
                          : `${session.planned_duration} min`}
                      </span>
                    </div>

                    {/* Scheduled Date or Notes if present */}
                    {session.scheduled_date && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.74rem', color: '#64748B' }}>
                        <Calendar size={13} color="#94A3B8" />
                        <span>{new Date(session.scheduled_date).toLocaleDateString()}</span>
                      </div>
                    )}

                    {session.notes && (
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: '#475569',
                          background: '#F8FAFC',
                          padding: '6px 8px',
                          borderRadius: 6,
                          borderLeft: '2px solid #0D9488'
                        }}
                      >
                        {session.notes}
                      </div>
                    )}

                    {/* Accessible Action Buttons */}
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        paddingTop: 8,
                        borderTop: '1px solid #F1F5F9',
                        gap: 6
                      }}
                    >
                      {/* Left move button */}
                      {col.id === 'practising' && (
                        <button
                          type="button"
                          disabled={updatingSessionId === session.id}
                          onClick={() => changeSessionStatus(session.id, 'planned')}
                          title="Move back to To Do"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: '#F1F5F9',
                            color: '#475569',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: updatingSessionId === session.id ? 'not-allowed' : 'pointer',
                            opacity: updatingSessionId === session.id ? 0.5 : 1
                          }}
                        >
                          <MoveLeft size={12} />
                          <span>To Do</span>
                        </button>
                      )}

                      {col.id === 'done' && (
                        <button
                          type="button"
                          disabled={updatingSessionId === session.id}
                          onClick={() => changeSessionStatus(session.id, 'practising')}
                          title="Move back to Doing"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '4px 8px',
                            borderRadius: 6,
                            background: '#F1F5F9',
                            color: '#475569',
                            border: 'none',
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            cursor: updatingSessionId === session.id ? 'not-allowed' : 'pointer',
                            opacity: updatingSessionId === session.id ? 0.5 : 1
                          }}
                        >
                          <MoveLeft size={12} />
                          <span>Doing</span>
                        </button>
                      )}

                      {/* Right forward button */}
                      {col.id === 'planned' && (
                        <button
                          type="button"
                          disabled={updatingSessionId === session.id}
                          onClick={() => changeSessionStatus(session.id, 'practising')}
                          title="Start Doing"
                          style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 12px',
                            borderRadius: 8,
                            background: '#0D9488',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.76rem',
                            fontWeight: 750,
                            cursor: updatingSessionId === session.id ? 'not-allowed' : 'pointer',
                            opacity: updatingSessionId === session.id ? 0.6 : 1
                          }}
                        >
                          {updatingSessionId === session.id ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <Play size={11} fill="#FFFFFF" />
                          )}
                          <span>Start Doing</span>
                        </button>
                      )}

                      {col.id === 'practising' && (
                        <button
                          type="button"
                          disabled={updatingSessionId === session.id}
                          onClick={() => changeSessionStatus(session.id, 'done')}
                          style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            padding: '5px 12px',
                            borderRadius: 8,
                            background: '#16A34A',
                            color: '#FFFFFF',
                            border: 'none',
                            fontSize: '0.76rem',
                            fontWeight: 750,
                            cursor: updatingSessionId === session.id ? 'not-allowed' : 'pointer',
                            opacity: updatingSessionId === session.id ? 0.6 : 1
                          }}
                        >
                          {updatingSessionId === session.id ? (
                            <RefreshCw size={11} className="animate-spin" />
                          ) : (
                            <Check size={13} strokeWidth={2.5} />
                          )}
                          <span>Mark as Done</span>
                        </button>
                      )}

                      {col.id === 'done' && (
                        <span
                          style={{
                            marginLeft: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            fontSize: '0.74rem',
                            fontWeight: 750,
                            color: '#16A34A'
                          }}
                        >
                          <CheckCircle2 size={14} /> Completed
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ADD SESSION MODAL */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              width: '100%',
              maxWidth: 480,
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                Add Practice Session
              </h4>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddSession} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 750, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Session Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Session 5 – Song Rehearsal"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 750, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Target Activity
                </label>
                <select
                  value={newActivity}
                  onChange={(e) => setNewActivity(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    background: '#FFFFFF'
                  }}
                >
                  <option value="Breath Routine & Song Vocalization">Breath Routine & Song Vocalization</option>
                  <option value="Vocal Warm-up & Sirens">Vocal Warm-up & Sirens</option>
                  <option value="Posture & Diaphragmatic Breathing">Posture & Diaphragmatic Breathing</option>
                  <option value="Hiss Exhalation & Airflow Control">Hiss Exhalation & Airflow Control</option>
                  <option value="Song Practice & Phrasing Marking">Song Practice & Phrasing Marking</option>
                  <option value="Vocal Cool-down & Sighs">Vocal Cool-down & Sighs</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 750, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="180"
                    value={newDuration}
                    onChange={(e) => setNewDuration(parseInt(e.target.value, 10) || 10)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 750, color: '#334155', display: 'block', marginBottom: 6 }}>
                    Scheduled Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: 10,
                      border: '1.5px solid #CBD5E1',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 750, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Notes / Focus Point (Optional)
                </label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="e.g. Focus on keeping ribs gently expanded on bar 12..."
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalSaving}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#0D9488',
                    color: '#FFFFFF',
                    fontWeight: 750,
                    cursor: 'pointer'
                  }}
                >
                  {modalSaving ? 'Saving...' : 'Create Session'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* COMPLETION MODAL */}
      {completeModalSession && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: 16
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              width: '100%',
              maxWidth: 460,
              padding: 28,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: '#DCFCE7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={18} color="#16A34A" />
                </div>
                <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1E293B', margin: 0 }}>
                  Complete Practice Session
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setCompleteModalSession(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 18px 0' }}>
              Confirm your practice details for <strong>{completeModalSession.session_title}</strong> to log it into your Practice Journal.
            </p>

            <form onSubmit={handleCompleteSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {completeModalError && (
                <div
                  style={{
                    padding: '10px 14px',
                    background: '#FEF2F2',
                    border: '1.5px solid #FCA5A5',
                    borderRadius: 10,
                    color: '#991B1B',
                    fontSize: '0.85rem',
                    fontWeight: 650,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  <AlertCircle size={16} color="#DC2626" style={{ flexShrink: 0 }} />
                  <span>{completeModalError}</span>
                </div>
              )}

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 750, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Actual Duration Practised (Minutes)
                </label>
                <input
                  type="number"
                  min="1"
                  max="240"
                  disabled={completeSubmitting}
                  value={actualDuration}
                  onChange={(e) => setActualDuration(parseInt(e.target.value, 10) || 1)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: 750, color: '#334155', display: 'block', marginBottom: 6 }}>
                  Quick Practice Reflection (Optional)
                </label>
                <textarea
                  rows={3}
                  disabled={completeSubmitting}
                  value={completeNotes}
                  onChange={(e) => setCompleteNotes(e.target.value)}
                  placeholder="How did this session feel? What went well?"
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: 10,
                    border: '1.5px solid #CBD5E1',
                    fontSize: '0.88rem',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
                <button
                  type="button"
                  disabled={completeSubmitting}
                  onClick={() => {
                    if (!completeSubmitting) setCompleteModalSession(null);
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontWeight: 700,
                    cursor: completeSubmitting ? 'not-allowed' : 'pointer',
                    opacity: completeSubmitting ? 0.6 : 1
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={completeSubmitting}
                  style={{
                    padding: '10px 22px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#16A34A',
                    color: '#FFFFFF',
                    fontWeight: 750,
                    cursor: completeSubmitting ? 'not-allowed' : 'pointer',
                    opacity: completeSubmitting ? 0.75 : 1,
                    boxShadow: '0 2px 8px rgba(22, 163, 74, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                  }}
                >
                  {completeSubmitting ? (
                    <>
                      <RefreshCw size={15} className="animate-spin" />
                      <span>Saving to Database...</span>
                    </>
                  ) : (
                    <span>Confirm & Complete ✓</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
