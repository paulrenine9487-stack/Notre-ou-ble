import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Award, CheckCircle2, Clock } from 'lucide-react';

export default function LearningProgressCard({ progressData, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="dash-section">
        <div className="skeleton" style={{ width: '220px', height: '18px', marginBottom: '12px' }} />
        <div className="skeleton" style={{ width: '100%', height: '150px', borderRadius: '16px' }} />
      </div>
    );
  }

  const badge = progressData?.badge || 'MODULE 01 · VOCAL FOUNDATIONS';
  const title = progressData?.title || 'Breathe. Support. Sing.';
  const description = progressData?.description || "Breath management isn't about taking the biggest breath or holding a note for the longest time. It's about coordinating comfortable breathing with the musical phrase.";
  const percentage = progressData?.percentage || 0;
  const totalStages = progressData?.totalStages || 5;
  const completedStages = progressData?.completedStages || 0;
  const currentStageNumber = progressData?.currentStageNumber || 1;
  const currentStageTitle = progressData?.currentStageTitle || 'Introduction';
  const marksObtained = progressData?.marksObtained || 0;
  const totalPossible = progressData?.totalPossibleMarks || 100;
  const scorePercent = progressData?.provisionalScorePercent || 0;
  const challenges = progressData?.challenges;
  const recordingsCount = progressData?.recordingsCount || 0;

  const statusText = completedStages > 0
    ? `${completedStages} of ${totalStages} learning stages explored`
    : `Stage ${currentStageNumber.toString().padStart(2, '0')} · ${currentStageTitle}`;

  const buttonText = completedStages === totalStages
    ? 'Review Module Complete →'
    : `Resume Stage ${currentStageNumber.toString().padStart(2, '0')} (${currentStageTitle}) →`;

  const buttonLink = '/learning/modules/breath-management';

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <h3 className="dash-section-title">Pick up where you left off</h3>
        <span className="dash-section-label">YOUR LEARNING PATH</span>
      </div>

      <div className="dash-progress-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
          <span className="dash-progress-status-badge">{badge}</span>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {challenges && (challenges.totalCompleted > 0 || challenges.mythOrFactCompleted) && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAE5F3',
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#191B35'
              }}>
                <Award size={13} color="#7C3AED" />
                <span>Myth or Fact: {challenges.latestScoreMythFact || challenges.latestScore}pts ({challenges.completionPercentage || challenges.latestPercentage}%) | Best: {challenges.bestScoreMythFact || challenges.bestScore}pts</span>
              </div>
            )}
            {progressData?.reflectionStatus && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAE5F3',
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: progressData.reflectionStatus === 'Completed' ? '#0D9488' : progressData.reflectionStatus === 'In progress' ? '#D97706' : '#64748B'
              }}>
                <span style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  backgroundColor: progressData.reflectionStatus === 'Completed' ? '#0D9488' : progressData.reflectionStatus === 'In progress' ? '#F59E0B' : '#94A3B8'
                }} />
                <span>Reflection: {progressData.reflectionStatus}</span>
              </div>
            )}
            {recordingsCount > 0 && (
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #EAE5F3',
                borderRadius: '9999px',
                padding: '3px 10px',
                fontSize: '0.74rem',
                fontWeight: 700,
                color: '#15966A'
              }}>
                <CheckCircle2 size={13} color="#15966A" />
                <span>{recordingsCount} recording{recordingsCount > 1 ? 's' : ''} submitted</span>
              </div>
            )}
          </div>
        </div>

        <h4 className="dash-progress-title">{title}</h4>
        <p className="dash-progress-desc">{description}</p>

        {/* Progress Bar */}
        <div className="dash-progress-bar-container">
          <div 
            className="dash-progress-bar-fill"
            style={{ width: `${Math.min(100, Math.max(0, percentage))}%` }}
          />
        </div>

        {/* Meta & Percentage */}
        <div className="dash-progress-meta">
          <span>{statusText}</span>
          <span className="dash-progress-percent">{percentage}%</span>
        </div>

        <button
          onClick={() => navigate(buttonLink)}
          className="dash-btn-primary"
        >
          <span>{buttonText}</span>
        </button>
      </div>
    </div>
  );
}
