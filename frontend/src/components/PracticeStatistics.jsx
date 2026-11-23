import React, { useState } from 'react';
import { api } from '../services/api';
import { Target, CheckCircle2, Flame, Settings2 } from 'lucide-react';

export default function PracticeStatistics({ statsData, loading, onGoalUpdated }) {
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [goalInput, setGoalInput] = useState(statsData?.weeklyGoalReached?.targetMinutes || 60);
  const [savingGoal, setSavingGoal] = useState(false);

  if (loading) {
    return (
      <div className="dash-stats-grid">
        <div className="skeleton" style={{ height: '75px', borderRadius: '14px' }} />
        <div className="skeleton" style={{ height: '75px', borderRadius: '14px' }} />
        <div className="skeleton" style={{ height: '75px', borderRadius: '14px' }} />
      </div>
    );
  }

  const practiceThisWeek = statsData?.practiceThisWeek || { value: '0 min', label: 'Practice this week' };
  const sessionsCompleted = statsData?.sessionsCompleted || { value: '0 sessions', label: 'Sessions completed' };
  const weeklyGoalReached = statsData?.weeklyGoalReached || { value: '0%', targetMinutes: 60, label: 'Weekly goal reached' };

  const handleSaveGoal = async (e) => {
    e.preventDefault();
    setSavingGoal(true);
    try {
      await api.setPracticeGoal(parseInt(goalInput, 10));
      setIsEditingGoal(false);
      if (onGoalUpdated) onGoalUpdated();
    } catch (err) {
      console.error('Failed to update goal:', err);
    } finally {
      setSavingGoal(false);
    }
  };

  return (
    <div className="dash-stats-grid">
      {/* Card 1: Practice This Week */}
      <div className="dash-stat-card">
        <div className="dash-stat-value">{practiceThisWeek.value}</div>
        <div className="dash-stat-label">{practiceThisWeek.label}</div>
        <div className="dash-stat-badge">
          <Flame size={13} />
          <span>Calculated from live MySQL sessions</span>
        </div>
      </div>

      {/* Card 2: Sessions Completed */}
      <div className="dash-stat-card">
        <div className="dash-stat-value">{sessionsCompleted.value}</div>
        <div className="dash-stat-label">{sessionsCompleted.label}</div>
        <div className="dash-stat-badge">
          <CheckCircle2 size={13} />
          <span>Current week progress</span>
        </div>
      </div>

      {/* Card 3: Weekly Goal Reached */}
      <div className="dash-stat-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div className="dash-stat-value">{weeklyGoalReached.value}</div>
          <button
            onClick={() => setIsEditingGoal(!isEditingGoal)}
            title="Configure Weekly Goal"
            style={{
              background: 'transparent',
              border: 'none',
              color: '#77728A',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            <Settings2 size={15} />
          </button>
        </div>
        <div className="dash-stat-label">{weeklyGoalReached.label}</div>

        {!isEditingGoal ? (
          <div className="dash-stat-badge">
            <Target size={13} />
            <span>Target: {weeklyGoalReached.targetMinutes || 60} min / week</span>
          </div>
        ) : (
          <form onSubmit={handleSaveGoal} style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
            <input
              type="number"
              min="10"
              max="600"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              style={{
                width: '70px',
                padding: '4px 8px',
                borderRadius: '6px',
                border: '1px solid #7C3AED',
                fontSize: '0.85rem'
              }}
            />
            <button
              type="submit"
              disabled={savingGoal}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                backgroundColor: '#7C3AED',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '0.8rem',
                cursor: 'pointer'
              }}
            >
              {savingGoal ? '...' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
