import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Clock } from 'lucide-react';

/**
 * Helper: Professional time-of-day greeting:
 * - Good morning:   12:00 AM - 12:00 PM (00:00 - 11:59)
 * - Good afternoon: 12:00 PM - 05:00 PM (12:00 - 16:59)
 * - Good evening:   05:00 PM - 11:59 PM (17:00 - 23:59)
 */
export function getTimeGreeting(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 0 && hour < 12) {
    return 'Good morning';
  } else if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  } else {
    return 'Good evening';
  }
}

export function getTimePeriod(date = new Date()) {
  const hour = date.getHours();
  if (hour >= 0 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  return 'evening';
}

export default function DashboardHeader({ headerData, username, loading }) {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => new Date());

  // Keep date & time live and accurate every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format username (capitalizing first letter if needed)
  const rawName = username || headerData?.username;
  const displayName = rawName
    ? (rawName.charAt(0).toUpperCase() + rawName.slice(1))
    : 'Vocalist';

  // If loading without any known user, display graceful placeholder
  if (loading && !rawName) {
    return (
      <div className="dash-header">
        <div>
          <div className="skeleton" style={{ width: '220px', height: '11px', marginBottom: '8px' }} />
          <div className="skeleton" style={{ width: '260px', height: '24px', marginBottom: '6px' }} />
          <div className="skeleton" style={{ width: '340px', height: '14px' }} />
        </div>
        <div className="skeleton" style={{ width: '140px', height: '32px', borderRadius: '9999px' }} />
      </div>
    );
  }

  // Calculate live time greeting
  const greetingText = getTimeGreeting(currentDate);

  // Formatted date and time components
  const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(currentDate).toUpperCase();
  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric' }).format(currentDate).toUpperCase();
  const timeString = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(currentDate);

  const tagline = headerData?.tagline || 'A little intentional practice goes a long way. Pick up where you left off.';

  return (
    <header className="dash-header">
      <div>
        {/* Working Condition Live Date & Time Banner */}
        <div className="dash-header-date" style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          flexWrap: 'wrap',
          background: '#FFFFFF',
          border: '1px solid #EFE4D2',
          padding: '4px 12px',
          borderRadius: '9999px',
          width: 'fit-content',
          marginBottom: '8px',
          color: '#381E72',
          boxShadow: '0 2px 6px rgba(25, 27, 53, 0.05)'
        }}>
          <span>{dayName}, {monthDay}</span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: 'rgba(255, 255, 255, 0.75)',
            color: '#155E50',
            padding: '1px 8px',
            borderRadius: '9999px',
            fontWeight: 800,
            fontSize: '0.67rem',
            letterSpacing: '0.04em'
          }}>
            <Clock size={11} strokeWidth={2.4} />
            <span>{timeString}</span>
          </span>
          <span style={{ opacity: 0.6 }}>•</span>
          <span>YOUR LEARNING SPACE</span>
        </div>

        {/* Dynamic Timing Greeting with Authenticated Username */}
        <h1 className="dash-header-title">
          <span>{greetingText}, {displayName} ✦</span>
        </h1>

        <p className="dash-header-subtitle">{tagline}</p>
      </div>

      <button
        onClick={() => navigate(headerData?.ctaLink || '/learning')}
        className="dash-btn-continue"
        aria-label="Continue Learning"
      >
        <span>{headerData?.ctaText || 'CONTINUE LEARNING'}</span>
        <ArrowRight size={14} />
      </button>
    </header>
  );
}
