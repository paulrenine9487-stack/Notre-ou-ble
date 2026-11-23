import React, { useState, useEffect } from 'react';
import {
  Lightbulb,
  Sparkles,
  Award,
  Send,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Pin,
  Clock,
  RotateCcw,
  BookOpen,
  Bookmark
} from 'lucide-react';
import { api } from '../services/api';

const MAX_CHARS = 1000;

export default function PersonalLearningPinboard({ stageId = 4, moduleId = 1, onUpdate }) {
  // Form State
  const [q1, setQ1] = useState('');
  const [q2, setQ2] = useState('');
  const [q3, setQ3] = useState('');

  // Pinboard & Submission State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [savedReflection, setSavedReflection] = useState(null);
  const [feedbackMsg, setFeedbackMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Fetch authenticated student's existing reflection from MySQL
  const loadReflection = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.getStudentReflection(moduleId, stageId);
      if (res && res.success && res.reflection) {
        setSavedReflection(res.reflection);
        setQ1(res.reflection.question_1_answer || '');
        setQ2(res.reflection.question_2_answer || '');
        setQ3(res.reflection.question_3_answer || '');
        setIsEditing(false);
      } else {
        setSavedReflection(null);
        setIsEditing(true); // Default to open form if no reflection exists yet
      }
    } catch (err) {
      console.warn('Could not load student reflection:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReflection();
  }, [moduleId, stageId]);

  // 2. Handle Submit / Update Reflection
  const handleSubmit = async (e) => {
    if (e) e.preventDefault();

    const ans1 = q1.trim();
    const ans2 = q2.trim();
    const ans3 = q3.trim();

    if (!ans1 || !ans2 || !ans3) {
      setErrorMsg('Please complete all three reflection questions before submitting.');
      return;
    }

    if (ans1.length < 5 || ans2.length < 5 || ans3.length < 5) {
      setErrorMsg('Please write a meaningful reflection for each card (at least 5 characters).');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg('');
      setFeedbackMsg(null);

      const payload = {
        question_1_answer: ans1,
        question_2_answer: ans2,
        question_3_answer: ans3,
        module_id: moduleId,
        stage_id: stageId
      };

      const res = savedReflection
        ? await api.updateStudentReflection(payload)
        : await api.submitStudentReflection(payload);

      if (res && res.success) {
        setSavedReflection(res.reflection);
        setIsEditing(false);
        setFeedbackMsg(savedReflection ? 'Reflection updated successfully!' : 'Reflection submitted successfully!');
        if (onUpdate) onUpdate();
        setTimeout(() => setFeedbackMsg(null), 4000);
      } else {
        setErrorMsg(res?.message || 'Failed to save reflection.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error saving reflection. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 16, border: '1px solid #EAE5F3', textAlign: 'center' }}>
        <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>Loading learning reflection...</div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* SECTION CONTAINER */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 20,
          border: '1px solid #DFEBE3',
          padding: '28px 24px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}
      >
        {/* Section Header */}
        <div style={{ marginBottom: 24 }}>
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
              PART 2 · PERSONAL REFLECTION
            </span>
            <span style={{ color: '#CBD5E1' }}>•</span>
            <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#64748B' }}>
              3 Reflection Cards
            </span>
          </div>
          <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#143137', margin: '0 0 6px 0', letterSpacing: '-0.01em' }}>
            What Have You Learned?
          </h3>
          <p style={{ fontSize: '0.9rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Reflect on what you knew before, what you wanted to discover, and what you learned during this module.
          </p>
        </div>

        {/* Success Alert Banner */}
        {feedbackMsg && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              background: '#F0FDF4',
              border: '1.5px solid #86EFAC',
              color: '#15803D',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.88rem',
              fontWeight: 700,
              marginBottom: 20
            }}
          >
            <CheckCircle2 size={18} color="#16A34A" />
            <span>{feedbackMsg}</span>
          </div>
        )}

        {/* Error Alert Banner */}
        {errorMsg && (
          <div
            style={{
              padding: '12px 18px',
              borderRadius: 12,
              background: '#FEF2F2',
              border: '1.5px solid #FECACA',
              color: '#DC2626',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.88rem',
              fontWeight: 700,
              marginBottom: 20
            }}
          >
            <AlertCircle size={18} color="#DC2626" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* REFLECTION INPUT FORM (Always accessible, togglable via Edit button when completed) */}
        {(!savedReflection || isEditing) && (
          <form onSubmit={handleSubmit}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: 20,
                marginBottom: 24
              }}
            >
              {/* CARD 01 – WHAT I KNOW? (Mint Theme) */}
              <div
                style={{
                  background: '#F0FDF4',
                  border: '1.5px solid #A7F3D0',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: '#D1FAE5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#059669'
                    }}
                  >
                    <Lightbulb size={18} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#064E3B', margin: 0 }}>
                    What I Know?
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#047857', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                  Write what you already know about breathing and breath management before starting this module.
                </p>

                <textarea
                  id="reflection-q1"
                  name="question_1_answer"
                  aria-label="What I Know reflection"
                  rows={5}
                  value={q1}
                  onChange={(e) => setQ1(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="For example: I know that breathing is important for singing..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.88rem',
                    color: '#1E293B',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#0D9488')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: '0.72rem', color: '#64748B' }}>
                  <span>{q1.length} / {MAX_CHARS} characters</span>
                </div>
              </div>

              {/* CARD 02 – WHAT I WANT? (Peach Theme) */}
              <div
                style={{
                  background: '#FFF7ED',
                  border: '1.5px solid #FED7AA',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: '#FFEDD5',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#EA580C'
                    }}
                  >
                    <Sparkles size={18} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#7C2D12', margin: 0 }}>
                    What I Want?
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#C2410C', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                  What would you like to understand or improve about your breathing while singing?
                </p>

                <textarea
                  id="reflection-q2"
                  name="question_2_answer"
                  aria-label="What I Want to Know reflection"
                  rows={5}
                  value={q2}
                  onChange={(e) => setQ2(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="For example: I want to learn how to control my breath while singing long phrases..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.88rem',
                    color: '#1E293B',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#EA580C')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: '0.72rem', color: '#64748B' }}>
                  <span>{q2.length} / {MAX_CHARS} characters</span>
                </div>
              </div>

              {/* CARD 03 – WHAT I HAVE LEARNED? (Lavender Theme) */}
              <div
                style={{
                  background: '#FAF5FF',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: 16,
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(124, 58, 237, 0.05)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 10,
                      background: '#EDE9FE',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#7C3AED'
                    }}
                  >
                    <Award size={18} />
                  </div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4C1D95', margin: 0 }}>
                    What I Have Learned?
                  </h4>
                </div>
                <p style={{ fontSize: '0.82rem', color: '#6D28D9', margin: '0 0 14px 0', lineHeight: 1.45 }}>
                  Share one important thing you discovered or understood after completing this module.
                </p>

                <textarea
                  id="reflection-q3"
                  name="question_3_answer"
                  aria-label="What I Learned reflection"
                  rows={5}
                  value={q3}
                  onChange={(e) => setQ3(e.target.value.slice(0, MAX_CHARS))}
                  placeholder="For example: I learned that controlled airflow is more important than taking a bigger breath..."
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    fontSize: '0.88rem',
                    color: '#1E293B',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    outline: 'none',
                    transition: 'border-color 0.15s ease'
                  }}
                  onFocus={(e) => (e.target.style.borderColor = '#7C3AED')}
                  onBlur={(e) => (e.target.style.borderColor = '#CBD5E1')}
                />
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 6, fontSize: '0.72rem', color: '#64748B' }}>
                  <span>{q3.length} / {MAX_CHARS} characters</span>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, paddingTop: 8 }}>
              {savedReflection && (
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: 10,
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#64748B',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  Cancel Edit
                </button>
              )}

              <button
                type="submit"
                disabled={submitting}
                style={{
                  padding: '12px 28px',
                  borderRadius: 12,
                  border: 'none',
                  background: submitting ? '#94A3B8' : '#0D9488',
                  color: '#FFFFFF',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
                  transition: 'all 0.18s ease',
                  marginLeft: 'auto'
                }}
              >
                <Send size={16} />
                <span>{submitting ? 'Saving to Database...' : savedReflection ? 'UPDATE MY REFLECTION' : 'SUBMIT MY REFLECTION'}</span>
              </button>
            </div>
          </form>
        )}

        {/* PERSONAL LEARNING PINBOARD DISPLAY (Shown once submitted) */}
        {savedReflection && (
          <div style={{ marginTop: (!isEditing ? 0 : 32), borderTop: (!isEditing ? 'none' : '1px dashed #CBD5E1'), paddingTop: (!isEditing ? 0 : 24) }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Pin size={17} color="#0D9488" style={{ transform: 'rotate(-25deg)' }} />
                  <h4 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#143137', margin: 0, letterSpacing: '-0.01em' }}>
                    MY LEARNING PINBOARD
                  </h4>
                </div>
                <p style={{ fontSize: '0.86rem', color: '#64748B', margin: 0, fontStyle: 'italic' }}>
                  My thoughts, my discoveries, my progress.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {savedReflection.updated_at && (
                  <span style={{ fontSize: '0.74rem', color: '#94A3B8', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} />
                    {new Date(savedReflection.updated_at || savedReflection.submitted_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    })}
                  </span>
                )}

                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 8,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#0D9488',
                      fontSize: '0.78rem',
                      fontWeight: 750,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
                    }}
                  >
                    <Edit3 size={13} />
                    Edit Reflection
                  </button>
                )}
              </div>
            </div>

            {/* THREE PINBOARD STICKY NOTE CARDS */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: 20
              }}
            >
              {/* STICKY NOTE 01: WHAT I KNOW (Pastel Light Mint) */}
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1.5px solid #A7F3D0',
                  borderRadius: 16,
                  padding: '22px 20px',
                  boxShadow: '0 6px 16px rgba(16, 185, 129, 0.08)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 180,
                  transform: 'rotate(-0.5deg)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Pin Decoration */}
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: 24,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#059669',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Pin size={11} color="#FFFFFF" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    WHAT I KNOW
                  </span>
                  <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#047857', background: '#D1FAE5', padding: '2px 7px', borderRadius: 9999 }}>
                    Prior Knowledge
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.90rem',
                    color: '#064E3B',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    flex: 1
                  }}
                >
                  {savedReflection.question_1_answer}
                </p>
              </div>

              {/* STICKY NOTE 02: WHAT I WANT (Pastel Light Peach) */}
              <div
                style={{
                  background: '#FFF7ED',
                  border: '1.5px solid #FDBA74',
                  borderRadius: 16,
                  padding: '22px 20px',
                  boxShadow: '0 6px 16px rgba(249, 115, 22, 0.08)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 180,
                  transform: 'rotate(0.5deg)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Pin Decoration */}
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: 24,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#EA580C',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Pin size={11} color="#FFFFFF" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#9A3412', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    WHAT I WANT
                  </span>
                  <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#C2410C', background: '#FFEDD5', padding: '2px 7px', borderRadius: 9999 }}>
                    Learning Goals
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.90rem',
                    color: '#7C2D12',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    flex: 1
                  }}
                >
                  {savedReflection.question_2_answer}
                </p>
              </div>

              {/* STICKY NOTE 03: WHAT I HAVE LEARNED (Pastel Light Lavender) */}
              <div
                style={{
                  background: '#FAF5FF',
                  border: '1.5px solid #DDD6FE',
                  borderRadius: 16,
                  padding: '22px 20px',
                  boxShadow: '0 6px 16px rgba(124, 58, 237, 0.08)',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: 180,
                  transform: 'rotate(-0.3deg)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                }}
              >
                {/* Pin Decoration */}
                <div
                  style={{
                    position: 'absolute',
                    top: -10,
                    left: 24,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: '#7C3AED',
                    border: '2px solid #FFFFFF',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                >
                  <Pin size={11} color="#FFFFFF" />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, marginTop: 4 }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5B21B6', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    WHAT I HAVE LEARNED
                  </span>
                  <span style={{ fontSize: '0.70rem', fontWeight: 700, color: '#6D28D9', background: '#EDE9FE', padding: '2px 7px', borderRadius: 9999 }}>
                    Discovery & Insight
                  </span>
                </div>

                <p
                  style={{
                    margin: 0,
                    fontSize: '0.90rem',
                    color: '#4C1D95',
                    lineHeight: 1.6,
                    whiteSpace: 'pre-wrap',
                    fontFamily: 'inherit',
                    flex: 1
                  }}
                >
                  {savedReflection.question_3_answer}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
