import React from 'react';
import { Activity, Clock, Flame, Award, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

export default function PracticeInsights({ analytics, loading }) {
  if (loading) {
    return (
      <div className="insights-container">
        <div className="skeleton" style={{ width: '220px', height: '22px', marginBottom: '16px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
          <div className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />
          <div className="skeleton" style={{ height: '70px', borderRadius: '12px' }} />
        </div>
      </div>
    );
  }

  const hasHistory = analytics?.hasHistory;
  const metrics = [
    {
      label: 'Total Practice',
      value: `${analytics?.totalPracticeMinutes || 0} min`,
      icon: Clock,
      color: '#7C3AED'
    },
    {
      label: 'Sessions Logged',
      value: `${analytics?.totalPracticeSessions || 0} sessions`,
      icon: Flame,
      color: '#D97706'
    },
    {
      label: 'Weekly Consistency',
      value: analytics?.weeklyPracticeConsistency || '0 of 7 days',
      icon: TrendingUp,
      color: '#2563EB'
    },
    {
      label: 'Diary Tasks Completed',
      value: `${analytics?.diaryTasksCompleted || 0} tasks`,
      icon: CheckCircle2,
      color: '#166534'
    }
  ];

  return (
    <div className="insights-container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#191B35', margin: '0 0 4px 0' }}>
            YOUR PRACTICE INSIGHTS
          </h3>
          <p style={{ margin: 0, fontSize: '0.82rem', color: '#77728A' }}>
            Actual metrics and vocal practice observations derived from your MySQL records.
          </p>
        </div>
      </div>

      {!hasHistory ? (
        <div style={{
          padding: '28px',
          textAlign: 'center',
          backgroundColor: '#F8FAF8',
          borderRadius: '12px',
          color: '#77728A'
        }}>
          <Sparkles size={24} color="#9690A7" style={{ marginBottom: '8px' }} />
          <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 650, color: '#191B35' }}>
            Your practice insights will appear here as you begin recording your sessions.
          </p>
        </div>
      ) : (
        <>
          {/* Key Metrics */}
          <div className="insights-grid">
            {metrics.map((m, idx) => {
              const Icon = m.icon;
              return (
                <div key={idx} className="insight-metric-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span className="insight-metric-lbl">{m.label}</span>
                    <Icon size={16} color={m.color} />
                  </div>
                  <div className="insight-metric-val">{m.value}</div>
                </div>
              );
            })}
          </div>

          {/* Observations based strictly on records */}
          {analytics?.insights && analytics.insights.length > 0 && (
            <div>
              <span style={{ fontSize: '0.8rem', fontWeight: 750, color: '#191B35', display: 'block', marginBottom: '10px' }}>
                Key Observations:
              </span>
              <div className="insight-observations-list">
                {analytics.insights.map((text, idx) => (
                  <div key={idx} className="insight-pill">
                    <Sparkles size={14} color="#7C3AED" style={{ flexShrink: 0 }} />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
