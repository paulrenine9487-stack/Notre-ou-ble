import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Mic, Music } from 'lucide-react';

export default function WelcomeBanner({ bannerData, loading }) {
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="skeleton" style={{ width: '100%', height: '160px', borderRadius: '18px', marginBottom: '24px' }} />
    );
  }

  const badge = bannerData?.badge || 'YOUR VOICE, YOUR PACE';
  const heading = bannerData?.heading || 'Make every practice session count.';
  const description = bannerData?.description || "Go beyond repeating exercises. Understand what you're practising, why it matters, and how to bring it into your songs.";
  const buttonText = bannerData?.buttonText || 'Resume breath management →';
  const buttonLink = bannerData?.buttonLink || '/learning';

  return (
    <div className="dash-banner">
      {/* Left Content */}
      <div className="dash-banner-left">
        <span className="dash-banner-badge">{badge}</span>
        <h2 className="dash-banner-heading">{heading}</h2>
        <p className="dash-banner-desc">{description}</p>
        <button
          onClick={() => navigate(buttonLink)}
          className="dash-btn-primary"
        >
          <span>{buttonText}</span>
        </button>
      </div>

      {/* Right Decorative Microphone & Soundwave Illustration */}
      <div className="dash-banner-right">
        {/* Outer concentric decorative dashed circles */}
        <div className="banner-mic-circle banner-mic-circle-2" />
        <div className="banner-mic-circle banner-mic-circle-1" />

        {/* Floating Musical Note Accents */}
        <div style={{
          position: 'absolute',
          top: '12px',
          right: '18px',
          color: '#7C3AED',
          opacity: 0.8,
          transform: 'rotate(15deg)'
        }}>
          <Music size={14} />
        </div>
        <div style={{
          position: 'absolute',
          bottom: '14px',
          left: '14px',
          color: '#7C3AED',
          opacity: 0.6,
          transform: 'rotate(-20deg)'
        }}>
          <Music size={11} />
        </div>

        {/* Center Glowing Microphone Icon */}
        <div className="banner-mic-center">
          <Mic size={24} strokeWidth={2.2} />
        </div>
      </div>
    </div>
  );
}
