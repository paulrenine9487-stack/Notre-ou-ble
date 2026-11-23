import React, { useState } from 'react';
import { useAuth } from '../context/useAuth';
import UserSidebar from '../components/UserSidebar';
import YourPracticeCommitment from '../components/YourPracticeCommitment';
import LearningJournalKanban from '../components/LearningJournalKanban';
import ModuleCompleteCard from '../components/ModuleCompleteCard';
import { Menu } from 'lucide-react';
import '../styles/dashboard.css';

export default function PracticeJournalPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Handlers for Stage 5 Keep It Going components
  const handleCommitmentSaved = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleSessionsUpdated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="dash-layout">
      {/* Sidebar Navigation */}
      <UserSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile Top Header with Hamburger Toggle */}
      <header className="mobile-header-bar">
        <button
          onClick={() => setSidebarOpen(true)}
          className="mobile-hamburger-btn"
          aria-label="Open Navigation"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-brand-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/IMG_7974.PNG"
            alt="No Tre(ou)ble"
            style={{
              height: '30px',
              width: 'auto',
              objectFit: 'contain',
              background: '#FFFFFF',
              borderRadius: '8px',
              padding: '2px 4px'
            }}
          />
          <img
            src="/NoTreble-Classic-darktext.png"
            alt="No Tre(ou)ble"
            style={{ height: '24px', width: 'auto', objectFit: 'contain' }}
          />
        </div>
        <button
          onClick={() => setSidebarOpen(true)}
          className="mobile-user-avatar"
          aria-label="Open Menu"
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : '✦'}
        </button>
      </header>

      {/* Main Workspace */}
      <main className="dash-main">
        {/* Page Title & Context Header */}
        <div style={{ marginBottom: 26 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            <span
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#0D9488',
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                background: '#E6F4F1',
                padding: '4px 12px',
                borderRadius: 9999
              }}
            >
              STAGE 05 · KEEP IT GOING
            </span>
            <span style={{ color: '#94A3B8' }}>•</span>
            <span style={{ fontSize: '0.82rem', color: '#64748B', fontWeight: 600 }}>Subtitle: Fine-tune</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#143137', margin: 0, marginBottom: 8 }}>
            Practice Commitment & Learning Journal
          </h1>
          <p style={{ fontSize: '0.96rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Decide your weekly practice commitment, track sessions in your Learning Journal, and review your Module 1 completion summary.
          </p>
        </div>

        {/* 3 KEEP IT GOING SECTIONS */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          {/* SECTION 1: YOUR PRACTICE COMMITMENT */}
          <YourPracticeCommitment onCommitmentSaved={handleCommitmentSaved} />

          {/* SECTION 2: LEARNING JOURNAL KANBAN */}
          <LearningJournalKanban onSessionsUpdated={handleSessionsUpdated} />

          {/* SECTION 3: MODULE 1 COMPLETE! */}
          <ModuleCompleteCard refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}
