import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wind, Music, Volume2, Lock, ArrowRight } from 'lucide-react';

export default function LearningPathway({ pathwayData, loading }) {
  const navigate = useNavigate();
  const [modalInfo, setModalInfo] = useState(null);

  if (loading) {
    return (
      <div className="dash-section">
        <div className="skeleton" style={{ width: '180px', height: '18px', marginBottom: '12px' }} />
        <div className="dash-pathway-grid">
          <div className="skeleton" style={{ height: '130px', borderRadius: '14px' }} />
          <div className="skeleton" style={{ height: '130px', borderRadius: '14px' }} />
          <div className="skeleton" style={{ height: '130px', borderRadius: '14px' }} />
        </div>
      </div>
    );
  }

  const defaultCards = [
    {
      id: 1,
      title: 'Breath Management',
      description: 'Master diaphragmatic support, appoggio, and rhythmic airflow pacing.',
      status: 'IN PROGRESS',
      rawStatus: 'IN_PROGRESS',
      icon: 'wind'
    },
    {
      id: 2,
      title: 'Pitch & Intonation',
      description: 'Fine-tune micro-intonation, interval accuracy, and agile vocal scales.',
      status: 'NEXT LEARNING MODULE',
      rawStatus: 'NEXT_MODULE',
      icon: 'music'
    },
    {
      id: 3,
      title: 'Vocal Resonance',
      description: 'Unlock mask resonance and vocal projection without throat constriction.',
      status: 'COMING SOON',
      rawStatus: 'COMING_SOON',
      icon: 'volume-2'
    }
  ];

  const cards = pathwayData && pathwayData.length > 0 ? pathwayData : defaultCards;

  const getIcon = (iconName) => {
    switch (iconName) {
      case 'wind': return <Wind size={18} />;
      case 'music': return <Music size={18} />;
      case 'volume-2': return <Volume2 size={18} />;
      default: return <Wind size={18} />;
    }
  };

  const getStatusClass = (statusStr) => {
    if (statusStr.includes('PROGRESS')) return 'status-in-progress';
    if (statusStr.includes('NEXT')) return 'status-next';
    return 'status-soon';
  };

  const handleCardClick = (card) => {
    if (card.rawStatus === 'IN_PROGRESS' || card.id === 1) {
      navigate('/learning/modules/breath-management');
    } else {
      setModalInfo({
        title: card.title,
        status: card.status,
        description: `This module will unlock after completing the foundational Breath Management curriculum. Check back soon for interactive exercises and tutorials!`
      });
    }
  };

  return (
    <div className="dash-section">
      <div className="dash-section-header">
        <h3 className="dash-section-title">Your learning pathway</h3>
      </div>

      <div className="dash-pathway-grid">
        {cards.map((card) => {
          const isAvailable = card.rawStatus === 'IN_PROGRESS' || card.id === 1;
          return (
            <div
              key={card.id || card.title}
              className={`dash-pathway-card ${!isAvailable ? 'coming-soon' : ''}`}
              onClick={() => handleCardClick(card)}
              style={{ cursor: isAvailable ? 'pointer' : 'default' }}
            >
              <div>
                <div className="dash-pathway-icon">
                  {getIcon(card.icon)}
                </div>
                <h4 className="dash-pathway-title">{card.title}</h4>
                <p className="dash-pathway-desc">{card.description}</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px' }}>
                <span className={`dash-pathway-status ${getStatusClass(card.status)}`}>
                  {card.status}
                </span>
                {isAvailable ? (
                  <ArrowRight size={18} color="#7C3AED" />
                ) : (
                  <Lock size={16} color="#77728A" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Informative Modal for Next / Coming Soon Modules */}
      {modalInfo && (
        <div style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(124, 58, 237, 0.45)',
          backdropFilter: 'blur(3px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 200,
          padding: '20px'
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            padding: '32px',
            maxWidth: '440px',
            width: '100%',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.15)',
            border: '1px solid #EAE5F3'
          }}>
            <span style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              color: '#2F6F94',
              backgroundColor: '#EBF2F7',
              padding: '4px 10px',
              borderRadius: '9999px',
              display: 'inline-block',
              marginBottom: '12px'
            }}>
              {modalInfo.status}
            </span>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#191B35', margin: '0 0 10px 0' }}>
              {modalInfo.title}
            </h3>
            <p style={{ fontSize: '0.95rem', color: '#77728A', lineHeight: 1.6, margin: '0 0 24px 0' }}>
              {modalInfo.description}
            </p>
            <button
              onClick={() => setModalInfo(null)}
              className="dash-btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
