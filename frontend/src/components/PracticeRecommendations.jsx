import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Music, Clock, Calendar, ArrowRight } from 'lucide-react';

export default function PracticeRecommendations({ planData, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="dash-section">
        <div className="skeleton" style={{ width: '220px', height: '24px', marginBottom: '18px' }} />
        <div className="dash-nudge-grid">
          <div className="skeleton" style={{ height: '220px', borderRadius: '20px' }} />
          <div className="skeleton" style={{ height: '220px', borderRadius: '20px' }} />
        </div>
      </div>
    );
  }

  const todayGoal = planData?.todayGoal || {
    heading: 'One small goal for today',
    recommendation: 'Practise one song phrase',
    description: 'Use a comfortable breath and notice where the phrase needs support.',
    icon: 'music',
    buttonText: 'Open practice journal',
    buttonLink: '/practice'
  };

  const upcoming = planData?.upcoming || [
    {
      title: '10-minute breath session',
      sub: 'Suggested · Whenever it suits you'
    },
    {
      title: 'Revisit your song phrase',
      sub: 'After your next vocal lesson'
    }
  ];

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <h3 className="dash-section-title">A gentle nudge</h3>
        <span className="dash-section-label">YOUR PRACTICE PLAN</span>
      </div>

      <div className="dash-nudge-grid">
        {/* Left Card: One small goal for today */}
        <div className="dash-nudge-card">
          <div>
            <div className="dash-nudge-subheading">{todayGoal.heading}</div>
            <h4 className="dash-nudge-title">
              <Music size={22} color="#7C3AED" />
              <span>{todayGoal.recommendation}</span>
            </h4>
            <p className="dash-nudge-desc">{todayGoal.description}</p>
          </div>

          <button
            onClick={() => navigate(todayGoal.buttonLink || '/practice')}
            className="dash-btn-primary"
            style={{ width: 'fit-content' }}
          >
            <span>{todayGoal.buttonText}</span>
          </button>
        </div>

        {/* Right Card: Coming up in your practice */}
        <div className="dash-nudge-card">
          <div>
            <div className="dash-nudge-subheading">Coming up in your practice</div>
            {upcoming.map((item, idx) => (
              <div key={idx} className="dash-upcoming-item">
                <div className="dash-upcoming-icon">
                  {idx === 0 ? <Clock size={18} /> : <Calendar size={18} />}
                </div>
                <div>
                  <h5 className="dash-upcoming-title">{item.title}</h5>
                  <p className="dash-upcoming-sub">{item.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => navigate('/practice')}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#7C3AED',
              fontSize: '0.88rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 0',
              marginTop: '10px'
            }}
          >
            <span>View all scheduled sessions</span>
            <ArrowRight size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
