import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Check, CheckCircle2, Award, ArrowRight, RefreshCw, BookOpen, Clock, Flame, Sparkles } from 'lucide-react';
import { api } from '../services/api';

// Circular Progress Component using SVG strokeDashoffset
function CircularProgress({ percentage, label, subtext, color = '#0D9488', size = 110, strokeWidth = 9 }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(100, Math.max(0, percentage || 0));
  const strokeDashoffset = circumference - (clampedPercent / 100) * circumference;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          {/* Background Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#E2E8F0"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Animated Progress Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.8s ease-in-out' }}
          />
        </svg>

        {/* Center Percentage Display */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '1.45rem', fontWeight: 800, color: '#1E293B', lineHeight: 1 }}>
            {clampedPercent}%
          </span>
        </div>
      </div>

      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1E293B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </div>
        {subtext && (
          <div style={{ fontSize: '0.74rem', color: '#64748B', marginTop: 2 }}>
            {subtext}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModuleCompleteCard({ refreshTrigger }) {
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const loadSummary = async (isBackground = false) => {
    try {
      if (!isBackground) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setErrorMsg('');
      const res = await api.getModuleCompletionSummary(1);
      if (res && res.success) {
        setData(res);
      } else {
        if (!isBackground) setErrorMsg('Could not load completion metrics.');
      }
    } catch (err) {
      console.error('Failed to load module summary:', err);
      if (!isBackground) setErrorMsg('Could not connect to database.');
    } finally {
      if (!isBackground) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    const isBackground = data !== null;
    loadSummary(isBackground);
  }, [refreshTrigger]);

  if (loading && !data) {
    return (
      <div style={{ background: '#FFFFFF', padding: 36, borderRadius: 20, border: '1px solid #DFEBE3', textAlign: 'center' }}>
        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#0D9488' }} />
        <div style={{ color: '#64748B', fontSize: '0.9rem', fontWeight: 600 }}>Calculating real module metrics...</div>
      </div>
    );
  }

  const isComplete = data?.module?.isComplete;
  const lessons = data?.lessons || { percentage: 0, completedStages: 0, totalStages: 5 };
  const journal = data?.journal || { percentage: 0, completedSessions: 0, totalSessions: 0 };
  const practice = data?.practice || { percentage: 0, completedActivities: 0, totalActivities: 6 };
  const remaining = data?.remainingActivities || [];

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: '36px 28px',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.04)',
        textAlign: 'center'
      }}
    >
      {/* SUCCESS OR IN-PROGRESS HERO ICON */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
        {isComplete ? (
          <div
            style={{
              width: 76,
              height: 76,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(245, 158, 11, 0.3)'
            }}
          >
            <div
              style={{
                width: 62,
                height: 62,
                borderRadius: '50%',
                background: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Check size={36} color="#F59E0B" strokeWidth={3.5} />
            </div>
          </div>
        ) : (
          <div
            style={{
              width: 68,
              height: 68,
              borderRadius: '50%',
              background: '#E6F4F1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '2px solid #99F6E4'
            }}
          >
            <Sparkles size={32} color="#0D9488" />
          </div>
        )}
      </div>

      {/* HEADING & SUBTITLE */}
      <h3 style={{ fontSize: '1.75rem', fontWeight: 850, color: '#143137', margin: '0 0 6px 0', letterSpacing: '-0.02em' }}>
        {isComplete ? 'Module 1 complete!' : 'Your module is still in progress.'}
      </h3>
      <p style={{ fontSize: '0.96rem', color: '#64748B', margin: '0 auto 28px auto', maxWidth: 520, lineHeight: 1.5 }}>
        {isComplete
          ? 'Well done! You have built a steady breathing habit and completed the foundations of breath management.'
          : 'You are making steady progress! Continue completing your planned sessions and practice exercises to finish the module.'}
      </p>

      {/* THREE CIRCULAR PROGRESS INDICATORS (LESSONS, JOURNAL, PRACTICE) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 40,
          flexWrap: 'wrap',
          padding: '24px 20px',
          background: '#F8FAFC',
          borderRadius: 16,
          border: '1px solid #E2E8F0',
          maxWidth: 620,
          margin: '0 auto 28px auto'
        }}
      >
        {/* 1. LESSONS PROGRESS */}
        <CircularProgress
          percentage={lessons.percentage}
          label="LESSONS"
          subtext={`${lessons.completedStages || 0} of ${lessons.totalStages || 5} stages`}
          color="#0D9488"
        />

        {/* 2. JOURNAL PROGRESS */}
        <CircularProgress
          percentage={journal.percentage}
          label="JOURNAL"
          subtext={`${journal.completedSessions || 0} of ${journal.totalSessions || 0} sessions`}
          color="#3B82F6"
        />

        {/* 3. PRACTICE PROGRESS */}
        <CircularProgress
          percentage={practice.percentage}
          label="PRACTICE"
          subtext={`${practice.completedActivities || 0} of ${practice.totalActivities || 6} activities`}
          color="#8B5CF6"
        />
      </div>

      {/* IN-PROGRESS REMAINING TASKS LIST (Requirement 5) */}
      {!isComplete && remaining.length > 0 && (
        <div
          style={{
            maxWidth: 580,
            margin: '0 auto 28px auto',
            textAlign: 'left',
            background: '#F1F5F9',
            padding: '18px 22px',
            borderRadius: 14,
            border: '1px solid #E2E8F0'
          }}
        >
          <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#334155', textTransform: 'uppercase', marginBottom: 10, letterSpacing: '0.04em' }}>
            Remaining Activities to Complete Module:
          </div>
          <ul style={{ margin: 0, paddingLeft: 20, color: '#475569', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
            {remaining.slice(0, 4).map((rem, idx) => (
              <li key={idx}>{rem.text}</li>
            ))}
            {remaining.length > 4 && (
              <li style={{ color: '#0D9488', fontWeight: 600 }}>+ {remaining.length - 4} more exercises</li>
            )}
          </ul>
        </div>
      )}

      {/* ACTION BUTTONS */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, flexWrap: 'wrap' }}>
        {isComplete ? (
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 28px',
              borderRadius: 12,
              background: '#0D9488',
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: '0.94rem',
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(13, 148, 136, 0.25)',
              transition: 'all 0.15s ease'
            }}
          >
            <span>Back to Dashboard</span>
            <ArrowRight size={18} />
          </Link>
        ) : (
          <Link
            to="/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 24px',
              borderRadius: 12,
              background: '#F1F5F9',
              color: '#334155',
              fontWeight: 750,
              fontSize: '0.9rem',
              textDecoration: 'none',
              border: '1px solid #CBD5E1',
              transition: 'all 0.15s ease'
            }}
          >
            <span>View Dashboard</span>
          </Link>
        )}
      </div>
    </div>
  );
}
