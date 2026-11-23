import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/useAuth';
import { api } from '../services/api';
import UserSidebar from '../components/UserSidebar';
import DashboardHeader from '../components/DashboardHeader';
import PracticeStatistics from '../components/PracticeStatistics';
import LearningProgressCard from '../components/LearningProgressCard';
import LearningPathway from '../components/LearningPathway';
import PracticeRecommendations from '../components/PracticeRecommendations';
import { Menu, AlertCircle, RefreshCw } from 'lucide-react';
import '../styles/dashboard.css';

export default function DashboardPage() {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);

  const fetchOverview = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDashboardOverview();
      if (res.success) {
        setDashboardData(res.data);
      } else {
        setError(res.message || 'Failed to load dashboard overview.');
      }
    } catch (err) {
      console.error('Dashboard load error:', err);
      setError(err.message || 'Could not connect to server. Please ensure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, []);

  return (
    <div className="dash-layout">
      {/* User Sidebar (Follows Reference Image 1) */}
      <UserSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
      />

      {/* Mobile Top Header with Hamburger Toggle */}
      <header className="mobile-header-bar">
        <button
          onClick={() => setSidebarOpen(true)}
          className="mobile-hamburger-btn"
          aria-label="Open Navigation"
        >
          <Menu size={22} />
        </button>
        <div className="mobile-brand-title" style={{ display: 'flex', alignItems: 'center' }}>
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

      {/* Main Dashboard Workspace (Follows Reference Images 2 & 3) */}
      <main className="dash-main">
        {/* Error Notification with Retry */}
        {error && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            backgroundColor: '#FEF2F2',
            border: '1px solid #FCA5A5',
            borderRadius: '16px',
            marginBottom: '24px',
            color: '#991B1B'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertCircle size={20} />
              <span style={{ fontSize: '0.92rem', fontWeight: 600 }}>{error}</span>
            </div>
            <button
              onClick={fetchOverview}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                backgroundColor: '#991B1B',
                color: '#FFFFFF',
                borderRadius: '8px',
                border: 'none',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} />
              <span>Retry</span>
            </button>
          </div>
        )}

        {/* 1. Dynamic Welcome Header */}
        <DashboardHeader
          headerData={dashboardData?.header}
          username={dashboardData?.user?.username || user?.username}
          loading={loading}
        />

        {/* 2. Live Dashboard Statistics (MySQL Integration) */}
        <PracticeStatistics
          statsData={dashboardData?.statistics}
          loading={loading}
          onGoalUpdated={fetchOverview}
        />

        {/* 4. Learning Progress Card (Reference Image 3) */}
        <LearningProgressCard
          progressData={dashboardData?.learningProgress}
          loading={loading}
        />

        {/* 5. Your Learning Pathway (3 Modules in Row) */}
        <LearningPathway
          pathwayData={dashboardData?.learningPathway}
          loading={loading}
        />

        {/* 6. A Gentle Nudge (Practice Recommendations) */}
        <PracticeRecommendations
          planData={dashboardData?.practicePlan}
          loading={loading}
        />
      </main>
    </div>
  );
}
